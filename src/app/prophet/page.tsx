import type { Metadata } from "next";
import { ProphetPage } from "@/components/pages/prophet-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Prophet Gabriel Christ Alorgo",
  description: "Meet Prophet Gabriel Christ Alorgo, Founder and Lead Shepherd of Eagles Prophetic Ministries in Ghana, and learn about his ministry calling.",
  path: "/prophet",
});

export default function ProphetRoute() {
  return <ProphetPage />;
}
