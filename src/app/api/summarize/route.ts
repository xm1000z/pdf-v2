import assert from "assert";
import dedent from "dedent";
import Together from "together-ai";

// Add observability if a Helicone key is specified, otherwise skip
const options: ConstructorParameters<typeof Together>[0] = {};
if (process.env.HELICONE_API_KEY) {
  options.baseURL = "https://together.helicone.ai/v1";
  options.defaultHeaders = {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Property-AppName": "SmartPDF",
  };
}

const client = new Together(options);

export async function POST(req: Request) {
  const { text, language } = await req.json();

  assert.ok(typeof text === "string");
  assert.ok(typeof language === "string");

  const systemPrompt = dedent`
    You are an expert at synthesizing and summarizing text. I am going to send you a part of a document and I want you to summarize it for me. The summary should be 2-4 paragraphs. Once you've summarized it, also give the summary a short title.

    You speak several languages. For this query, please respond in ${language}.

    Only answer with the title and summary in JSON. {title: string, summary: string}. It's very important for my job that you ONLY respond with the JSON and nothing else.
  `;

  const response = await client.chat.completions.create({
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
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

export const runtime = "edge";
