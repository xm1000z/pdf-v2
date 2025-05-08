import Logo from "@/components/ui/logo";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import PlausibleProvider from "next-plausible";
import Image from "next/image";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "PDFs Inteligentes | Resume PDFs en segundos",
  description:
    "¡Sube un PDF para obtener un resumen rápido, claro y compartible con IA de forma gratuita!",
  openGraph: {
    images: "/og.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <PlausibleProvider domain="notas.ai" />
      </head>
      <body
        className={`${font.variable} flex min-h-full flex-col bg-gray-100 font-[family-name:var(--font-plus-jakarta-sans)] text-gray-900 antialiased`}
      >
        <header className="py-6 px-6 flex items-center justify-between">
          <Link href="https://notas.ai" className="flex items-center">
            <h1 className="text-2xl font-[InstrumentSerif]">
              NotasAI
            </h1>
          </Link>
          <Link href="https://notas.ai" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="NotasAI" 
              width={40} 
              height={40}
              priority
            />
          </Link>
        </header>

        <main className="grow overflow-hidden">{children}</main>
        <Toaster />
        <footer className="mx-auto mt-14 flex w-full max-w-7xl items-center justify-between px-4 py-6 md:mt-0">
        </footer>
      </body>
    </html>
  );
}
