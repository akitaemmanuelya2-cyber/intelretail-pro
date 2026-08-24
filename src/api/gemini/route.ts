import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      history,
      screen,
      currency,
      dataSummary,
      starProduct,
      sleepingProduct,
      leaderProduct,
      avgTicket,
      fullCatalog,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clave GEMINI_API_KEY no detectada en variables de entorno.' },
        { status: 500 }
      );
    }

    const systemInstruction = `Eres TARS, el Director Comercial y Consultor Financiero Senior de 'IntelRetail Pro'.
Tu personalidad es cercana, ejecutiva, analítica, profesional y con criterio de negocio de alto nivel.
NUNCA utilices respuestas prefabricadas, clichés robóticos ni guiones genéricos.

=======================================================
CONTEXTO FINANCIERO Y COMERCIAL EN TIEMPO REAL:
=======================================================
• Módulo actual en pantalla: ${screen || 'General'}.
• Divisa de trabajo: ${currency || 'COP'}.
• Métricas consolidadas: ${dataSummary || 'Sin datos cargados'}.
• Ticket Promedio: ${avgTicket || '$0'}.
• Producto Estrella (Mayor Utilidad): ${starProduct || 'No determinado'}.
• Producto Líder en Rotación: ${leaderProduct || 'No determinado'}.
• Producto Menos Vendido: ${sleepingProduct || 'No determinado'}.

=======================================================
BASE DE DATOS COMPLETA DEL CATÁLOGO (PRODUCTOS Y CIFRAS):
=======================================================
${fullCatalog || 'No hay catálogo cargado aún por el usuario.'}

=======================================================
DIRECTRICES DE RESPUESTA E INTERACCIÓN:
=======================================================
1. CONSULTAS DE PRODUCTOS ESPECÍFICOS:
   - Si el usuario te pregunta por cualquier producto del catálogo (ej: "leche alquería", "atún", "arroz", "detergente"):
     Busca ese producto en la lista del catálogo provista arriba, analiza sus unidades vendidas, su facturación y su margen, y dale un diagnóstico táctico real (ej: si es un producto gancho, si conviene empaquetarlo, ajustar su precio o usarlo para elevar el ticket promedio).

2. PREGUNTAS FUERA DE TEMA O NO RELACIONADAS:
   - Si el usuario hace preguntas ajenas (ej: "comprar un pan", temas personales, etc.):
     Responde de forma amable, ingeniosa y breve, explicando que IntelRetail Pro es una plataforma analítica y de simulación estratégica (no una tienda de venta directa), e invítalo con simpatía a analizar las finanzas o la rotación de sus productos.

3. PREGUNTAS ESTRATÉGICAS Y DE MARKETING:
   - Entrega sugerencias reales de retail: combos cruzados (bundling), promociones condicionadas al ticket promedio (${avgTicket}), cambios de ubicación en góndola o estrategias de pauta publicitaria multicanal.`;

    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach((h: any) => {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: `${systemInstruction}\n\nPregunta del usuario:\n${prompt}` }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error?.message || 'Error al conectar con el servicio de IA.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar la respuesta.';

    return NextResponse.json({ response: reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}