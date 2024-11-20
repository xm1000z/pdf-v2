"use client";

import { sharePdf } from "@/app/actions";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { Chunk } from "@/lib/summarize";
import { Section, SmartPDF } from "@prisma/client";
import { LinkIcon, MenuIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function SmartPDFViewer({
  smartPdf,
}: {
  smartPdf: SmartPDF & { sections: Section[] };
}) {
  const [showMobileContents, setShowMobileContents] = useState(true);
  const [activeChunkIndex, setActiveChunkIndex] = useState<
    number | "quick-summary"
  >("quick-summary");

  return (
    <div className="mt-6 px-4 md:mt-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between rounded-lg border border-gray-250 px-4 py-2 md:px-6 md:py-3">
          <p className="md:text-lg">{smartPdf.pdfName}</p>
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
                <hr className="-mx-5 my-8" />
                <h2 className="font-semibold text-gray-900">
                  {quickSummary?.title}
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-sm">
                  {quickSummary?.summary}
                </div>
              </div>
            ) : activeChunkIndex !== null ? (
              <div>
                <h2 className="font-semibold text-gray-900">
                  {chunks[activeChunkIndex].title}
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-sm">
                  {chunks[activeChunkIndex].summary}
                </div>
              </div>
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
              quickSummary={smartPdf.sections[0]}
              chunks={smartPdf.sections.slice(1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TableOfContents({
  activeChunkIndex,
  setActiveChunkIndex,
  quickSummary,
  chunks,
}: {
  activeChunkIndex: number | "quick-summary" | null;
  setActiveChunkIndex: (index: number | "quick-summary") => void;
  quickSummary: { title: string; summary: string } | undefined;
  chunks: Chunk[];
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <Button
        variant="outline"
        className={`${activeChunkIndex === "quick-summary" ? "bg-white hover:bg-white" : "hover:bg-gray-200"} inline-flex w-full justify-between border-gray-250 px-4 py-6 text-base font-semibold shadow-sm`}
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
            className={`${activeChunkIndex === i ? "bg-white hover:bg-white" : "hover:bg-gray-200"} inline-flex h-auto w-full justify-between border-gray-250 px-4 py-3 text-base shadow-sm transition disabled:cursor-not-allowed`}
            disabled={!chunk.summary}
            onClick={() => setActiveChunkIndex(i)}
          >
            <span className="flex h-full min-w-0 flex-col justify-start text-left">
              <span className="text-xs font-medium uppercase text-gray-500">
                Section {i + 1}
              </span>
              <span className="truncate text-sm">
                {chunk.title ?? <>&hellip;</>}
              </span>
            </span>
            <Spinner loading={!chunk.summary} />
          </Button>
        ))}
      </div>
    </div>
  );
}
