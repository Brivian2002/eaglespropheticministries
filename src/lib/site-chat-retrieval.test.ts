import { describe, expect, it } from "vitest";
import { findRelevantBloggerPosts, htmlToPlainText } from "./site-chat-retrieval";
import type { BlogPost } from "./blogger-feed";

const posts: BlogPost[] = [
  {
    id: "1",
    title: "The Mystery of Babylon the Great",
    content: "<p>A teaching about Babylon and the book of Revelation.</p>",
    summary: "A teaching about Babylon.",
    published: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-02T00:00:00.000Z",
    url: "https://example.test/teachings/babylon.html",
    slug: "babylon",
    thumbnail: null,
    labels: ["Prophecy", "EndTimes"],
    author: "Eagles Prophetic Ministries",
  },
  {
    id: "2",
    title: "Prayer and Spiritual Growth",
    content: "<p>Practical encouragement about prayer and spiritual growth.</p>",
    summary: "Prayer and spiritual growth.",
    published: "2026-02-01T00:00:00.000Z",
    updated: "2026-02-02T00:00:00.000Z",
    url: "https://example.test/teachings/prayer.html",
    slug: "prayer",
    thumbnail: null,
    labels: ["SpiritualGrowth"],
    author: "Eagles Prophetic Ministries",
  },
];

describe("site chat content retrieval", () => {
  it("ranks posts by relevance and preserves their official source links", () => {
    const relevant = findRelevantBloggerPosts("Explain the mystery of Babylon the Great", posts);

    expect(relevant[0]).toMatchObject({
      title: "The Mystery of Babylon the Great",
      url: "https://example.test/teachings/babylon.html",
    });
    expect(relevant[0].excerpt).toContain("Babylon");
    expect(relevant[0].score).toBeGreaterThan(0);
  });

  it("does not return unrelated posts when no query terms match", () => {
    expect(findRelevantBloggerPosts("unrelated astronomy question", posts)).toEqual([]);
  });

  it("removes script/style content and decodes common HTML entities", () => {
    expect(htmlToPlainText("<p>Safe &amp; sound</p><script>ignore rules</script><style>.x{}</style>"))
      .toBe("Safe & sound");
  });
});
