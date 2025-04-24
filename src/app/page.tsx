"use client";

import { useS3Upload } from "next-s3-upload";
import { Button } from "@/components/ui/button";
import {
  Chunk,
  chunkPdf,
  generateImage,
  generateQuickSummary,
  summarizeStream,
} from "@/lib/summarize";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { FormEvent, useState } from "react";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";
import { LinkIcon, MenuIcon, SquareArrowOutUpRight } from "lucide-react";
import { sharePdf } from "@/app/actions";
import ActionButton from "@/components/ui/action-button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { HomeLandingDrop } from "@/components/HomeLandingDrop";
import SummaryContent from "@/components/ui/summary-content";
import TableOfContents from "@/components/ui/table-of-contents";

export type StatusApp = "idle" | "parsing" | "generating";

export default function Home() {
  const [status, setStatus] = useState<StatusApp>("idle");
  const [file, setFile] = useState<File>();
  const [fileUrl, setFileUrl] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState<
    number | "quick-summary" | null
  >(null);
  const [quickSummary, setQuickSummary] = useState<{
    title: string;
    summary: string;
  }>();
  const [image, setImage] = useState<string>();
  const [showMobileContents, setShowMobileContents] = useState(true);
  const { uploadToS3 } = useS3Upload();

  const { toast } = useToast();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const language = new FormData(e.currentTarget).get("language");

    if (!file || typeof language !== "string") return;

    setStatus("parsing");

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    if (pdf.numPages > 500) {
      toast({
        variant: "destructive",
        title: "PDF too large (500 pages max)",
        description: "That PDF has too many pages. Please use a smaller PDF.",
      });
      setStatus("idle");
      return;
    }
    const chunks = await chunkPdf(pdf);

    setChunks(chunks);
    setStatus("generating");

    const summarizedChunks: Chunk[] = [];

    const writeStream = new WritableStream({
      write(chunk) {
        summarizedChunks.push(chunk);
        setChunks((chunks) => {
          return chunks.map((c) =>
            c.text === chunk.text ? { ...c, ...chunk } : c,
          );
        });
      },
    });

    const stream = await summarizeStream(chunks, language);
    const controller = new AbortController();
    await stream.pipeTo(writeStream, { signal: controller.signal });

    const quickSummary = await generateQuickSummary(summarizedChunks, language);
    const image = await generateImage(quickSummary.summary);

    setQuickSummary(quickSummary);
    setImage(`data:image/png;base64,${image}`);

    setActiveChunkIndex((activeChunkIndex) =>
      activeChunkIndex === null ? "quick-summary" : activeChunkIndex,
    );
  }

  async function shareAction() {
    if (!file || !quickSummary || !image) return;

    const uploadedPdf = await uploadToS3(file);
    setFileUrl(uploadedPdf.url);
    const uploadedImage = await uploadToS3(
      base64ToFile(image, "image.png", "image/png"),
    );

    await sharePdf({
      pdfName: file.name,
      pdfUrl: uploadedPdf.url,
      imageUrl: uploadedImage.url,
      sections: [
        {
          type: "quick-summary",
          title: quickSummary.title,
          summary: quickSummary.summary,
          position: 0,
        },
        ...chunks.map((chunk, index) => ({
          type: "summary",
          title: chunk?.title ?? "",
          summary: chunk?.summary ?? "",
          position: index + 1,
        })),
      ],
    });
  }

  return (
    <div>
      {status === "idle" || status === "parsing" ? (
        <HomeLandingDrop
          status={status}
          file={file}
          setFile={(file) => file && setFile(file)}
          handleSubmit={handleSubmit}
        />
      ) : (
        <div className="mt-6 px-4 md:mt-10">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between rounded-lg border border-gray-250 px-4 py-2 md:px-6 md:py-3">
              <div className="inline-flex items-center gap-4">
                <p className="md:text-lg">{file?.name}</p>
              </div>

              <div className="flex flex-row gap-2">
                {fileUrl && (
                  <Link href={fileUrl} target="_blank">
                    <ActionButton>
                      <SquareArrowOutUpRight size={14} />
                      <span>Original PDF</span>
                    </ActionButton>
                  </Link>
                )}
                <form action={shareAction}>
                  <fieldset disabled={!quickSummary}>
                    <div className="md:hidden">
                      <ActionButton type="submit" size="icon">
                        <LinkIcon />
                      </ActionButton>
                    </div>
                    <div className="hidden md:block">
                      <ActionButton type="submit">
                        <LinkIcon />
                        <span>Share Summary</span>
                      </ActionButton>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-gray-200 px-4 py-2 shadow md:hidden">
              <Button
                onClick={() => setShowMobileContents(!showMobileContents)}
                className="w-full text-gray-500 hover:bg-transparent"
                variant="ghost"
              >
                <MenuIcon />
                {showMobileContents ? "Hide" : "Show"} contents
              </Button>

              {showMobileContents && (
                <div className="mt-4">
                  <TableOfContents
                    activeChunkIndex={activeChunkIndex}
                    setActiveChunkIndex={setActiveChunkIndex}
                    quickSummary={quickSummary}
                    chunks={chunks}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-4">
              <div className="w-full grow rounded-lg bg-white p-5 text-gray-500 shadow">
                {activeChunkIndex === "quick-summary" ? (
                  <SummaryContent
                    title={quickSummary?.title}
                    summary={quickSummary?.summary}
                    image={image}
                  />
                ) : activeChunkIndex !== null ? (
                  <SummaryContent
                    title={chunks[activeChunkIndex].title}
                    summary={chunks[activeChunkIndex].summary}
                  />
                ) : (
                  <div className="flex animate-pulse items-center justify-center py-4 text-lg md:py-8">
                    Generating your Smart PDF&hellip;
                  </div>
                )}
              </div>

              <div className="hidden w-full max-w-60 shrink-0 md:flex">
                <TableOfContents
                  activeChunkIndex={activeChunkIndex}
                  setActiveChunkIndex={setActiveChunkIndex}
                  quickSummary={quickSummary}
                  chunks={chunks}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function base64ToFile(
  base64String: string,
  fileName: string,
  mimeType: string,
): File {
  // Ensure the Base64 string has the correct format
  if (!base64String.startsWith("data:")) {
    throw new Error(
      "Invalid Base64 string format. It must include the data URI scheme (e.g., data:image/png;base64,...)",
    );
  }

  // Decode the Base64 string
  const byteString = atob(base64String.split(",")[1]);

  // Create a typed array from the binary string
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  // Create a Blob from the typed array
  const blob = new Blob([byteArray], { type: mimeType });

  // Create and return the File object
  return new File([blob], fileName, { type: mimeType });
}
