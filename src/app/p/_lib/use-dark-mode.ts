"use client";

import { useEffect, useState } from "react";

/**
 * Dark mode hook — persists choice in localStorage and toggles the `dark`
 * class on <html>. Defaults to system preference on first visit.
 *
 * Tailwind v4 dark variant is configured in globals.css via
 * `@custom-variant dark (&:is(.dark *))` — adding `dark` on <html> is enough.
 */
export function useDarkMode() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("vs-theme") : null;
    const initial: "light" | "dark" =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("vs-theme", theme);
  }, [theme, mounted]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle, mounted };
}
