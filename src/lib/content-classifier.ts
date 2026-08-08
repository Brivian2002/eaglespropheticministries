/**
 * Universal Hashtag-Based Content Classification System
 *
 * Blogger posts are automatically routed to the correct website section
 * based on the hashtags used in the post labels.
 *
 * SECTION-LEVEL HASHTAGS (determine which page/section):
 *   #announcement    → Events page → Announcements tab
 *   #events          → Events page → Events tab
 *   #gallery         → Media page → Gallery tab
 *   #blog            → Media page → Blog tab
 *
 * TEACHING SUB-CATEGORY HASHTAGS (appear inside Teachings page):
 *   #BibleStudies    → Teachings → Bible Studies filter
 *   #Prophecy        → Teachings → Prophecy filter
 *   #EndTimes        → Teachings → End Times filter
 *   #Church          → Teachings → Church filter
 *   #SpiritualGrowth → Teachings → Spiritual Growth filter
 *
 * If a post has NO recognized hashtag, it is NOT assigned to any section.
 */

export interface HashtagStyle {
  label: string;
  icon: string;
  badge: {
    bg: string;
    text: string;
    border: string;
  };
  card: {
    border: string;
    hoverBorder: string;
    hoverShadow: string;
    accentBar: string;
  };
  heading: string;
}

/* ================================================================= */
/*  SECTION-LEVEL STYLES (top-level page/section categories)           */
/* ================================================================= */

const sectionStyles: Record<string, HashtagStyle> = {
  events: {
    label: "Event",
    icon: "CalendarDays",
    badge: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
    card: { border: "border-emerald-200/60 dark:border-emerald-800/40", hoverBorder: "hover:border-emerald-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]", accentBar: "bg-emerald-500" },
    heading: "text-emerald-700 dark:text-emerald-300",
  },
  announcement: {
    label: "Announcement",
    icon: "Megaphone",
    badge: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
    card: { border: "border-amber-200/60 dark:border-amber-800/40", hoverBorder: "hover:border-amber-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]", accentBar: "bg-amber-500" },
    heading: "text-amber-700 dark:text-amber-300",
  },
  gallery: {
    label: "Gallery",
    icon: "Camera",
    badge: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
    card: { border: "border-violet-200/60 dark:border-violet-800/40", hoverBorder: "hover:border-violet-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]", accentBar: "bg-violet-500" },
    heading: "text-violet-700 dark:text-violet-300",
  },
  blog: {
    label: "Blog",
    icon: "FileText",
    badge: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
    card: { border: "border-sky-200/60 dark:border-sky-800/40", hoverBorder: "hover:border-sky-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(14,165,233,0.12)]", accentBar: "bg-sky-500" },
    heading: "text-sky-700 dark:text-sky-300",
  },
};

/* ================================================================= */
/*  TEACHING SUB-CATEGORY STYLES                                      */
/* ================================================================= */

