"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  ExternalLink,
  Megaphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { getHashtagStyle, filterByCategory } from "@/lib/content-classifier";
import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BlogPost {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
  author: string;
  slug: string;
  labels: string[];
  thumbnail: string | null;
  summary?: string;
}

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */

/** Strip HTML tags and optionally truncate. */
function stripHtml(html: string, maxLen = 200): string {
  const plain = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).trimEnd() + "…";
}

/** Format ISO date string to a readable form. */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ------------------------------------------------------------------ */
/*  Skeleton grid                                                      */
/* ------------------------------------------------------------------ */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[16/10] w-full" />
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event card                                                         */
/* ------------------------------------------------------------------ */

function EventCard({ post }: { post: BlogPost }) {
  const style = getHashtagStyle("events");

  return (
    <Link href={`/teachings/${post.slug}`}>
    <Card
      className={`
        cursor-pointer
        overflow-hidden h-full flex flex-col transition-all duration-300
        border-l-4 border-l-emerald-500
        ${style.card.border} ${style.card.hoverBorder} ${style.card.hoverShadow}
      `}
    >
        {/* Accent bar */}
        <div className={`h-1.5 w-full ${style.card.accentBar}`} />

        {/* Thumbnail */}
        {post.thumbnail && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              quality={100}
              unoptimized
            />
          </div>
        )}

        <CardContent className="flex-1 flex flex-col p-6">
          {/* Badge + date row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge
              className={`
                text-[11px] uppercase tracking-wider font-semibold
                ${style.badge.bg} ${style.badge.text} border ${style.badge.border}
              `}
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              Event
            </Badge>

            <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
              {formatDate(post.published)}
            </span>
          </div>

          {/* Title */}
          <h3
            className={`
              text-xl font-bold font-[var(--font-playfair)] mb-2 line-clamp-2
              transition-colors duration-300 ${style.heading}
              group-hover:text-emerald-600 dark:group-hover:text-emerald-400
            `}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {stripHtml(post.content)}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-1.5 text-sm font-medium mt-4 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Announcement card                                                 */
/* ------------------------------------------------------------------ */

function AnnouncementCard({ post }: { post: BlogPost }) {
  const style = getHashtagStyle("announcement");

  return (
    <Link href={`/teachings/${post.slug}`}>
    <Card
      className={`
        cursor-pointer
        overflow-hidden h-full flex flex-col transition-all duration-300
        border-l-4 border-l-amber-500
        ${style.card.border} ${style.card.hoverBorder} ${style.card.hoverShadow}
      `}
    >
        {/* Accent bar */}
        <div className={`h-1.5 w-full ${style.card.accentBar}`} />

        {/* Thumbnail */}
        {post.thumbnail && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              quality={100}
              unoptimized
            />
          </div>
        )}

        <CardContent className="flex-1 flex flex-col p-6">
          {/* Badge + date row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge
              className={`
                text-[11px] uppercase tracking-wider font-semibold
                ${style.badge.bg} ${style.badge.text} border ${style.badge.border}
              `}
            >
              <Megaphone className="h-3 w-3 mr-1" />
              Announcement
            </Badge>

            <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              {formatDate(post.published)}
            </span>
          </div>

          {/* Title */}
          <h3
            className={`
              text-xl font-bold font-[var(--font-playfair)] mb-2 line-clamp-2
              transition-colors duration-300 ${style.heading}
              group-hover:text-amber-600 dark:group-hover:text-amber-400
            `}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {stripHtml(post.content)}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-1.5 text-sm font-medium mt-4 text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
            Read More
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty states                                                       */
/* ------------------------------------------------------------------ */

function EventsEmpty() {
  return (
    <div className="text-center py-20 bg-card rounded-2xl border border-emerald-200/40 dark:border-emerald-800/30">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5">
        <CalendarDays className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold font-[var(--font-playfair)] text-foreground mb-2">
        No Events Available
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        There are no upcoming events published at this time. Check back soon
        or follow us on social media to stay informed.
      </p>
    </div>
  );
}

function AnnouncementsEmpty() {
  return (
    <div className="text-center py-20 bg-card rounded-2xl border border-amber-200/40 dark:border-amber-800/30">
      <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-5">
        <Megaphone className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold font-[var(--font-playfair)] text-foreground mb-2">
        No Announcements Available
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        There are no announcements at this time. Check back soon or follow us
        on social media to stay informed.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export function EventsPage() {
  // All posts from Blogger (single fetch, no label filter)
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blogger?maxResults=50");
      if (res.ok) {
        const data = await res.json();
        setAllPosts(data.posts ?? []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => { await fetchAllPosts(); };
    void load();
  }, [fetchAllPosts]);

  // Client-side classification using universal hashtag system
  const events = filterByCategory(allPosts, "event");
  const announcements = filterByCategory(allPosts, "announcement");

  return (
    <div className="flex flex-col">
      {/* ================================================================= */}
      {/*  HERO SECTION                                                      */}
      {/* ================================================================= */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-royal-dark via-royal to-royal-dark" />
        <div className="absolute inset-0 opacity-15">
          <Image
            src="/images/Ministeybanner.jpg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path
              d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z"
              fill="var(--background)"
            />
          </svg>
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} custom={0}>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                Upcoming &amp; Past
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className="text-3xl md:text-5xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4"
            >
              Events &amp; Announcements
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="text-white/70 text-lg max-w-2xl mx-auto"
            >
              Stay connected with our prophetic gatherings, conferences, revival
              services, and important ministry announcements.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/*  STICKY TAB BAR                                                    */}
      {/* ================================================================= */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-gold/10">
        <div className="container mx-auto px-4 md:px-8">
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="h-auto p-1 rounded-none border-0 bg-transparent gap-1">
              <TabsTrigger
                value="events"
                className={`
                  rounded-lg px-5 py-2.5 text-sm font-medium transition-all
                  data-[state=active]:bg-emerald-600 data-[state=active]:text-white
                  data-[state=active]:shadow-md data-[state=active]:shadow-emerald-600/20
                  text-muted-foreground hover:text-foreground
                `}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Events
              </TabsTrigger>
              <TabsTrigger
                value="announcements"
                className={`
                  rounded-lg px-5 py-2.5 text-sm font-medium transition-all
                  data-[state=active]:bg-amber-500 data-[state=active]:text-white
                  data-[state=active]:shadow-md data-[state=active]:shadow-amber-500/20
                  text-muted-foreground hover:text-foreground
                `}
              >
                <Megaphone className="h-4 w-4 mr-2" />
                Announcements
              </TabsTrigger>
            </TabsList>

            {/* ============================================================= */}
            {/*  EVENTS TAB CONTENT                                             */}
            {/* ============================================================= */}
            <TabsContent value="events">
              <section className="py-16 md:py-20">
                <div className="container mx-auto px-4 md:px-8 max-w-5xl mx-auto">
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                  >
                    <motion.div variants={fadeInUp} custom={0}>
                      {loading ? (
                        <SkeletonGrid />
                      ) : events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {events.map((post) => (
                            <EventCard key={post.id} post={post} />
                          ))}
                        </div>
                      ) : (
                        <EventsEmpty />
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </section>
            </TabsContent>

            {/* ============================================================= */}
            {/*  ANNOUNCEMENTS TAB CONTENT                                      */}
            {/* ============================================================= */}
            <TabsContent value="announcements">
              <section className="py-16 md:py-20">
                <div className="container mx-auto px-4 md:px-8 max-w-5xl mx-auto">
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                  >
                    <motion.div variants={fadeInUp} custom={0}>
                      {loading ? (
                        <SkeletonGrid />
                      ) : announcements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {announcements.map((post) => (
                            <AnnouncementCard key={post.id} post={post} />
                          ))}
                        </div>
                      ) : (
                        <AnnouncementsEmpty />
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ================================================================= */}
      {/*  CTA SECTION                                                       */}
      {/* ================================================================= */}
      <section className="py-16 md:py-20 bg-royal">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold font-[var(--font-playfair)] text-white mb-4">
            Stay Updated
          </h3>
          <p className="text-primary-foreground/60 max-w-md mx-auto mb-8 leading-relaxed">
            Follow us on YouTube for sermons and live streams, or reach out
            directly to learn more about our ministry events and gatherings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              className="bg-gold hover:bg-gold-dark text-royal-dark font-medium"
              asChild
            >
              <a
                href="https://www.youtube.com/@EaglesPropheticMinistries"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">
                <ArrowRight className="h-4 w-4 mr-2" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
