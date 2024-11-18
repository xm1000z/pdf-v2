"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import {
  Chunk,
  chunkPdf,
  generateImage,
  generateQuickSummary,
  summarizeStream,
} from "@/lib/summarize";
import { getDocument } from "pdfjs-dist";
// import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { FormEvent, useState } from "react";
import Dropzone from "react-dropzone";

// test early on vercel
import "pdfjs-dist/build/pdf.worker.mjs";
import Image from "next/image";
import SparklesIcon from "@/components/icons/sparkles";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "parsing" | "generating">(
    "idle",
  );
  const [file, setFile] = useState<File>();
  // const [fileUrl, setFileUrl] = useState<string>();
  // const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState<
    number | "quick-summary" | null
  >(null);
  // const [controller, setController] = useState<AbortController>();
  const [quickSummary, setQuickSummary] = useState<string>();
  const [image, setImage] = useState<string>();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) return;

    // const fileUrl = URL.createObjectURL(file);
    // setFileUrl(fileUrl);
    setStatus("parsing");

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    // setPdf(pdf);

    const chunks = await chunkPdf(pdf);
    setChunks(chunks);

    setStatus("generating");

    const summarizedChunks: Chunk[] = [];

    const writeStream = new WritableStream({
      write(chunk) {
        summarizedChunks.push(chunk);
        setChunks((chunks) => {
          return chunks.map((c) => {
            return c.text === chunk.text ? { ...c, ...chunk } : c;
          });
        });
      },

      close() {
        // console.log("write stream closed");
      },
    });

    const stream = await summarizeStream(chunks);
    const controller = new AbortController();
    // setController(controller);

    await stream.pipeTo(writeStream, { signal: controller.signal });

    const quickSummary = await generateQuickSummary(summarizedChunks);
    const image = await generateImage(quickSummary);

    setQuickSummary(quickSummary);
    setImage(`data:image/png;base64,${image}`);

    setActiveChunkIndex((activeChunkIndex) =>
      activeChunkIndex === null ? "quick-summary" : activeChunkIndex,
    );
  }

  return (
    <div>
      {status === "idle" || status === "parsing" ? (
        <div className="mx-auto max-w-lg">
          <h1>Summarize PDFs in seconds</h1>
          <p>Upload a PDF to get a quick, clear summary—your way.</p>
          <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-sm">
            <div className="flex flex-col rounded-xl bg-white p-12 shadow">
              <label className="text-gray-300" htmlFor="file">
                Upload PDF
              </label>
              <Dropzone
                multiple={false}
                // accept={{ "image/png": [".png", ".jpg", ".jpeg"] }}
                onDrop={(acceptedFiles) => setFile(acceptedFiles[0])}
              >
                {({
                  getRootProps,
                  getInputProps,
                  isDragAccept,
                  acceptedFiles,
                }) => (
                  <div
                    className={`mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-lg border border-dashed bg-gray-100 ${isDragAccept ? "border-blue-500" : "border-gray-900/25"}`}
                    {...getRootProps()}
                  >
                    <input {...getInputProps()} />
                    <div className="text-center">
                      {acceptedFiles.length > 0 ? (
                        <p>{acceptedFiles[0].name}</p>
                      ) : (
                        <Button>Select PDF</Button>
                      )}
                    </div>
                  </div>
                )}
              </Dropzone>
              <label className="mt-8 text-gray-300" htmlFor="language">
                Language
              </label>
              <Select defaultValue="english">
                <SelectTrigger className="bg-gray-100" id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 text-center">
              <Button
                type="submit"
                variant="secondary"
                className="border bg-white text-base font-semibold"
                disabled={status === "parsing"}
              >
                <SparklesIcon />
                Generate
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="border-gray-250 flex items-center justify-between rounded-xl border px-6 py-3">
            <p className="text-lg">{file?.name}</p>

            <div>
              <Button>Share</Button>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <div className="w-full grow rounded-xl bg-white p-5 text-gray-500 shadow">
              {activeChunkIndex === "quick-summary" ? (
                <div>
                  {image && (
                    <Image
                      className="rounded-md"
                      src={image}
                      width={1280}
                      height={720}
                      alt=""
                    />
                  )}
                  <hr className="-mx-4 my-8" />
                  <div>{quickSummary}</div>
                </div>
              ) : activeChunkIndex !== null ? (
                <div>{chunks[activeChunkIndex].summary}</div>
              ) : null}
            </div>

            <div className="flex w-full max-w-60 shrink-0 flex-col gap-4">
              <Button
                variant="outline"
                className={`${activeChunkIndex === "quick-summary" ? "bg-white hover:bg-white" : ""} border-gray-250 inline-flex w-full justify-between px-4 py-6 text-base shadow-sm`}
                onClick={() => setActiveChunkIndex("quick-summary")}
                disabled={!quickSummary}
              >
                Quick summary
                <Spinner loading={!quickSummary} />
              </Button>

              <hr />

              <div className="flex flex-col gap-2">
                {chunks.map((chunk, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className={`${activeChunkIndex === i ? "bg-white hover:bg-white" : ""} border-gray-250 inline-flex w-full justify-between px-4 py-6 text-base shadow-sm disabled:cursor-not-allowed`}
                    disabled={!chunk.summary}
                    onClick={() => setActiveChunkIndex(i)}
                  >
                    <span>Section {i + 1}</span>
                    <Spinner loading={!chunk.summary} />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
