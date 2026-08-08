"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight,
  BookOpen,
  PlayCircle,
  ExternalLink,
  Clock,
  ChevronRight,
  Heart,
  Users,
  ChevronDown,
  Loader2,
  Church,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getPostCategoryLabel, getHashtagStyle } from "@/lib/content-classifier";

// ─── Animation Variants ───────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Types ────────────────────────────────────────────────────────
interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface BloggerPost {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
  labels: string[];
  thumbnail: string;
  summary: string;
  author: string;
  slug: string;
}

// ─── Helpers ──────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatPrice = (priceInCents: number) => {
  return `GHS ${(priceInCents / 100).toFixed(2)}`;
};

// ─── Typing Effect Hook ───────────────────────────────────────────
function useTypingEffect(text: string, speed = 50, startDelay = 800) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, started]);

  return displayed;
}

// ─── Animated Counter Hook ────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 2000, inView: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [target, duration, inView]);

  return count;
}

// ─── Stat Item Component ──────────────────────────────────────────
function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useAnimatedCounter(value, 2000, inView);

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-white">
        {count}
        {suffix}
      </div>
      <div className="text-xs md:text-sm text-white/60 mt-1 tracking-wide">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════════
export function HomePage() {
  // ─── Data State ─────────────────────────────────────────────────
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [posts, setPosts] = useState<BloggerPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // ─── Typing Effect ─────────────────────────────────────────────
  const tagline = useTypingEffect(
    "Preparing the Church for the Second Coming",
    45,
    1200
  );

  // ─── Fetch YouTube Videos (called from intervals / on mount) ──
  const loadVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/youtube?maxResults=3");
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  // ─── Fetch Blogger Posts ────────────────────────────────────────
  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/blogger?maxResults=3");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // ─── Initial Fetch + Auto-Refresh: Videos every 60s ────────────
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState-in-effect lint
    const id = setTimeout(loadVideos, 0);
    const interval = setInterval(loadVideos, 60_000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
  }, [loadVideos]);

  // ─── Initial Fetch + Auto-Refresh: Posts every 5 min ───────────
  useEffect(() => {
    const id = setTimeout(loadPosts, 0);
    const interval = setInterval(loadPosts, 300_000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
    };
  }, [loadPosts]);

  // ─── Smooth Scroll to Next Section ──────────────────────────────
  const scrollToContent = () => {
    const el = document.getElementById("about-snippet");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════
          1. HERO — Cinematic, Full Viewport, Dynamic
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/Ministeybanner.jpg"
            alt=""
            fill
            className="object-cover scale-105"
            priority
          />
        </div>

        {/* Animated Gradient Overlay */}
        <div
          className="absolute inset-0 hero-gradient-overlay"
          style={{
            background:
              "linear-gradient(180deg, rgba(92,0,0,0.85) 0%, rgba(139,0,0,0.70) 40%, rgba(92,0,0,0.85) 70%, rgba(13,5,5,0.95) 100%)",
          }}
        />
        <div className="hero-shimmer-overlay absolute inset-0" />

        {/* Ministry Logo — Top Left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute top-4 left-4 md:top-8 md:left-8 z-20"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden ring-2 ring-gold/40 shadow-lg">
            <Image
              src="/images/Ministrylogo.jpg"
              alt="Eagles Prophetic Ministries"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Live Indicator Badge — Top Right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute top-4 right-4 md:top-8 md:right-8 z-20"
        >
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-gold/30 rounded-full px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span className="text-white/90 text-xs font-medium tracking-wide uppercase">
              Live Ministry
            </span>
          </div>
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-8 py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Cross ornament */}
            <motion.div variants={fadeInUp} custom={0}>
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="w-10 h-[1px] bg-gold" />
                <Church className="h-5 w-5 text-gold" />
                <span className="w-10 h-[1px] bg-gold" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-[var(--font-playfair)] text-white leading-tight mb-6"
            >
              Eagles Prophetic
              <br />
              <span className="text-gradient-gold">Ministries</span>
            </motion.h1>

            {/* Animated Tagline — Typing Effect */}
            <motion.div
              variants={fadeInUp}
              custom={2}
              className="min-h-[2rem] mb-8"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-gold/30 rounded-full px-5 py-2.5">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse-gold" />
                <span className="text-gold text-sm md:text-base font-medium tracking-wide">
                  {tagline}
                  <span className="inline-block w-[2px] h-5 bg-gold ml-0.5 animate-pulse align-middle" />
                </span>
              </div>
            </motion.div>

            {/* Animated Gold Divider Line */}
            <motion.div
              variants={fadeInUp}
              custom={3}
              className="flex justify-center mb-8"
            >
              <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-shimmer" />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              custom={4}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Button
                size="lg"
                className="bg-gold hover:bg-gold-dark text-royal-dark font-semibold text-base px-8 py-6 shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 hover:scale-[1.02]"
                asChild
              >
                <Link href="/prophet">
                  Meet The Prophet <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-base px-8 py-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
                asChild
              >
                <Link href="/teachings">
                  Explore Teachings <BookOpen className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Counter Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-24 md:bottom-20 left-0 right-0 z-10"
        >
          <div className="container mx-auto px-4 md:px-8">
              <div className="flex items-center justify-center gap-8 md:gap-16 divide-x divide-white/10">
                <StatItem value={100} suffix="+" label="Teachings" />
                <StatItem value={50} suffix="+" label="Global Reach" />
              </div>
          </div>
        </motion.div>

        {/* Scroll Down Chevron */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <button
            onClick={scrollToContent}
            className="flex flex-col items-center gap-1 text-white/50 hover:text-gold transition-colors duration-300 cursor-pointer"
            aria-label="Scroll down"
          >
            <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </button>
        </motion.div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 40C360 80 720 0 1080 40C1260 60 1380 70 1440 75V80H0V40Z"
              fill="var(--background)"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          2. ABOUT SNIPPET — Asymmetric Layout
      ═══════════════════════════════════════════════════════════════ */}
      <section id="about-snippet" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Text Left */}
              <motion.div variants={fadeInUp} custom={0}>
                <p className="text-gold text-xs tracking-[0.3em] uppercase font-medium mb-4">
                  About The Ministry
                </p>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-[2px] bg-gradient-to-r from-gold to-gold-dark" />
                  <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-royal">
                    A Voice to This Generation
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Eagles Prophetic Ministries is a vibrant, Spirit-led ministry founded by
                  Prophet Gabriel Christ Alorgo. We are called to expose the deceptions of the
                  enemy, minister the mind of Christ to the Body of Christ, and prepare the
                  Church for the second coming of our Lord Jesus Christ.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Whether you are seeking spiritual growth, prophetic insight, or a deeper
                  walk with God — you are in the right place. Through prophetic revelations,
                  biblical teachings, and spiritual equipping, we stand as a beacon of truth
                  in these endtimes.
                </p>
                <Button
                  variant="outline"
                  className="border-royal/30 text-royal hover:bg-royal hover:text-white transition-all duration-300 px-6"
                  asChild
                >
                  <Link href="/about">
                    Learn More <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>

              {/* Image Right */}
              <motion.div
                variants={fadeInUp}
                custom={1}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="aspect-[4/5]">
                    <Image
                      src="/images/TheProphet.jpg"
                      alt="Prophet Gabriel Christ Alorgo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Decorative gold border accent */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold/20" />
                </div>
                {/* Decorative element behind image */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-gold/30 rounded-2xl -z-10" />
                <div className="absolute -top-4 -left-4 w-16 h-16 border-2 border-gold/20 rounded-xl -z-10" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          3. TEACHINGS PREVIEW — Dynamic Cards from Blogger
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-royal">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <motion.div
              variants={fadeInUp}
              custom={0}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-[var(--font-playfair)] text-white">
                    Latest Posts
                  </h2>
                  <p className="text-sm text-white/50">Recent content from the ministry</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-gold/30 text-gold hover:bg-gold/10 hidden sm:flex"
                asChild
              >
                <Link href="/teachings">
                  View All Teachings <ChevronRight className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            </motion.div>

            {/* Teaching Cards */}
            <motion.div variants={fadeInUp} custom={1}>
              {loadingPosts ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="bg-royal-dark/50 border-white/5">
                      <Skeleton className="aspect-video w-full rounded-t-lg" />
                      <CardContent className="p-5">
                        <Skeleton className="h-4 w-20 mb-3" />
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {posts.slice(0, 3).map((post) => (
                    <Link key={post.id} href={`/teachings/${post.slug}`}>
                    <Card
                      className="bg-royal-dark/50 border-white/5 hover:border-gold/30 hover:shadow-gold transition-all duration-300 group overflow-hidden cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden bg-muted">
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
                          <div className="w-full h-full bg-gradient-to-br from-royal to-royal-dark flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-gold/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {/* Category Badge — uses hashtag system */}
                        {post.labels && post.labels.length > 0 && (() => {
                          const catLabel = getPostCategoryLabel(post.labels);
                          const catStyle = getHashtagStyle(catLabel);
                          return (
                            <Badge className={`absolute top-3 left-3 ${catStyle.badge.bg} ${catStyle.badge.text} border ${catStyle.badge.border} text-[10px] uppercase tracking-wider`}>
                              {catLabel}
                            </Badge>
                          );
                        })()}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-white line-clamp-2 group-hover:text-gold transition-colors mb-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-white/40 line-clamp-2 mb-3">
                          {post.summary || post.content.replace(/<[^>]*>/g, "").slice(0, 120)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/30">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(post.published)}</span>
                        </div>
                      </CardContent>
                    </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-royal-dark/30 rounded-2xl border border-white/5">
                  <BookOpen className="h-10 w-10 text-gold/30 mx-auto mb-4" />
                  <p className="text-white/40 text-sm mb-4">
                    Teaching content will appear here once the Blogger API is configured.
                  </p>
                  <Button
                    className="bg-gold hover:bg-gold-dark text-royal-dark"
                    asChild
                  >
                    <Link href="/teachings">
                      Explore Teachings <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Mobile "View All" button */}
            <motion.div variants={fadeInUp} custom={2} className="mt-8 text-center sm:hidden">
              <Button
                variant="outline"
                className="border-gold/30 text-gold hover:bg-gold/10"
                asChild
              >
                <Link href="/teachings">
                  View All Teachings <ChevronRight className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          4. VIDEO SECTION — YouTube Integration
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <motion.div
              variants={fadeInUp}
              custom={0}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-royal/10 flex items-center justify-center">
                  <PlayCircle className="h-5 w-5 text-royal" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold font-[var(--font-playfair)] text-royal">
                      Latest Videos
                    </h2>
                    {/* Live refresh indicator */}
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Auto-refresh
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">From our YouTube channel</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-royal/20 text-royal hover:bg-royal/5 hidden sm:flex"
                asChild
              >
                <a
                  href="https://www.youtube.com/@EaglesPropheticMinistries"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch on YouTube <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            </motion.div>

            {/* Video Cards */}
            <motion.div variants={fadeInUp} custom={1}>
              {loadingVideos ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-gold/10">
                      <Skeleton className="aspect-video w-full rounded-t-lg" />
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {videos.slice(0, 3).map((video) => (
                    <a
                      key={video.videoId}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Card className="border-gold/10 hover:border-gold/30 hover:shadow-gold transition-all duration-300 group overflow-hidden h-full">
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                              <PlayCircle className="h-8 w-8 text-royal ml-0.5" />
                            </div>
                          </div>
                          {/* Duration-style bottom gradient */}
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-foreground line-clamp-2 group-hover:text-royal transition-colors mb-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(video.publishedAt)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-2xl border border-gold/10">
                  <PlayCircle className="h-10 w-10 text-royal/20 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm mb-4">
                    Video content will appear here once the YouTube API is configured.
                  </p>
                  <Button className="bg-royal hover:bg-royal-dark text-white" asChild>
                    <a
                      href="https://www.youtube.com/@EaglesPropheticMinistries"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Our YouTube <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5. BOOK HIGHLIGHT — Premium Product Showcase
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-royal">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <div className="relative overflow-hidden rounded-2xl border border-gold/20 shadow-2xl book-showcase">
                {/* Premium gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-royal-dark via-royal to-royal-dark opacity-90" />
                {/* Subtle gold glow/shine animation */}
                <div className="absolute inset-0 book-shine" />

                <div className="relative z-10 flex flex-col md:flex-row">
                  {/* Book Cover — Left */}
                  <div className="w-full md:w-2/5 min-h-[280px] md:min-h-[400px] flex items-center justify-center p-8 md:p-10">
                    <div className="relative">
                      {/* Glow behind book */}
                      <div className="absolute -inset-4 bg-gold/10 rounded-lg blur-2xl" />
                      <div className="relative w-44 h-64 md:w-52 md:h-72 rounded-md overflow-hidden shadow-2xl ring-2 ring-gold/40 ring-offset-4 ring-offset-royal-dark">
                        <Image
                          src="/images/BOOK.jpg"
                          alt="THE ENDTIMES PROPHETIC GUIDE"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Book Details — Right */}
                  <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-3 py-1 w-fit mb-4">
                      <BookOpen className="h-3 w-3 text-gold" />
                      <span className="text-gold text-xs font-medium tracking-wide uppercase">
                        Featured Book
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-[var(--font-playfair)] text-white mb-2 leading-tight">
                      THE ENDTIMES
                      <br />
                      <span className="text-gradient-gold">PROPHETIC GUIDE</span>
                    </h2>

                    <p className="text-gold font-[var(--font-playfair)] text-sm mb-4">
                      by Prophet Gabriel Christ Alorgo
                    </p>

                    <p className="text-white/60 leading-relaxed mb-4 text-sm md:text-base">
                      A prophetic and teaching material that emphasizes understanding the
                      endtimes prophecies of the Bible. This book contains useful guidelines
                      for understanding the Bible in a more prophetic and accurate way.
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-2xl md:text-3xl font-bold text-gold">
                        {formatPrice(15000)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="bg-gold hover:bg-gold-dark text-royal-dark font-semibold transition-all duration-300 hover:shadow-gold/30 hover:shadow-lg"
                        asChild
                      >
                        <Link href="/bookstore">
                          Get Your Copy <ChevronRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          6. SOCIAL / COMMUNITY — Modern with Floating Animation
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} custom={0}>
              <p className="text-gold text-xs tracking-[0.3em] uppercase font-medium mb-4">
                Connect With Us
              </p>
              <h2 className="text-3xl md:text-4xl font-bold font-[var(--font-playfair)] text-royal mb-4">
                Join Our Community
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-10">
                Stay connected with Eagles Prophetic Ministries for the latest teachings,
                prophetic messages, and event updates.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              custom={1}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              {/* YouTube */}
              <motion.a
                href="https://www.youtube.com/@EaglesPropheticMinistries"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
              >
                <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center">
                  <PlayCircle className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">YouTube</div>
                  <div className="text-[10px] text-muted-foreground">Watch sermons</div>
                </div>
              </motion.a>

              {/* Facebook */}
              <motion.a
                href="https://www.facebook.com/Eaglespropheticministries/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1877F2] flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">Facebook</div>
                  <div className="text-[10px] text-muted-foreground">Join the family</div>
                </div>
              </motion.a>

              {/* TikTok */}
              <motion.a
                href="https://www.tiktok.com/@eaglespropheticministrie"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48 6.28 6.28 0 001.86-4.48V8.69a8.22 8.22 0 004.86 1.57V6.79a4.84 4.84 0 01-1.14-.1z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">TikTok</div>
                  <div className="text-[10px] text-muted-foreground">Short clips</div>
                </div>
              </motion.a>

              {/* WhatsApp */}
              <motion.a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#25D366] flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">WhatsApp</div>
                  <div className="text-[10px] text-muted-foreground">Stay in touch</div>
                </div>
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INJECTED STYLES (hero animations, book shine, etc.)
      ═══════════════════════════════════════════════════════════════ */}
      <style jsx global>{`
        /* Hero animated shimmer overlay */
        .hero-shimmer-overlay {
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(212, 175, 55, 0.04) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: heroShimmer 8s ease-in-out infinite;
        }

        @keyframes heroShimmer {
          0%,
          100% {
            background-position: 200% 0;
          }
          50% {
            background-position: -200% 0;
          }
        }

        /* Book showcase shine animation */
        .book-shine {
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(212, 175, 55, 0.06) 45%,
            rgba(212, 175, 55, 0.12) 50%,
            rgba(212, 175, 55, 0.06) 55%,
            transparent 60%
          );
          background-size: 300% 100%;
          animation: bookShine 6s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes bookShine {
          0%,
          100% {
            background-position: 200% 0;
          }
          50% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </div>
  );
}
