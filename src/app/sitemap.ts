import type { MetadataRoute } from "next";
import { fetchBloggerPosts } from "@/lib/blogger-feed";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/prophet`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/teachings`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/bookstore`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/media`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/events`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/support`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const { posts } = await fetchBloggerPosts({ maxResults: 500 });
    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${SITE_URL}/teachings/${post.slug}`,
      lastModified: new Date(post.updated || post.published),
      changeFrequency: "monthly",
      priority: 0.8,
    }));
    return [...staticPages, ...postPages];
  } catch {
    return staticPages;
  }
}
