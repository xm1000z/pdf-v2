import { PDFDocumentProxy } from "pdfjs-dist";

export type Chunk = {
  text: string;
  summary?: string;
};

export async function getPdfText(pdf: PDFDocumentProxy) {
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

  return fullText;
}

export async function chunkPdf(pdf: PDFDocumentProxy) {
  // const chunkCharSize = 6000; // 100k
  // const chunkCharSize = 100_000;
  const maxChunkSize = 100_000;
  // ideally have at least 4 chunks
  // chunk size = total chars / 4 OR 100k, whichever is smaller

  const fullText = await getPdfText(pdf);

  const chunks: Chunk[] = [];
  const chunkCharSize = Math.min(maxChunkSize, Math.ceil(fullText.length / 4));

  for (let i = 0; i < fullText.length; i += chunkCharSize) {
    const text = fullText.slice(i, i + chunkCharSize);
    chunks.push({ text });
  }

  return chunks;
}

export async function summarizeStream(chunks: Chunk[]) {
  let reading = true;
  const stream = new ReadableStream({
    async start(controller) {
      const promises = chunks.map(async (chunk) => {
        const text = chunk.text;
        const response = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });
        const data = await response.json();

        if (reading) {
          controller.enqueue({
            ...chunk,
            summary: data.summary,
          });
        }
      });

      await Promise.all(promises);
      controller.close();
    },

    cancel() {
      console.log("read stream canceled");
      reading = false;
    },
  });

  return stream;
}

export async function generateQuickSummary(chunks: Chunk[]) {
  const allSummaries = chunks.map((chunk) => chunk.summary).join("\n\n");

  const response = await fetch("/api/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: allSummaries }),
  });

  const data = await response.json();
  const summary = data.summary;

  return typeof summary === "string" ? summary : "No summary available";
}

export async function generateImage(summary: string) {
  const response = await fetch("/api/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: summary }),
  });

  const data = await response.json();
  const image = data.image;

  return typeof image === "string" ? image : null;
}
