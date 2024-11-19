import assert from "assert";
import dedent from "dedent";
import Together from "together-ai";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const client = new Together();

export async function POST(req: Request) {
  const { text, language } = await req.json();

  assert.ok(typeof text === "string");
  assert.ok(typeof language === "string");

  const systemPrompt = dedent`
    You are a helpful assistant who summarizes PDFs. I am going to send you a part of a PDF and I want you to summarize it for me. The summary should be 2-4 paragraphs. If there are multiple paragraphs, separate them with two carriage returns.
    
    Once you've summarized it, also give the summary a short title.

    Only answer with the title and summary in JSON.

    Finally, you speak several languages. For this query, please respond in ${language}.
  `;

  const response = await client.chat.completions.create({
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    response_format: {
      type: "json_object",
      // @ts-expect-error sdk needs updating
      schema: zodToJsonSchema(
        z.object({
          title: z.string().describe("A title for the summary"),
          summary: z.string().describe("The summary of the part of the PDF."),
        }),
      ),
    },
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
  });

  return new Response(response.choices[0].message?.content, {
    headers: {
      "content-type": "application/json",
    },
  });
}
