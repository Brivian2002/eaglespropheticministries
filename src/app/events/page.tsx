import type { Metadata } from "next";
import { EventsPage } from "@/components/pages/events-page";

export const metadata: Metadata = {
  title: "Events & Announcements — Eagles Prophetic Ministries",
  description:
    "Stay connected with prophetic gatherings, conferences, revival services, and important ministry announcements.",
};

export default function EventsRoute() {
  return <EventsPage />;
}
