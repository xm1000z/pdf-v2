import dedent from "dedent";
import Together from "together-ai";

const client = new Together();

const systemPrompt = dedent`
  You are a helpful assistant who summarizes PDFs. 

  I am going to send you a part of a PDF and I want you to summarize it for me.
  
  The summary should be short and to the point. Do not add any extra text, markup, or formatting. Only return a summary.,
`;

export async function POST(req: Request) {
  const json = await req.json();
  const text = "text" in json ? json.text : "";

  // await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await client.chat.completions.create({
    // model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
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

  const summary = response.choices[0].message?.content;

  const payload = {
    summary,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json",
    },
  });
}
