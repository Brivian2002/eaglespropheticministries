"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  PlayCircle,
  Camera,
  FileText,
  Clock,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Image as ImageIcon,
  Play,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { getHashtagStyle } from "@/lib/content-classifier";
import { extractAllImages } from "@/lib/blogger-feed";

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
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
}

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
  summary: string;
}

interface GalleryImage {
  src: string;
  caption: string;
  postId: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

const stripHtml = (html: string, maxLength = 160): string => {
  const text = html.replace(/<[^>]*>/g, "");
  return text.length > maxLength ? text.slice(0, maxLength) + "\u2026" : text;
};

const FALLBACK_IMAGES: GalleryImage[] = [
  { src: "/images/Members.jpg", caption: "Fellowship & Worship", postId: "local-1" },
  { src: "/images/Members2.jpg", caption: "Church Gathering", postId: "local-2" },
  { src: "/images/Members3.jpg", caption: "Ministry Service", postId: "local-3" },
  { src: "/images/Members5.jpg", caption: "Prayer Meeting", postId: "local-4" },
  { src: "/images/Ministeybanner.jpg", caption: "Eagles Prophetic Ministries", postId: "local-5" },
  { src: "/images/TheProphet.jpg", caption: "The Prophet", postId: "local-6" },
];

/* ------------------------------------------------------------------ */
/*  Tab configuration                                                  */
/* ------------------------------------------------------------------ */

const TAB_ITEMS = [
  { value: "videos", label: "Video Gallery", Icon: PlayCircle, activeColor: "data-[state=active]:border-royal" },
  { value: "blog", label: "Blog", Icon: FileText, activeColor: "data-[state=active]:border-sky-500" },
  { value: "gallery", label: "Photo Gallery", Icon: Camera, activeColor: "data-[state=active]:border-violet-500" },
] as const;

type TabValue = (typeof TAB_ITEMS)[number]["value"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MediaPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("videos");
  /* ---- Video state ---- */
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [videosAnimKey, setVideosAnimKey] = useState(0);
  const rotationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- Blog state ---- */
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);

  /* ---- Gallery state ---- */
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const blogStyle = getHashtagStyle("blog");

  /* ================================================================ */
  /*  VIDEO GALLERY                                                    */
  /* ================================================================ */

