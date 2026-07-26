"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type FeaturedProduct = {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  photoUrl: string | null;
  weight: string | null;
  createdAt: string;
  scanCount: number;
  category: { id: string; name: string; icon: string | null };
  user: { id: string; companyName: string | null; logoUrl: string | null };
};

const GREEN = "#2ebd5a";
const GREEN_LIGHT = "#E0F5E6";
const BLUE_LIGHT = "#E6EEF7";
const ORANGE = "#F59E0B";
const ORANGE_LIGHT = "#FEF3C7";

type MarqueeProps = {
  /** Override the title shown above the marquee. Default: "À la une" */
  title?: string;
  /** Override the subtitle. */
  subtitle?: string;
  /** Animation direction. */
  reverse?: boolean;
  /** Animation speed. */
  speed?: "slow" | "normal" | "fast";
  /** Max number of items to display (default 12). */
  limit?: number;
  /** Hide the section heading row (useful when embedding). */
  hideHeading?: boolean;
  /** Background variant. */
  variant?: "default" | "muted";
};

export function FeaturedMarquee({
  title = "À la une",
  subtitle = "Les produits les plus scannés par les consommateurs",
  reverse = false,
  speed = "normal",
  limit = 12,
  hideHeading = false,
  variant = "default",
}: MarqueeProps) {
  const [items, setItems] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/featured?limit=${limit}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setItems(data.items || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (!loading && items.length === 0) return null;

  // Duplicate the items array to create a seamless infinite loop.
  const loop = [...items, ...items];

  const speedClass =
    speed === "fast" ? "vs-marquee-fast" : speed === "slow" ? "vs-marquee-slow" : "";

  return (
    <section
      className={
        variant === "muted"
          ? "border-y border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white"
          : ""
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {!hideHeading && (
          <div className="flex items-center gap-2 mb-5">
            <div
              className="flex-shrink-0 size-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: ORANGE }}
            >
              <Flame className="size-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 leading-tight">
                {title}
              </h2>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="vs-marquee relative overflow-hidden">
            {/* Edge fade mask */}
            <div
              className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, white 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to left, white 0%, rgba(255,255,255,0) 100%)",
              }}
            />

            <div
              className={`vs-marquee-track ${reverse ? "vs-marquee-reverse" : ""} ${speedClass}`}
              style={{ gap: "1rem" }}
            >
              {loop.map((p, i) => (
                <FeaturedMarqueeCard key={`${p.id}-${i}`} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedMarqueeCard({ product }: { product: FeaturedProduct }) {
  return (
    <Link
      href={`/produit/${product.id}`}
      className="group block flex-shrink-0"
      style={{ width: 240 }}
    >
      <Card
        className="overflow-hidden vs-card-shadow border-amber-200 transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full relative"
        style={{ borderWidth: "2px" }}
      >
        <div
          className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-md flex items-center gap-1"
          style={{ backgroundColor: ORANGE }}
        >
          <Flame className="size-2.5" />
          À la une
        </div>

        {product.scanCount > 0 && (
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-white/95 text-gray-700 text-[10px] font-semibold shadow-md flex items-center gap-1">
            <Eye className="size-2.5 text-blue-600" />
            {product.scanCount}
          </div>
        )}

        <div
          className="aspect-square flex items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${ORANGE_LIGHT} 0%, ${GREEN_LIGHT} 100%)`,
          }}
        >
          {product.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.photoUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <span className="text-5xl">{product.category?.icon || "📦"}</span>
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700">
            {product.category?.icon} {product.category?.name}
          </Badge>
          <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
          <p className="text-xs text-gray-500 truncate">
            {product.brand}
            {product.weight ? ` · ${product.weight}` : ""}
          </p>
          <p className="text-[11px] text-gray-400 truncate">
            par {product.user.companyName ?? "Fabricant"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
