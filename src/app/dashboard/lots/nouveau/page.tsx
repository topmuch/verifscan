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

type Product = {
  id: string;
  name: string;
  brand: string;
  category?: { pageTemplate?: string };
};

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
    // Champs export_produce
    harvestDate: "",
    packagingDate: "",
    packagingStation: "",
    containerNumber: "",
    palletNumber: "",
    shipDate: "",
    destination: "",
    carrier: "",
    caliber: "",
    avgWeightGram: "",
    brix: "",
    storageTempC: "",
    shelfLifeDays: "",
  });

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((data) => setProducts(data.items || []))
      .catch(() => toast.error("Erreur de chargement des produits"));
  }, []);

  // Détecte si le produit sélectionné est dans une catégorie export_produce
  const selectedProduct = products.find((p) => p.id === form.productId);
  const isExportProduce = selectedProduct?.category?.pageTemplate === "export_produce";

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
        productId: form.productId,
        lotNumber: form.lotNumber,
        manufacturingDate: form.manufacturingDate,
        expirationDate: form.expirationDate,
        ingredients: form.ingredients,
        manufacturingLocation: form.manufacturingLocation,
        transformationLocation: form.transformationLocation,
        salesCountries: form.selectedCountries.join(", "),
        status: form.status,
        // Champs export_produce (envoyés seulement si pertinent)
        ...(isExportProduce
          ? {
              harvestDate: form.harvestDate || undefined,
              packagingDate: form.packagingDate || undefined,
              packagingStation: form.packagingStation || undefined,
              containerNumber: form.containerNumber || undefined,
              palletNumber: form.palletNumber || undefined,
              shipDate: form.shipDate || undefined,
              destination: form.destination || undefined,
              carrier: form.carrier || undefined,
              caliber: form.caliber || undefined,
              avgWeightGram: form.avgWeightGram ? Number(form.avgWeightGram) : undefined,
              brix: form.brix ? Number(form.brix) : undefined,
              storageTempC: form.storageTempC ? Number(form.storageTempC) : undefined,
              shelfLifeDays: form.shelfLifeDays ? Number(form.shelfLifeDays) : undefined,
            }
          : {}),
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

              {/* === CHAMPS SPÉCIFIQUES EXPORT (affichés seulement pour les catégories export_produce) === */}
              {isExportProduce && (
                <div className="space-y-4 mt-4 pt-4 border-t-2 border-dashed border-blue-200">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
                    <p className="font-semibold">🚢 Informations d'export</p>
                    <p className="text-xs mt-0.5">
                      Ce produit est dans une catégorie d'export. Les champs ci-dessous
                      apparaîtront sur la page produit publique (template export).
                    </p>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-700">📅 Récolte & Conditionnement</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="harvestDate">Date de récolte</Label>
                      <Input
                        id="harvestDate"
                        type="date"
                        value={form.harvestDate}
                        onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="packagingDate">Date de conditionnement</Label>
                      <Input
                        id="packagingDate"
                        type="date"
                        value={form.packagingDate}
                        onChange={(e) => setForm({ ...form, packagingDate: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="packagingStation">Station de conditionnement</Label>
                    <Input
                      id="packagingStation"
                      placeholder="Station COSEM Richard-Toll"
                      value={form.packagingStation}
                      onChange={(e) => setForm({ ...form, packagingStation: e.target.value })}
                      className="border-blue-200 focus-visible:ring-blue-500"
                    />
                  </div>

                  <h3 className="text-sm font-semibold text-gray-700 pt-2">📦 Logistique</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="containerNumber">N° de conteneur</Label>
                      <Input
                        id="containerNumber"
                        placeholder="CMAU-4455667"
                        value={form.containerNumber}
                        onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="palletNumber">N° de palette(s)</Label>
                      <Input
                        id="palletNumber"
                        placeholder="PLT-001 à PLT-020"
                        value={form.palletNumber}
                        onChange={(e) => setForm({ ...form, palletNumber: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="shipDate">Date d'expédition</Label>
                      <Input
                        id="shipDate"
                        type="date"
                        value={form.shipDate}
                        onChange={(e) => setForm({ ...form, shipDate: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="destination">Destination</Label>
                      <Input
                        id="destination"
                        placeholder="Le Havre, France"
                        value={form.destination}
                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="carrier">Transporteur</Label>
                    <Input
                      id="carrier"
                      placeholder="Maersk Line"
                      value={form.carrier}
                      onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                      className="border-blue-200 focus-visible:ring-blue-500"
                    />
                  </div>

                  <h3 className="text-sm font-semibold text-gray-700 pt-2">🧪 Contrôle qualité</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="caliber">Calibre</Label>
                      <Input
                        id="caliber"
                        placeholder="Calibre A (5-6 fruits / carton)"
                        value={form.caliber}
                        onChange={(e) => setForm({ ...form, caliber: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="avgWeightGram">Poids moyen (g)</Label>
                      <Input
                        id="avgWeightGram"
                        type="number"
                        min="0"
                        placeholder="580"
                        value={form.avgWeightGram}
                        onChange={(e) => setForm({ ...form, avgWeightGram: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="brix">Taux de sucre (°Brix)</Label>
                      <Input
                        id="brix"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="14.5"
                        value={form.brix}
                        onChange={(e) => setForm({ ...form, brix: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="storageTempC">Temp. conservation (°C)</Label>
                      <Input
                        id="storageTempC"
                        type="number"
                        step="0.1"
                        placeholder="8.5"
                        value={form.storageTempC}
                        onChange={(e) => setForm({ ...form, storageTempC: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="shelfLifeDays">Durée conservation (j)</Label>
                      <Input
                        id="shelfLifeDays"
                        type="number"
                        min="0"
                        placeholder="21"
                        value={form.shelfLifeDays}
                        onChange={(e) => setForm({ ...form, shelfLifeDays: e.target.value })}
                        className="border-blue-200 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

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
