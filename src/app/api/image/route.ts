import dedent from "dedent";
import Together from "together-ai";

const client = new Together();

export async function POST(req: Request) {
  const json = await req.json();
  const text = "text" in json ? json.text : "";

  const prompt = dedent`
    I'm going to give you a short summary of what is in a PDF. I need you to create an image that captures the essence of the content.
    
    The image should be one that looks good as a hero image on a blog post or website. It should not include any text.

    Here is the summary:

    ${text}
  `;

  const response = await client.images.create({
    model: "black-forest-labs/FLUX.1-schnell",
    prompt,
    steps: 5,
    width: 1280,
    height: 720,
    // @ts-ignore
    response_format: "base64",
  });

  const image = response.data[0].b64_json;
  const payload = {
    image,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json",
    },
  });
}

export const runtime = "edge";
