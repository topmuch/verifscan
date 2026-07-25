"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, QrCode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Product = { id: string; name: string; brand: string };

const COUNTRIES = [
  "Sénégal",
  "Mali",
  "Côte d'Ivoire",
  "Guinée",
  "Burkina Faso",
  "Niger",
  "Togo",
  "Bénin",
  "Gambie",
  "Mauritanie",
  "Ghana",
  "Nigeria",
  "Cameroun",
];

export default function NouveauLotPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productId: "",
    lotNumber: "",
    manufacturingDate: "",
    expirationDate: "",
    ingredients: "",
    manufacturingLocation: "",
    transformationLocation: "",
    selectedCountries: [] as string[],
    status: "active" as "active" | "recalled",
  });

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((data) => setProducts(data.items || []))
      .catch(() => toast.error("Erreur de chargement des produits"));
  }, []);

  function toggleCountry(c: string) {
    setForm((f) => ({
      ...f,
      selectedCountries: f.selectedCountries.includes(c)
        ? f.selectedCountries.filter((x) => x !== c)
        : [...f.selectedCountries, c],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.selectedCountries.length === 0) {
      setError("Sélectionnez au moins un pays de vente");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        salesCountries: form.selectedCountries.join(", "),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erreur lors de la création");
      return;
    }
    toast.success("Lot créé et QR code généré !");
    router.push("/dashboard/qr-codes");
    router.refresh();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 text-gray-500">
        <Link href="/dashboard/lots">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux lots
        </Link>
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nouveau lot</h1>
      <p className="mt-1 text-gray-600">
        Créez un lot de production et générez automatiquement son QR code de traçabilité.
      </p>

      {products.length === 0 ? (
        <Card className="mt-6 vs-card-shadow border-amber-200 bg-amber-50/50">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-amber-900">
              Vous devez d'abord créer un produit avant de pouvoir créer un lot.
            </p>
            <Button asChild className="mt-3 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/produits/nouveau">Créer un produit</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 vs-card-shadow border-emerald-100">
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="size-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Produit *</Label>
                <Select
                  value={form.productId}
                  onValueChange={(v) => setForm({ ...form, productId: v })}
                  required
                >
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue placeholder="Choisir un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lotNumber">Numéro de lot (optionnel)</Label>
                <Input
                  id="lotNumber"
                  placeholder="Auto-généré si vide"
                  value={form.lotNumber}
                  onChange={(e) => setForm({ ...form, lotNumber: e.target.value })}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">
                  Format suggéré : LOT-AAAAMMJJ-XXXX. Si vide, un numéro unique sera généré.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturingDate">Date de fabrication *</Label>
                  <Input
                    id="manufacturingDate"
                    type="date"
                    value={form.manufacturingDate}
                    onChange={(e) => setForm({ ...form, manufacturingDate: e.target.value })}
                    required
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Date de péremption *</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                    required
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingredients">Ingrédients</Label>
                <Textarea
                  id="ingredients"
                  placeholder="Hibiscus (60%), eau, sucre de canne, citron..."
                  rows={3}
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  className="border-emerald-200 focus-visible:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturingLocation">Lieu de fabrication</Label>
                  <Input
                    id="manufacturingLocation"
                    placeholder="Zone Industrielle, Dakar"
                    value={form.manufacturingLocation}
                    onChange={(e) => setForm({ ...form, manufacturingLocation: e.target.value })}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transformationLocation">Lieu de transformation</Label>
                  <Input
                    id="transformationLocation"
                    placeholder="Atelier Sarine Bio, Dakar"
                    value={form.transformationLocation}
                    onChange={(e) => setForm({ ...form, transformationLocation: e.target.value })}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pays de vente *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 max-h-44 overflow-y-auto vs-scroll">
                  {COUNTRIES.map((c) => (
                    <label
                      key={c}
                      className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-emerald-50 rounded p-1"
                    >
                      <Checkbox
                        checked={form.selectedCountries.includes(c)}
                        onCheckedChange={() => toggleCountry(c)}
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {form.selectedCountries.length} pays sélectionné{form.selectedCountries.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2 text-sm text-emerald-800">
                <Sparkles className="size-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">QR code automatique</p>
                  <p className="text-xs">
                    Un QR code unique sera généré automatiquement pour ce lot à la création.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <QrCode className="mr-2 size-4" />
                  {loading ? "Création..." : "Créer le lot & générer le QR code"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/dashboard/lots">Annuler</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
