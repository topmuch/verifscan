"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Upload, Loader2, Image as ImageIcon } from "lucide-react";
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

type Category = { id: string; name: string; icon: string | null; pageTemplate?: string };

export default function NouveauProduitPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    photoUrl: "",
    weight: "",
    categoryId: "",
    isVisible: true,
    // Code-barres produit (EAN-13, UPC-A...)
    barcode: "",
    // Champs export_produce
    variety: "",
    regionOfProduction: "",
    producerStory: "",
    producerPhotoUrl: "",
    gpsLat: "",
    gpsLng: "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => toast.error("Impossible de charger les catégories"));
  }, []);

  // Détecte si la catégorie sélectionnée utilise le template export_produce
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const isExportProduce = selectedCategory?.pageTemplate === "export_produce";

  async function uploadProducerPhoto(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 MB)");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      setForm((f) => ({ ...f, producerPhotoUrl: data.url }));
      toast.success("Photo producteur téléversée !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du téléversement");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const producerPhotoInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadPhoto(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 MB)");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      setForm((f) => ({ ...f, photoUrl: data.url }));
      toast.success("Photo téléversée !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du téléversement");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        brand: form.brand,
        description: form.description,
        photoUrl: form.photoUrl,
        weight: form.weight,
        categoryId: form.categoryId,
        isVisible: form.isVisible,
        barcode: form.barcode || undefined,
        // Champs export_produce (envoyés seulement si pertinent)
        ...(isExportProduce
          ? {
              variety: form.variety || undefined,
              regionOfProduction: form.regionOfProduction || undefined,
              producerStory: form.producerStory || undefined,
              producerPhotoUrl: form.producerPhotoUrl || undefined,
              gpsLat: form.gpsLat ? Number(form.gpsLat) : undefined,
              gpsLng: form.gpsLng ? Number(form.gpsLng) : undefined,
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
    toast.success("Produit créé avec succès !");
    router.push("/dashboard/produits");
    router.refresh();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 text-gray-500">
        <Link href="/dashboard/produits">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux produits
        </Link>
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nouveau produit</h1>
      <p className="mt-1 text-gray-600">
        Renseignez les informations de votre produit. Vous pourrez créer des lots et QR codes ensuite.
      </p>

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
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                placeholder="Jus de Bissap Bio"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="border-emerald-200 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marque *</Label>
                <Input
                  id="brand"
                  placeholder="Sarine Bio"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  required
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Poids / Contenance</Label>
                <Input
                  id="weight"
                  placeholder="500ml, 1kg, 200g..."
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Code-barres (EAN / UPC)</Label>
                <Input
                  id="barcode"
                  placeholder="Ex : 6112345678905 (EAN-13)"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="border-emerald-200 focus-visible:ring-emerald-500 font-mono"
                />
                <p className="text-xs text-gray-500">
                  Affiché à côté du QR code sur la page produit. Optionnel.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
                required
              >
                <SelectTrigger className="border-emerald-200">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* === Photo upload === */}
            <div className="space-y-2">
              <Label>Photo du produit</Label>
              <div className="flex items-start gap-4">
                <div className="size-24 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photoUrl}
                      alt="Aperçu produit"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-8 text-emerald-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">
                    Téléversez une photo de votre produit. Formats : JPG, PNG, WebP (max 5 MB).
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Téléversement...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 size-4" />
                          Téléverser
                        </>
                      )}
                    </Button>
                    {form.photoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setForm({ ...form, photoUrl: "" })}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Retirer
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              {/* Champ URL optionnel — visible mais secondaire */}
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Ou coller une URL d&apos;image externe
                </summary>
                <Input
                  type="url"
                  placeholder="https://exemple.com/photo.jpg"
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  className="mt-2 border-emerald-200 focus-visible:ring-emerald-500"
                />
              </details>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre produit : ingrédients principaux, qualités, histoire..."
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border-emerald-200 focus-visible:ring-emerald-500 resize-none"
              />
            </div>

            {/* === CHAMPS SPÉCIFIQUES EXPORT (affichés seulement pour les catégories export_produce) === */}
            {isExportProduce && (
              <div className="space-y-4 mt-2 pt-4 border-t-2 border-dashed border-blue-200">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
                  <p className="font-semibold">🚢 Produit d&apos;export</p>
                  <p className="text-xs mt-0.5">
                    Cette catégorie utilise un template de page produit spécialisé export.
                    Les champs ci-dessous apparaîtront sur la page publique scannée par QR code.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="variety">Variété</Label>
                    <Input
                      id="variety"
                      placeholder="Kent, Keitt, Brooks..."
                      value={form.variety}
                      onChange={(e) => setForm({ ...form, variety: e.target.value })}
                      className="border-blue-200 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="regionOfProduction">Région de production</Label>
                    <Input
                      id="regionOfProduction"
                      placeholder="Casamance, Vallée du fleuve, Niayes..."
                      value={form.regionOfProduction}
                      onChange={(e) => setForm({ ...form, regionOfProduction: e.target.value })}
                      className="border-blue-200 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="producerStory">Histoire / Présentation du producteur</Label>
                  <Textarea
                    id="producerStory"
                    placeholder="Notre exploitation familiale de 45 hectares cultive la mangue Kent depuis 3 générations..."
                    rows={4}
                    value={form.producerStory}
                    onChange={(e) => setForm({ ...form, producerStory: e.target.value })}
                    className="border-blue-200 focus-visible:ring-blue-500 resize-none"
                  />
                </div>

                {/* === Photo producteur / verger === */}
                <div className="space-y-1">
                  <Label>Photo du producteur / verger</Label>
                  <div className="flex items-start gap-4">
                    <div className="size-24 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {form.producerPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.producerPhotoUrl}
                          alt="Aperçu producteur"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="size-8 text-blue-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">
                        Photo du producteur, du verger ou de l&apos;atelier. Affichée sur la page produit.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingPhoto}
                          onClick={() => producerPhotoInputRef.current?.click()}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Téléversement...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 size-4" />
                              Téléverser
                            </>
                          )}
                        </Button>
                        {form.producerPhotoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setForm({ ...form, producerPhotoUrl: "" })}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Retirer
                          </Button>
                        )}
                      </div>
                      <input
                        ref={producerPhotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadProducerPhoto(f);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* === Coordonnées GPS du verger / station === */}
                <div className="space-y-1">
                  <Label>Localisation GPS (optionnel)</Label>
                  <p className="text-xs text-gray-500">
                    Coordonnées du verger, de la ferme ou de la station de conditionnement.
                    Affichées sur une carte Google Maps sur la page produit.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude (ex: 16.4647)"
                      value={form.gpsLat}
                      onChange={(e) => setForm({ ...form, gpsLat: e.target.value })}
                      className="border-blue-200 focus-visible:ring-blue-500"
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude (ex: -15.7031)"
                      value={form.gpsLng}
                      onChange={(e) => setForm({ ...form, gpsLng: e.target.value })}
                      className="border-blue-200 focus-visible:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Astuce : sur Google Maps, clic droit sur un lieu → les coordonnées sont copiées automatiquement.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isVisible"
                checked={form.isVisible}
                onCheckedChange={(v) => setForm({ ...form, isVisible: v === true })}
              />
              <Label htmlFor="isVisible" className="text-sm cursor-pointer">
                Visible publiquement dans le répertoire produits
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="mr-2 size-4" />
                {loading ? "Création..." : "Créer le produit"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/dashboard/produits">Annuler</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
