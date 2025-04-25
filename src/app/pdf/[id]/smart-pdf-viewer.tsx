"use client";

import { Button } from "@/components/ui/button";
import { Section, SmartPDF } from "@prisma/client";
import { MenuIcon, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import TableOfContents from "@/components/ui/table-of-contents";
import SummaryContent from "@/components/ui/summary-content";
import ActionButton from "@/components/ui/action-button";

export default function SmartPDFViewer({
  smartPdf,
}: {
  smartPdf: SmartPDF & { sections: Section[] };
}) {
  const [showMobileContents, setShowMobileContents] = useState(true);
  const [activeSection, setActiveSection] = useState<number | "quick-summary">(
    "quick-summary",
  );

  const quickSummary = smartPdf.sections[0];
  const pdfSections = smartPdf.sections.slice(1);

  return (
    <div className="mt-6 px-4 md:mt-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-250 px-4 py-2 text-center sm:flex-row md:px-6 md:py-3">
          <p className="md:text-lg md:leading-9">{smartPdf.pdfName}</p>
          <Link href={smartPdf.pdfUrl} target="_blank">
            <ActionButton>
              <SquareArrowOutUpRight size={14} />
              <span>Original PDF</span>
            </ActionButton>
          </Link>
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
                activeChunkIndex={activeSection}
                setActiveChunkIndex={(idx) =>
                  idx !== null && setActiveSection(idx)
                }
                quickSummary={smartPdf.sections[0]}
                chunks={smartPdf.sections.slice(1).map((section) => ({
                  ...section,
                  text: section.summary,
                }))}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-4">
          <div className="w-full grow rounded-lg bg-white p-5 text-gray-500 shadow">
            {activeSection === "quick-summary" ? (
              <SummaryContent
                title={quickSummary.title}
                summary={quickSummary.summary}
                imageUrl={smartPdf.imageUrl}
              />
            ) : activeSection !== null ? (
              <SummaryContent
                title={pdfSections[activeSection].title}
                summary={pdfSections[activeSection].summary}
              />
            ) : (
              <div className="flex animate-pulse items-center justify-center py-4 text-lg md:py-8">
                Generating your Smart PDF&hellip;
              </div>
            )}
          </div>

          <div className="hidden w-full max-w-60 shrink-0 md:flex">
            <TableOfContents
              activeChunkIndex={activeSection}
              setActiveChunkIndex={(idx) =>
                idx !== null && setActiveSection(idx)
              }
              quickSummary={smartPdf.sections[0]}
              chunks={smartPdf.sections.slice(1).map((section) => ({
                ...section,
                text: section.summary,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
