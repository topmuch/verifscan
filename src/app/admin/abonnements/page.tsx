"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Ban,
  Trash2,
  Pause,
  Play,
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
import { toast } from "sonner";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  qrCodesUsed: number;
  qrCodesLimit: number;
  productsLimit: number;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  user: {
    id: string;
    companyName: string;
    email: string;
    logoUrl: string | null;
    isActive: boolean;
    createdAt: string;
    _count: { products: number; scans: number };
  };
  _count: { invoices: number };
};

type ApiResponse = {
  data: Subscription[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  mrr: number;
  arr: number;
  planCounts: Record<string, number>;
  statusCounts: Record<string, number>;
};

const PLAN_BADGE: Record<string, { bg: string; text: string }> = {
  starter: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]" },
  pro: { bg: "bg-[#0f4382]", text: "text-white" },
  enterprise: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-[#DCFCE7]", text: "text-[#065F46]", label: "Actif" },
  trial: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "Essai" },
  past_due: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", label: "En retard" },
  canceled: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Annulé" },
  suspended: { bg: "bg-[#FFEDD5]", text: "text-[#9A3412]", label: "Suspendu" },
};

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState<ApiResponse | null>(null);

  // "Create subscription" modal state.
  // We need to fetch the list of fabricants who don't yet have a subscription
  // so the superadmin can pick from them.
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; email: string; companyName: string | null }>>([]);
  const [createForm, setCreateForm] = useState({
    userId: "",
    plan: "starter" as "starter" | "pro" | "enterprise",
    status: "trial" as "trial" | "active" | "past_due" | "suspended" | "canceled",
  });
  const [creating, setCreating] = useState(false);

  async function openCreateModal() {
    setCreateForm({ userId: "", plan: "starter", status: "trial" });
    setShowCreateModal(true);
    try {
      // Fetch all fabricants — the API doesn't yet have a "no-subscription" filter,
      // so we filter client-side against existing subscriptions.
      const res = await fetch("/api/admin/users?pageSize=100");
      const data = await res.json();
      const allSubs = subscriptions.map((s) => s.user.id);
      const available = (data.data || []).filter((u: any) => !allSubs.includes(u.id));
      setAvailableUsers(available);
    } catch {
      setAvailableUsers([]);
    }
  }

  async function submitCreateSubscription() {
    if (!createForm.userId) {
      toast.error("Veuillez sélectionner un utilisateur");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création");
        return;
      }
      toast.success("Abonnement créé avec succès");
      setShowCreateModal(false);
      load();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setCreating(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        plan: planFilter,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/admin/subscriptions?${params}`);
      if (!res.ok) throw new Error();
      const data: ApiResponse = await res.json();
      const filtered = search
        ? data.data.filter(
            (s) =>
              s.user.companyName?.toLowerCase().includes(search.toLowerCase()) ||
              s.user.email.toLowerCase().includes(search.toLowerCase())
          )
        : data.data;
      setSubscriptions(filtered);
      setMeta(data);
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

  async function changePlan(id: string, plan: string) {
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) {
      toast.error("Erreur lors du changement de plan");
      return;
    }
    toast.success(`Plan changé vers ${plan}`);
    load();
  }

  async function changeStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Erreur lors du changement de statut");
      return;
    }
    const labels: Record<string, string> = {
      active: "Activé",
      canceled: "Annulé",
      suspended: "Suspendu",
      trial: "En essai",
      past_due: "En retard",
    };
    toast.success(`Abonnement ${labels[status] || status}`);
    load();
  }

  async function deleteSubscription(id: string, companyName?: string | null) {
    if (!confirm(
      `Supprimer définitivement l'abonnement de ${companyName || "cet utilisateur"} ?\n` +
      `Cette action est irréversible. Les factures associées seront supprimées.`
    )) return;
    const res = await fetch(`/api/admin/subscriptions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Erreur lors de la suppression");
      return;
    }
    toast.success("Abonnement supprimé");
    load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Gestion des Abonnements
          </h1>
          <p className="mt-1 text-[#6B7280]">
            {meta && `Revenus MRR : ${meta.mrr.toLocaleString("fr-FR")} FCFA · ARR projeté : ${meta.arr.toLocaleString("fr-FR")} FCFA`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-[#0f4382] hover:bg-[#0a3060]" onClick={openCreateModal}>
            <Plus className="mr-2 size-4" />
            Créer un abonnement
          </Button>
          <Button asChild variant="outline" className="border-[#E5E7EB]">
            <Link href="/admin/abonnements/plans">Configuration des plans</Link>
          </Button>
          <Button variant="outline" className="border-[#E5E7EB]">
            <Download className="mr-2 size-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Tabs statut */}
      {meta && (
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tous", count: meta.total },
            { key: "active", label: "Actifs", count: meta.statusCounts.active || 0 },
            { key: "trial", label: "En essai", count: meta.statusCounts.trial || 0 },
            { key: "past_due", label: "En retard", count: meta.statusCounts.past_due || 0 },
            { key: "canceled", label: "Annulés", count: meta.statusCounts.canceled || 0 },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStatusFilter(t.key);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === t.key
                  ? "bg-[#0f4382] text-white"
                  : "bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F9FAFB]"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}

      {/* Résumé MRR */}
      {meta && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-4">
              <div className="text-xs text-[#6B7280]">Total MRR</div>
              <div className="font-mono text-xl font-bold text-[#111827] mt-1">
                {meta.mrr.toLocaleString("fr-FR")}
              </div>
              <div className="text-xs text-[#9CA3AF]">FCFA / mois</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-4">
              <div className="text-xs text-[#6B7280]">ARR projeté</div>
              <div className="font-mono text-xl font-bold text-[#111827] mt-1">
                {meta.arr.toLocaleString("fr-FR")}
              </div>
              <div className="text-xs text-[#9CA3AF]">FCFA / an</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-4">
              <div className="text-xs text-[#6B7280]">Plan Pro</div>
              <div className="font-mono text-xl font-bold text-[#0f4382] mt-1">
                {meta.planCounts.pro || 0}
              </div>
              <div className="text-xs text-[#9CA3AF]">abonnements</div>
            </CardContent>
          </Card>
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-4">
              <div className="text-xs text-[#6B7280]">Starter + Enterprise</div>
              <div className="font-mono text-xl font-bold text-[#111827] mt-1">
                {(meta.planCounts.starter || 0) + (meta.planCounts.enterprise || 0)}
              </div>
              <div className="text-xs text-[#9CA3AF]">abonnements</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
              <Input
                placeholder="Rechercher entreprise, email..."
                className="pl-10 border-[#E5E7EB]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
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
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto size-12 text-[#D1D5DB]" />
              <h3 className="mt-4 font-semibold text-[#111827]">Aucun abonnement trouvé</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="py-3 px-4 font-medium">Entreprise</th>
                    <th className="py-3 px-4 font-medium">Plan</th>
                    <th className="py-3 px-4 font-medium">Statut</th>
                    <th className="py-3 px-4 font-medium">Quota QR</th>
                    <th className="py-3 px-4 font-medium">Début</th>
                    <th className="py-3 px-4 font-medium">Prochaine fact.</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => {
                    const planBadge = PLAN_BADGE[s.plan] || PLAN_BADGE.starter;
                    const statusBadge = STATUS_BADGE[s.status] || STATUS_BADGE.active;
                    return (
                      <tr key={s.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
                        <td className="py-3 px-4">
                          <Link href={`/admin/fabricants/${s.user.id}`} className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-gradient-to-br from-[#0f4382] to-[#2ebd5a] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {s.user.companyName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[#111827] truncate">{s.user.companyName}</div>
                              <div className="text-xs text-[#6B7280] truncate">{s.user.email}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${planBadge.bg} ${planBadge.text}`}>
                            {s.plan}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-[#6B7280]">
                          {s.qrCodesUsed} / {s.qrCodesLimit}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#6B7280]">
                          {s.currentPeriodStart ? new Date(s.currentPeriodStart).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#6B7280]">
                          {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("fr-FR") : "—"}
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
                                <Link href={`/admin/fabricants/${s.user.id}`} className="cursor-pointer">
                                  Voir détails fabricant
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1 text-xs text-[#9CA3AF] uppercase">Changer de plan</div>
                              <DropdownMenuItem onClick={() => changePlan(s.id, "starter")} className="cursor-pointer">
                                → Starter
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changePlan(s.id, "pro")} className="cursor-pointer">
                                → Pro
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changePlan(s.id, "enterprise")} className="cursor-pointer">
                                → Enterprise
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => changeStatus(s.id, "active")} className="cursor-pointer text-[#065F46]">
                                <Play className="mr-2 size-3.5" /> Activer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeStatus(s.id, "suspended")} className="cursor-pointer text-[#9A3412]">
                                <Pause className="mr-2 size-3.5" /> Suspendre
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changeStatus(s.id, "canceled")} className="cursor-pointer text-[#991B1B]">
                                <Ban className="mr-2 size-3.5" /> Annuler
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteSubscription(s.id, s.user.companyName)}
                                className="cursor-pointer text-[#991B1B]"
                              >
                                <Trash2 className="mr-2 size-3.5" /> Supprimer définitivement
                              </DropdownMenuItem>
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

          {!loading && subscriptions.length > 0 && (
            <div className="px-4 py-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs text-[#6B7280]">
                Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, meta?.total || 0)} sur {meta?.total || 0}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="border-[#E5E7EB] size-8 p-0">
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-[#6B7280] px-2">
                  Page {page} / {meta?.totalPages || 1}
                </span>
                <Button variant="outline" size="sm" disabled={page >= (meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className="border-[#E5E7EB] size-8 p-0">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create subscription modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-semibold text-[#111827]">
                  Créer un abonnement
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Pour un fabricant qui n&apos;a pas encore d&apos;abonnement.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B7280] hover:text-[#111827] p-1 rounded hover:bg-[#F9FAFB]"
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto vs-scroll">
              <div>
                <label className="text-sm font-medium text-[#111827]">Fabricant *</label>
                {availableUsers.length === 0 ? (
                  <div className="mt-1 p-3 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/30 text-xs text-[#92400E]">
                    Aucun fabricant sans abonnement trouvé. Tous les fabricants ont déjà un abonnement.
                  </div>
                ) : (
                  <select
                    value={createForm.userId}
                    onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4382]"
                  >
                    <option value="">— Sélectionner —</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.companyName || u.email} — {u.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#111827]">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value as any })}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4382]"
                  >
                    <option value="starter">Starter (500 QR / 5 produits)</option>
                    <option value="pro">Pro (5000 QR / illimité)</option>
                    <option value="enterprise">Enterprise (100k QR / illimité)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111827]">Statut initial</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4382]"
                  >
                    <option value="trial">Essai (14 jours)</option>
                    <option value="active">Actif</option>
                    <option value="past_due">En retard</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="border-[#E5E7EB]"
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </Button>
              <Button
                className="bg-[#0f4382] hover:bg-[#0a3060]"
                onClick={submitCreateSubscription}
                disabled={creating || !createForm.userId || availableUsers.length === 0}
              >
                {creating ? "Création..." : "Créer l'abonnement"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
