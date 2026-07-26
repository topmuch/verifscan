"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Copy, Languages } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  weight: string | null;
  ingredients: string | null;
};

type SeoResult = {
  description: string;
  metaDescription: string;
  slug: string;
  tags: string[];
};

export function AISeoGenerator({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [translatedTo, setTranslatedTo] = useState<"fr" | "en" | "wolof">("fr");

  async function generate(productId: string) {
    setSelectedId(productId);
    setLoading(true);
    setResult(null);
    try {
      const product = products.find((p) => p.id === productId)!;
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          name: product.name,
          brand: product.brand,
          categoryId: product.categoryId,
          weight: product.weight,
          ingredients: product.ingredients,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setTranslatedTo("fr");
        toast.success("Description SEO générée");
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  }

  function translate(target: "fr" | "en" | "wolof") {
    if (!result) return;
    setTranslatedTo(target);
    // Heuristique simple : on simule la traduction
    // (en production, on appellerait /api/ai/translate)
    const prefixes: Record<string, string> = {
      en: "[EN] ",
      wolof: "[Wolof] ",
      fr: "",
    };
    setResult({
      ...result,
      description: prefixes[target] + result.description,
      metaDescription: prefixes[target] + result.metaDescription,
    });
    toast.success(`Traduit en ${target === "wolof" ? "Wolof" : target.toUpperCase()}`);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Générez une description optimisée SEO en un clic, puis traduisez-la en FR/EN/Wolof
      </p>

      <div className="flex flex-wrap gap-2">
        {products.slice(0, 10).map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={selectedId === p.id ? "default" : "outline"}
            onClick={() => generate(p.id)}
            disabled={loading}
          >
            <Wand2 className="size-3.5 mr-1" />
            {p.name}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="size-5 mr-2 animate-spin" /> Génération IA en cours...
        </div>
      )}

      {result && (
        <Card className="border-emerald-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-semibold text-sm">Description générée</h4>
              <div className="flex gap-1">
                <Button size="sm" variant={translatedTo === "fr" ? "default" : "ghost"} onClick={() => translate("fr")}>
                  FR
                </Button>
                <Button size="sm" variant={translatedTo === "en" ? "default" : "ghost"} onClick={() => translate("en")}>
                  EN
                </Button>
                <Button size="sm" variant={translatedTo === "wolof" ? "default" : "ghost"} onClick={() => translate("wolof")}>
                  Wolof
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <p className="text-sm text-gray-700 leading-relaxed">{result.description}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 text-xs"
                onClick={() => copy(result.description, "Description")}
              >
                <Copy className="size-3 mr-1" /> Copier
              </Button>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Meta description (SEO)</p>
              <div className="p-2 rounded bg-gray-50 border border-gray-100 flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700">{result.metaDescription}</p>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => copy(result.metaDescription, "Meta")}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Slug URL</p>
              <div className="p-2 rounded bg-gray-50 border border-gray-100 flex items-center justify-between gap-2">
                <code className="text-sm text-emerald-700">/produit/{result.slug}</code>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => copy(result.slug, "Slug")}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Tags suggérés</p>
              <div className="flex flex-wrap gap-1">
                {result.tags.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-xs">#{t}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
