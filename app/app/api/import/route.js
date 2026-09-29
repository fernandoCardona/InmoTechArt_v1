import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { importBatches, properties } from '../../../db/schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';
import { EventEmitter } from 'events';

// Emisor de eventos global para comunicar el Parser con el endpoint SSE en memoria
// En producción real (VPS) con mútiples instancias Node (PM2), usaríamos Redis PubSub.
// Para este entorno, un EventEmitter local es perfecto.
export const importEmitter = new EventEmitter();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const providerId = formData.get('providerId');

    if (!file || !providerId) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileName = file.name;
    const batchId = uuidv4(); // Simulamos un ID de BD para enviar al SSE antes del insert si hay lag

    // 1. Lectura Inicial y Parseo
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convertir a Array de Objetos JSON
    const rawData = xlsx.utils.sheet_to_json(sheet);
    const totalRows = rawData.length;

    // TODO: Insertar importBatches real en PostgreSQL (necesita providerId real UUID)
    // omitido temporalmente para no fallar si no hay providers en DB en el test.

    // 2. Procesamiento Asíncrono en Background (Simulado)
    // Aquí invocamos al parser que leerá fila por fila e insertará en BD.
    // Usamos setTimeout para salir de la solicitud HTTP rápida y dejar el hilo corriendo.
    setTimeout(async () => {
      let inserted = 0;
      let updated = 0;
      let failed = 0;
      
      let insertedList = [];
      let updatedList = [];
      let failedList = [];

      // 3. Crear el Import Batch en DB
      const [batch] = await db.insert(importBatches).values({
        id: batchId,
        providerId,
        fileName,
        status: 'PROCESSING'
      }).returning();

      for (let i = 0; i < totalRows; i++) {
        const row = rawData[i];
        
        try {
          // Normalizar las llaves del objeto (pasar a minúsculas para encontrar sin fallos)
          const keys = Object.keys(row);
          const getVal = (...keywords) => {
            const match = keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
            return match ? row[match] : null;
          };

          const refProveedor = getVal('REO', 'referencia proveedor', 'id inmueble', 'id wantoku', 'referencia');
          const refCatastral = getVal('catastral', 'catastro');
          const provincia = getVal('provincia');
          const municipio = getVal('municipio', 'poblacion', 'localidad');
          const direccion = getVal('direccion', 'calle', 'domicilio');
          const cp = getVal('codigo postal', 'cp', 'c.p.');
          const tipo = getVal('tipo activo', 'tipo inmueble', 'tipologia');
          const precioRaw = getVal('precio', 'pvp', 'importe');
          const fase = getVal('fase judicial', 'estado posesorio', 'ocupacion', 'estado comercial');

          // Validar campos obligatorios mínimos
          if (!provincia || !municipio) {
            throw new Error('Faltan campos obligatorios: Provincia o Municipio.');
          }

          // Parsear precio
          let precio = 0;
          if (precioRaw) {
            precio = parseFloat(String(precioRaw).replace(/[^0-9,-]/g, '').replace(',', '.'));
            if (isNaN(precio)) precio = 0;
          }

          const mappedData = {
            providerId,
            referenciaProveedor: refProveedor ? String(refProveedor).substring(0, 100) : null,
            referenciaCatastral: refCatastral ? String(refCatastral).substring(0, 50) : null,
            fincasRegistrales: getVal('finca registral', 'fincas') ? String(getVal('finca registral', 'fincas')).substring(0, 100) : null,
            ccaa: getVal('ccaa', 'comunidad') ? String(getVal('ccaa', 'comunidad')).substring(0, 100) : null,
            provincia: String(provincia).substring(0, 100),
            municipio: String(municipio).substring(0, 150),
            direccion: direccion ? String(direccion).substring(0, 255) : null,
            codigoPostal: cp ? String(cp).substring(0, 10) : null,
            tipoActivo: tipo ? String(tipo).substring(0, 100) : null,
            subtipoTipologia: getVal('subtipo') ? String(getVal('subtipo')).substring(0, 100) : null,
            usoUrbanistico: getVal('uso') ? String(getVal('uso')).substring(0, 100) : null,
            clasificacionSuelo: getVal('clasificacion suelo', 'clase suelo') ? String(getVal('clasificacion suelo')).substring(0, 100) : null,
            precioVenta: precio.toString(),
            porcentajeParticipacion: getVal('%', 'participacion') ? String(getVal('%', 'participacion')).substring(0, 50) : null,
            modalidadComercial: getVal('modalidad') ? String(getVal('modalidad')).substring(0, 100) : null,
            faseJudicialOcupacion: fase ? String(fase).substring(0, 150) : null,
            superficieSueloM2: getVal('superficie parcela', 'sup. parcela') ? parseFloat(getVal('superficie parcela')) || null : null,
            edificabilidadSobreRasanteM2: getVal('sobre rasante', 'sr') ? parseFloat(getVal('sobre rasante')) || null : null,
            edificabilidadBajoRasanteM2: getVal('bajo rasante', 'br') ? parseFloat(getVal('bajo rasante')) || null : null,
            numViviendas: getVal('nº viv', 'num viv', 'unidades') ? parseInt(getVal('nº viv')) || null : null,
            rawMetadata: row,
            lastSeenInBatchId: batch.id,
          };

          // Comprobar si ya existe usando la referenciaCatastral o referenciaProveedor (Upsert manual)
          let existingProp = null;
          if (mappedData.referenciaCatastral) {
            existingProp = await db.select().from(properties).where(sql`${properties.referenciaCatastral} = ${mappedData.referenciaCatastral} AND ${properties.providerId} = ${providerId}`).limit(1);
          } else if (mappedData.referenciaProveedor) {
            existingProp = await db.select().from(properties).where(sql`${properties.referenciaProveedor} = ${mappedData.referenciaProveedor} AND ${properties.providerId} = ${providerId}`).limit(1);
          }

          if (existingProp && existingProp.length > 0) {
            // Update
            await db.update(properties).set({ ...mappedData, updatedAt: new Date() }).where(sql`${properties.id} = ${existingProp[0].id}`);
            updated++;
            updatedList.push({ ...row, _rowId: i + 1, _status: 'UPDATED' });
          } else {
            // Insert
            await db.insert(properties).values(mappedData);
            inserted++;
            insertedList.push({ ...row, _rowId: i + 1, _status: 'INSERTED' });
          }

        } catch (rowErr) {
          failed++;
          failedList.push({ ...row, _rowId: i + 1, _error: rowErr.message });
        }

        // Emitimos progreso vía SSE cada 50 filas o al final
        if (i % 50 === 0 || i === totalRows - 1) {
          importEmitter.emit(`progress_${batchId}`, {
            type: 'PROGRESS',
            payload: { inserted, updated, failed, total: totalRows }
          });
        }
      }

      // Actualizar el batch
      await db.update(importBatches).set({
        recordsReceived: totalRows,
        recordsInserted: inserted,
        recordsUpdated: updated,
        recordsFailed: failed,
        status: 'COMPLETED',
        finishedAt: new Date()
      }).where(sql`${importBatches.id} = ${batch.id}`);

      // Proceso terminado
      importEmitter.emit(`progress_${batchId}`, {
        type: 'COMPLETED',
        payload: { 
          inserted, updated, failed, total: totalRows,
          insertedList, updatedList, failedList,
          allList: rawData
        }
      });
      
    }, 100); // Iniciamos 100ms después

    return NextResponse.json({ success: true, batchId, totalRows });

  } catch (error) {
    console.error('Error in import route:', error);
    return NextResponse.json({ error: 'Fallo al procesar fichero.' }, { status: 500 });
  }
}
