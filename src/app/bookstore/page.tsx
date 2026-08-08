import type { Metadata } from "next";
import { BookStorePage } from "@/components/pages/bookstore-page";

export const metadata: Metadata = {
  title: "Book Store — Eagles Prophetic Ministries",
  description:
    "Order prophetic books and resources by Prophet Gabriel Christ Alorgo. Strengthen your spiritual walk with revelatory literature.",
};

export default function BookStoreRoute() {
  return <BookStorePage />;
}
