import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientShell } from "@/components/client-shell";
import { SITE_URL } from "@/lib/seo";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Eagles Prophetic Ministries — Prophet Gabriel Christ Alorgo",
  description:
    "Official website of Prophet Gabriel Christ Alorgo and Eagles Prophetic Ministries in Ghana. Explore Bible teachings, ministry media, events, and books preparing the Church for the Second Coming of Jesus Christ.",
  keywords: [
    "Prophet Gabriel Christ Alorgo",
    "Eagles Prophetic Ministries",
    "Ghana prophetic ministry",
    "Bible teachings",
    "end-times Bible teaching",
    "Second Coming of Jesus Christ",
  ],
  authors: [{ name: "Eagles Prophetic Ministries" }],
  robots: { index: true, follow: true },
  icons: { icon: "/images/Ministrylogo.jpg" },
  openGraph: {
    title: "Eagles Prophetic Ministries",
    description: "Bible teaching, ministry resources, events, and media from Prophet Gabriel Christ Alorgo in Ghana.",
    siteName: "Eagles Prophetic Ministries",
    locale: "en_GH",
    type: "website",
    images: [{ url: "/images/Ministrylogo.jpg", alt: "Eagles Prophetic Ministries" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eagles Prophetic Ministries",
    description: "Bible teaching, ministry resources, events, and media from Prophet Gabriel Christ Alorgo in Ghana.",
    images: ["/images/Ministrylogo.jpg"],
  },
  verification: {
    google: "rFXCJfN2PKInkfgkJx2gD9GTfN27-evXzaTyxQG2zGk",
  },
  other: { "google-adsense-account": "ca-pub-7744791430316817" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GH" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <ClientShell>{children}</ClientShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
