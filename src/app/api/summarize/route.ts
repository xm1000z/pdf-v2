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
    You are an expert at summarizing text. I am going to send you a part of a document and I want you to concisely summarize it for me in a few paragraphs. I also want you to generate a short title for the summary, all in ${language}.

    Think carefully step by step and make sure to cover all the important points of the document in the summary.
  `;

  // - Only answer with the title and summary in JSON. {title: string, summary: string}
  //   - It's VERY important for my job that you ONLY respond with the JSON and nothing else.

  const summarySchema = z.object({
    title: z.string().describe("A title for the summary"),
    summary: z.string().describe("The actual summary of the text."),
  });

  const summaryResponse = await generateObject({
    model: togetheraiClient("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
    schema: summarySchema,
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
