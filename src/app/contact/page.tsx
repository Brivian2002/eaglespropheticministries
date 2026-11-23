import type { Metadata } from "next";
import { ContactSection } from "@/components/contact-section";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact Eagles Prophetic Ministries",
  description: "Contact Eagles Prophetic Ministries for prayer requests, ministry inquiries, partnerships, and general questions.",
  path: "/contact",
});

export default function ContactRoute() {
  return <ContactSection />;
}
