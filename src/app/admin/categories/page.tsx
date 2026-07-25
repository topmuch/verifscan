"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
  _count: { products: number };
};

const EMOJI_CHOICES = ["🥤", "🍞", "🌶️", "🥫", "🌾", "🥛", "🥜", "🫒", "🍯", "🥖", "🧂", "🐟", "🍖", "🧀", "🥗", "🍪", "🍫", "☕", "🍬", "🌰"];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({ name: "", icon: "📦" });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      toast.error(data.error || "Erreur");
      return;
    }
    toast.success("Catégorie créée");
    setForm({ name: "", icon: "📦" });
    fetchCategories();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Catégories</h1>
        <p className="mt-1 text-gray-600">
          Gérez les catégories de produits proposées aux fabricants.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create form */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="size-5 text-emerald-600" />
              Nouvelle catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la catégorie *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Confiseries"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Icône (emoji)</Label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 max-h-32 overflow-y-auto vs-scroll">
                  {EMOJI_CHOICES.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm({ ...form, icon: e })}
                      className={`w-9 h-9 rounded-lg text-xl transition-colors ${
                        form.icon === e
                          ? "bg-emerald-600"
                          : "bg-white hover:bg-emerald-100"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Sélection actuelle : {form.icon}</p>
              </div>

              <Button
                type="submit"
                disabled={creating || !form.name.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 size-4" />
                {creating ? "Création..." : "Créer la catégorie"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="size-5 text-amber-600" />
              Catégories existantes ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune catégorie</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto vs-scroll">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-emerald-50/40 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">{c.icon}</span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{c.name}</p>
                        <p className="text-xs text-gray-500">
                          {c._count.products} produit{c._count.products > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={c.isActive
                        ? "border-emerald-200 text-emerald-700"
                        : "border-gray-200 text-gray-500"}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
