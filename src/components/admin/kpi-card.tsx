"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Building2,
  CreditCard,
  TrendingUp,
  Ticket,
  Package,
  Layers,
  QrCode,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Map of icon names → lucide-react components.
 *
 * Why this map exists:
 *   In Next.js 16 / React 19, you CANNOT pass a React component (such as a
 *   lucide-react icon) as a prop from a Server Component to a Client
 *   Component — the server-side serializer throws:
 *     "Functions cannot be passed directly to Client Components"
 *   because forward_ref components expose a `render` function which is not
 *   serializable.
 *
 *   To work around this, the server side passes the icon as a STRING (its
 *   name in this map), and the Client Component resolves the string back
 *   to the actual component via this lookup table.
 */
const ICONS: Record<string, LucideIcon> = {
  Building2,
  CreditCard,
  TrendingUp,
  Ticket,
  Package,
  Layers,
  QrCode,
  Eye,
};

export type KpiIconName = keyof typeof ICONS;

type KpiCardProps = {
  /** Name of the lucide-react icon to display (must exist in ICONS map above). */
  icon: KpiIconName;
  iconBg: string; // tailwind bg class
  iconColor: string; // tailwind text class
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: { value: string; direction: "up" | "down" };
  subtext?: string;
};

function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          let startTime: number | null = null;
          let raf: number;
          const tick = (t: number) => {
            if (startTime === null) startTime = t;
            const progress = Math.min((t - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) raf = requestAnimationFrame(tick);
            else setCount(end);
          };
          raf = requestAnimationFrame(tick);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, elRef };
}

export function KpiCard({
  icon: iconName,
  iconBg,
  iconColor,
  title,
  value,
  prefix = "",
  suffix = "",
  trend,
  subtext,
}: KpiCardProps) {
  const Icon = ICONS[iconName] ?? Building2; // safe fallback
  const numericValue = typeof value === "number" ? value : 0;
  const { count, elRef } = useCountUp(numericValue);
  const display = typeof value === "number"
    ? `${prefix}${count.toLocaleString("fr-FR")}${suffix}`
    : value;

  return (
    <div
      ref={elRef}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-6 vs-card-shadow transition-all hover:vs-card-shadow-hover"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "size-12 rounded-xl flex items-center justify-center",
            iconBg,
            iconColor
          )}
        >
          <Icon className="size-6" />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold",
              trend.direction === "up"
                ? "bg-[#DCFCE7] text-[#065F46]"
                : "bg-[#FEE2E2] text-[#991B1B]"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div className="font-mono text-2xl sm:text-3xl font-bold text-[#111827]">
        {display}
      </div>
      <div className="text-sm text-[#6B7280] mt-1">{title}</div>
      {subtext && (
        <div className="text-xs text-[#9CA3AF] mt-1">{subtext}</div>
      )}
    </div>
  );
}
