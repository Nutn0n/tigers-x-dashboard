import type { Metadata } from "next";

export const SITE_TITLE = "TIGERS-X Mission Control Viewer";

export const SITE_DESCRIPTION =
  "Dashboard for Thailand Innovative G-force varied Emulsification Research for Space Exploration experiments aboard the International Space Station";

/** Absolute URL for social crawlers (Facebook, etc.); must stay publicly reachable. */
export const OPENGRAPH_IMAGE_URL =
  "https://ishalab.space/wp-content/uploads/2026/04/og-scaled.jpg";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export function createRootMetadata(): Metadata {
  const title = SITE_TITLE;
  const description = SITE_DESCRIPTION;

  return {
    metadataBase: new URL(getSiteUrl()),
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
}
