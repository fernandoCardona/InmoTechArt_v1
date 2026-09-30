import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importBatches, providers } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export const importEmitter = new EventEmitter();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    let providerId = formData.get('providerId');
    const providerName = formData.get('providerName');

    if (!file || (!providerId && !providerName)) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    if (!providerId && providerName) {
      const normalizedName = providerName.trim();
      const existingProvider = await db.execute(
        sql`SELECT id FROM app_core.providers WHERE lower(name) = lower(${normalizedName})`
      );
      
      if (existingProvider.rows && existingProvider.rows.length > 0) {
        providerId = existingProvider.rows[0].id;
      } else {
        const [newProv] = await db.insert(providers).values({
          name: normalizedName,
          isActive: true
        }).returning({ id: providers.id });
        providerId = newProv.id;
      }
    }


    const buffer = await file.arrayBuffer();
    const fileName = file.name;
    const batchId = uuidv4(); 
    const uniqueFileName = `${batchId}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Contar las líneas del buffer (CSV) para saber el total real
    const textContent = new TextDecoder('utf-8').decode(buffer);
    const lineCount = textContent.split('\n').filter(line => line.trim().length > 0).length - 1; // -1 por la cabecera
    const finalRowCount = Math.max(1, lineCount); // Asegurar al menos 1 para no romper la lógica

    const [batch] = await db.insert(importBatches).values({
      id: batchId,
      providerId,
      fileName: uniqueFileName,
      status: 'PROCESSING',
      recordsReceived: finalRowCount
    }).returning();


    setTimeout(async () => {
      try {
        const n8nWebhookUrl = 'http://localhost:5679/webhook-test/import';
        
        const n8nFormData = new FormData();
        n8nFormData.append('batchId', batch.id);
        n8nFormData.append('providerId', providerId);
        
        const blob = new Blob([buffer], { type: file.type });
        n8nFormData.append('data', blob, uniqueFileName);

        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          body: n8nFormData,
        });

        if (!response.ok) {
          throw new Error(`n8n webhook falló con status: ${response.status}`);
        }

      } catch (err) {
        console.error('Error llamando a n8n:', err);
        await db.update(importBatches).set({
          status: 'FAILED',
          errorLog: err.message,
          finishedAt: new Date()
        }).where(sql`id = ${batch.id}`);
      }
    }, 100);

    return NextResponse.json({ success: true, batchId, message: 'Delegado a n8n' });

  } catch (error) {
    console.error('Error in import route:', error);
    return NextResponse.json({ error: 'Fallo al procesar fichero.' }, { status: 500 });
  }
}
