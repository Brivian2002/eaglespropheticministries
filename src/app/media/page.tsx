import type { Metadata } from "next";
import { MediaPage } from "@/components/pages/media-page";

export const metadata: Metadata = {
  title: "Media — Eagles Prophetic Ministries",
  description:
    "Browse photos, videos, and media content from Eagles Prophetic Ministries events, services, and ministry activities.",
};

export default function MediaRoute() {
  return <MediaPage />;
}