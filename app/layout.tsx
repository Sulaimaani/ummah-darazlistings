import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ummah DarazListings - AI SEO Listing Generator for Daraz Sellers",
  description:
    "Generate page-1 ranking Daraz product titles, highlights, and long descriptions using AI trained on Daraz marketplace algorithms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased`}>
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}