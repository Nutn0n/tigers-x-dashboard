import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

/** Absolute URL for social crawlers (Facebook, etc.); must stay publicly reachable. */
const OPENGRAPH_IMAGE_URL =
  "https://ishalab.space/wp-content/uploads/2026/04/og-scaled.jpg";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const title = "TIGERS-X Mission Control Viewer";
const description =
  "Dashboard for Thailand Innovative G-force varied Emulsification Research for Space Exploration experiments aboard the International Space Station";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TIGERS-X Mission Control",
    url: "/",
    title,
    description,
    images: [
      {
        url: OPENGRAPH_IMAGE_URL,
        alt: title,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [OPENGRAPH_IMAGE_URL],
  },
};

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
