import type { Metadata } from "next";
import { BookStorePage } from "@/components/pages/bookstore-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Book Store — The Endtimes Prophetic Guide",
  description: "Choose the PDF-only edition for GHS 160 or the Android app with PDF and audiobook for GHS 200. Secure local checkout and verified private downloads.",
  path: "/bookstore",
});

export default function BookStoreRoute() {
  return <BookStorePage />;
}
