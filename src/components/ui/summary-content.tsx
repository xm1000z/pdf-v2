"use client";

import Image from "next/image";

interface SummaryContentProps {
  title?: string;
  summary?: string;
  image?: string;
}

export default function SummaryContent({
  title,
  summary,
  image,
}: SummaryContentProps) {
  return (
    <div>
      {image && (
        <>
          <Image
            className="rounded-md"
            src={image}
            width={1280}
            height={720}
            alt=""
          />
          <hr className="-mx-5 my-8" />
        </>
      )}
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div
        className="prose mt-4 text-sm"
        dangerouslySetInnerHTML={{
          __html: summary || "",
        }}
      />
    </div>
  );
}
