import type { Metadata } from "next";

const SITE_TITLE = "TIGERS-X Mission Archive";

const SITE_DESCRIPTION =
  "Archived mission dashboard for the TIGERS-X payload aboard the International Space Station — timeline, link passes, and operations frozen at experiment cube deactivation.";

/** Absolute URL for social crawlers (Facebook, etc.); must stay publicly reachable. */
const OPENGRAPH_IMAGE_URL =
  "https://ishalab.space/wp-content/uploads/2026/04/og-scaled.jpg";

function getSiteUrl(): string {
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
      siteName: "TIGERS-X Mission Archive",
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
