/**
 * Post Reader Store (Zustand)
 *
 * Global store for the in-site post reader overlay.
 * When a user clicks "Read More" on any post (teachings, blog, etc.),
 * the post data is stored here and the reader overlay opens.
 */

import { create } from "zustand";

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
  author: string;
  slug?: string;
  labels?: string[];
  thumbnail?: string | null;
  summary?: string;
}

interface PostReaderStore {
  isOpen: boolean;
  post: BlogPost | null;
  openPost: (post: BlogPost) => void;
  closePost: () => void;
}

export const usePostReaderStore = create<PostReaderStore>((set) => ({
  isOpen: false,
  post: null,
  openPost: (post) => set({ isOpen: true, post }),
  closePost: () => set({ isOpen: false, post: null }),
}));
