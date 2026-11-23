import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/about-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About Eagles Prophetic Ministries",
  description: "Learn about Eagles Prophetic Ministries, its mission, vision, and prophetic calling to prepare the Church for the Second Coming of Jesus Christ.",
  path: "/about",
});

export default function AboutRoute() {
  return <AboutPage />;
}
