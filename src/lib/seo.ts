import type { Metadata } from "next";

export const SITE_URL = "https://eaglespropheticministries.vercel.app";

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonicalUrl = new URL(path, SITE_URL).toString();
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Eagles Prophetic Ministries",
      locale: "en_GH",
      type: "website",
      images: [{ url: "/images/Ministrylogo.jpg", alt: "Eagles Prophetic Ministries" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/Ministrylogo.jpg"],
    },
  };
}
