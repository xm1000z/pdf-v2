import dedent from "dedent";
import Together from "together-ai";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const client = new Together();

const systemPrompt = dedent`
  You are a helpful assistant who summarizes PDFs. I am going to send you a part of a PDF and I want you to summarize it for me. The summary should be short and to the point. Do not add any extra text, markup, or formatting.
  
  Once you've summarized it, also give the summary a short title.

  Only answer with the title and summary in JSON.
`;

export async function POST(req: Request) {
  const json = await req.json();
  const text = "text" in json ? json.text : "";

  const response = await client.chat.completions.create({
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    response_format: {
      type: "json_object",
      // @ts-ignore
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
