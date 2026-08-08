"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AIChatWidget } from "@/components/ai-chat-widget";
import { FloatingSocialBar } from "@/components/floating-social-bar";
import { WelcomeSplash } from "@/components/welcome-splash";
import { InfoBanner } from "@/components/info-banner";
import { PostReader } from "@/components/post-reader";

/**
 * ClientShell wraps all pages with global client-only UI elements
 * that need to persist across route navigations.
 */
export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <WelcomeSplash />
      <Header />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
      <FloatingSocialBar />
      <AIChatWidget />
      <InfoBanner />
      <PostReader />
    </div>
  );
}
