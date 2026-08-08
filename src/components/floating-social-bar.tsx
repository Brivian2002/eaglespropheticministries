"use client";

import { useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Youtube, Facebook } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────
const STORAGE_KEY = "social-bar-hidden";
const TOGGLE_EVENT = "floating-social-bar:toggle";

// ── localStorage subscription helpers ──────────────────────────────────

function subscribe(callback: () => void): () => void {
  // Listen for cross-tab `storage` events and our own custom toggle event
  window.addEventListener("storage", callback);
  window.addEventListener(TOGGLE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TOGGLE_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  try {
    // Key holds "true" when the bar IS hidden, so visibility is the negation
    return localStorage.getItem(STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  // Default to visible on the server (matches SSR-safe rendering)
  return true;
}

// ── Social link data ────────────────────────────────────────────────────

interface SocialLink {
  name: string;
  href: string;
  color: string;
  hoverColor: string;
  icon: React.ReactNode;
}

const socialLinks: SocialLink[] = [
  {
    name: "YouTube",
    href: "https://www.youtube.com/@EaglesPropheticMinistries",
    color: "bg-[#FF0000]",
    hoverColor: "hover:bg-[#CC0000]",
    icon: <Youtube className="h-5 w-5 text-white" />,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/Eaglespropheticministries/",
    color: "bg-[#1877F2]",
    hoverColor: "hover:bg-[#1565C0]",
    icon: <Facebook className="h-5 w-5 text-white" />,
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@eaglespropheticministrie",
    color: "bg-[#010101]",
    hoverColor: "hover:bg-[#333333]",
    icon: (
      <svg
        className="h-5 w-5 text-white"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48 6.28 6.28 0 001.86-4.48V8.69a8.22 8.22 0 004.86 1.57V6.79a4.84 4.84 0 01-1.14-.1z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/233257870755",
    color: "bg-[#25D366]",
    hoverColor: "hover:bg-[#1DA851]",
    icon: <MessageCircle className="h-5 w-5 text-white" />,
  },
];

// ── Component ─────────────────────────────────────────────────────────

export function FloatingSocialBar() {
  const isVisible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    // Read current state, flip it, persist, and notify subscribers
    const currentlyVisible = getSnapshot();
    const isNowHidden = currentlyVisible; // bar is about to become hidden
    try {
      localStorage.setItem(STORAGE_KEY, String(isNowHidden));
    } catch {
      // ignore write failures (e.g. private browsing)
    }
    window.dispatchEvent(new Event(TOGGLE_EVENT));
  }, []);

  return (
    <motion.div
      className={cn(
        "fixed z-40",
        // Mobile: bottom-left corner, horizontal layout
        "left-3 bottom-24",
        // Desktop (md+): left side, vertically centered
        "md:left-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2",
      )}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
    >
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            "flex items-center gap-2",
            "bg-card/80 backdrop-blur-md rounded-full p-2",
            "border border-gold/10 shadow-lg",
            // Mobile: horizontal row
            "flex-row",
            // Desktop: vertical column
            "md:flex-col",
          )}
        >
          {/* ── Toggle Button ────────────────────────────────────── */}
          <button
            onClick={toggle}
            className={cn(
              "relative flex items-center justify-center",
              "h-10 w-10 rounded-full shrink-0",
              "bg-card shadow-md border border-gold/20",
              "hover:shadow-xl hover:border-gold/40",
              "transition-all duration-200",
              "text-primary-foreground/70 hover:text-gold",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-gold/50",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "cursor-pointer",
            )}
            aria-label={isVisible ? "Hide social links" : "Show social links"}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isVisible ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center pointer-events-none"
              >
                {isVisible ? (
                  <X className="h-5 w-5" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* ── Social Buttons ──────────────────────────────────── */}
          <AnimatePresence>
            {isVisible && (
              <motion.div
                className={cn(
                  "flex gap-2",
                  // Mobile: horizontal row
                  "flex-row",
                  // Desktop: vertical column
                  "md:flex-col",
                )}
                initial={{ opacity: 0, x: -16, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -16, scale: 0.85 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 28,
                  mass: 0.8,
                }}
              >
                {socialLinks.map((social) => (
                  <Tooltip key={social.name}>
                    <TooltipTrigger asChild>
                      <motion.a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit our ${social.name} page`}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "flex items-center justify-center",
                          "h-11 w-11 rounded-full",
                          social.color,
                          social.hoverColor,
                          "transition-colors duration-200",
                          "focus-visible:outline-none",
                          "focus-visible:ring-2 focus-visible:ring-gold/50",
                          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          "cursor-pointer shadow-sm",
                        )}
                      >
                        {social.icon}
                      </motion.a>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      <p className="text-xs font-semibold tracking-wide">
                        {social.name}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}
