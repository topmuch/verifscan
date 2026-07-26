"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FlaskConical, Pause, Play } from "lucide-react";
import { toast } from "sonner";

export default function ABTestsPage() {
  const [variants, setVariants] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ productId: "", name: "", description: "" });

  const load = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        fetch("/api/ab-tests"),
        fetch("/api/products"),
      ]);
      const v = await vRes.json();
      const p = await pRes.json();
      setVariants(v.variants || []);
      setProducts(Array.isArray(p) ? p : p.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.name) {
      toast.error("Produit et nom requis");
      return;
    }
    const r = await fetch("/api/ab-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await r.json();
    if (r.ok) {
      toast.success("Variante créée");
      setShowForm(false);
      setFormData({ productId: "", name: "", description: "" });
      load();
    } else {
      toast.error(data.error || "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#0f4382]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0f4382]">A/B Testing d'emballage</h1>
          <p className="text-[#6B7280] mt-2">Testez différents designs d'emballage et mesurez celui qui génère le plus de scans.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4 mr-2" />
          Nouvelle variante
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0f4382]">Créer une variante</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Produit</label>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                >
                  <option value="">— Sélectionner —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Nom de la variante</label>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  placeholder="ex: Design A — Rouge"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description (optionnel)</label>
                <textarea
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  rows={3}
                  placeholder="Notes internes sur ce design..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Créer</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {variants.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <FlaskConical className="size-12 text-gray-300 mx-auto" />
            <p className="text-[#6B7280]">Aucune variante pour le moment.</p>
            <p className="text-sm text-gray-400">Créez votre première variante pour comparer l'impact de différents emballages sur les scans.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {variants.map((v) => (
            <Card key={v.id}>
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-[#0f4382]">{v.name}</h3>
                    <Badge variant="outline" className={
                      v.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      v.status === "draft" ? "bg-gray-50 text-gray-700 border-gray-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }>
                      {v.status}
                    </Badge>
                  </div>
                  {v.description && <p className="text-sm text-[#6B7280] mt-1">{v.description}</p>}
                  <div className="flex gap-6 mt-3 text-sm">
                    <div>
                      <span className="text-[#6B7280]">Scans : </span>
                      <span className="font-semibold text-[#0f4382]">{v.scansCount}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Conversions : </span>
                      <span className="font-semibold text-[#2ebd5a]">{v.conversionCount}</span>
                    </div>
                    {v.startDate && (
                      <div className="text-[#6B7280]">
                        Depuis le {new Date(v.startDate).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {v.status === "active" ? (
                    <Button size="sm" variant="outline">
                      <Pause className="size-4 mr-1" /> Pause
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Play className="size-4 mr-1" /> Activer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
