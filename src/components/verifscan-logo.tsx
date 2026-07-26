import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * VerifScan logo component.
 *
 * Uses the brand PNG asset at `/public/logo.png` (272×66, transparent background,
 * already contains the "VerifScan" wordmark in the brand palette #0f4382 + #2ebd5a).
 *
 * Because the wordmark is baked into the image, the `showText` prop is kept only
 * for API backward-compatibility and has no visual effect.
 */
export function VerifScanLogo({
  className,
  showText = true, // kept for backward compat — wordmark is part of the image
  size = "md",
  variant = "color",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "color" | "light";
}) {
  // Size by height — logo aspect ratio is ~4.12:1 (272×66)
  const heights: Record<"sm" | "md" | "lg" | "xl", number> = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  };
  const h = heights[size];
  const w = Math.round(h * (272 / 66));

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center group transition-opacity hover:opacity-90",
        className
      )}
      aria-label="VerifScan - Accueil"
    >
      <Image
        src="/logo.png"
        alt="VerifScan"
        width={w}
        height={h}
        priority
        className={cn(
          "h-auto w-auto transition-transform duration-300 group-hover:scale-[1.03]",
          variant === "light" && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        )}
        style={{ height: h, width: "auto" }}
      />
    </Link>
  );
}
