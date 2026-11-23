import type { Metadata } from "next";
import { TeachingsPage } from "@/components/pages/teachings-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Bible Teachings and Prophetic Messages",
  description: "Browse Bible studies, prophetic teachings, and messages from Prophet Gabriel Christ Alorgo and Eagles Prophetic Ministries.",
  path: "/teachings",
});

export default function TeachingsRoute() {
  return <TeachingsPage />;
}
