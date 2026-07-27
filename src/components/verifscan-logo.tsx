import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * VerifScan logo component.
 *
 * Uses brand SVG assets under /public/ :
 *   - logo-light.svg  : version blanche pour fonds sombres (sidebar dashboard, header admin)
 *   - logo-color.svg  : version colorée pour fonds clairs (header public, footer)
 *   - logo-icon.svg   : icône bouclier seule (favicon, version compacte)
 *
 * SVGs are inline-rendered via <img> (no Next/Image optimization needed for SVG).
 * Aspect ratio : 280/80 = 3.5:1.
 *
 * The legacy public/logo.png (272×66) is kept for backward compat in metadata
 * (OG tags, manifest) but is NOT used by this component.
 */
export function VerifScanLogo({
  className,
  showText = true, // kept for backward compat — SVG already includes wordmark
  size = "md",
  variant = "color",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "color" | "light";
}) {
  // Size by height — SVG aspect ratio is 280/80 = 3.5:1
  const heights: Record<"sm" | "md" | "lg" | "xl", number> = {
    sm: 36,
    md: 44,
    lg: 56,
    xl: 72,
  };
  const h = heights[size];
  const w = Math.round(h * (280 / 80));

  const src = variant === "light" ? "/logo-light.svg" : "/logo-color.svg";

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center group transition-opacity hover:opacity-90",
        className
      )}
      aria-label="VerifScan - Accueil"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="VerifScan"
        width={w}
        height={h}
        className={cn(
          "h-auto w-auto transition-transform duration-300 group-hover:scale-[1.03]",
          variant === "light" && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        )}
        style={{ height: h, width: "auto" }}
      />
    </Link>
  );
}

/**
 * Compact icon-only logo (just the shield + checkmark, no wordmark).
 * Useful in mobile headers, favicons, narrow spaces.
 */
export function VerifScanIcon({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-icon.svg"
      alt="VerifScan"
      width={size}
      height={size}
      className={cn("transition-transform duration-300 hover:scale-[1.05]", className)}
      style={{ width: size, height: size }}
    />
  );
}
