import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, screen, currency, dataSummary } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Si no hay API key configurada, responde con diagnóstico estructurado en vez de fallar
    if (!apiKey) {
      return NextResponse.json({
        response: `[Modo Diagnóstico Local - IntelRetail Pro]\n\n📊 Resumen de Métricas (${screen || 'General'}):\n• Estado: ${dataSummary || 'Datos analizados correctamente'}.\n• Divisa: ${currency || 'COP'}.\n\n💡 Diagnóstico Táctico:\n1. Optimiza la rotación de tus productos de menor volumen mediante combos o venta cruzada.\n2. Protege el margen de los artículos de alta facturación.\n3. Configura GEMINI_API_KEY en las variables de entorno para habilitar respuestas generativas en vivo.`,
      });
    }

    const systemInstruction = `Eres el consultor financiero y director comercial experto de 'IntelRetail Pro'.
Analiza las métricas retail del usuario y entrega diagnósticos ejecutivos, concisos y accionables con números o viñetas.
- Moneda activa: ${currency || 'COP'}.
- Módulo en consulta: ${screen || 'Catálogo'}.
- Métricas consolidadas: ${dataSummary || 'Sin datos'}.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemInstruction}\n\nConsulta:\n${prompt}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { response: `Aviso Gemini: ${errorData.error?.message || 'Servicio temporalmente no disponible.'}` },
        { status: 200 }
      );
    }

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se generó respuesta del modelo.';

    return NextResponse.json({ response: reply });
  } catch (error: any) {
    return NextResponse.json(
      { response: `Error interno de procesamiento: ${error.message}` },
      { status: 200 }
    );
  }
}