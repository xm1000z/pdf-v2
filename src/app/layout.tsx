import GithubIcon from "@/components/icons/github";
import XIcon from "@/components/icons/x";
import Logo from "@/components/ui/logo";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Smart PDFs",
  description: "Summarize PDFs in seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${font.variable} flex min-h-full flex-col bg-gray-100 font-[family-name:var(--font-plus-jakarta-sans)] text-gray-900 antialiased`}
      >
        <header className="py-6 text-center">
          <Link href="/" replace={true} className="inline-flex justify-center">
            <Logo />
          </Link>
        </header>

        <main className="grow">{children}</main>
        <Toaster />
        <footer className="mx-auto mt-14 flex w-full max-w-7xl items-center justify-between px-4 py-6 md:mt-0">
          <p className="text-xs text-gray-300 md:text-sm">
            Powered by{" "}
            <Link
              className="underline transition hover:text-gray-900"
              href="https://www.together.ai/"
            >
              Together.ai
            </Link>{" "}
            &{" "}
            <Link
              className="underline transition hover:text-gray-900"
              href="https://www.together.ai/blog/flux-api-is-now-available-on-together-ai-new-pro-free-access-to-flux-schnell"
            >
              Flux
            </Link>
          </p>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              className="inline-flex items-center gap-1 rounded-lg border border-gray-250 bg-white px-2 py-1.5 text-xs text-gray-300 shadow transition hover:bg-white/75 md:rounded-xl md:px-4 md:text-sm"
              href="#"
            >
              <GithubIcon className="size-4" />
              GitHub
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-250 bg-white px-2 py-1.5 text-xs text-gray-300 shadow transition hover:bg-white/75 md:rounded-xl md:px-4 md:text-sm"
            >
              <XIcon className="size-3" />
              Twitter
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
