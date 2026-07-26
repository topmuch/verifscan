"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Package,
  Eye,
  CreditCard,
  TrendingUp,
  Loader2,
  User,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type UserDetail = {
  user: {
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
    updatedAt: string;
    subscription: {
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
      invoices: Array<{
        id: string;
        invoiceNumber: string;
        amount: number;
        status: string;
        paymentMethod: string | null;
        paymentRef: string | null;
        periodStart: string;
        periodEnd: string;
        createdAt: string;
      }>;
    } | null;
    products: Array<{
      id: string;
      name: string;
      brand: string;
      isVisible: boolean;
      category: { name: string; icon: string | null } | null;
      _count: { lots: number };
    }>;
    _count: { products: number; scans: number; notifications: number };
  };
  scansByDay: Array<{ date: string; count: number }>;
  totalScans30d: number;
};

const PLAN_PRICES: Record<string, number> = {
  starter: 10000,
  pro: 25000,
  enterprise: 75000,
};

export default function FabricantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => {
        toast.error("Fabricant introuvable");
        router.push("/admin/fabricants");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-[1600px] mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  const { user, scansByDay, totalScans30d } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Back */}
      <div>
        <Link
          href="/admin/fabricants"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827]"
        >
          <ArrowLeft className="size-4" />
          Retour à la liste
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user.companyName?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
              {user.companyName || "Sans nom"}
            </h1>
            <Badge
              className={
                user.isActive
                  ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]"
                  : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]"
              }
            >
              {user.isActive ? "Actif" : "Désactivé"}
            </Badge>
            {user.subscription && (
              <Badge className="bg-[#DBEAFE] text-[#1E40AF] capitalize hover:bg-[#DBEAFE]">
                Plan {user.subscription.plan}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-[#6B7280]">
            Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            {user.updatedAt && ` · Dernière MAJ : ${new Date(user.updatedAt).toLocaleDateString("fr-FR")}`}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche 70% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations entreprise */}
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base font-display">Informations entreprise</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <InfoItem icon={Mail} label="Email" value={user.email} />
              <InfoItem icon={Phone} label="Téléphone" value={user.phone || "—"} />
              <InfoItem icon={MessageCircle} label="WhatsApp" value={user.whatsapp || "—"} />
              <InfoItem icon={Mail} label="Email contact" value={user.emailContact || "—"} />
              <InfoItem icon={MapPin} label="Adresse" value={user.address || "—"} />
              <InfoItem icon={Calendar} label="Inscription" value={new Date(user.createdAt).toLocaleString("fr-FR")} />
            </CardContent>
          </Card>

          {/* Abonnement */}
          {user.subscription && (
            <Card className="border-[#E5E7EB]">
              <CardHeader>
                <CardTitle className="text-base font-display flex items-center justify-between">
                  <span>Abonnement actuel</span>
                  <Link href={`/admin/abonnements?user=${user.id}`}>
                    <Button variant="outline" size="sm" className="border-[#E5E7EB]">
                      Gérer
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-[#F9FAFB] p-4 border border-[#E5E7EB]">
                    <div className="text-xs text-[#6B7280] mb-1">Plan</div>
                    <div className="font-semibold text-[#111827] capitalize">{user.subscription.plan}</div>
                    <div className="text-xs text-[#6B7280] mt-1">
                      {PLAN_PRICES[user.subscription.plan]?.toLocaleString("fr-FR") || "—"} FCFA/mois
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F9FAFB] p-4 border border-[#E5E7EB]">
                    <div className="text-xs text-[#6B7280] mb-1">Statut</div>
                    <Badge
                      className={
                        user.subscription.status === "active"
                          ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]"
                          : user.subscription.status === "trial"
                          ? "bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]"
                          : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]"
                      }
                    >
                      {user.subscription.status}
                    </Badge>
                    {user.subscription.currentPeriodEnd && (
                      <div className="text-xs text-[#6B7280] mt-2">
                        Prochaine facturation : {new Date(user.subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quotas */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6B7280]">QR codes utilisés</span>
                      <span className="font-mono text-[#111827]">
                        {user.subscription.qrCodesUsed} / {user.subscription.qrCodesLimit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB]"
                        style={{
                          width: `${Math.min(100, (user.subscription.qrCodesUsed / user.subscription.qrCodesLimit) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6B7280]">Produits (limite)</span>
                      <span className="font-mono text-[#111827]">
                        {user._count.products} / {user.subscription.productsLimit === -1 ? "∞" : user.subscription.productsLimit}
                      </span>
                    </div>
                    {user.subscription.productsLimit !== -1 && (
                      <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className="h-full bg-[#10B981]"
                          style={{
                            width: `${Math.min(100, (user._count.products / user.subscription.productsLimit) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Produits récents */}
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center justify-between">
                <span>Produits de ce fabricant</span>
                <span className="text-xs text-[#6B7280]">{user._count.products} au total</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.products.length === 0 ? (
                <p className="text-center text-[#9CA3AF] py-6 text-sm">Aucun produit créé.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB]">
                        <th className="py-2 pr-3 font-medium">Nom</th>
                        <th className="py-2 pr-3 font-medium">Catégorie</th>
                        <th className="py-2 pr-3 font-medium text-center">Lots</th>
                        <th className="py-2 font-medium text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.products.map((p) => (
                        <tr key={p.id} className="border-b border-[#F3F4F6]">
                          <td className="py-2 pr-3 font-medium text-[#111827]">{p.name}</td>
                          <td className="py-2 pr-3 text-[#6B7280]">
                            {p.category?.icon} {p.category?.name || "—"}
                          </td>
                          <td className="py-2 pr-3 text-center font-mono">{p._count.lots}</td>
                          <td className="py-2 text-center">
                            <Badge
                              className={
                                p.isVisible
                                  ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]"
                                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]"
                              }
                            >
                              {p.isVisible ? "Visible" : "Masqué"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique scans 30j */}
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center justify-between">
                <span>Historique des scans (30 jours)</span>
                <span className="text-xs text-[#6B7280]">Total : {totalScans30d}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalScans30d === 0 ? (
                <p className="text-center text-[#9CA3AF] py-12 text-sm">Aucun scan sur les 30 derniers jours.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={scansByDay} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="userScanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563EB"
                      strokeWidth={2}
                      fill="url(#userScanGrad)"
                      name="Scans"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite 30% */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base font-display">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-[#E5E7EB]"
              >
                <a href={`https://wa.me/${user.whatsapp?.replace(/[^0-9]/g, "") || ""}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 size-4 text-[#10B981]" />
                  Contacter WhatsApp
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-[#E5E7EB]"
              >
                <a href={`mailto:${user.email}`}>
                  <Mail className="mr-2 size-4 text-[#2563EB]" />
                  Envoyer email
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-[#E5E7EB]"
              >
                <Link href={`/admin/support?user=${user.id}`}>
                  <Package className="mr-2 size-4 text-[#F59E0B]" />
                  Créer ticket support
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <Card className="border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-base font-display">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatItem icon={Package} label="Produits" value={user._count.products} color="text-[#2563EB]" />
              <StatItem icon={Eye} label="Scans totaux" value={user._count.scans} color="text-[#10B981]" />
              <StatItem icon={CreditCard} label="Factures" value={user.subscription?.invoices.length || 0} color="text-[#F59E0B]" />
              <StatItem icon={TrendingUp} label="Scans (30j)" value={totalScans30d} color="text-[#2563EB]" />
            </CardContent>
          </Card>

          {/* Factures récentes */}
          {user.subscription && user.subscription.invoices.length > 0 && (
            <Card className="border-[#E5E7EB]">
              <CardHeader>
                <CardTitle className="text-base font-display">Factures récentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.subscription.invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="rounded-lg border border-[#E5E7EB] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#6B7280]">{inv.invoiceNumber}</span>
                      <Badge
                        className={
                          inv.status === "paid"
                            ? "bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]"
                            : inv.status === "pending"
                            ? "bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]"
                            : "bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="font-semibold text-[#111827] mt-1">
                      {inv.amount.toLocaleString("fr-FR")} FCFA
                    </div>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      {new Date(inv.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-[#F9FAFB] flex items-center justify-center flex-shrink-0">
        <Icon className="size-4 text-[#6B7280]" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[#6B7280]">{label}</div>
        <div className="text-sm font-medium text-[#111827] break-words">{value}</div>
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${color}`} />
        <span className="text-sm text-[#6B7280]">{label}</span>
      </div>
      <span className="font-mono font-semibold text-[#111827]">{value}</span>
    </div>
  );
}
