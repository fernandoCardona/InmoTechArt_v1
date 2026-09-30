import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    // 3. Disparar Webhook de n8n para el Mailer Comercial
    const n8nWebhookUrl = 'http://localhost:5679/webhook/send-match'; 
    
    // Lo enviamos en background para no bloquear al cliente
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matchId }),
    }).catch(err => console.error('Error llamando a n8n mailer:', err));

    return NextResponse.json({ success: true, message: 'Enviando email...' });

  } catch (error) {
    console.error('Error in send-match route:', error);
    return NextResponse.json({ error: 'Fallo al procesar petición.' }, { status: 500 });
  }
}
