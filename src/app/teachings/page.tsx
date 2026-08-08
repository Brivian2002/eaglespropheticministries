import type { Metadata } from "next";import { TeachingsPage } from "@/components/pages/teachings-page";export const metadata: Metadata = {
  title: "Teachings — Eagles Prophetic Ministries",
  description:
    "Deep prophetic teachings, Bible studies, and revelatory messages from Prophet Gabriel Christ Alorgo.",
};export default function TeachingsRoute() {
  return <TeachingsPage />;
}