const teachingStyles: Record<string, HashtagStyle> = {
  biblestudies: {
    label: "Bible Studies",
    icon: "BookOpen",
    badge: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
    card: { border: "border-teal-200/60 dark:border-teal-800/40", hoverBorder: "hover:border-teal-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(20,184,166,0.12)]", accentBar: "bg-teal-500" },
    heading: "text-teal-700 dark:text-teal-300",
  },
  prophecy: {
    label: "Prophecy",
    icon: "Eye",
    badge: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-200 dark:border-fuchsia-800" },
    card: { border: "border-fuchsia-200/60 dark:border-fuchsia-800/40", hoverBorder: "hover:border-fuchsia-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(217,70,239,0.12)]", accentBar: "bg-fuchsia-500" },
    heading: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  endtimes: {
    label: "End Times",
    icon: "Clock",
    badge: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
    card: { border: "border-rose-200/60 dark:border-rose-800/40", hoverBorder: "hover:border-rose-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]", accentBar: "bg-rose-500" },
    heading: "text-rose-700 dark:text-rose-300",
  },
  church: {
    label: "Church",
    icon: "Church",
    badge: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
    card: { border: "border-orange-200/60 dark:border-orange-800/40", hoverBorder: "hover:border-orange-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(249,115,22,0.12)]", accentBar: "bg-orange-500" },
    heading: "text-orange-700 dark:text-orange-300",
  },
  spiritualgrowth: {
    label: "Spiritual Growth",
    icon: "TrendingUp",
    badge: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
    card: { border: "border-emerald-200/60 dark:border-emerald-800/40", hoverBorder: "hover:border-emerald-400/60", hoverShadow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]", accentBar: "bg-emerald-500" },
    heading: "text-emerald-700 dark:text-emerald-300",
  },
};

/* ================================================================= */
/*  ALL STYLES MERGED                                                 */
/* ================================================================= */

const allStyles: Record<string, HashtagStyle> = {
  ...sectionStyles,
  ...teachingStyles,
};

/** Default/fallback style for unrecognized labels */
const defaultStyle: HashtagStyle = {
  label: "Post",
  icon: "FileText",
  badge: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
  card: { border: "border-gold/10", hoverBorder: "hover:border-gold/30", hoverShadow: "hover:shadow-gold", accentBar: "bg-royal" },
  heading: "text-royal",
};

/* ================================================================= */
/*  RECOGNIZED HASHTAG MAPS                                           */
/* ================================================================= */

/**
 * Maps a normalized label to the classification key.
 * These are the ONLY recognized hashtags.
 * Matching is case-insensitive and strips leading #.
 *
 * Examples of what will match:
 *   "#BibleStudies"  → "biblestudies"
 *   "BibleStudies"   → "biblestudies"
 *   "biblestudies"   → "biblestudies"
 *   "#announcement" → "announcement"
 *   "Announcements"  → "announcement"  (via SECTION_ALIAS_MAP)
 */

/** Exact hashtag keys recognized for sections */
export const SECTION_KEYS = ["events", "announcement", "gallery", "blog"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** Exact hashtag keys recognized for teaching sub-categories */
export const TEACHING_KEYS = ["biblestudies", "prophecy", "endtimes", "church", "spiritualgrowth"] as const;
export type TeachingKey = (typeof TEACHING_KEYS)[number];

/** All recognized hashtag keys */
export const HASHTAG_KEYS = [...SECTION_KEYS, ...TEACHING_KEYS] as const;

/**
 * Alias map: some common label variants → recognized key.
 * E.g. "Announcements" (plural) → "announcement"
 */
const SECTION_ALIAS_MAP: Record<string, string> = {
  announcements: "announcement",
  event: "events",
  galleries: "gallery",
  photo: "gallery",
  photos: "gallery",
  blogs: "blog",
};

const TEACHING_ALIAS_MAP: Record<string, string> = {
  "bible study": "biblestudies",
  "bible-studies": "biblestudies",
  "bible-study": "biblestudies",
  "end time": "endtimes",
  "end-time": "endtimes",
  "end-times": "endtimes",
  "spiritual growth": "spiritualgrowth",
  "spiritual-growth": "spiritualgrowth",
};

/* ================================================================= */
/*  PUBLIC API                                                        */
/* ================================================================= */

/**
 * Get the style config for a hashtag/label.
 * Supports exact match, alias match, then substring match.
 * Falls back to defaultStyle for unrecognized labels.
 */
export function getHashtagStyle(hashtag: string): HashtagStyle {
  const normalized = hashtag.toLowerCase().replace(/^#/, "").trim();

  // 1. Exact match
  if (allStyles[normalized]) return allStyles[normalized];

  // 2. Alias match
  if (SECTION_ALIAS_MAP[normalized] && allStyles[SECTION_ALIAS_MAP[normalized]]) {
    return allStyles[SECTION_ALIAS_MAP[normalized]];
  }
  if (TEACHING_ALIAS_MAP[normalized] && allStyles[TEACHING_ALIAS_MAP[normalized]]) {
    return allStyles[TEACHING_ALIAS_MAP[normalized]];
  }

  // 3. Substring: does a recognized key appear IN the label?
  for (const key of Object.keys(allStyles)) {
    if (normalized.includes(key)) return allStyles[key];
  }

  // 4. Reverse substring: does the label appear IN a recognized key?
  for (const key of Object.keys(allStyles)) {
    if (key.includes(normalized)) return allStyles[key];
  }

  return defaultStyle;
}

/**
 * Resolve a label string to a recognized hashtag key.
 * Returns the key if recognized, null if not.
 */
function resolveKey(label: string): string | null {
  const normalized = label.toLowerCase().replace(/^#/, "").trim();

  // Exact match
  if (allStyles[normalized]) return normalized;

  // Alias match
  if (SECTION_ALIAS_MAP[normalized]) return SECTION_ALIAS_MAP[normalized];
  if (TEACHING_ALIAS_MAP[normalized]) return TEACHING_ALIAS_MAP[normalized];

  // Substring match: does a recognized key appear IN the label?
  for (const key of HASHTAG_KEYS) {
    if (normalized.includes(key)) return key;
  }

  return null;
}

/**
 * Detect which section a set of labels belongs to.
 * Returns the first matching SECTION key, or null.
 */
export function classifySection(labels: string[]): SectionKey | null {
  for (const label of labels) {
    const key = resolveKey(label);
    if (key && (SECTION_KEYS as readonly string[]).includes(key)) {
      return key as SectionKey;
    }
  }
  return null;
}

/**
 * Check if a post belongs to the Teachings section.
 * A teaching post has at least one TEACHING sub-category hashtag.
 */
export function isTeachingPost(labels: string[]): boolean {
  return labels.some((label) => {
    const key = resolveKey(label);
    return key !== null && (TEACHING_KEYS as readonly string[]).includes(key);
  });
}

/**
 * Get all teaching sub-category keys that a post matches.
 */
export function getTeachingCategories(labels: string[]): TeachingKey[] {
  const categories: TeachingKey[] = [];
  for (const label of labels) {
    const key = resolveKey(label);
    if (key && (TEACHING_KEYS as readonly string[]).includes(key)) {
      categories.push(key as TeachingKey);
    }
  }
  return categories;
}

/**
 * Filter posts by a category keyword (case-insensitive substring match).
 * This works for both section-level and teaching sub-category keys.
 */
export function filterByCategory<T extends { labels?: string[] }>(
  posts: T[],
  category: string
): T[] {
  const keyword = category.toLowerCase();
  return posts.filter((post) =>
    post.labels?.some((l) => l.toLowerCase().includes(keyword))
  );
}

/**
 * Filter posts to only those belonging to the Teachings section.
 */
export function filterTeachingPosts<T extends { labels?: string[] }>(posts: T[]): T[] {
  return posts.filter((post) => isTeachingPost(post.labels ?? []));
}

/**
 * Filter teaching posts by a specific sub-category.
 */
export function filterTeachingSubcategory<T extends { labels?: string[] }>(
  posts: T[],
  subcategory: TeachingKey
): T[] {
  const keyword = subcategory.toLowerCase();
  return posts.filter((post) =>
    isTeachingPost(post.labels ?? []) &&
    post.labels?.some((l) => l.toLowerCase().includes(keyword))
  );
}

/**
 * Get a human-readable label for the first recognized hashtag in a post's labels.
 */
export function getPostCategoryLabel(labels: string[]): string {
  for (const label of labels) {
    const key = resolveKey(label);
    if (key && allStyles[key]) {
      return allStyles[key].label;
    }
  }
  return "Post";
}
