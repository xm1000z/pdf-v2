"use server";

import client from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function sharePdf({
  pdfName,
  sections,
}: {
  pdfName: string;
  sections: { type: string; title: string; text: string; position: number }[];
}) {
  const smartPdf = await client.smartPDF.create({
    data: {
      pdfName,
      sections: {
        createMany: {
          data: sections,
        },
      },
    },
  });

  redirect(`/share/${smartPdf.id}`);
}
