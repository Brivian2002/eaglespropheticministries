"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePostReaderStore } from "@/lib/post-reader-store";
import { getHashtagStyle } from "@/lib/content-classifier";
import Image from "next/image";

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Upgrades any Blogger image URLs in the HTML content to high-res.
 */
function upgradeContentImages(html: string): string {
  return html
    // Path-based: /s72-c/ or /s320/ → /s1600/
    .replace(/\/s\d+(-[a-z])?\//g, "/s1600/")
    // Path-based: /w400-h225/ → /s1600/
    .replace(/\/w\d+(-h\d+)?\//g, "/s1600/")
    // Query-based: =w303-h303 → =s1600
    .replace(/=[sw]\d+(-h\d+)?$/gi, "=s1600");
}

/**
 * Process Blogger HTML content for in-site rendering.
 * - Upgrades images to high-res
 * - Adds responsive styling
 */
function processContent(html: string): string {
  let processed = upgradeContentImages(html);

  // Make images responsive
  processed = processed.replace(
    /<img([^>]*)>/gi,
    (match, attrs) => {
      // Add responsive class if not already present
      if (!attrs.includes("class=")) {
        return `<img${attrs} class="w-full h-auto rounded-lg my-4" />`;
      }
      return match;
    }
  );

  // Style blockquotes
  processed = processed.replace(
    /<blockquote([^>]*)>/gi,
    '<blockquote$1 class="border-l-4 border-gold pl-4 my-4 italic text-muted-foreground">'
  );

  return processed;
}

/**
 * PostReader — Full-screen in-site post reader overlay.
 *
 * Opens when any post card is clicked across the site.
 * Renders the Blogger post content professionally within the site.
 * No external tab needed.
 */
export function PostReader() {
  const { isOpen, post, closePost } = usePostReaderStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open, restore on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Scroll reader to top
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closePost();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closePost]);

  if (!post) return null;

  const categoryLabel =
    post.labels && post.labels.length > 0
      ? post.labels[0]
      : "Post";
  const style = getHashtagStyle(categoryLabel);
  const processedContent = processContent(post.content || "");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] bg-background"
        >
          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-4 md:px-8">
              <div className="flex items-center justify-between h-14">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closePost}
                  className="text-muted-foreground hover:text-foreground -ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back
                </Button>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View on Blogger
                </a>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            ref={scrollRef}
            className="h-[calc(100vh-3.5rem)] overflow-y-auto"
          >
            <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
              {/* Category Badge */}
              <div className="mb-4">
                <Badge
                  variant="outline"
                  className={`${style.badge.bg} ${style.badge.text} ${style.badge.border} text-[10px] uppercase tracking-wider border font-medium`}
                >
                  {style.label}
                </Badge>
              </div>

              {/* Title */}
              <h1
                className="text-2xl md:text-4xl font-bold font-[var(--font-playfair)] text-foreground leading-tight mb-6"
              >
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-border text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.published)}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {post.author || "Eagles Prophetic Ministries"}
                </span>
              </div>

              {/* Featured Image */}
              {post.thumbnail && (
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl mb-8 bg-muted">
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 720px"
                    quality={100}
                    unoptimized
                    priority
                  />
                </div>
              )}

              {/* Post Content */}
              <div
                className="prose prose-lg max-w-none
                  prose-headings:font-[var(--font-playfair)] prose-headings:text-foreground
                  prose-p:text-foreground/90 prose-p:leading-relaxed
                  prose-a:text-royal prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-lg prose-img:my-4
                  prose-blockquote:border-l-gold
                  prose-strong:text-foreground
                  [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4
                  [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:my-6
                  [&_a]:text-royal [&_a]:hover:underline
                "
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* Bottom spacer */}
              <div className="h-12" />
            </article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
