/**
 * VerifScan offline helpers — client-side.
 *
 * Used by the public scan page (/p/[lotId]) to:
 *  - Generate a stable anonymous device fingerprint (localStorage-based)
 *  - Queue scans locally when offline
 *  - Trigger Background Sync when the SW is available
 *  - Read the local scan history (cached from server + offline queue)
 */

const FINGERPRINT_KEY = "vs-device-fp";
const HISTORY_KEY = "vs-scan-history";
const QUEUE_KEY = "vs-scan-queue";

// --- Device fingerprint (anonymous, stable per browser) ---
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server";
  try {
    let fp = localStorage.getItem(FINGERPRINT_KEY);
    if (!fp) {
      // Combine a few non-PII signals
      const signals = [
        navigator.userAgent,
        navigator.language,
        `${screen.width}x${screen.height}`,
        `${new Date().getTimezoneOffset()}`,
        navigator.hardwareConcurrency?.toString() || "",
        (navigator as any).deviceMemory?.toString() || "",
      ];
      const raw = signals.join("|");
      // Simple hash (djb2) — good enough as a non-reversible identifier
      let hash = 5381;
      for (let i = 0; i < raw.length; i++) {
        hash = (hash * 33) ^ raw.charCodeAt(i);
      }
      fp = `fp_${(hash >>> 0).toString(36)}_${Date.now().toString(36).slice(-4)}`;
      localStorage.setItem(FINGERPRINT_KEY, fp);
    }
    return fp;
  } catch {
    return "fp_unknown";
  }
}

// --- Scan history (local cache for offline access) ---
export interface LocalScanRecord {
  id: string;
  lotId: string;
  productName: string;
  brand?: string;
  photoUrl?: string;
  scannedAt: string; // ISO
  isAuthentic: boolean;
  region?: string;
  pointsEarned?: number;
}

export function getLocalHistory(): LocalScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function pushLocalHistory(record: LocalScanRecord): void {
  if (typeof window === "undefined") return;
  try {
    const history = getLocalHistory();
    // Avoid duplicates by lotId+scannedAt
    const exists = history.some(
      (h) => h.lotId === record.lotId && h.scannedAt === record.scannedAt
    );
    if (!exists) {
      history.unshift(record);
      // Keep last 100
      const trimmed = history.slice(0, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // silent fail
  }
}

export function clearLocalHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}

// --- Offline scan queue (replayed by Service Worker sync) ---
export interface QueuedScan {
  id: string;
  url: string;
  body: Record<string, any>;
  queuedAt: string;
}

export function getQueuedScans(): QueuedScan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function queueScan(scan: QueuedScan): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getQueuedScans();
    queue.push(scan);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function removeQueuedScan(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getQueuedScans().filter((s) => s.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

// --- Network status ---
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// --- Trigger SW background sync (when available) ---
export async function triggerBackgroundSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ("sync" in reg) {
      await (reg as any).sync.register("vs-scan-queue");
    } else {
      // Fallback: try to flush the queue manually
      await flushQueueNow();
    }
  } catch {
    // silent
  }
}

/** Manually replay queued scans (fallback when Background Sync is unsupported) */
export async function flushQueueNow(): Promise<void> {
  const queue = getQueuedScans();
  for (const item of queue) {
    try {
      const resp = await fetch(item.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (resp.ok) {
        removeQueuedScan(item.id);
      }
    } catch {
      // Stop on first failure (probably offline again)
      break;
    }
  }
}

// --- Geolocation (asks for permission) ---
export function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null), // permission denied or timeout — silent fallback
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  });
}
