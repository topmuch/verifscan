"use client";

import * as React from "react";

/**
 * Theme provider for VerifScan.
 *
 * Supports three themes:
 *  - "light"  : default light theme (brand blue + green + orange)
 *  - "dark"   : dark mode (.dark class on <html>)
 *  - "violet" : violet theme (.theme-violet class on <html>)
 *
 * The choice is persisted to localStorage and re-applied on every page load.
 * The <html> element gets the appropriate class(es) — Tailwind's `dark:` variant
 * is wired to the `.dark` selector in globals.css.
 */

type Theme = "light" | "dark" | "violet";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "vs-theme";

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("dark", "theme-violet");
  if (theme === "dark") html.classList.add("dark");
  if (theme === "violet") html.classList.add("theme-violet");
  html.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");

  // Read persisted theme on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored && ["light", "dark", "violet"].includes(stored)) {
        setThemeState(stored);
        applyThemeClass(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    applyThemeClass(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const cycleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "light" ? "dark" : prev === "dark" ? "violet" : "light";
      applyThemeClass(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback so the toggle button can render even if a page forgets
    // to wrap with <ThemeProvider>.
    return {
      theme: "light" as Theme,
      setTheme: () => {},
      cycleTheme: () => {},
    };
  }
  return ctx;
}

/**
 * Inline theme-toggle button.
 *
 * Click cycles: light → dark → violet → light.
 * Renders a compact icon button so it fits in any header / sidebar.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, cycleTheme } = useTheme();
  const label =
    theme === "light" ? "Mode clair" : theme === "dark" ? "Mode sombre" : "Mode violet";
  const dotColor =
    theme === "light" ? "#F59E0B" : theme === "dark" ? "#1E293B" : "#7C3AED";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={label}
      aria-label={label}
      className={
        "inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors " +
        (className || "")
      }
    >
      <span
        className="size-3 rounded-full border border-black/10"
        style={{ backgroundColor: dotColor }}
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
