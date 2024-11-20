import SmartPDFViewer from "@/app/share/[id]/smart-pdf-viewer";
import client from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const smartPdf = await client.smartPDF.findUnique({
    where: { id },
    include: { sections: true },
  });

  if (!smartPdf) notFound();

  return <SmartPDFViewer smartPdf={smartPdf} />;
}
