"use server";

import { nanoid } from "nanoid";
import client from "@/lib/prisma";
import { redirect } from "next/navigation";

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 20);
};

export async function sharePdf({
  pdfName,
  pdfUrl,
  imageUrl,
  sections,
}: {
  pdfName: string;
  pdfUrl: string;
  imageUrl: string;
  sections: {
    type: string;
    title: string;
    summary: string;
    position: number;
  }[];
}) {
  const smartPdf = await client.smartPDF.create({
    data: {
      id: `${slugify(sections[0].title)}-${nanoid(4)}`,
      pdfName,
      pdfUrl,
      imageUrl,
      sections: {
        createMany: {
          data: sections,
        },
      },
    },
  });

  redirect(`/pdf/${smartPdf.id}`);
}
