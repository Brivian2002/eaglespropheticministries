import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchBloggerPostBySlug, fetchAllPostSlugs, stripHtml } from "@/lib/blogger-feed";
import { getHashtagStyle } from "@/lib/content-classifier";

const BASE_URL = "https://eaglespropheticministries.vercel.app";

// ISR: revalidate every hour
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await fetchAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBloggerPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const description = stripHtml(post.content, 160);

  return {
    title: `${post.title} — Eagles Prophetic Ministries`,
    description,
    authors: [{ name: post.author || "Eagles Prophetic Ministries" }],
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.published,
      authors: [post.author || "Eagles Prophetic Ministries"],
      url: `${BASE_URL}/teachings/${post.slug}`,
      ...(post.thumbnail
        ? { images: [{ url: post.thumbnail, width: 1600, height: 900 }] }
        : {}),
    },
  };
}

/**
 * Upgrades any Blogger image URLs in the HTML content to high-res.
 */
function upgradeContentImages(html: string): string {
  return html
    .replace(/\/s\d+(-[a-z])?\//g, "/s1600/")
    .replace(/\/w\d+(-h\d+)?\//g, "/s1600/")
    .replace(/=[sw]\d+(-h\d+)?$/gi, "=s1600");
}

function processContent(html: string): string {
  let processed = upgradeContentImages(html);
  processed = processed.replace(
    /<img([^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes("class=")) {
        return `<img${attrs} class="w-full h-auto rounded-lg my-4" />`;
      }
      return match;
    }
  );
  processed = processed.replace(
    /<blockquote([^>]*)>/gi,
    '<blockquote$1 class="border-l-4 border-gold pl-4 my-4 italic text-muted-foreground">'
  );
  return processed;
}

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

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchBloggerPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const categoryLabel =
    post.labels && post.labels.length > 0 ? post.labels[0] : "Post";
  const style = getHashtagStyle(categoryLabel);
  const processedContent = processContent(post.content || "");
  const description = stripHtml(post.content, 160);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    datePublished: post.published,
    dateModified: post.updated || post.published,
    author: {
      "@type": "Person",
      name: post.author || "Eagles Prophetic Ministries",
    },
    publisher: {
      "@type": "Organization",
      name: "Eagles Prophetic Ministries",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/Ministrylogo.jpg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/teachings/${post.slug}`,
    },
    ...(post.thumbnail ? { image: post.thumbnail } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2 mb-6"
          asChild
        >
          <Link href="/teachings">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Teachings
          </Link>
        </Button>

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
        <h1 className="text-2xl md:text-4xl font-bold font-[var(--font-playfair)] text-foreground leading-tight mb-6">
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
          {post.updated !== post.published && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Updated {formatDate(post.updated)}
            </span>
          )}
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

        {/* Post Content — server-rendered HTML */}
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
    </>
  );
}