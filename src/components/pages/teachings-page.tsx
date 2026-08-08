"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Church,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getHashtagStyle,
  filterTeachingPosts,
  filterTeachingSubcategory,
  type TeachingKey,
  getPostCategoryLabel,
} from "@/lib/content-classifier";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/post-reader-store";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const stripHtml = (html: string, maxLen = 150): string => {
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length > maxLen ? text.substring(0, maxLen).trimEnd() + "\u2026" : text;
};

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

/* ------------------------------------------------------------------ */
/*  Teaching sub-category tab config                                    */
/* ------------------------------------------------------------------ */

const TEACHING_TABS: { key: TeachingKey | "all"; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", icon: BookOpen },
  { key: "biblestudies", label: "Bible Studies", icon: BookOpen },
  { key: "prophecy", label: "Prophecy", icon: Eye },
  { key: "endtimes", label: "End Times", icon: Clock },
  { key: "church", label: "Church", icon: Church },
  { key: "spiritualgrowth", label: "Spiritual Growth", icon: TrendingUp },
];

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <Card className="border-gold/10 overflow-hidden">
      <div className="relative aspect-[16/10]">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Teaching Card                                                      */
/* ------------------------------------------------------------------ */

function TeachingCard({ post }: { post: BlogPost }) {
  const categoryLabel = getPostCategoryLabel(post.labels ?? []);
  const style = getHashtagStyle(categoryLabel);

  return (
    <motion.div variants={fadeInUp} custom={0}>
      <Link href={`/teachings/${post.slug || post.id}`}>
        <Card
          className={[
            style.card.border,
            style.card.hoverBorder,
            style.card.hoverShadow,
            "transition-all duration-300 group overflow-hidden h-full cursor-pointer",
          ].join(" ")}
        >
        <div className={style.card.accentBar} />
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {post.thumbnail ? (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={100}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-royal/10 via-royal/5 to-gold/10 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-royal/10 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-royal/50" />
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge
              variant="outline"
              className={`${style.badge.bg} ${style.badge.text} ${style.badge.border} text-[10px] uppercase tracking-wider border font-medium`}
            >
              {categoryLabel}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Clock className="h-3 w-3" />
              {formatDate(post.published)}
            </span>
          </div>
          <h3 className="text-lg font-bold font-[var(--font-playfair)] text-foreground mb-2 line-clamp-2 group-hover:text-royal transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
            {stripHtml(post.content)}
          </p>
          <span className="inline-flex items-center gap-1 text-sm text-royal font-medium group-hover:text-gold transition-colors">
            Read More
            <ChevronRight className="h-4 w-4" />
          </span>
        </CardContent>
      </Card>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */

export function TeachingsPage() {
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TeachingKey | "all">("all");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setApiError("");
      try {
        const res = await fetch("/api/blogger?maxResults=50");
        const data = await res.json();
        if (!cancelled) {
          if (data.error) setApiError(data.error);
          setAllPosts(data.posts || []);
        }
      } catch {
        if (!cancelled) {
          setApiError("Failed to connect. Please check your internet connection.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const teachingPosts = filterTeachingPosts(allPosts);

  const tabCounts = TEACHING_TABS.map((tab) => ({
    ...tab,
    count:
      tab.key === "all"
        ? teachingPosts.length
        : filterTeachingSubcategory(teachingPosts, tab.key as TeachingKey).length,
  }));

  const filteredPosts =
    activeTab === "all"
      ? teachingPosts
      : filterTeachingSubcategory(teachingPosts, activeTab);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-royal-dark via-royal to-royal-dark" />
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/Ministeybanner.jpg" alt="" fill className="object-cover" />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="var(--background)" />
          </svg>
        </div>
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} custom={0}>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">From the Desk of the Prophet</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} custom={1} className="text-3xl md:text-5xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4">
              Teachings
            </motion.h1>
            <motion.p variants={fadeInUp} custom={2} className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Deep prophetic teachings, Bible studies, and revelatory messages from the ministry of Prophet Gabriel Christ Alorgo.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* TAG FILTER MENU */}
      <section className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-gold/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {tabCounts.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap",
                    "transition-all duration-200 flex-shrink-0",
                    isActive
                      ? "bg-royal text-white shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span className={["ml-0.5 text-[10px]", isActive ? "text-white/70" : "text-muted-foreground/60"].join(" ")}>
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            {apiError && !loading && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-300 font-medium mb-1">Could not load teachings</p>
                  <p className="text-xs text-red-300/70 leading-relaxed">{apiError}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-300 hover:text-white hover:bg-red-500/20"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredPosts.map((post, i) => (
                  <TeachingCard key={post.id} post={post} />
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-5">
                  <BookOpen className="h-9 w-9 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-foreground font-[var(--font-playfair)] mb-2 text-center">
                  {activeTab !== "all"
                    ? `No posts found for "${tabCounts.find((t) => t.key === activeTab)?.label || activeTab}"`
                    : "No Teachings Available"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto text-center leading-relaxed">
                  {activeTab !== "all"
                    ? "Try selecting a different category or check back later."
                    : "Teaching posts will appear here once published on Blogger with a teaching hashtag (e.g. #BibleStudies, #Prophecy, #EndTimes, #Church, #SpiritualGrowth)."}
                </p>
                {activeTab !== "all" && (
                  <button
                    onClick={() => setActiveTab("all")}
                    className="mt-5 text-sm text-royal font-medium hover:text-gold transition-colors"
                  >
                    View All Teachings
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
