"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, useCallback } from "react";

type Theme = "wine" | "emerald";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "wine",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = "epm-theme";
const TOGGLE_EVENT = "epm-theme-change";

function getSnapshot(): Theme {
  if (typeof window === "undefined") return "wine";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "wine";
}

function getServerSnapshot(): Theme {
  return "wine";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(TOGGLE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TOGGLE_EVENT, callback);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    window.dispatchEvent(new Event(TOGGLE_EVENT));
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "emerald") {
      html.setAttribute("data-theme", "emerald");
    } else {
      html.removeAttribute("data-theme");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
