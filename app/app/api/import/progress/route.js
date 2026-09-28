import { importEmitter } from '../route';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    return new Response('Missing batchId', { status: 400 });
  }

  // Configuración Headers para SSE (Server-Sent Events)
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = new ReadableStream({
    start(controller) {
      // Función manejadora cuando el EventEmitter global emite un evento de este Batch
      const progressHandler = (data) => {
        // Formato SSE: 'data: {...}\n\n'
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));

        if (data.type === 'COMPLETED' || data.type === 'ERROR') {
          // Cerramos el stream cuando termina o falla
          cleanup();
          controller.close();
        }
      };

      // Limpieza de listeners
      const cleanup = () => {
        importEmitter.off(`progress_${batchId}`, progressHandler);
      };

      // Nos suscribimos al evento específico del Batch actual
      importEmitter.on(`progress_${batchId}`, progressHandler);

      // Si el cliente desconecta antes de tiempo
      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, { headers });
}
