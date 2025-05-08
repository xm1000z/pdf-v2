import dedent from "dedent";
import { togetheraiBaseClient } from "@/lib/ai";
import { ImageGenerationResponse } from "@/lib/summarize";
import { awsS3Client } from "@/lib/s3client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const text = "text" in json ? json.text : "";

    const start = new Date();

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

    const end = new Date();
    console.log(
      `Flux took ${end.getTime() - start.getTime()}ms to generate an image`,
    );

    const fluxImageUrl = generatedImage.data[0]?.url;

    if (!fluxImageUrl) {
      return Response.json({ error: "No image URL from Flux" }, { status: 500 });
    }

    const fluxFetch = await fetch(fluxImageUrl);
    const fluxImage = await fluxFetch.blob();
    const imageBuffer = Buffer.from(await fluxImage.arrayBuffer());

    const coverImageKey = `pdf-cover-${generatedImage.id}.jpg`;

    try {
      const uploadedFile = await awsS3Client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_UPLOAD_BUCKET || "",
          Key: coverImageKey,
          Body: imageBuffer,
          ContentType: "image/jpeg",
        }),
      );

      if (!uploadedFile) {
        return Response.json({ error: "Failed to upload image to S3" }, { status: 500 });
      }

      return Response.json({
        url: `https://${process.env.S3_UPLOAD_BUCKET}.s3.${
          process.env.S3_UPLOAD_REGION || "us-east-1"
        }.amazonaws.com/${coverImageKey}`,
      } as ImageGenerationResponse);
    } catch (error) {
      console.error("S3 upload error:", error);
      return Response.json({ error: "S3 upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Image generation error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export const runtime = "edge";
