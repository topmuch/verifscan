"use client";

import { useState, useEffect, useRef, use } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Category = { id: string; name: string; icon: string | null; pageTemplate?: string };

export default function ModifierProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingProducerPhoto, setUploadingProducerPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const producerPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    photoUrl: "",
    weight: "",
    categoryId: "",
    isVisible: true,
    // Champs export_produce
    variety: "",
    regionOfProduction: "",
    producerStory: "",
    producerPhotoUrl: "",
    gpsLat: "",
    gpsLng: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/products/${id}`).then((r) => r.json()),
    ])
      .then(([cats, product]) => {
        setCategories(cats);
        setForm({
          name: product.name || "",
          brand: product.brand || "",
          description: product.description || "",
          photoUrl: product.photoUrl || "",
          weight: product.weight || "",
          categoryId: product.categoryId || "",
          isVisible: product.isVisible ?? true,
          variety: product.variety || "",
          regionOfProduction: product.regionOfProduction || "",
          producerStory: product.producerStory || "",
          producerPhotoUrl: product.producerPhotoUrl || "",
          gpsLat:
            product.gpsLat != null ? String(product.gpsLat) : "",
          gpsLng:
            product.gpsLng != null ? String(product.gpsLng) : "",
        });
        setFetching(false);
      })
      .catch(() => {
        toast.error("Erreur de chargement");
        setFetching(false);
      });
  }, [id]);

  // Détecte si la catégorie sélectionnée utilise le template export_produce
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const isExportProduce = selectedCategory?.pageTemplate === "export_produce";

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

  async function uploadProducerPhoto(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 MB)");
      return;
    }
    setUploadingProducerPhoto(true);
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
      setUploadingProducerPhoto(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Construction du payload — les champs export ne sont envoyés que si la
    // catégorie est export_produce (sinon on les ignore côté serveur).
    const payload: Record<string, unknown> = {
      name: form.name,
      brand: form.brand,
      description: form.description,
      photoUrl: form.photoUrl,
      weight: form.weight,
      categoryId: form.categoryId,
      isVisible: form.isVisible,
    };

    if (isExportProduce) {
      payload.variety = form.variety || "";
      payload.regionOfProduction = form.regionOfProduction || "";
      payload.producerStory = form.producerStory || "";
      payload.producerPhotoUrl = form.producerPhotoUrl || "";
      payload.gpsLat = form.gpsLat ? Number(form.gpsLat) : null;
      payload.gpsLng = form.gpsLng ? Number(form.gpsLng) : null;
    }

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erreur lors de la modification");
      return;
    }
    toast.success("Produit modifié !");
    router.push("/dashboard/produits");
    router.refresh();
  }

  if (fetching) {
    return (
      <div className="p-8 max-w-2xl space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 text-gray-500">
        <Link href="/dashboard/produits">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux produits
        </Link>
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Modifier le produit</h1>

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
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
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
              {isExportProduce && (
                <p className="text-xs text-blue-700 flex items-center gap-1 mt-1">
                  <span>🚢</span>
                  Cette catégorie utilise le template « Produit d&apos;export » —
                  des champs supplémentaires sont disponibles ci-dessous.
                </p>
              )}
            </div>

            {/* Photo du produit */}
            <div className="space-y-2">
              <Label>Photo du produit</Label>
              <div className="flex items-start gap-4">
                <div className="size-24 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photoUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-8 text-emerald-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">
                    Photo carrée (JPG, PNG, WebP). Affichée sur la page produit.
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border-emerald-200 focus-visible:ring-emerald-500 resize-none"
              />
            </div>

            {/* === CHAMPS SPÉCIFIQUES EXPORT === */}
            {isExportProduce && (
              <div className="space-y-4 mt-2 pt-4 border-t-2 border-dashed border-blue-200">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
                  <p className="font-semibold">🚢 Produit d&apos;export</p>
                  <p className="text-xs mt-0.5">
                    Les champs ci-dessous apparaîtront sur la page publique scannée par QR code
                    (template export_produce).
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

                {/* Photo producteur / verger */}
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
                        Photo du producteur, du verger ou de l&apos;atelier.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingProducerPhoto}
                          onClick={() => producerPhotoInputRef.current?.click()}
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          {uploadingProducerPhoto ? (
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

                {/* Coordonnées GPS */}
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
                {loading ? "Enregistrement..." : "Enregistrer"}
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
