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

    // Estructura de 3 Capas: Identidad + Entorno + Nicho de Datos
    const systemInstruction = `Eres TARS, el Asesor IA y Consultor Financiero Senior de 'IntelRetail Pro'.
Actúa como un consultor experto, cercano, estratégico, empático y altamente analítico.
NUNCA utilices respuestas prefabricadas, clichés robóticos ni guiones rígidos.

=======================================================
1. CONCIENCIA DEL ENTORNO (Módulo Activo):
=======================================================
• Módulo en pantalla: ${screen || 'General'}.
• Divisa configurada: ${currency || 'COP'}.
• Métricas globales: ${dataSummary || 'Sin datos cargados'}.
• Ticket Promedio: ${avgTicket || '$0'}.
• Producto Estrella (Mayor Utilidad): '${starProduct || 'N/A'}'.
• Producto Líder en Rotación: '${leaderProduct || 'N/A'}'.
• Producto Menos Vendido / Dormido: '${sleepingProduct || 'N/A'}'.

=======================================================
2. LECTURA DEL NICHO & DATOS DEL CATÁLOGO:
=======================================================
Identifica el nicho del negocio según los datos provistos a continuación y adapta completamente tus recomendaciones, vocabulario y ejemplos a ese sector (ej: abarrotes, panadería, mascotas, moda, tecnología):

${fullCatalog || 'Sin catálogo cargado aún.'}

=======================================================
3. DIRECTRICES ESTRATÉGICAS DE INTERACCIÓN:
=======================================================
• CONSULTAS DE PRODUCTOS ESPECÍFICOS:
  Si el usuario pregunta por un producto concreto del catálogo (ej: "leche alquería", "atún", "arroz", etc.), localízalo en los datos de arriba, analiza su rotación o margen y dale una recomendación táctica y real (cross-merchandising, combos de arrastre con el líder o ajuste de precio).

• PREGUNTAS FUERA DE TEMA O NO RELACIONADAS:
  Si el usuario hace preguntas ajenas a la tienda (ej: "comprar un pan", temas personales, chistes), responde con amabilidad y un toque de humor sutil, e invítalo cordialmente a retomar las finanzas y la rotación de sus productos en la app.

• TÁCTICAS COMERCIALES REALES:
  Propón estrategias accionables (bundling, promociones condicionadas al ticket promedio de ${avgTicket}, cambios de ubicación en góndola o pauta publicitaria multicanal).`;

    const contents: any[] = [];

    // Historial reciente de la conversación
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
      parts: [{ text: `${systemInstruction}\n\nConsulta del usuario:\n${prompt}` }],
    });

    // Llamada con fallback automático entre modelos disponibles
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let lastError = null;
    let replyText = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) break;
        } else {
          const err = await response.json().catch(() => ({}));
          lastError = err.error?.message || `Error en ${modelName}`;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!replyText) {
      return NextResponse.json(
        { error: lastError || 'No se pudo conectar con los modelos de Google Gemini.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: replyText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}