import type { Metadata } from "next";
import { ContactSection } from "@/components/contact-section";

export const metadata: Metadata = {
  title: "Contact — Eagles Prophetic Ministries",
  description:
    "Get in touch with Eagles Prophetic Ministries. Reach out for prayer requests, partnership inquiries, or general questions.",
};

export default function ContactRoute() {
  return <ContactSection />;
}
