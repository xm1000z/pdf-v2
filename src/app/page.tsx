"use client";

import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import { ChangeEvent, useState } from "react";

// test early on vercel
import "pdfjs-dist/build/pdf.worker.mjs";

type Chunk = {
  text: string;
  summary?: string;
};

export default function Home() {
  const [file, setFile] = useState<File>();
  const [fileUrl, setFileUrl] = useState<string>();
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [controller, setController] = useState<AbortController>();

  const [isShowingChunks, setIsShowingChunks] = useState(true);

  async function handleSelectPdf(event: ChangeEvent<HTMLInputElement>) {
    console.log("pdf selected");

    if (event.target.files) {
      const file = event.target.files[0];
      setFile(file);

      const fileUrl = URL.createObjectURL(file);
      setFileUrl(fileUrl);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      setPdf(pdf);

      const chunks = await chunkPdf(pdf);
      setChunks(chunks);

      const writeStream = new WritableStream({
        write(chunk) {
          setChunks((chunks) => {
            return chunks.map((c) => {
              return c.text === chunk.text ? chunk : c;
            });
          });
        },

        close() {
          console.log("write stream closed");
        },
      });

      const stream = await summarizeStream(chunks);
      const controller = new AbortController();
      stream.pipeTo(writeStream, { signal: controller.signal });

      setController(controller);
    } else {
      console.log("no file selected");
      setFile(undefined);
    }
  }

  async function chunkPdf(pdf: PDFDocumentProxy) {
    // const chunkCharSize = 6000; // 100k
    const chunkCharSize = 100_000;
    // ideally have at least 4 chunks
    // chunk size = total chars / 4 OR 100k, whichever is smaller
    const numPages = pdf.numPages;
    let fullText = "";

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum); // Get page
      const textContent = await page.getTextContent(); // Extract text content

      // Concatenate text from all items on the page
      const pageText = textContent.items
        .map((item) => {
          return "str" in item ? item.str : "";
        })
        .join(" ");

      fullText += pageText + "\n"; // Add page text to full text
    }

    const chunks: Chunk[] = [];

    for (let i = 0; i < fullText.length; i += chunkCharSize) {
      const text = fullText.slice(i, i + chunkCharSize);
      chunks.push({ text });
    }

    return chunks;
  }

  async function summarizeStream(chunks: Chunk[]) {
    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const text = chunk.text;
          const response = await fetch("/api/summarize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          });
          const data = await response.json();

          controller.enqueue({
            ...chunk,
            summary: data.summary,
          });
        }
      },

      cancel() {
        console.log("read stream canceled");
      },
    });

    return stream;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2>1. Upload PDF</h2>
        <form>
          <input type="file" accept=".pdf" onChange={handleSelectPdf} />
        </form>
      </div>
      <div>
        <h2>2. PDF</h2>
        <div>
          <ul className="mt-2 space-y-1">
            {!!(file && fileUrl) && (
              <li>
                File:{" "}
                <a
                  href={fileUrl}
                  download={file.name}
                  className="text-blue-500 underline"
                >
                  {file.name}
                </a>
              </li>
            )}
            {pdf && <li>Pages: {pdf?.numPages}</li>}
          </ul>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h2>3. Chunk PDF</h2>
          {chunks.length > 0 && (
            <button onClick={() => setIsShowingChunks((c) => !c)}>
              {isShowingChunks ? "Hide" : "Show"} chunks
            </button>
          )}
        </div>
        <div>
          {isShowingChunks ? (
            <ul className="mt-4 space-y-4">
              {chunks.map((chunk, index) => (
                <li key={index}>
                  <div className="bg-gray-300 px-2 py-1 text-xs font-medium">
                    Chunk {index + 1}
                  </div>
                  <div className="whitespace-pre-wrap border border-gray-300 p-4">
                    {chunk.text}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>Extracted {chunks.length} total chunks.</p>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h2>4. Summarize</h2>
          {controller && (
            <button
              onClick={() => {
                controller.abort("Canceled by user");
                setController(undefined);
              }}
            >
              Cancel
            </button>
          )}
        </div>
        <div>
          <ul className="mt-4 space-y-4">
            {chunks.map((chunk, index) => (
              <li key={index}>
                <div className="bg-gray-300 px-2 py-1 text-xs font-medium">
                  Chunk {index + 1}
                </div>
                <div className="whitespace-pre-wrap border border-gray-300 p-4">
                  {chunk.summary ? (
                    chunk.summary
                  ) : (
                    <p className="text-sm italic text-gray-600">
                      Summary loading...
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
