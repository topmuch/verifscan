"use client";

import { useState, useEffect } from "react";
import { Building2, Search, Eye, EyeOff, Mail, Phone, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Fabricant = {
  id: string;
  email: string;
  companyName: string;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  emailContact: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { products: number };
};

export default function AdminFabricantsPage() {
  const [fabricants, setFabricants] = useState<Fabricant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setFabricants(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/users/${id}/activate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (!res.ok) {
      toast.error("Erreur lors de la modification");
      return;
    }
    setFabricants((list) =>
      list.map((f) => (f.id === id ? { ...f, isActive: !current } : f))
    );
    toast.success(current ? "Fabricant désactivé" : "Fabricant activé");
  }

  const filtered = fabricants.filter((f) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      f.companyName?.toLowerCase().includes(s) ||
      f.email.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fabricants</h1>
        <p className="mt-1 text-gray-600">
          Activez, désactivez et supervisez les comptes fabricants de la plateforme.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom ou email..."
          className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto size-12 text-emerald-200" />
            <h3 className="mt-4 font-semibold">Aucun fabricant trouvé</h3>
            <p className="text-sm text-gray-500">Aucun compte fabricant ne correspond à votre recherche.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((f) => (
            <Card key={f.id} className="vs-card-shadow border-emerald-100">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-400 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {f.companyName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold truncate">{f.companyName}</h3>
                      <Badge className={f.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                        {f.isActive ? "Actif" : "Désactivé"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />
                        {f.email}
                      </span>
                      {f.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {f.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Package className="size-3" />
                        {f._count.products} produit{f._count.products > 1 ? "s" : ""}
                      </span>
                      <span>Inscrit le {new Date(f.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant={f.isActive ? "destructive" : "outline"}
                        className={f.isActive ? "" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}
                      >
                        {f.isActive ? (
                          <>
                            <EyeOff className="mr-2 size-4" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 size-4" />
                            Activer
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {f.isActive ? "Désactiver ce fabricant ?" : "Activer ce fabricant ?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {f.isActive
                            ? `${f.companyName} ne pourra plus se connecter ni gérer ses produits. Ses produits publics resteront visibles.`
                            : `${f.companyName} pourra à nouveau se connecter et gérer ses produits.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => toggleActive(f.id, f.isActive)}
                          className={f.isActive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
                        >
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
