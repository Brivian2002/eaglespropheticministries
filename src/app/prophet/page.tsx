import type { Metadata } from "next";
import { ProphetPage } from "@/components/pages/prophet-page";

export const metadata: Metadata = {
  title: "The Prophet — Eagles Prophetic Ministries",
  description:
    "Meet Prophet Gabriel Christ Alorgo, Founder and Lead Shepherd of Eagles Prophetic Ministries. Called to prepare the Church for the Second Coming of the Lord Jesus Christ.",
};

export default function ProphetRoute() {
  return <ProphetPage />;
}
