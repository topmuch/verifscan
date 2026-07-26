import Link from "next/link";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifScanLogo({
  className,
  showText = true,
  size = "md",
  variant = "color",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "color" | "light";
}) {
  const dim = size === "sm" ? 32 : size === "lg" ? 48 : size === "xl" ? 64 : 40;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : size === "xl" ? "text-3xl" : "text-xl";
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 group", className)}
      aria-label="VerifScan - Accueil"
    >
      <div
        className="rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3"
        style={{
          width: dim,
          height: dim,
          background:
            "linear-gradient(135deg, #2563EB 0%, #10B981 100%)",
        }}
      >
        <ScanLine
          className="text-white"
          style={{ width: dim * 0.55, height: dim * 0.55 }}
          strokeWidth={2.5}
        />
      </div>
      {showText && (
        <div className={cn("font-bold tracking-tight font-display", text)}>
          <span style={{ color: variant === "light" ? "#FFFFFF" : "#2563EB" }}>Verif</span>
          <span style={{ color: variant === "light" ? "#10B981" : "#10B981" }}>Scan</span>
        </div>
      )}
    </Link>
  );
}
