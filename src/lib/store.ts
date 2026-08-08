import { create } from "zustand";

export type PageView =
  | "home"
  | "about"
  | "prophet"
  | "teachings"
  | "bookstore"
  | "media"
  | "events"
  | "support"
  | "contact";

/** Map from PageView → URL path */
export const PAGE_PATHS: Record<PageView, string> = {
  home: "/",
  about: "/about",
  prophet: "/prophet",
  teachings: "/teachings",
  bookstore: "/bookstore",
  media: "/media",
  events: "/events",
  support: "/support",
  contact: "/contact",
};

interface NavigationStore {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  mobileOpen: false,
  setMobileOpen: (open) => set({ mobileOpen: open }),
}));
