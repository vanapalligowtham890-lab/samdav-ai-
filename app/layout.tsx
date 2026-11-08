import type { Metadata } from "next";
import { Fraunces, DM_Sans, Noto_Sans_Telugu, Noto_Serif_Telugu } from "next/font/google";
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

const notoSansTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-sans-telugu",
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerifTelugu = Noto_Serif_Telugu({
  variable: "--font-noto-serif-telugu",
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vaani Recap | Telugu & Hinglish Call-to-Lead Assistant",
  description: "Small business sales call summaries powered by Gnani Prisma & Timbre",
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
      className={`${fraunces.variable} ${dmSans.variable} ${notoSansTelugu.variable} ${notoSerifTelugu.variable}`}
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
