"use client";

import { useEffect, useState, useCallback } from "react";

export type Theme = "dark" | "light";

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("lf_theme") as Theme | null;
  if (saved === "dark" || saved === "light") return saved;
  if (document.documentElement.classList.contains("light")) return "light";
  return "dark";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
  try {
    localStorage.setItem("lf_theme", t);
  } catch {}
  window.dispatchEvent(new CustomEvent("lf-theme-change", { detail: t }));
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getSystemTheme();
    setThemeState(initial);
    applyTheme(initial);

    // Observer class changes on <html>
    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.classList.contains("light");
      setThemeState(isLight ? "light" : "dark");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<Theme>).detail;
      if (detail === "dark" || detail === "light") {
        setThemeState(detail);
      }
    };
    window.addEventListener("lf-theme-change", onCustomEvent);

    return () => {
      observer.disconnect();
      window.removeEventListener("lf-theme-change", onCustomEvent);
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [theme, setTheme]);

  return { theme, setTheme, toggle, mounted };
}
