import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importBatches } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// Event Emitter para enviar el progreso al cliente (Server-Sent Events)
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
    const batchId = uuidv4(); 

    // 1. Guardar el archivo en el volumen compartido de Docker (shared_imports)
    // En desarrollo local, Next.js corre en el host, así que la ruta es relativa a la carpeta raíz del proyecto.
    const uploadDir = path.join(process.cwd(), '../infra/docker/shared_imports');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Generar un nombre único para evitar colisiones
    const uniqueFileName = `${batchId}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    await fs.writeFile(filePath, Buffer.from(buffer));

    // 2. Crear el Import Batch en DB
    const [batch] = await db.insert(importBatches).values({
      id: batchId,
      providerId,
      fileName: uniqueFileName,
      status: 'PROCESSING'
    }).returning();

    // 3. Disparar Webhook de n8n
    // n8n se encargará de leer el archivo, usar la IA de Ollama para el mapeo y hacer el Upsert.
    // Usamos setTimeout para no bloquear la respuesta HTTP.
    setTimeout(async () => {
      try {
        const n8nWebhookUrl = 'http://localhost:5679/webhook/import'; 
        
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batchId: batch.id,
            providerId: providerId,
            fileName: uniqueFileName,
            filePath: `/data/imports/${uniqueFileName}`, // Ruta interna de n8n dentro de su contenedor
          }),
        });

        if (!response.ok) {
          throw new Error(`n8n webhook falló con status: ${response.status}`);
        }

        // Emitir progreso inicial
        importEmitter.emit(`progress_${batchId}`, {
          type: 'PROGRESS',
          payload: { message: 'El archivo ha sido enviado a n8n para su procesamiento con IA.' }
        });

      } catch (err) {
        console.error('Error llamando a n8n:', err);
        await db.update(importBatches).set({
          status: 'FAILED',
          errorLog: err.message,
          finishedAt: new Date()
        }).where(sql`${importBatches.id} = ${batch.id}`);

        importEmitter.emit(`progress_${batchId}`, {
          type: 'ERROR',
          payload: { error: 'Fallo al comunicar con n8n.' }
        });
      }
    }, 100);

    return NextResponse.json({ success: true, batchId, message: 'Delegado a n8n' });

  } catch (error) {
    console.error('Error in import route:', error);
    return NextResponse.json({ error: 'Fallo al procesar fichero.' }, { status: 500 });
  }
}
