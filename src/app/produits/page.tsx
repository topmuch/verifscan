"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  PackageSearch,
  Filter,
  X,
  Flame,
  Eye,
  Sparkles,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

type Category = { id: string; name: string; icon: string | null };
type Product = {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  photoUrl: string | null;
  weight: string | null;
  category: { id: string; name: string; icon: string | null };
  user: { id: string; companyName: string };
  _count: { lots: number };
};

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

/* ============ Brand colors ============ */
const BLUE = "#0f4382";
const BLUE_LIGHT = "#E6EEF7";
const GREEN = "#2ebd5a";
const GREEN_DARK = "#1f8a42";
const GREEN_LIGHT = "#E0F5E6";
const ORANGE = "#F59E0B";
const ORANGE_LIGHT = "#FEF3C7";

/* Rotating palette for category cards */
const CATEGORY_PALETTES = [
  { bg: `linear-gradient(135deg, ${BLUE_LIGHT} 0%, #FFFFFF 100%)`, color: BLUE, ring: BLUE },
  { bg: `linear-gradient(135deg, ${GREEN_LIGHT} 0%, #FFFFFF 100%)`, color: GREEN_DARK, ring: GREEN },
  { bg: `linear-gradient(135deg, ${ORANGE_LIGHT} 0%, #FFFFFF 100%)`, color: "#92400E", ring: ORANGE },
  { bg: `linear-gradient(135deg, #FCE7F3 0%, #FFFFFF 100%)`, color: "#9D174D", ring: "#EC4899" },
  { bg: `linear-gradient(135deg, #DBEAFE 0%, #FFFFFF 100%)`, color: "#1E40AF", ring: "#3B82F6" },
  { bg: `linear-gradient(135deg, #D1FAE5 0%, #FFFFFF 100%)`, color: "#065F46", ring: "#10B981" },
  { bg: `linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 100%)`, color: "#92400E", ring: "#F59E0B" },
  { bg: `linear-gradient(135deg, #EDE9FE 0%, #FFFFFF 100%)`, color: "#5B21B6", ring: "#8B5CF6" },
];

export default function ProduitsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProduitsPageInner />
    </Suspense>
  );
}

function ProduitsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("page", String(page));
    params.set("limit", "20");

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [search, categoryId, page]);

  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const res = await fetch("/api/products/featured?limit=8");
      const data = await res.json();
      setFeatured(data.items || []);
    } catch {
      setFeatured([]);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchFeatured();
  }, [fetchCategories, fetchFeatured]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    if (updates.search !== undefined || updates.categoryId !== undefined) {
      params.delete("page");
    }
    router.push(`/produits?${params.toString()}`);
  };

  const isFiltered = Boolean(search || categoryId);

  return (
    <PublicShell>
      {/* ============ HERO ============ */}
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <PackageSearch className="size-3 mr-1" />
            Répertoire produits
          </Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Découvrez les produits authentiques
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Parcourez le répertoire des produits tracés par VerifScan. Chaque produit est
            authentifié par son fabricant et dispose d&apos;un QR code unique pour la traçabilité.
          </p>
        </div>
      </section>

      {/* ============ À LA UNE — Featured products (most scanned) ============ */}
      {!isFiltered && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="flex-shrink-0 size-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: ORANGE }}
            >
              <Flame className="size-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900 leading-tight">
                À la une
              </h2>
              <p className="text-xs text-gray-500">
                Les produits les plus scannés par les consommateurs
              </p>
            </div>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-sm text-gray-400 italic">Aucun produit à la une pour le moment.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => (
                <FeaturedCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============ CATÉGORIES EN IMAGES ============ */}
      {!isFiltered && (
        <section className="border-t border-emerald-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="flex-shrink-0 size-9 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: BLUE }}
              >
                <Sparkles className="size-5 text-white" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900 leading-tight">
                  Parcourir par catégorie
                </h2>
                <p className="text-xs text-gray-500">
                  Sélectionnez une catégorie pour filtrer le catalogue
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.map((c, i) => {
                const palette = CATEGORY_PALETTES[i % CATEGORY_PALETTES.length];
                const isActive = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => updateUrl({ categoryId: c.id })}
                    className="group relative rounded-2xl overflow-hidden vs-card-shadow transition-all hover:-translate-y-1 hover:vs-card-shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      background: palette.bg,
                      boxShadow: isActive ? `0 0 0 3px ${palette.ring}` : undefined,
                    }}
                    aria-label={`Filtrer par ${c.name}`}
                  >
                    <div className="aspect-square flex flex-col items-center justify-center p-3">
                      <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                        {c.icon || "📦"}
                      </span>
                      <span
                        className="text-xs font-semibold text-center leading-tight line-clamp-2"
                        style={{ color: palette.color }}
                      >
                        {c.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ FILTRES ============ */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, marque..."
                className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                defaultValue={search}
                onChange={(e) => {
                  const v = e.target.value;
                  clearTimeout((window as any).__searchTimer);
                  (window as any).__searchTimer = setTimeout(() => {
                    updateUrl({ search: v || null });
                  }, 350);
                }}
              />
            </div>
            <Select
              value={categoryId || "all"}
              onValueChange={(v) => updateUrl({ categoryId: v === "all" ? null : v })}
            >
              <SelectTrigger className="w-full sm:w-64 border-emerald-200">
                <Filter className="size-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={() => updateUrl({ search: null, categoryId: null })}
                className="text-gray-500"
              >
                <X className="size-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ============ CATALOGUE — Grille de cards 300×300 ============ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-2xl font-bold text-gray-900">
            {isFiltered ? "Résultats" : "Tous les produits"}
          </h2>
          <p className="text-sm text-gray-500">
            {loading ? "Chargement..." : `${total} produit${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <PackageSearch className="mx-auto size-12 text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-900">Aucun produit trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez d&apos;élargir votre recherche ou de changer de catégorie.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/produits?${new URLSearchParams({
                        ...(search && { search }),
                        ...(categoryId && { categoryId }),
                        page: String(page - 1),
                      }).toString()}`}
                    />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href={`/produits?${new URLSearchParams({
                        ...(search && { search }),
                        ...(categoryId && { categoryId }),
                        page: String(i + 1),
                      }).toString()}`}
                      isActive={page === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href={`/produits?${new URLSearchParams({
                        ...(search && { search }),
                        ...(categoryId && { categoryId }),
                        page: String(page + 1),
                      }).toString()}`}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>
    </PublicShell>
  );
}

/* ============ Product Card 300×300 ============ */
function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/produit/${product.id}`} className="group block">
      <Card className="overflow-hidden vs-card-shadow border-emerald-100 transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full">
        {/* 300×300 image area */}
        <div
          className="aspect-square flex items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${GREEN_LIGHT} 0%, ${BLUE_LIGHT} 100%)`,
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
            <span className="text-6xl">{product.category?.icon || "📦"}</span>
          )}
          {product._count.lots > 0 && (
            <Badge className="absolute top-2 right-2 text-white text-xs" style={{ backgroundColor: GREEN }}>
              {product._count.lots} lot{product._count.lots > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
            {product.category?.icon} {product.category?.name}
          </Badge>
          <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
          <p className="text-xs text-gray-500 truncate">
            {product.brand}
            {product.weight ? ` · ${product.weight}` : ""}
          </p>
          <p className="text-[11px] text-gray-400 truncate">par {product.user.companyName}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ============ Featured Card 300×300 (with scan count badge) ============ */
function FeaturedCard({ product }: { product: FeaturedProduct }) {
  return (
    <Link href={`/produit/${product.id}`} className="group block">
      <Card
        className="overflow-hidden vs-card-shadow border-amber-200 transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full relative"
        style={{ borderWidth: "2px" }}
      >
        {/* "À la une" badge */}
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-md flex items-center gap-1"
          style={{ backgroundColor: ORANGE }}
        >
          <Flame className="size-2.5" />
          À la une
        </div>

        {/* Scan count badge */}
        {product.scanCount > 0 && (
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-white/95 text-gray-700 text-[10px] font-semibold shadow-md flex items-center gap-1">
            <Eye className="size-2.5 text-blue-600" />
            {product.scanCount} scan{product.scanCount > 1 ? "s" : ""}
          </div>
        )}

        {/* 300×300 image area */}
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
            <span className="text-6xl">{product.category?.icon || "📦"}</span>
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
