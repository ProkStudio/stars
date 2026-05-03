import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stars Shop — Telegram Stars и Premium",
  description:
    "Минималистичная витрина: Telegram Stars, Premium и наборы. Оформление без регистрации.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} min-h-screen font-sans`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
