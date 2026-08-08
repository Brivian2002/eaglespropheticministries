import type { Metadata } from "next";
import { SupportPage } from "@/components/pages/support-page";

export const metadata: Metadata = {
  title: "Support — Eagles Prophetic Ministries",
  description:
    "Support Eagles Prophetic Ministries through tithes, offerings, and partnerships. Help us advance the prophetic mandate.",
};

export default function SupportRoute() {
  return <SupportPage />;
}
