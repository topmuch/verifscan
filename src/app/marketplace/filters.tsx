"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

type Category = { id: string; name: string };

export function MarketplaceFilters({
  categories,
  currentFilters,
}: {
  categories: Category[];
  currentFilters: {
    categoryId?: string;
    search?: string;
    certification?: string;
    region?: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentFilters.search || "");

  function update(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/marketplace?${params.toString()}`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    update("search", search || undefined);
  }

  const certOptions = [
    { value: "halal", label: "Halal" },
    { value: "bio", label: "Bio" },
    { value: "iso22000", label: "ISO 22000" },
    { value: "haccp", label: "HACCP" },
    { value: "cedeao", label: "CEDEAO" },
  ];

  const regions = ["Dakar", "Thiès", "Saint-Louis", "Casamance", "Abidjan", "Bamako"];

  return (
    <div className="bg-white border border-orange-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Filter className="size-4 text-orange-500" />
        Filtres avancés
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit, une marque..."
            className="pl-8"
          />
        </div>
        <Button type="submit" size="default">Rechercher</Button>
        {(currentFilters.categoryId || currentFilters.certification || currentFilters.region || currentFilters.search) && (
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={() => router.push("/marketplace")}
          >
            <X className="size-4" />
          </Button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <select
          value={currentFilters.categoryId || ""}
          onChange={(e) => update("categoryId", e.target.value || undefined)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={currentFilters.certification || ""}
          onChange={(e) => update("certification", e.target.value || undefined)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
        >
          <option value="">Toutes certifications</option>
          {certOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={currentFilters.region || ""}
          onChange={(e) => update("region", e.target.value || undefined)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white"
        >
          <option value="">Toutes régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
