import dedent from "dedent";
import { experimental_generateImage as generateImage } from "ai";
import { togetheraiClient } from "@/lib/ai";

export async function POST(req: Request) {
  const json = await req.json();
  const text = "text" in json ? json.text : "";

  const prompt = dedent`
    I'm going to give you a short summary of what is in a PDF. I need you to create an image that captures the essence of the content.
    
    The image should be one that looks good as a hero image on a blog post or website. It should not include any text.

    Here is the summary:

    ${text}
  `;

  const { images } = await generateImage({
    model: togetheraiClient.image("black-forest-labs/FLUX.1-dev"),
    prompt: prompt,
    providerOptions: {
      togetherai: {
        steps: 5,
      },
    },
    size: "1280x720",
  });

  const image = images[0].base64;
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
