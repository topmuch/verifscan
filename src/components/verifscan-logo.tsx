import Link from "next/link";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifScanLogo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <div
        className="rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
        style={{
          width: dim,
          height: dim,
          background:
            "linear-gradient(135deg, #059669 0%, #10b981 50%, #d97706 100%)",
        }}
      >
        <ScanLine className="text-white" style={{ width: dim * 0.6, height: dim * 0.6 }} />
      </div>
      {showText && (
        <div className={cn("font-bold tracking-tight", text)}>
          <span className="text-emerald-700">Verif</span>
          <span className="text-amber-600">Scan</span>
        </div>
      )}
    </Link>
  );
}
