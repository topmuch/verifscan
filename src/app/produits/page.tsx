"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, PackageSearch, Filter, X } from "lucide-react";
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

export default function ProduitsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  return (
    <PublicShell>
      {/* Hero */}
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
            authentifié par son fabricant et dispose d'un QR code unique pour la traçabilité.
          </p>
        </div>
      </section>

      {/* Filters */}
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
                  // Debounce
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
            {(search || categoryId) && (
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

          {/* Category chips */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 vs-scroll">
            <button
              onClick={() => updateUrl({ categoryId: null })}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !categoryId
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Toutes
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => updateUrl({ categoryId: c.id })}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categoryId === c.id
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-500 mb-4">
          {loading ? "Chargement..." : `${total} produit${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              Essayez d'élargir votre recherche ou de changer de catégorie.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link key={p.id} href={`/produit/${p.id}`} className="group">
                <Card className="overflow-hidden vs-card-shadow border-emerald-100 transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full">
                  <div className="aspect-square bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center relative">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">{p.category?.icon || "📦"}</span>
                    )}
                    {p._count.lots > 0 && (
                      <Badge className="absolute top-2 right-2 bg-emerald-600 text-white text-xs">
                        {p._count.lots} lot{p._count.lots > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-1.5">
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                      {p.category?.icon} {p.category?.name}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{p.brand} · {p.weight}</p>
                    <p className="text-xs text-gray-400 truncate">par {p.user.companyName}</p>
                  </CardContent>
                </Card>
              </Link>
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
