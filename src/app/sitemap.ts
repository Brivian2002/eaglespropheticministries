import type { MetadataRoute } from "next";
import { fetchBloggerPosts } from "@/lib/blogger-feed";

const BASE_URL = "https://eaglespropheticministries.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/prophet`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/teachings`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/bookstore`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/media`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic blog post pages
  try {
    const { posts } = await fetchBloggerPosts({ maxResults: 500 });
    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${BASE_URL}/teachings/${post.slug}`,
      lastModified: new Date(post.updated || post.published),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...postPages];
  } catch {
    // If Blogger fetch fails, still return static pages
    return staticPages;
  }
}
