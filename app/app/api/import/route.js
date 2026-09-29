import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { importBatches } from '../../../db/schema';
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

      for (let i = 0; i < totalRows; i++) {
        // Simulación de carga (retraso intencional para ver el progreso en UI)
        await new Promise(r => setTimeout(r, 20)); 
        
        const row = rawData[i] || { id: i, fila: i };
        
        // Mapeo (Aquí irá la lógica de conciliación del Parser)
        if (i % 10 === 0) {
          failed++;
          failedList.push({ ...row, _rowId: i + 1, _error: 'Dato requerido faltante o formato inválido (Ej: Referencia Catastral)' });
        }
        else if (i % 3 === 0) {
          updated++;
          updatedList.push({ ...row, _rowId: i + 1 });
        }
        else {
          inserted++;
          insertedList.push({ ...row, _rowId: i + 1 });
        }

        // Emitimos progreso vía SSE cada 10 filas o al final
        if (i % 10 === 0 || i === totalRows - 1) {
          importEmitter.emit(`progress_${batchId}`, {
            type: 'PROGRESS',
            payload: { inserted, updated, failed, total: totalRows }
          });
        }
      }

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
