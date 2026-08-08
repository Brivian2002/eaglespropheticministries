import { NextRequest, NextResponse } from "next/server";
import { fetchBloggerPosts } from "@/lib/blogger-feed";

/**
 * Blogger API Route (JSON Feed)
 *
 * Uses the free Blogger JSON feed — NO API key required.
 * Works as long as the blog is set to Public.
 *
 * Query parameters:
 * - maxResults: number of posts (default 10, max 50)
 * - label: filter by category/label
 */

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes — fast content updates

interface CacheEntry {
  posts: Awaited<ReturnType<typeof fetchBloggerPosts>>["posts"];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const maxResults = Math.min(
    parseInt(searchParams.get("maxResults") || "10"),
    50
  );
  const label = searchParams.get("label") || null;

  const cacheKey = label || "__all__";
  const now = Date.now();

  // Return cached data if still fresh
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ posts: cached.posts, cached: true });
  }

  try {
    const { posts, total } = await fetchBloggerPosts({
      maxResults,
      label: label || undefined,
    });

    // Update cache
    cache.set(cacheKey, { posts, timestamp: now });

    return NextResponse.json({
      posts,
      total,
      cached: false,
    });
  } catch (error) {
    console.error("[Blogger API] Error:", error);
    return NextResponse.json(
      {
        posts: [],
        error:
          "Failed to fetch posts from Blogger. Please check that the blog is public.",
      },
      { status: 502 }
    );
  }
}
