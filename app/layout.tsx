import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Samvad AI | Telugu & Regional Call-to-Lead Assistant",
  description: "Autonomous regional sales dialogue and audio briefings powered by Gnani Prisma & Timbre",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${dmSans.variable}`}
    >
      <body 
        suppressHydrationWarning
        className="font-sans antialiased bg-paper text-ink min-h-screen selection:bg-accent/15 selection:text-ink relative"
      >
        {/* Subtle paper grain texture overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] bg-[radial-gradient(#1f1b16_1px,transparent_1px)] [background-size:16px_16px]"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
