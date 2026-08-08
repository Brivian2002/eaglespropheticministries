"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const BLOG_FEED_URL =
  "https://eaglespropheticministries.blogspot.com/feeds/posts/default";

const DISMISS_KEY = "epm-info-banner-dismissed";
const BANNER_DELAY_MS = 2500; // wait for splash screen to finish
const POLL_INTERVAL_MS = 10 * 60 * 1000; // re-check every 10 minutes for new posts
const MAX_POST_AGE_DAYS = 30;

interface InfoPost {
  title: string;
  content: string;
  url: string;
  published: string;
}

function getAtomText(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "$t" in field) {
    return (field as { $t: string }).$t;
  }
  return "";
}

function stripHtml(html: string, maxLength = 300): string {
  const text = html
    .replace(/<br\s*\/>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function formatPublishDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * InfoBanner — Pop-up announcement system tied to #info hashtag from Blogger.
 *
 * How it works:
 * 1. Fetches the most recent Blogger post labeled "info" from Blogger
 * 2. Shows as a professional modal overlay with the post title & content
 * 3. When dismissed, stores the post URL in sessionStorage
 * 4. Every 10 minutes, re-checks for a new #info post
 * 5. If a NEW post (different URL) is found, shows the banner again
 * 6. If no #info posts exist, no banner is shown
 * 7. Posts older than 30 days are automatically ignored
 * 8. Uses no browser cache for instant appearance of new posts
 */
export function InfoBanner() {
  const [post, setPost] = useState<InfoPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const dismissedUrlRef = useRef<string | null>(
    typeof window !== "undefined" ? sessionStorage.getItem(DISMISS_KEY) : null
  );

  const dismiss = useCallback(() => {
    setVisible(false);
    setIsDismissed(true);
    // Store the specific post URL so new posts can still appear
    if (post) {
      sessionStorage.setItem(DISMISS_KEY, post.url);
      dismissedUrlRef.current = post.url;
    }
  }, [post]);

  // Fetch recent posts from Blogger and find one with #info label
  // We can't use the Blogger category filter because labels may be "#info" (with hash)
  // so we fetch recent posts and filter client-side.
  const fetchInfoPost = useCallback(async (signal?: AbortSignal): Promise<InfoPost | null> => {
    try {
      const params = new URLSearchParams({
        alt: "json",
        "max-results": "10",
      });
      const url = `${BLOG_FEED_URL}?${params.toString()}`;

      const res = await fetch(url, {
        cache: "no-store",
        signal,
      });

      if (!res.ok || signal?.aborted) return null;

      const data = await res.json();
      const entries: Record<string, unknown>[] = data.feed?.entry ?? [];

      // Find the first post with an "info" label (supports #info, info, Info, etc.)
      const infoEntry = entries.find((entry) => {
        const categories = entry.category as Array<{ term: string }> | undefined;
        const labels = categories?.map((c) => c.term.toLowerCase().replace(/^#/, "")) ?? [];
        return labels.includes("info");
      });

      if (!infoEntry) return null;

      const entry = infoEntry;
      const content = getAtomText(entry.content) || "";
      const links = entry.link as
        | Array<{ rel: string; href: string }>
        | undefined;
      const altLink = links?.find((l) => l.rel === "alternate")?.href ?? "";
      const published = getAtomText(entry.published) || "";
      const title = getAtomText(entry.title) || "";

      // Ignore posts older than MAX_POST_AGE_DAYS
      const pubDate = new Date(published);
      const maxAge = new Date();
      maxAge.setDate(maxAge.getDate() - MAX_POST_AGE_DAYS);
      if (pubDate < maxAge) return null;

      return { title, content, url: altLink, published };
    } catch (err) {
      if (!signal?.aborted) {
        console.error("[InfoBanner] Fetch error:", err);
      }
      return null;
    }
  }, []);

  // Initial fetch + periodic re-check
  useEffect(() => {
    const controller = new AbortController();

    async function checkForNewPost() {
      const infoPost = await fetchInfoPost(controller.signal);
      if (controller.signal.aborted || !infoPost) {
        setLoading(false);
        return;
      }

      const isNewPost = infoPost.url !== dismissedUrlRef.current;

      setPost(infoPost);
      setLoading(false);

      // If this is a new post (different from the one that was dismissed),
      // clear the dismissed state so the banner shows again
      if (isNewPost) {
        setIsDismissed(false);
      }
    }

    void checkForNewPost();

    // Periodically re-check for new #info posts
    const pollTimer = setInterval(() => {
      void checkForNewPost();
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(pollTimer);
    };
  }, [fetchInfoPost]);

  // Show banner with a delay (after splash screen finishes)
  useEffect(() => {
    if (isDismissed || !post || loading) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, BANNER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isDismissed, post, loading]);

  // Don't render anything if dismissed or no post
  if (isDismissed || (!post && !loading)) return null;

  const plainContent = post ? stripHtml(post.content) : "";
  const formattedDate = post ? formatPublishDate(post.published) : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #1a0a0a 0%, #2a1515 50%, #1a0a0a 100%)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold accent bar at top */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent 0%, #D4AF37 30%, #F59E0B 50%, #D4AF37 70%, transparent 100%)" }} />

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 md:p-8">
              {/* Header with icon */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(139,0,0,0.2))", border: "1px solid rgba(212,175,55,0.3)" }}
                >
                  <Megaphone className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase font-medium mb-0.5"
                    style={{ color: "#D4AF37" }}
                  >
                    Important Notice
                  </p>
                  {loading ? (
                    <Skeleton className="h-5 w-3/4 rounded" />
                  ) : (
                    <h3 className="text-base md:text-lg font-bold font-[var(--font-playfair)] text-white leading-snug">
                      {post?.title || "Announcement"}
                    </h3>
                  )}
                </div>
              </div>

              {/* Content body */}
              {loading ? (
                <div className="space-y-2 mb-5">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-4/6 rounded" />
                </div>
              ) : (
                <div className="mb-5">
                  <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">
                    {plainContent}
                  </p>
                  {formattedDate && (
                    <p className="text-xs text-white/40 mt-3">
                      Posted: {formattedDate}
                    </p>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="h-px w-full mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                {post?.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      border: "1px solid rgba(212,175,55,0.4)",
                      color: "#D4AF37",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Read Full Post
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Button
                  onClick={dismiss}
                  className="rounded-lg text-sm font-medium"
                  style={{
                    background: "linear-gradient(135deg, #8B0000, #B91C1C)",
                    color: "white",
                  }}
                >
                  Got It
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}