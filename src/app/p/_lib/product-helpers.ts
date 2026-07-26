/**
 * Helpers for the public product page V4.
 *
 * - detectAllergens: scans an ingredients string and returns matched allergens
 *   with an icon + label + severity hint. Pure function, deterministic.
 * - estimateNutrition: lightweight heuristic for displaying a nutrition panel
 *   when no real nutrition data is available. Returns null if the product
 *   category has no known nutrition profile.
 * - cn: tiny className combiner (avoids importing cn from utils that depends
 *   on clsx which may not be available in all bundles).
 */

export type AllergenInfo = {
  key: string;
  label: string;
  icon: string;
  /** Color token used in Tailwind classes (bg-xxx-50 text-xxx-700 border-xxx-200). */
  tone: "amber" | "red" | "orange" | "yellow" | "rose" | "lime" | "stone";
};

const ALLERGEN_RULES: { key: string; label: string; icon: string; tone: AllergenInfo["tone"]; patterns: RegExp[] }[] = [
  { key: "gluten", label: "Gluten / Blé", icon: "🌾", tone: "amber", patterns: [/blé/i, /farine/i, /gluten/i, /froment/i, /orge/i, /seigle/i, /avoine/i] },
  { key: "lait", label: "Lait / Lactose", icon: "🥛", tone: "orange", patterns: [/lait/i, /lactose/i, /beurre/i, /crème/i, /fromage/i, /yaourt/i, /petit-lait/i] },
  { key: "oeuf", label: "Œufs", icon: "🥚", tone: "yellow", patterns: [/œuf/i, /oeuf/i, /ovoproduit/i, /blanc d[' ]œuf/i, /jaune d[' ]œuf/i] },
  { key: "arachide", label: "Arachide", icon: "🥜", tone: "red", patterns: [/arachide/i, /cacahuète/i, /cacahouète/i] },
  { key: "coque", label: "Fruits à coque", icon: "🌰", tone: "amber", patterns: [/noix/i, /amande/i, /noisette/i, /pistache/i, /noix de cajou/i, /noix du brésil/i] },
  { key: "soja", label: "Soja", icon: "🫘", tone: "lime", patterns: [/soja/i, /lécithine de soja/i] },
  { key: "poisson", label: "Poisson", icon: "🐟", tone: "rose", patterns: [/poisson/i, /saumon/i, /thon/i, /morue/i, /sardine/i, /anchois/i] },
  { key: "crustaces", label: "Crustacés", icon: "🦐", tone: "red", patterns: [/crevette/i, /crabe/i, /homard/i, /langouste/i] },
  { key: "sesame", label: "Sésame", icon: "⚪", tone: "stone", patterns: [/sésame/i, /sesame/i] },
  { key: "moutarde", label: "Moutarde", icon: "🟡", tone: "yellow", patterns: [/moutarde/i] },
  { key: "sulfites", label: "Sulfites", icon: "🍷", tone: "rose", patterns: [/sulfite/i, /dioxyde de soufre/i] },
  { key: "celeri", label: "Céleri", icon: "🥬", tone: "lime", patterns: [/céleri/i, /celeri/i] },
];

export function detectAllergens(ingredients: string | null | undefined): AllergenInfo[] {
  if (!ingredients || !ingredients.trim()) return [];
  const found: AllergenInfo[] = [];
  for (const rule of ALLERGEN_RULES) {
    if (rule.patterns.some((p) => p.test(ingredients))) {
      found.push({ key: rule.key, label: rule.label, icon: rule.icon, tone: rule.tone });
    }
  }
  return found;
}

/** Tone → Tailwind classes (kept here so they survive PurgeCSS). */
export const ALLERGEN_TONE_CLASSES: Record<AllergenInfo["tone"], string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  lime: "bg-lime-50 text-lime-700 border-lime-200",
  stone: "bg-stone-50 text-stone-700 border-stone-200",
};

/** Certification type → display metadata. */
export type CertificationMeta = {
  label: string;
  icon: string;
  tone: "emerald" | "indigo" | "amber" | "rose" | "blue" | "violet";
  description: string;
};

export const CERTIFICATION_META: Record<string, CertificationMeta> = {
  bio: { label: "Bio", icon: "🌱", tone: "emerald", description: "Agriculture biologique certifiée" },
  halal: { label: "Halal", icon: "清真", tone: "emerald", description: "Conforme aux exigences halal" },
  iso22000: { label: "ISO 22000", icon: "⚙️", tone: "indigo", description: "Sécurité des denrées alimentaires" },
  fda: { label: "FDA", icon: "🇺🇸", tone: "blue", description: "Conforme Food and Drug Administration" },
  haccp: { label: "HACCP", icon: "🛡️", tone: "amber", description: "Analyse des dangers — points critiques" },
  nsf: { label: "NSF", icon: "✅", tone: "violet", description: "Norme sanitaire NSF International" },
  cedeao: { label: "CEDEAO", icon: "🌍", tone: "rose", description: "Norme Communauté Économique des États de l'Afrique de l'Ouest" },
};

export const CERT_TONE_CLASSES: Record<CertificationMeta["tone"], string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

export function getCertificationMeta(type: string): CertificationMeta {
  return CERTIFICATION_META[type] ?? {
    label: type.toUpperCase(),
    icon: "📋",
    tone: "indigo",
    description: "Certification complémentaire",
  };
}

/** Format ISO date → "12 mars 2026" (fr-FR, long). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Format ISO date with time → "12 mars 2026, 14:30". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Format ISO date → relative ("il y a 3 jours", "dans 2 mois"). */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = target - now;
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  if (Math.abs(days) >= 30) {
    const months = Math.round(days / 30);
    return rtf.format(months, "month");
  }
  if (Math.abs(days) >= 1) return rtf.format(days, "day");
  const hours = Math.round(diff / (1000 * 60 * 60));
  return rtf.format(hours, "hour");
}

export function isExpired(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** Days remaining until expiration (negative = already expired). */
export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Tiny className combiner (filters falsy values). */
export function cn(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

/** Star row helper — returns an array of 5 booleans (filled or not). */
export function starArray(rating: number): boolean[] {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
}
