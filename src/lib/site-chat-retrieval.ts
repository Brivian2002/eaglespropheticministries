import type { BlogPost } from "@/lib/blogger-feed";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "but", "by",
  "can", "could", "did", "do", "does", "for", "from", "had", "has",
  "have", "he", "her", "here", "him", "his", "how", "i", "if", "in",
  "into", "is", "it", "its", "me", "my", "of", "on", "or", "our",
  "please", "she", "tell", "that", "the", "their", "them", "there",
  "they", "this", "to", "us", "was", "we", "were", "what", "when",
  "where", "which", "who", "why", "will", "with", "would", "you", "your",
]);

export interface RelevantBloggerPost {
  title: string;
  url: string;
  published: string;
  labels: string[];
  excerpt: string;
  score: number;
}

function tokenize(value: string): string[] {
  return (value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(text: string, terms: string[], maxLength: number): string {
  if (text.length <= maxLength) return text;
  const lower = text.toLowerCase();
  const firstMatch = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = Math.max(0, (firstMatch ?? 0) - Math.floor(maxLength / 5));
  const excerpt = text.slice(start, start + maxLength).trim();
  return `${start > 0 ? "…" : ""}${excerpt}${start + maxLength < text.length ? "…" : ""}`;
}

export function findRelevantBloggerPosts(
  query: string,
  posts: BlogPost[],
  limit = 4,
): RelevantBloggerPost[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];

  return posts
    .map((post) => {
      const titleTerms = new Set(tokenize(post.title));
      const labelTerms = new Set(tokenize(post.labels.join(" ")));
      const bodyText = htmlToPlainText(post.content || post.summary || "");
      const bodyTerms = new Set(tokenize(bodyText));
      const titleMatches = terms.filter((term) => titleTerms.has(term)).length;
      const labelMatches = terms.filter((term) => labelTerms.has(term)).length;
      const bodyMatches = terms.filter((term) => bodyTerms.has(term)).length;
      const score = titleMatches * 5 + labelMatches * 4 + bodyMatches * 2;

      return {
        score,
        post,
        bodyText,
      };
    })
    .filter((result) => result.score >= 2)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Date.parse(b.post.published) - Date.parse(a.post.published);
    })
    .slice(0, Math.max(1, Math.min(limit, 5)))
    .map(({ score, post, bodyText }) => ({
      title: post.title,
      url: post.url,
      published: post.published,
      labels: post.labels.slice(0, 8),
      excerpt: makeExcerpt(bodyText || post.summary || "", terms, 1400),
      score,
    }));
}
