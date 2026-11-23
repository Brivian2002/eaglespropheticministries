import type { Metadata } from "next";
import { MediaPage } from "@/components/pages/media-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Ministry Photos and Videos",
  description: "Browse photos, videos, and media from Eagles Prophetic Ministries services, events, and ministry activities in Ghana.",
  path: "/media",
});

export default function MediaRoute() {
  return <MediaPage />;
}
