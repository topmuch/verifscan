"use client";

import { useEffect } from "react";

/**
 * Registers the VerifScan service worker for PWA offline support.
 * - Caches the app shell + last seen products
 * - Queues offline scans via IndexedDB + Background Sync
 * - Falls back gracefully when SW is unsupported
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      // Only register in production to avoid HMR conflicts in dev
      return;
    }

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available — reload once to activate
              if (confirm("Une nouvelle version de VerifScan est disponible. Recharger ?")) {
                window.location.reload();
              }
            }
          });
        });
      } catch (err) {
        console.warn("[VerifScan] SW registration failed:", err);
      }
    };

    register();
  }, []);

  return null;
}
