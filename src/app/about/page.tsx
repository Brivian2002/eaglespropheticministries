import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/about-page";

export const metadata: Metadata = {
  title: "About Us — Eagles Prophetic Ministries",
  description:
    "Learn about Eagles Prophetic Ministries, our mission, vision, and the prophetic calling to prepare the Church for the Second Coming of the Lord Jesus Christ.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
