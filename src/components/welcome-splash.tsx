"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Church } from "lucide-react";

const SPLASH_KEY = "epm-splash-seen";
const TYPING_SPEED = 55;
const DISPLAY_TEXT = "Welcome to Eagles Prophetic Ministries";
const SUB_TEXT = "Preparing the Church for the Second Coming";
const HOLD_TIME = 1200;

export function WelcomeSplash() {
  const [phase, setPhase] = useState<"typing" | "hold" | "exit">("typing");
  const [displayed, setDisplayed] = useState("");
  const [subDisplayed, setSubDisplayed] = useState("");
  const [showSub, setShowSub] = useState(false);
  const [removed, setRemoved] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem(SPLASH_KEY);
  });
  const hasStarted = useRef(false);

  const startTyping = useCallback(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(DISPLAY_TEXT.slice(0, i));
      if (i >= DISPLAY_TEXT.length) {
        clearInterval(interval);
        setShowSub(true);
        setPhase("hold");
      }
    }, TYPING_SPEED);
    return () => clearInterval(interval);
  }, []);

  const startSubTyping = useCallback(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setSubDisplayed(SUB_TEXT.slice(0, i));
      if (i >= SUB_TEXT.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const cleanup = startTyping();
    return cleanup;
  }, [startTyping]);

  useEffect(() => {
    if (!showSub) return;
    const cleanup = startSubTyping();
    return cleanup;
  }, [showSub, startSubTyping]);

  useEffect(() => {
    if (phase !== "hold") return;
    const timer = setTimeout(() => {
      setPhase("exit");
      sessionStorage.setItem(SPLASH_KEY, "1");
    }, HOLD_TIME);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "exit") {
      const timer = setTimeout(() => setRemoved(true), 800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (removed) return null;

  const dots = [0, 1, 2];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: phase === "exit" ? 0 : 1,
        scale: phase === "exit" ? 1.05 : 1,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #5C0000 30%, #8B0000 50%, #5C0000 70%, #1a0a0a 100%)" }} />
      <div className="absolute inset-0 animate-pulse" style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.15) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 hero-shimmer-overlay" />

      <div className="relative z-10 text-center px-6 max-w-2xl">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-8"
        >
          <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto">
            <div className="absolute -inset-2 rounded-full bg-gold/20 blur-xl" />
            <div className="relative w-full h-full rounded-full overflow-hidden ring-2 ring-gold/50 shadow-2xl">
              <Image src="/images/Ministrylogo.jpg" alt="EPM Logo" fill className="object-cover" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <span className="w-8 h-[1px] bg-gold/60" />
          <Church className="h-4 w-4 text-gold/80" />
          <span className="w-8 h-[1px] bg-gold/60" />
        </motion.div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-[var(--font-playfair)] text-white leading-tight mb-4 min-h-[3rem] md:min-h-[4rem]">
          {displayed}
          {phase === "typing" && <span className="inline-block w-[2px] h-6 md:h-8 bg-gold ml-0.5 animate-pulse align-middle" />}
        </h1>

        <AnimatePresence>
          {showSub && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-gold/80 text-sm md:text-base tracking-wide min-h-[1.5rem]"
            >
              {subDisplayed}
              {subDisplayed.length < SUB_TEXT.length && (
                <span className="inline-block w-[2px] h-4 bg-gold/60 ml-0.5 animate-pulse align-middle" />
              )}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-24 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-8"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "exit" ? 0 : 0.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5"
      >
        {dots.map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gold"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
