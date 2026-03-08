export const config = { runtime: 'edge' };

// Groq — API compatible con OpenAI, completamente gratis
// Modelo: llama-3.3-70b-versatile (el más capaz en Groq)
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();

    // Convertir formato Anthropic → formato OpenAI/Groq
    const groqBody = {
      model: GROQ_MODEL,
      max_tokens: body.max_tokens || 4000,
      stream: true,
      messages: body.messages || [],
    };

    const apiRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(groqBody),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: apiRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Groq devuelve SSE igual que OpenAI — lo pasamos tal cual
    return new Response(apiRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
