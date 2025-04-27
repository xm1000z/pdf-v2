import dedent from "dedent";
import { togetheraiBaseClient } from "@/lib/ai";
import { ImageGenerationResponse } from "@/lib/summarize";
import { awsS3Client } from "@/lib/s3client";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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
  const fluxImageUrl = generatedImage.data[0].url;

  if (!fluxImageUrl) throw new Error("No image URL from Flux");

  const fluxFetch = await fetch(fluxImageUrl);
  const fluxImage = await fluxFetch.blob();
  const imageBuffer = Buffer.from(await fluxImage.arrayBuffer());

  const coverImageKey = `pdf-cover-${generatedImage.id}.jpg`;

  const uploadedFile = await awsS3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_UPLOAD_BUCKET || "",
      Key: coverImageKey,
      Body: imageBuffer,
      ContentType: "image/jpeg",
    }),
  );

  if (!uploadedFile) {
    throw new Error("Failed to upload enhanced image to S3");
  }

  return Response.json({
    url: `https://${process.env.S3_UPLOAD_BUCKET}.s3.${
      process.env.S3_UPLOAD_REGION || "us-east-1"
    }.amazonaws.com/${coverImageKey}`,
  } as ImageGenerationResponse);
}

export const runtime = "edge";
