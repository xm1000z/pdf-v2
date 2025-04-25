import SmartPDFViewer from "@/app/pdf/[id]/smart-pdf-viewer";
import client from "@/lib/prisma";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { Metadata, ResolvingMetadata } from "next";

const getSmartPDF = unstable_cache(
  async (id: string) => {
    return client.smartPDF.findUnique({
      where: { id },
      include: { sections: true },
    });
  },
  ["smart-pdf-query"],
  { revalidate: false },
);

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // read route params
  const { id } = await params;
  const parentData = await parent;

  // fetch data
  const smartPdf = await getSmartPDF(id);

  if (!smartPdf) notFound();

  return {
    title: `${smartPdf.sections[0].title.slice(0, 60)} | ${parentData.title?.absolute}`,
    description: `${smartPdf.sections[0].summary
      .replace(/<[^>]*>/g, "")
      .slice(0, 160)}...`,
    openGraph: {
      images: [smartPdf.imageUrl],
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const smartPdf = await getSmartPDF(id);

  if (!smartPdf) notFound();

  return <SmartPDFViewer smartPdf={smartPdf} />;
}
