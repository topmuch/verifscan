"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Leaf, Heart, Save } from "lucide-react";
import { toast } from "sonner";

export default function NutritionPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    energyKcal: "",
    fatG: "",
    saturatedFatG: "",
    carbsG: "",
    sugarsG: "",
    fiberG: "",
    proteinG: "",
    saltG: "",
    allergens: "",
    carbonFootprintKgCo2e: "",
    waterFootprintL: "",
    ingredientsList: "",
  });
  const [current, setCurrent] = useState<any>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.products || [];
        setProducts(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/products/nutrition?productId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        setCurrent(data.nutrition);
        if (data.nutrition) {
          setForm({
            energyKcal: data.nutrition.energyKcal ?? "",
            fatG: data.nutrition.fatG ?? "",
            saturatedFatG: data.nutrition.saturatedFatG ?? "",
            carbsG: data.nutrition.carbsG ?? "",
            sugarsG: data.nutrition.sugarsG ?? "",
            fiberG: data.nutrition.fiberG ?? "",
            proteinG: data.nutrition.proteinG ?? "",
            saltG: data.nutrition.saltG ?? "",
            allergens: data.nutrition.allergens ?? "",
            carbonFootprintKgCo2e: data.nutrition.carbonFootprintKgCo2e ?? "",
            waterFootprintL: data.nutrition.waterFootprintL ?? "",
            ingredientsList: data.nutrition.ingredientsList ?? "",
          });
        } else {
          setForm({
            energyKcal: "", fatG: "", saturatedFatG: "", carbsG: "", sugarsG: "",
            fiberG: "", proteinG: "", saltG: "", allergens: "",
            carbonFootprintKgCo2e: "", waterFootprintL: "", ingredientsList: "",
          });
        }
      });
  }, [selectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      // Convert empty strings to undefined
      const payload: any = { productId: selectedId, dataSource: "manual" };
      for (const [k, v] of Object.entries(form)) {
        if (v !== "" && v != null) {
          payload[k] = k === "allergens" || k === "ingredientsList" ? v : Number(v);
        }
      }
      const r = await fetch("/api/products/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (r.ok) {
        toast.success("Informations nutritionnelles enregistrées");
        setCurrent(data.nutrition);
      } else {
        toast.error(data.error || "Erreur");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#0f4382]" />
      </div>
    );
  }

  const numField = (label: string, key: string, suffix = "") => (
    <div>
      <label className="text-xs text-[#6B7280] font-medium block mb-1">{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          step="0.01"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
        {suffix && <span className="ml-2 text-xs text-[#6B7280]">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0f4382]">Nutrition & empreinte carbone</h1>
        <p className="text-[#6B7280] mt-2">
          Renseignez les valeurs nutritionnelles et l'impact environnemental de vos produits.
          Le Nutri-Score est calculé automatiquement.
        </p>
      </div>

      {/* Product selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Produit :</label>
        <select
          className="rounded-md border border-gray-200 px-3 py-2 flex-1"
          value={selectedId || ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {current?.nutriScore && (
          <Badge className="bg-emerald-100 text-emerald-700 uppercase">
            <Heart className="size-3 mr-1" />
            Nutri-Score {current.nutriScore.toUpperCase()}
          </Badge>
        )}
        {current?.ecoScore && (
          <Badge className="bg-blue-100 text-blue-700 uppercase">
            <Leaf className="size-3 mr-1" />
            Eco-Score {current.ecoScore.toUpperCase()}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0f4382] text-base">Valeurs nutritionnelles (pour 100g)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {numField("Énergie", "energyKcal", "kcal")}
            {numField("Matières grasses", "fatG", "g")}
            {numField("dont saturées", "saturatedFatG", "g")}
            {numField("Glucides", "carbsG", "g")}
            {numField("dont sucres", "sugarsG", "g")}
            {numField("Fibres", "fiberG", "g")}
            {numField("Protéines", "proteinG", "g")}
            {numField("Sel", "saltG", "g")}
            <div className="col-span-2">
              <label className="text-xs text-[#6B7280] font-medium block mb-1">Allergènes (séparés par virgules)</label>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="ex: gluten, lait, arachide"
                value={form.allergens}
                onChange={(e) => setForm({ ...form, allergens: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#6B7280] font-medium block mb-1">Liste des ingrédients</label>
              <textarea
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                rows={3}
                value={form.ingredientsList}
                onChange={(e) => setForm({ ...form, ingredientsList: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0f4382] text-base flex items-center gap-2">
              <Leaf className="size-4" />
              Impact environnemental
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {numField("Empreinte carbone", "carbonFootprintKgCo2e", "kg CO₂e / kg")}
            {numField("Empreinte eau", "waterFootprintL", "L / kg")}
            <div className="pt-4 border-t border-gray-100 text-xs text-[#6B7280]">
              L'Eco-Score est calculé automatiquement en fonction de l'empreinte carbone :
              <span className="block mt-1">
                A &lt; 0.5 · B &lt; 1.5 · C &lt; 3 · D &lt; 5 · E ≥ 5 kg CO₂e/kg
              </span>
            </div>
            <Button type="submit" disabled={saving} className="w-full mt-4">
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
