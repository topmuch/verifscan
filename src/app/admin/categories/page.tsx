"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Pencil, Eye, EyeOff, X, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
  _count: { products: number };
};

const EMOJI_CHOICES = [
  "🥤", "🍞", "🌶️", "🥫", "🌾", "🥛", "🥜", "🫒", "🍯", "🥖",
  "🧂", "🐟", "🍖", "🧀", "🥗", "🍪", "🍫", "☕", "🍬", "🌰",
  "🧴", "📦", "🍷", "🥃", "🍵", "🧊", "🥥", "🍍", "🥭", "🍋",
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "📦" });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ name: "", icon: "📦" });
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, icon: cat.icon || "📦" });
    setEditingId(cat.id);
    setModalOpen(true);
  }

  async function onSave() {
    if (!form.name.trim() || form.name.length < 3) {
      toast.error("Le nom doit faire au moins 3 caractères");
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(editingId ? "Catégorie modifiée" : "Catégorie créée");
      setModalOpen(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: Category) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    if (!res.ok) {
      toast.error("Erreur");
      return;
    }
    toast.success(cat.isActive ? "Catégorie désactivée" : "Catégorie activée");
    fetchCategories();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/categories/${deleteId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Erreur");
      return;
    }
    toast.success("Catégorie supprimée");
    setDeleteId(null);
    fetchCategories();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Gestion des Catégories
          </h1>
          <p className="mt-1 text-[#6B7280]">
            {categories.filter((c) => c.isActive).length} catégories actives sur {categories.length}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#0f4382] hover:bg-[#0a3060]">
          <Plus className="mr-2 size-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Grille de cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-12 text-center">
            <Tag className="mx-auto size-12 text-[#D1D5DB]" />
            <h3 className="mt-4 font-semibold text-[#111827]">Aucune catégorie</h3>
            <p className="text-sm text-[#6B7280] mt-1">Créez votre première catégorie pour commencer.</p>
            <Button onClick={openCreate} className="mt-4 bg-[#0f4382] hover:bg-[#0a3060]">
              <Plus className="mr-2 size-4" />
              Créer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="border-[#E5E7EB] group hover:vs-card-shadow-hover transition-all hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{cat.icon || "📦"}</div>
                  <Badge
                    className={
                      cat.isActive
                        ? "bg-[#DCFCE7] text-[#065F46] hover:bg-[#DCFCE7]"
                        : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]"
                    }
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-semibold text-[#111827]">
                  {cat.name}
                </h3>
                <p className="text-sm text-[#6B7280] mt-1">
                  {cat._count.products} produit{cat._count.products > 1 ? "s" : ""}
                </p>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-[#F3F4F6] flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(cat)}
                    className="border-[#E5E7EB] flex-1"
                  >
                    <Pencil className="mr-1 size-3.5" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(cat)}
                    className="border-[#E5E7EB] size-8 p-0"
                    title={cat.isActive ? "Désactiver" : "Activer"}
                  >
                    {cat.isActive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteId(cat.id)}
                    disabled={cat._count.products > 0}
                    className="border-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2] size-8 p-0"
                    title={cat._count.products > 0 ? "Suppression impossible (produits liés)" : "Supprimer"}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal create/edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie *</Label>
              <Input
                id="name"
                placeholder="Ex : Boissons, Épices..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={50}
              />
              <p className="text-xs text-[#9CA3AF]">{form.name.length}/50 caractères</p>
            </div>

            <div className="space-y-2">
              <Label>Icône / Emoji</Label>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-12 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-2xl">
                  {form.icon}
                </div>
                <span className="text-sm text-[#6B7280]">Aperçu</span>
              </div>
              <div className="grid grid-cols-10 gap-1 p-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] max-h-32 overflow-y-auto vs-scroll">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm({ ...form, icon: e })}
                    className={`size-8 rounded-lg text-lg transition-colors ${
                      form.icon === e
                        ? "bg-[#0f4382]"
                        : "bg-white hover:bg-[#DBEAFE]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={onSave} disabled={saving} className="bg-[#0f4382] hover:bg-[#0a3060]">
              <Save className="mr-2 size-4" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La catégorie sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
