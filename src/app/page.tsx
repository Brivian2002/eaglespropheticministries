import type { Metadata } from "next";
import { HomePage } from "@/components/pages/home-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Eagles Prophetic Ministries | Prophet Gabriel Christ Alorgo",
  description: "Official home of Eagles Prophetic Ministries in Ghana: Bible teachings, ministry events, media, and resources from Prophet Gabriel Christ Alorgo.",
  path: "/",
});

export default function Home() {
  return <HomePage />;
}
