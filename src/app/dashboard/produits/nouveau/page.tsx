"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
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

type Category = { id: string; name: string; icon: string | null };

export default function NouveauProduitPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    photoUrl: "",
    weight: "",
    categoryId: "",
    isVisible: true,
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => toast.error("Impossible de charger les catégories"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

            <div className="space-y-2">
              <Label htmlFor="photoUrl">URL de la photo (optionnel)</Label>
              <Input
                id="photoUrl"
                type="url"
                placeholder="https://exemple.com/photo.jpg"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                className="border-emerald-200 focus-visible:ring-emerald-500"
              />
              <p className="text-xs text-gray-500">
                Collez l'URL d'une image de votre produit. Stockage d'images intégré à venir.
              </p>
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
