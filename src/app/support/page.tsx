import type { Metadata } from "next";
import { SupportPage } from "@/components/pages/support-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Support Eagles Prophetic Ministries",
  description: "Learn how to support Eagles Prophetic Ministries through tithes, offerings, and partnerships advancing its ministry work.",
  path: "/support",
});

export default function SupportRoute() {
  return <SupportPage />;
}
