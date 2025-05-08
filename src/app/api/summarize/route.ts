import { togetheraiClient } from "@/lib/ai";
import assert from "assert";
import dedent from "dedent";
import { z } from "zod";
import { generateObject } from "ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, language, summary_length = 3 } = await req.json();

    if (!text || !language) {
      return Response.json(
        { error: "Faltan campos requeridos: texto e idioma" },
        { status: 400 }
      );
    }

    assert.ok(typeof text === "string");
    assert.ok(typeof language === "string");
    
    // Determinar la longitud del resumen basado en el valor
    let summaryLengthDescription;
    switch (Number(summary_length)) {
      case 1: 
        summaryLengthDescription = "muy breve";
        break;
      case 2:
        summaryLengthDescription = "breve";
        break;
      case 3:
        summaryLengthDescription = "normal";
        break;
      case 4:
        summaryLengthDescription = "detallado";
        break;
      case 5:
        summaryLengthDescription = "muy detallado";
        break;
      default:
        summaryLengthDescription = "normal";
    }

    const systemPrompt = dedent`
      Eres un experto en resumir textos.

      Tu tarea:
      1. Lee el fragmento de documento que te proporcionaré
      2. Crea un resumen conciso en ${language}
      3. Genera un título corto y descriptivo en ${language}
      
      La longitud del resumen debe ser ${summaryLengthDescription}.

      Pautas para el resumen:
      - Formatea el resumen en HTML
      - Usa etiquetas <p> para los párrafos (2-3 oraciones cada uno)
      - Usa etiquetas <ul> y <li> para listas de viñetas
      - Usa etiquetas <h3> para subtítulos cuando sea necesario, pero no repitas el título inicial en el primer párrafo
      - Asegura un espaciado adecuado con las etiquetas HTML apropiadas
      
      El resumen debe estar bien estructurado y ser fácil de leer, manteniendo precisión e integridad.
      Por favor, analiza el texto completamente antes de comenzar el resumen.
      
      IMPORTANTE: Genera SOLO HTML válido sin markdown ni saltos de línea de texto plano.
    `;

    const summarySchema = z.object({
      title: z.string().describe("Un título para el resumen"),
      summary: z
        .string()
        .describe(
          "El resumen del texto que contiene saltos de línea entre párrafos o frases para una mejor legibilidad.",
        ),
    });

    const summaryResponse = await generateObject({
      model: togetheraiClient("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
      schema: summarySchema,
      maxRetries: 2,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      // maxTokens: 800,
    });

    const rayId = summaryResponse.response?.headers?.["cf-ray"];
    console.log("Ray ID:", rayId);

    const content = summaryResponse.object;
    console.log(summaryResponse.usage);

    if (!content) {
      console.log("El contenido estaba vacío");
      return Response.json({ error: "Error al generar el resumen" }, { status: 500 });
    }

    return Response.json(content);
  } catch (error) {
    console.error("Error de resumen:", error);
    return Response.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

export const runtime = "edge";
