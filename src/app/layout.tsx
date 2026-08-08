import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ClientShell } from "@/components/client-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eagles Prophetic Ministries — Prophet Gabriel Christ Alorgo",
  description:
    "Official page of Prophet Gabriel Christ Alorgo, Founder and Lead Shepherd of Eagles Prophetic Ministries. Preparing the Church for the Second Coming of the Lord Jesus Christ.",
  keywords: [
    "Prophet Gabriel Christ Alorgo",
    "Eagles Prophetic Ministries",
    "Prophetic Ministry",
    "Endtime Ministry",
    "Ghana Prophet",
    "Second Coming",
    "Bible Teachings",
  ],
  authors: [{ name: "Eagles Prophetic Ministries" }],
  icons: {
    icon: "/images/Ministrylogo.jpg",
  },
  openGraph: {
    title: "Eagles Prophetic Ministries",
    description:
      "Prophet Gabriel Christ Alorgo — Preparing the Church for the Second Coming of the Lord Jesus Christ.",
    type: "website",
  },
  verification: {
    google: "rFXCJfN2PKInkfgkJx2gD9GTfN27-evXzaTyxQG2zGk",
  },
  other: {
    "google-adsense-account": "ca-pub-7744791430316817",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <ClientShell>{children}</ClientShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}