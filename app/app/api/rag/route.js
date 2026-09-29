import { NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';

// Configuración de endpoints (Next.js está en Local Host, Qdrant y Ollama en Docker expuestos)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11435';
const QDRANT_URL = process.env.QDRANT_URL || 'http://127.0.0.1:6334';
const COLLECTION_NAME = 'legal_documents';
const EMBEDDING_MODEL = 'nomic-embed-text'; // Modelo rápido de embedding
const LLM_MODEL = 'llama3'; // o el modelo configurado en local

// Inicializamos Qdrant
const qdrant = new QdrantClient({ url: QDRANT_URL });

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    // 1. Convertir la pregunta en Vector usando Ollama Embeddings
    let queryVector = [];
    try {
      const embedRes = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: message
        }),
      });
      const embedData = await embedRes.json();
      if (embedData.embedding) {
        queryVector = embedData.embedding;
      }
    } catch (e) {
      console.warn('Ollama embeddings no disponible, usando simulador RAG fallback.', e.message);
    }

    let contextText = '';

    // 2. Buscar similitud en Qdrant (Solo si tenemos vector real)
    if (queryVector.length > 0) {
      try {
        const searchResults = await qdrant.search(COLLECTION_NAME, {
          vector: queryVector,
          limit: 3,
        });
        
        contextText = searchResults.map(res => res.payload?.content || '').join('\n---\n');
      } catch (e) {
        console.warn('Colección de Qdrant vacía o no creada. Saltando RAG estricto.', e.message);
      }
    }

    // 3. Prompting Dinámico con Contexto RAG
    const systemPrompt = `Eres el Asistente Legal y Analista de Neretxaus.
Respondes con precisión premium en español.
${contextText ? `UTILIZA ESTE CONTEXTO RECUPERADO PARA RESPONDER:\n${contextText}` : 'Si no tienes contexto específico, responde basándote en tu conocimiento legal e inmobiliario.'}`;

    // 4. Llamar al LLM de Ollama para la generación
    try {
      const llmRes = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LLM_MODEL,
          system: systemPrompt,
          prompt: message,
          stream: false // Para esta V1, evitamos streaming por simplicidad. Devuelve respuesta completa.
        }),
      });

      if (!llmRes.ok) {
        throw new Error('Ollama no respondió correctamente');
      }

      const llmData = await llmRes.json();

      return NextResponse.json({
        reply: llmData.response || 'El asistente no pudo procesar una respuesta coherente.',
        contextUsed: !!contextText
      });

    } catch (e) {
      console.error('Error contactando al LLM:', e);
      return NextResponse.json({ 
        reply: 'Conexión con el cerebro IA (Ollama) fallida. Asegúrate de que el contenedor Ollama está corriendo y el modelo está descargado.',
        error: true 
      });
    }

  } catch (error) {
    console.error('API RAG Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor IA' }, { status: 500 });
  }
}
