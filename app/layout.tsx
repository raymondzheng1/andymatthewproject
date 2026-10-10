import type { Metadata } from "next";
import { Crimson_Pro, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const serif = Crimson_Pro({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif" });
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Ancient Object Investigation",
  description: "Students investigate ancient objects by asking questions and following sources. The answer is never handed over.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
