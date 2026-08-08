"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Trash2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I apologize, but I could not process your request. Please try again or contact us at eaglespropheticministries@gmail.com.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "A network error occurred. Please check your connection and try again, or contact us at eaglespropheticministries@gmail.com.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, isTyping]);

  const handleClear = () => {
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? "bg-royal hover:bg-royal-dark text-white"
              : "bg-gold hover:bg-gold-dark text-royal-dark"
          }`}
          size="icon"
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 max-h-[70vh] bg-card rounded-2xl shadow-2xl border border-gold/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-royal p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm font-[var(--font-playfair)]">
                    EPM Assistant
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-primary-foreground/60 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                onClick={handleClear}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
              style={{ maxHeight: "calc(70vh - 140px)" }}
            >
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-3">
                    <Bot className="h-6 w-6 text-gold" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Welcome to EPM!
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                    Ask about our ministry, teachings, events, the Prophet, how to
                    support, or any spiritual question. I&apos;m here to help!
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {["Who is the Prophet?", "How do I buy the book?", "Tell me about the endtimes"].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                          inputRef.current?.focus();
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-royal/5 text-royal hover:bg-royal/10 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-royal/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-royal" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-royal text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-gold-dark" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-royal/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-royal" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gold/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  className="flex-1 text-sm border-gold/10 focus:border-royal/40"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 bg-royal hover:bg-royal-dark text-white flex-shrink-0"
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
                AI assistant powered by Groq. May not always be accurate.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
