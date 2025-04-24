import { togetheraiClient } from "@/lib/ai";
import assert from "assert";
import dedent from "dedent";
import { z } from "zod";
import { generateObject } from "ai";

export async function POST(req: Request) {
  const { text, language } = await req.json();

  assert.ok(typeof text === "string");
  assert.ok(typeof language === "string");

  const systemPrompt = dedent`
    You are an expert at summarizing text.

    Your task:
    1. Read the document excerpt I will provide
    2. Create a concise summary in ${language}
    3. Generate a short, descriptive title in ${language}

    Guidelines for the summary:
    - Break down the summary into short, focused paragraphs (2-3 sentences each)
    - Use bullet points for listing key facts or points
    - Include line breaks between paragraphs for better readability
    
    The summary should be well-structured and easy to scan, while maintaining accuracy and completeness.
    Please analyze the text thoroughly before starting the summary.
  `;

  const summarySchema = z.object({
    title: z.string().describe("A title for the summary"),
    summary: z
      .string()
      .describe(
        "The actual summary of the text containing new lines breaks between paragraphs or phrases for better readability.",
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
    maxTokens: 800,
  });

  const rayId = summaryResponse.response?.headers?.["cf-ray"];
  console.log("Ray ID:", rayId);

  const content = summaryResponse.object;
  console.log(summaryResponse.usage);

  if (!content) {
    console.log("Content was blank");
    return;
  }

  return Response.json(content);
}

export const runtime = "edge";
