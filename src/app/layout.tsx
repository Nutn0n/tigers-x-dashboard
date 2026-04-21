import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { createRootMetadata } from "@/lib/site-metadata";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = createRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className={`${poppins.className} min-h-full bg-[#000]`}>
        {children}
      </body>
    </html>
  );
}
