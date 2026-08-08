/**
 * Blogger JSON Feed Fetcher
 *
 * Uses Blogger's public Atom/JSON feed — NO API key required.
 * Feed URL: https://eaglespropheticministries.blogspot.com/feeds/posts/default?alt=json
 *
 * This is free, requires no Google Cloud setup, and works as long as
 * the blog is set to Public in Blogger Settings > Permissions.
 */

const BLOG_FEED_URL =
  "https://eaglespropheticministries.blogspot.com/feeds/posts/default";

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  published: string;
  updated: string;
  url: string;
  slug: string;
  thumbnail: string | null;
  labels: string[];
  author: string;
}

function extractSlug(url: string): string {
  return url.split("/").pop()?.replace(".html", "") ?? "";
}

export function stripHtml(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]*>/g, "");
  return text.length > maxLength ? text.slice(0, maxLength) + "\u2026" : text;
}

/**
 * Upgrade a Blogger image URL to the highest available quality.
 * Handles all Blogger URL size formats:
 *   Path-based:  /s72-c/ /s200/ /w400-h225/
 *   Query-based:  =w303-h303  =s400  =w1200
 * All are replaced with /s1600/ or =s1600 for maximum resolution.
 */
function upgradeBloggerImage(src: string): string {
  // Replace path-based: /sNNN-c/ or /sNNN/ (e.g. /s72-c/, /s320/)
  let upgraded = src.replace(/\/s\d+(-[a-z])?\//, "/s1600/");
  // Replace path-based: /wNNN-hNNN/ or /wNNN/ (e.g. /w400-h225/, /w400/)
  upgraded = upgraded.replace(/\/w\d+(-h\d+)?\//, "/s1600/");
  // Replace query-based: =wNNN-hNNN or =sNNN or =wNNN at end of URL
  // e.g. ...imgID=w303-h303 → ...imgID=s1600
  upgraded = upgraded.replace(/=[sw]\d+(-h\d+)?$/i, "=s1600");
  return upgraded;
}

/**
 * Check if a Blogger image URL is already high-res.
 */
function isHighRes(src: string): boolean {
  return /\/(s1600|s2048|w1200|w1600)\//.test(src) || /=[sw](1600|2048|1200)$/i.test(src);
}

/**
 * Extract the BEST quality thumbnail from blog post content.
 * Prefers images that are NOT tiny Blogger thumbnails.
 * Returns the first large image found, or upscales the media$thumbnail.
 */
function extractBestThumbnail(content: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  let bestSrc: string | null = null;

  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    // Skip tiny tracking pixels and icons
    if (src.includes("1x1") || src.includes("icon") || src.includes("blank.gif")) continue;

    // Prefer already-large images
    if (isHighRes(src)) {
      bestSrc = src;
      break;
    }
    // Upgrade medium Blogger images to high-res
    if (!bestSrc) {
      bestSrc = upgradeBloggerImage(src);
    }
  }
  return bestSrc;
}

function getAtomText(field: unknown): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object" && field !== null && "$t" in field) {
    return (field as { $t: string }).$t;
  }
  return "";
}

export function extractAllImages(content: string): string[] {
  const imgs: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const src = match[1];
    // Skip tiny tracking pixels
    if (src.includes("1x1") || src.includes("blank.gif")) continue;
    // Always upgrade Blogger images to highest resolution
    imgs.push(upgradeBloggerImage(src));
  }
  return [...new Set(imgs)];
}

export async function fetchBloggerPosts(options?: {
  maxResults?: number;
  startIndex?: number;
  label?: string;
}): Promise<{ posts: BlogPost[]; total: number }> {
  const maxResults = options?.maxResults ?? 10;
  const startIndex = options?.startIndex ?? 1;

  const params = new URLSearchParams({
    alt: "json",
    "max-results": maxResults.toString(),
    "start-index": startIndex.toString(),
  });

  if (options?.label) {
    params.set("category", options.label);
  }

  const url = `${BLOG_FEED_URL}?${params.toString()}`;
  console.log(`[Blogger Feed] Fetching: ${url}`);

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`[Blogger Feed] HTTP ${res.status}`);
    return { posts: [], total: 0 };
  }

  const data = await res.json();
  const feed = data.feed;
  const entries: Record<string, unknown>[] = feed?.entry ?? [];

  const total = parseInt(
    getAtomText(feed?.openSearch$totalResults) || "0",
    10
  );

  const posts: BlogPost[] = entries.map((entry) => {
    const content = getAtomText(entry.content) || "";
    const links = entry.link as
      | Array<{ rel: string; href: string }>
      | undefined;
    const altLink =
      links?.find((l) => l.rel === "alternate")?.href ?? "";

    const categories = entry.category as
      | Array<{ term: string }>
      | undefined;
    const labels = categories?.map((c) => c.term) ?? [];

    const author = entry.author as
      | Array<{ name?: { $t?: string } }>
      | undefined;
    const authorName =
      author?.[0]?.name?.$t ?? "Eagles Prophetic Ministries";

    // Get the best quality thumbnail
    let thumbnail: string | null = null;
    const mediaThumbnail = entry.media$thumbnail as { url?: string } | undefined;
    if (mediaThumbnail?.url) {
      // Upscale from tiny 72px to 1600px for crystal-clear images
      thumbnail = upgradeBloggerImage(mediaThumbnail.url);
    }
    // Also try to find a better image from the content HTML
    const contentThumb = extractBestThumbnail(content);
    if (contentThumb) {
      thumbnail = contentThumb;
    }

    return {
      id: getAtomText(entry.id),
      title: getAtomText(entry.title),
      content,
      summary: stripHtml(content),
      published: getAtomText(entry.published),
      updated: getAtomText(entry.updated),
      url: altLink,
      slug: extractSlug(altLink),
      thumbnail,
      labels,
      author: authorName,
    };
  });

  console.log(`[Blogger Feed] Fetched ${posts.length} posts (total: ${total})`);
  return { posts, total };
}

/**
 * Fetch a single blog post by its URL slug.
 * Fetches up to 500 posts and finds the matching one.
 * Falls back to fetching all posts if the first batch doesn't contain it.
 */
export async function fetchBloggerPostBySlug(slug: string): Promise<BlogPost | null> {
  // Try first 500 posts
  const { posts } = await fetchBloggerPosts({ maxResults: 500 });
  const match = posts.find((p) => p.slug === slug);
  return match ?? null;
}

/**
 * Fetch all slugs for generateStaticParams.
 * Returns just slugs to keep the payload small.
 */
export async function fetchAllPostSlugs(): Promise<string[]> {
  const { posts } = await fetchBloggerPosts({ maxResults: 500 });
  return posts.map((p) => p.slug);
}
