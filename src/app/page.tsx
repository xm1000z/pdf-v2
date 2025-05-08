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
import { MenuIcon, SquareArrowOutUpRight } from "lucide-react";
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
    const formData = new FormData(e.currentTarget);
    const language = formData.get("language");
    const summary_length = formData.get("summary_length");

    if (!file || typeof language !== "string") return;

    setStatus("parsing");

    const uploadedPdfPromise = uploadToS3(file);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    if (pdf.numPages > 500) {
      toast({
        variant: "destructive",
        title: "PDF demasiado grande (máximo 500 páginas)",
        description: "Este PDF tiene demasiadas páginas. Por favor, usa un PDF más pequeño.",
      });
      setStatus("idle");
      return;
    }

    const localChunks = await chunkPdf(pdf);
    const totalText = localChunks.reduce(
      (acc, chunk) => acc + chunk.text.length,
      0,
    );

    if (totalText < 500) {
      toast({
        variant: "destructive",
        title: "No se puede procesar el PDF",
        description:
          "El PDF parece ser un documento escaneado o contiene muy poco texto para procesar. Asegúrate de que el PDF contenga texto que se pueda buscar.",
      });
      setFile(undefined);
      setStatus("idle");
      return;
    }

    setChunks(localChunks);
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

    const stream = await summarizeStream(localChunks, language, summary_length ? Number(summary_length) : 3);
    const controller = new AbortController();
    await stream.pipeTo(writeStream, { signal: controller.signal });

    const quickSummary = await generateQuickSummary(summarizedChunks, language, summary_length ? Number(summary_length) : 3);
    const imageUrl = await generateImage(quickSummary.summary);

    setQuickSummary(quickSummary);
    setImage(imageUrl);

    const uploadedPdf = await uploadedPdfPromise;
    setFileUrl(uploadedPdf.url);

    setActiveChunkIndex((activeChunkIndex) =>
      activeChunkIndex === null ? "quick-summary" : activeChunkIndex,
    );

    await sharePdf({
      pdfName: file.name,
      pdfUrl: uploadedPdf.url,
      imageUrl: imageUrl,
      sections: [
        {
          type: "quick-summary",
          title: quickSummary.title,
          summary: quickSummary.summary,
          position: 0,
        },
        ...summarizedChunks.map((chunk, index) => ({
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
                      <span>PDF Original</span>
                    </ActionButton>
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-gray-200 px-4 py-2 shadow md:hidden">
              <Button
                onClick={() => setShowMobileContents(!showMobileContents)}
                className="w-full text-gray-500 hover:bg-transparent"
                variant="ghost"
              >
                <MenuIcon />
                {showMobileContents ? "Ocultar" : "Mostrar"} contenido
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
                    imageUrl={image}
                  />
                ) : activeChunkIndex !== null ? (
                  <SummaryContent
                    title={chunks[activeChunkIndex].title}
                    summary={chunks[activeChunkIndex].summary}
                  />
                ) : (
                  <div className="flex animate-pulse items-center justify-center py-4 text-lg md:py-8">
                    Generando tu PDF&hellip;
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
