"use server";

import client from "@/lib/prisma";
import { redirect } from "next/navigation";

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

  redirect(`/share/${smartPdf.id}`);
}
