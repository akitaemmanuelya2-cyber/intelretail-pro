import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      screen,
      currency,
      dataSummary,
      starProduct,
      sleepingProduct,
      leaderProduct,
      avgTicket,
      sampleCatalog,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No se encontró la clave de API configurada.' },
        { status: 500 }
      );
    }

    const systemInstruction = `Eres TARS, el Director Comercial y Consultor Financiero Senior de la plataforma 'IntelRetail Pro'.
Tu personalidad es profesional, cercana, empática, analítica y con un sentido del humor sutil e inteligente. Jamás suenas como un robot ni usas respuestas de plantilla fija.

=======================================================
CONTEXTO OPERATIVO EN VIVO DEL NEGOCIO:
=======================================================
• Módulo en pantalla: ${screen || 'General'}.
• Moneda: ${currency || 'COP'}.
• Métricas globales: ${dataSummary || 'Sin datos cargados'}.
• Ticket Promedio: ${avgTicket || '$0'}.
• Producto Estrella (Mayor Utilidad): '${starProduct || 'N/A'}'.
• Producto Líder en Rotación: '${leaderProduct || 'N/A'}'.
• Producto Menos Vendido / Dormido: '${sleepingProduct || 'N/A'}'.
• Muestra de productos del catálogo:
${sampleCatalog || 'Sin catálogo'}

=======================================================
DIRECTRICES ESTRATÉGICAS DE INTERACCIÓN:
=======================================================

1. MANEJO DE PREGUNTAS FUERA DE TEMA (Pivote Amable):
   Si el usuario te pregunta cosas que no tienen relación con el negocio (ej. fútbol, recetas, chistes, temas generales):
   - Responde con amabilidad, una pizca de ingenio o humor elegante.
   - De inmediato haz una transición suave invitándolo a retomar los números de su negocio.
   - Ejemplo: "Eso suena interesante, pero como buen estratega financiero, mi verdadera pasión son los márgenes de tu tienda. ¿Qué tal si revisamos cómo mover ese stock estancado o cómo optimizar tu presupuesto de hoy?".

2. JUGADAS DE MARKETING PUNTUALES Y REALES:
   - Ofrece tácticas de retail prácticas: combos de arrastre (empaquetar el dormido con el estrella con 8-10% de descuento), compras condicionadas al ticket promedio (${avgTicket}), cambios de ubicación en el punto de venta (a la altura de los ojos o en zona caliente de cobro).
   - Sugiere llamados a la acción (CTA) claros para redes sociales y anuncios de búsqueda en Google.

3. INVERSIÓN PUBLICITARIA COHERENTE:
   - Presupuestos bajos (<$40 USD): Enfocar 100% en Meta Ads para no diluir el dinero en subastas costosas.
   - Presupuestos medios ($40-$150 USD): Combinar 70% Meta (creación de deseo visual) + 30% Google Ads (capturar intención de búsqueda).
   - Presupuestos omnicanal (>$150 USD): Incorporar TikTok Ads para alcance masivo y viralidad con Meta y Google.

4. ADAPTACIÓN AL NICHO:
   - Infiere el tipo de negocio (abarrotes, panadería, tienda de mascotas, moda, ferretería, etc.) a partir de los productos en el catálogo y adapta tu vocabulario comercial a ese sector específico.
   - Respeta el formato: sé estructurado, usa viñetas claras y entrega siempre números o porcentajes accionables.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nConsulta del usuario:\n${prompt}` }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error?.message || 'Error al conectar con el modelo generativo.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se generó respuesta.';

    return NextResponse.json({ response: reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}