import type { Metadata } from "next";
import { EventsPage } from "@/components/pages/events-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Events and Announcements",
  description: "Find prophetic gatherings, conferences, revival services, and ministry announcements from Eagles Prophetic Ministries.",
  path: "/events",
});

export default function EventsRoute() {
  return <EventsPage />;
}
