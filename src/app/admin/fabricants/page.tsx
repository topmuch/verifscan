"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Package,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    qrCodesUsed: number;
    qrCodesLimit: number;
    productsLimit: number;
  } | null;
  _count: { products: number; scans: number };
};

const PLAN_BADGE: Record<string, { bg: string; text: string }> = {
  starter: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
  pro: { bg: "bg-[#2563EB]", text: "text-white" },
  enterprise: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
};

export default function AdminFabricantsPage() {
  const [fabricants, setFabricants] = useState<Fabricant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        plan: planFilter,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFabricants(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter, page, pageSize]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Gestion des Fabricants
          </h1>
          <p className="mt-1 text-[#6B7280]">
            {total} fabricant{total > 1 ? "s" : ""} inscrit{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" className="border-[#E5E7EB]">
          <Download className="mr-2 size-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Filtres */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
              <Input
                placeholder="Rechercher par nom, email, entreprise..."
                className="pl-10 border-[#E5E7EB]"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="trial">En essai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : fabricants.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="mx-auto size-12 text-[#D1D5DB]" />
              <h3 className="mt-4 font-semibold text-[#111827]">Aucun fabricant trouvé</h3>
              <p className="text-sm text-[#6B7280]">Modifiez vos filtres pour voir plus de résultats.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="py-3 px-4 font-medium">Entreprise</th>
                    <th className="py-3 px-4 font-medium">Contact</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Statut</th>
                    <th className="py-3 px-4 font-medium text-center">Produits</th>
                    <th className="py-3 px-4 font-medium text-center">Scans</th>
                    <th className="py-3 px-4 font-medium">Inscription</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fabricants.map((f) => {
                    const planBadge = f.subscription?.plan
                      ? PLAN_BADGE[f.subscription.plan] || PLAN_BADGE.starter
                      : null;
                    return (
                      <tr key={f.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="py-3 px-4">
                          <Link href={`/admin/fabricants/${f.id}`} className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {f.companyName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[#111827] truncate">
                                {f.companyName || "Sans nom"}
                              </div>
                              <div className="text-xs text-[#6B7280] truncate">{f.email}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-[#6B7280] flex items-center gap-1">
                            <Mail className="size-3" />
                            {f.emailContact || f.email}
                          </div>
                          {f.phone && (
                            <div className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                              <Phone className="size-3" />
                              {f.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {planBadge ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${planBadge.bg} ${planBadge.text} capitalize`}>
                              {f.subscription?.plan}
                            </span>
                          ) : (
                            <span className="text-xs text-[#9CA3AF]">Aucun</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              f.isActive
                                ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]"
                                : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]"
                            }
                          >
                            {f.isActive ? "Actif" : "Désactivé"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[#111827]">
                          {f._count.products}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[#111827]">
                          {f._count.scans}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#6B7280] whitespace-nowrap">
                          {new Date(f.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="size-8 p-0">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/fabricants/${f.id}`} className="cursor-pointer">
                                  <Eye className="mr-2 size-4" />
                                  Voir détails
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/abonnements?user=${f.id}`} className="cursor-pointer">
                                  <Package className="mr-2 size-4" />
                                  Voir abonnement
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="cursor-pointer"
                                  >
                                    {f.isActive ? (
                                      <>
                                        <EyeOff className="mr-2 size-4" />
                                        Désactiver
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="mr-2 size-4" />
                                        Réactiver
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {f.isActive ? "Désactiver ce fabricant ?" : "Réactiver ce fabricant ?"}
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
                                      className={f.isActive ? "bg-red-600 hover:bg-red-700" : "bg-[#2563EB] hover:bg-[#1D4ED8]"}
                                    >
                                      Confirmer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && fabricants.length > 0 && (
            <div className="px-4 py-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-[#6B7280]">
                Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} sur {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-[#E5E7EB] size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-[#6B7280] px-2">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-[#E5E7EB] size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
