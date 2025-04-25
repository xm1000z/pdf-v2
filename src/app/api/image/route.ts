import dedent from "dedent";
import { togetheraiBaseClient } from "@/lib/ai";
import { ImageGenerationResponse } from "@/lib/summarize";

export async function POST(req: Request) {
  const json = await req.json();
  const text = "text" in json ? json.text : "";

  const prompt = dedent`
    I'm going to give you a short summary of what is in a PDF. I need you to create an image that captures the essence of the content.
    
    The image should be one that looks good as a hero image on a blog post or website. It should not include any text.

    Here is the summary:

    ${text}
  `;

  const generatedImage = await togetheraiBaseClient.images.create({
    model: "black-forest-labs/FLUX.1-dev",
    width: 1280,
    height: 720,
    steps: 24,
    prompt: prompt,
  });

  return Response.json({
    url: generatedImage.data[0].url,
  } as ImageGenerationResponse);
}

export const runtime = "edge";
