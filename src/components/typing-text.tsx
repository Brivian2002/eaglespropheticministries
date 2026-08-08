"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TypingTextProps {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  cursorClassName?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function TypingText({
  text,
  speed = 50,
  startDelay = 0,
  className = "",
  cursorClassName = "",
  as: Tag = "span",
}: TypingTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startTyping = () => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    };

    if (startDelay > 0) {
      const timer = setTimeout(startTyping, startDelay);
      return () => clearTimeout(timer);
    }
    startTyping();
  }, [text, speed, startDelay]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="inline"
    >
      <Tag className={className}>
        {displayed}
        {!done && (
          <span
            className={`inline-block w-[2px] h-[1.1em] bg-current ml-0.5 animate-pulse align-middle ${cursorClassName}`}
          />
        )}
      </Tag>
    </motion.div>
  );
}
