"use client";

import { motion } from "framer-motion";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isWine = theme === "wine";

  return (
    <button
      onClick={() => setTheme(isWine ? "emerald" : "wine")}
      className={cn(
        "relative flex items-center justify-center",
        "w-10 h-10 rounded-full",
        "bg-card border border-gold/20 hover:border-gold/40",
        "shadow-sm hover:shadow-md",
        "transition-all duration-300 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label={isWine ? "Switch to Green theme" : "Switch to Wine theme"}
      title={isWine ? "Switch to Green theme" : "Switch to Wine theme"}
    >
      <div className="relative w-6 h-6">
        {/* Background circle — full circle */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-colors duration-500",
            isWine ? "bg-royal" : "bg-emerald-600"
          )}
        />

        {/* Foreground circle — creates the crescent/half-moon shape */}
        <motion.div
          className="absolute inset-0 rounded-full bg-card"
          animate={{
            x: isWine ? -1 : 3,
            y: isWine ? -1 : -3,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        />

        {/* Small star/leaf indicator */}
        <motion.div
          className={cn(
            "absolute w-1 h-1 rounded-full transition-colors duration-500",
            isWine ? "bg-gold" : "bg-emerald-400"
          )}
          animate={{
            x: isWine ? -2 : 3,
            y: isWine ? -4 : -1,
            scale: isWine ? 1 : 0.8,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        />
      </div>
    </button>
  );
}