  const fetchVideos = useCallback(async (pageToken?: string) => {
    try {
      const params = new URLSearchParams({ maxResults: "6" });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`/api/youtube?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        setNextPageToken(data.nextPageToken || null);
        setVideosAnimKey((k) => k + 1);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingVideos(false);
      setRotating(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams({ maxResults: "6" });
      try {
        const res = await fetch(`/api/youtube?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setVideos(data.videos || []);
          setNextPageToken(data.nextPageToken || null);
          setVideosAnimKey((k) => k + 1);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoadingVideos(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Auto-rotation: every 60 seconds, fetch next page
  useEffect(() => {
    rotationIntervalRef.current = setInterval(() => {
      if (!nextPageToken || loadingVideos || rotating) return;
      setRotating(true);
      fetchVideos(nextPageToken);
    }, 60000);
    return () => {
      if (rotationIntervalRef.current) clearInterval(rotationIntervalRef.current);
    };
  }, [nextPageToken, loadingVideos, rotating, fetchVideos]);

  // Progress bar for rotation timer
  useEffect(() => {
    let elapsed = 0;
    progressIntervalRef.current = setInterval(() => {
      elapsed += 1;
      setRotationProgress((elapsed / 60) * 100);
    }, 1000);
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [videos]);

  /* ================================================================ */
  /*  BLOG                                                             */
  /* ================================================================ */

  useEffect(() => {
    async function fetchBlog() {
      try {
        // Fetch ALL posts — no label filter. The universal hashtag system
        // means blog content may have any label. Client sees everything.
        const res = await fetch("/api/blogger?maxResults=50");
        if (res.ok) {
          const data = await res.json();
          setBlogPosts(data.posts || []);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingBlog(false);
      }
    }
    fetchBlog();
  }, []);

  /* ================================================================ */
  /*  PHOTO GALLERY                                                    */
  /* ================================================================ */

  useEffect(() => {
    async function fetchGallery() {
      try {
        // Fetch ALL posts — extract images from every post regardless of label.
        // The universal hashtag system means gallery images may be in any post.
        const res = await fetch("/api/blogger?maxResults=50");
        if (res.ok) {
          const data = await res.json();
          const posts: BlogPost[] = data.posts || [];
          const images: GalleryImage[] = [];
          for (const post of posts) {
            const imgs = extractAllImages(post.content);
            for (const src of imgs) {
              images.push({ src, caption: post.title, postId: post.id });
            }
          }
          setGalleryImages(images.length > 0 ? images : FALLBACK_IMAGES);
        } else {
          setGalleryImages(FALLBACK_IMAGES);
        }
      } catch {
        setGalleryImages(FALLBACK_IMAGES);
      } finally {
        setLoadingGallery(false);
      }
    }
    fetchGallery();
  }, []);

  /* ================================================================ */
  /*  LIGHTBOX KEYBOARD NAV                                            */
  /* ================================================================ */

  const handleLightboxNav = useCallback(
    (direction: "prev" | "next") => {
      if (lightboxIndex === null) return;
      if (direction === "prev") {
        setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : galleryImages.length - 1);
      } else {
        setLightboxIndex(lightboxIndex < galleryImages.length - 1 ? lightboxIndex + 1 : 0);
      }
    },
    [lightboxIndex, galleryImages.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handleLightboxNav("prev");
      else if (e.key === "ArrowRight") handleLightboxNav("next");
      else if (e.key === "Escape") setLightboxIndex(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, handleLightboxNav]);

  /* ================================================================ */
  /*  SUB-COMPONENTS                                                   */
  /* ================================================================ */

  /* ---- Video Gallery Tab Content ---- */
  const renderVideoTab = () => (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header + Rotation Indicator */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10"
          >
            <motion.div variants={fadeInUp} custom={0} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-royal/10 flex items-center justify-center">
                <PlayCircle className="h-5 w-5 text-royal" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-[var(--font-playfair)] text-royal">
                  Video Messages
                </h2>
                <p className="text-sm text-muted-foreground">
                  Latest from our YouTube channel
                </p>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} custom={1} className="flex items-center gap-3">
              {rotating && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-royal" />
                  Loading next videos...
                </span>
              )}
              {!rotating && !loadingVideos && videos.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 text-gold" />
                  Rotating videos...
                </span>
              )}
            </motion.div>
          </motion.div>

          {/* Progress bar for rotation */}
          {!loadingVideos && videos.length > 0 && (
            <div className="h-0.5 bg-muted rounded-full mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-royal/40 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${rotationProgress}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>
          )}

          {/* Video Grid */}
          <AnimatePresence mode="wait">
            {loadingVideos ? (
              <motion.div
                key="video-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-gold/10 overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            ) : videos.length > 0 ? (
              <motion.div
                key={`video-grid-${videosAnimKey}`}
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {videos.map((video, i) => (
                  <motion.div key={video.videoId} variants={fadeInUp} custom={i}>
                    <a href={video.url} target="_blank" rel="noopener noreferrer">
                      <Card className="border-gold/10 hover:border-gold/30 hover:shadow-gold transition-all duration-300 group overflow-hidden h-full">
                        <div className="relative aspect-video overflow-hidden">
                          <Image
                            src={video.thumbnail}
                            alt={video.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <Play className="h-7 w-7 text-royal ml-1" />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold font-[var(--font-playfair)] text-foreground line-clamp-2 group-hover:text-royal transition-colors mb-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(video.publishedAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        </CardContent>
                      </Card>
                    </a>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="video-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-royal/10 flex items-center justify-center mb-4">
                  <PlayCircle className="h-8 w-8 text-royal" />
                </div>
                <h3 className="text-lg font-semibold font-[var(--font-playfair)] text-foreground mb-2">
                  No Videos Available
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Visit our YouTube channel for the latest sermon videos and prophetic messages.
                </p>
                <Button asChild className="bg-royal hover:bg-royal-dark text-white">
                  <a href="https://www.youtube.com/@EaglesPropheticMinistries" target="_blank" rel="noopener noreferrer">
                    Visit YouTube <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );

  /* ---- Blog Tab Content ---- */
  const renderBlogTab = () => (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-10"
          >
            <motion.div variants={fadeInUp} custom={0} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-sky-700 dark:text-sky-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-[var(--font-playfair)] text-foreground">
                  Blog
                </h2>
                <p className="text-sm text-muted-foreground">
                  Insights, reflections, and ministry updates
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Blog Grid */}
          {loadingBlog ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-gold/10 overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : blogPosts.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {blogPosts.map((post, i) => {
                const categoryLabels = post.labels.filter((l) => l.toLowerCase() !== "blog");
                return (
                  <motion.div key={post.id} variants={fadeInUp} custom={i}>
                    <Link href={`/teachings/${post.slug}`}>
                    <Card
                      className="border-gold/10 hover:border-gold/30 hover:shadow-gold transition-all duration-300 group h-full overflow-hidden cursor-pointer"
                    >
                        {post.thumbnail && (
                          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                            <Image
                              src={post.thumbnail}
                              alt={post.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              quality={100}
                              unoptimized
                            />
                          </div>
                        )}
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`${blogStyle.badge.bg} ${blogStyle.badge.text} ${blogStyle.badge.border} text-[10px] uppercase tracking-wider font-medium`}
                            >
                              {blogStyle.label}
                            </Badge>
                            {categoryLabels.slice(0, 3).map((label) => (
                              <Badge
                                key={label}
                                variant="secondary"
                                className="bg-muted text-muted-foreground text-[10px] uppercase tracking-wider"
                              >
                                {label}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="text-lg font-bold font-[var(--font-playfair)] text-foreground line-clamp-2 group-hover:text-royal transition-colors mb-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                            {stripHtml(post.content, 160)}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(post.published)}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-medium text-royal group-hover:text-gold-dark transition-colors">
                              Read More
                              <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-sky-700 dark:text-sky-300" />
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-playfair)] text-foreground mb-2">
                No Blog Posts Available
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Check back soon for insightful articles, ministry updates, and reflections from the Prophet.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );

  /* ---- Photo Gallery Tab Content ---- */
  const renderGalleryTab = () => (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="mb-10"
          >
            <motion.div variants={fadeInUp} custom={0} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Camera className="h-5 w-5 text-violet-700 dark:text-violet-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-[var(--font-playfair)] text-foreground">
                  Photo Gallery
                </h2>
                <p className="text-sm text-muted-foreground">
                  Capturing God&apos;s faithfulness through every moment
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Gallery Grid */}
          {loadingGallery ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-4"
                  style={{ height: `${150 + (i % 3) * 80}px` }}
                >
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : galleryImages.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger}
              className="columns-2 md:columns-3 lg:columns-4 gap-4"
            >
              {galleryImages.map((img, i) => {
                const isLocal = img.src.startsWith("/");
                return (
                  <motion.div
                    key={`${img.postId}-${i}`}
                    variants={fadeInUp}
                    custom={i % 8}
                    className="break-inside-avoid mb-4"
                  >
                    <div
                      className="relative group cursor-pointer rounded-lg overflow-hidden"
                      onClick={() => setLightboxIndex(i)}
                    >
                      {isLocal ? (
                        <Image
                          src={img.src}
                          alt={img.caption}
                          width={600}
                          height={400}
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 rounded-lg"
                        />
                      ) : (
                        <img
                          src={img.src}
                          alt={img.caption}
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 rounded-lg"
                          loading="lazy"
                        />
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-white text-sm font-medium font-[var(--font-playfair)] drop-shadow-lg">
                          {img.caption}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-violet-700 dark:text-violet-300" />
              </div>
              <h3 className="text-lg font-semibold font-[var(--font-playfair)] text-foreground mb-2">
                No Photos Available
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Photo gallery images will appear here as they are published on our blog.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );

  /* ---- Lightbox ---- */
  const renderLightbox = () => (
    <Dialog
      open={lightboxIndex !== null}
      onOpenChange={(open) => {
        if (!open) setLightboxIndex(null);
      }}
    >
      <DialogContent
        className="max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl bg-black/95 border-white/10 p-0 overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {lightboxIndex !== null
            ? `Image ${lightboxIndex + 1} of ${galleryImages.length}`
            : "Image Lightbox"}
        </DialogTitle>

        {lightboxIndex !== null && galleryImages[lightboxIndex] && (
          <div className="relative flex items-center justify-center min-h-[60vh] max-h-[85vh]">
            {/* Image */}
            <div className="w-full flex items-center justify-center px-2 py-4">
              {galleryImages[lightboxIndex].src.startsWith("/") ? (
                <Image
                  src={galleryImages[lightboxIndex].src}
                  alt={galleryImages[lightboxIndex].caption}
                  width={1200}
                  height={800}
                  className="max-h-[80vh] w-auto object-contain rounded-md"
                />
              ) : (
                <img
                  src={galleryImages[lightboxIndex].src}
                  alt={galleryImages[lightboxIndex].caption}
                  className="max-h-[80vh] w-auto object-contain rounded-md"
                />
              )}
            </div>

            {/* Caption at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
              <p className="text-white text-sm font-medium font-[var(--font-playfair)] text-center truncate">
                {galleryImages[lightboxIndex].caption}
              </p>
            </div>

            {/* Counter */}
            <div className="absolute top-4 left-4 bg-black/60 text-white/80 text-xs px-3 py-1 rounded-full font-medium">
              {lightboxIndex + 1} / {galleryImages.length}
            </div>

            {/* Navigation: Previous */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLightboxNav("prev");
              }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Navigation: Next */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLightboxNav("next");
              }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Close Button */}
            <DialogClose asChild>
              <button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  /* ================================================================ */
  /*  MAIN RENDER                                                      */
  /* ================================================================ */

  return (
    <div className="flex flex-col">
      {/* ---- Hero ---- */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-royal-dark via-royal to-royal-dark" />
        <div className="absolute inset-0 opacity-15">
          <Image src="/images/Members2.jpg" alt="" fill className="object-cover" />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="var(--background)" />
          </svg>
        </div>
        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeInUp} custom={0}>
              <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
                Gallery &amp; Videos
              </span>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              custom={1}
              className="text-3xl md:text-5xl font-bold font-[var(--font-playfair)] text-white mt-3 mb-4"
            >
              Media
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              custom={2}
              className="text-white/70 text-lg max-w-2xl mx-auto"
            >
              Moments from the ministry, prophetic messages, blog posts, and photo galleries.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ---- Sticky Tab Bar ---- */}
      <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-sm border-b border-gold/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TAB_ITEMS.map(({ value, label, Icon, activeColor }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`px-4 py-3 text-sm font-medium rounded-none border-b-2 transition-colors flex items-center gap-2 flex-shrink-0 ${
                  activeTab === value
                    ? `${activeColor} border-current text-foreground`
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Tab Content ---- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "videos" && renderVideoTab()}
          {activeTab === "blog" && renderBlogTab()}
          {activeTab === "gallery" && renderGalleryTab()}
        </motion.div>
      </AnimatePresence>

      {/* ---- Lightbox ---- */}
      {renderLightbox()}
    </div>
  );
}
