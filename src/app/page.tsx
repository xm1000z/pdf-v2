"use client";

import { Button } from "@/components/ui/button";
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import Dropzone from "react-dropzone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormEvent, useState } from "react";
import {
  Chunk,
  chunkPdf,
  generateImage,
  generateQuickSummary,
  summarizeStream,
} from "@/lib/summarize";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "generating">("generating");
  const [file, setFile] = useState<File>();
  const [fileUrl, setFileUrl] = useState<string>();
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [controller, setController] = useState<AbortController>();
  const [quickSummary, setQuickSummary] = useState<string>();
  const [image, setImage] = useState<string>();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!file) return;

    setStatus("generating");
    // const fileUrl = URL.createObjectURL(file);
    // setFileUrl(fileUrl);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    setPdf(pdf);

    const chunks = await chunkPdf(pdf);
    setChunks(chunks);

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
        console.log("write stream closed");
      },
    });

    const stream = await summarizeStream(chunks);
    const controller = new AbortController();
    setController(controller);

    await stream.pipeTo(writeStream, { signal: controller.signal });

    const quickSummary = await generateQuickSummary(summarizedChunks);
    setQuickSummary(quickSummary);

    const image = await generateImage(quickSummary);
    setImage(`data:image/png;base64,${image}`);
  }

  return (
    <div>
      {status === "idle" ? (
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
                    <input required {...getInputProps()} />
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
              <Button type="submit" variant="secondary" className="bg-white">
                Generate
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="border-gray-250 flex items-center justify-between rounded-xl border px-6 py-3">
            <p className="text-lg">Morocco History.pdf</p>

            <div>
              <Button>Share</Button>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <div className="rounded-xl bg-white p-4 shadow">
              <p>The Rich culture of Morocco</p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Vitae
                nam eum facilis cupiditate assumenda corporis ipsa tenetur culpa
                earum mollitia itaque repellat minima ipsam recusandae labore
                modi, quos iure adipisci?
              </p>
            </div>

            <div className="flex w-full max-w-72 shrink-0 flex-col gap-4">
              <Button
                variant="outline"
                className="border-gray-250 justify-start px-4 py-6 text-base shadow-sm"
              >
                Quick summary
              </Button>
              <hr />

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="border-gray-250 justify-start px-4 py-6 text-base shadow-sm"
                >
                  Section 1
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-250 justify-start px-4 py-6 text-base shadow-sm"
                >
                  Section 2
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-250 justify-start px-4 py-6 text-base shadow-sm"
                >
                  Section 3
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
