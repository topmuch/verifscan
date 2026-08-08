"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Gift,
  Ticket,
  Loader2,
  Sparkles,
  CheckCircle2,
  Copy,
  TrendingUp,
} from "lucide-react";
import { getDeviceFingerprint } from "@/lib/offline";
import { toast } from "sonner";

interface Wallet {
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  transactions: { id: string; type: string; points: number; description: string; createdAt: string }[];
  redemptions: { id: string; code: string; couponTitle: string; pointsSpent: number; status: string; redeemedAt: string }[];
}

interface Coupon {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  discountValue?: number;
  discountPercent?: number;
  validUntil: string;
  remaining: number;
  fabricant: { name: string; logoUrl?: string };
}

export default function MesRecompensesPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = async () => {
    const fp = getDeviceFingerprint();
    try {
      const [wRes, cRes] = await Promise.all([
        fetch(`/api/rewards/wallet?fp=${encodeURIComponent(fp)}`),
        fetch(`/api/rewards/coupons`),
      ]);
      const w = await wRes.json();
      const c = await cRes.json();
      setWallet(w);
      setCoupons(c.coupons || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRedeem = async (coupon: Coupon) => {
    if (!confirm(`Échanger ${coupon.pointsCost} points contre "${coupon.title}" ?`)) return;
    setRedeeming(coupon.id);
    const fp = getDeviceFingerprint();
    try {
      const r = await fetch("/api/rewards/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: coupon.id, deviceFingerprint: fp }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.error || "Échange impossible");
        return;
      }
      toast.success(`Coupon obtenu : ${data.redemption.code}`);
      load();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <PublicShell>
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">
            <Award className="size-3 mr-1" />
            Mes récompenses
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0f4382] mb-3">
            Vos points VerifScan
          </h1>
          <p className="text-lg text-[#4B5563] max-w-2xl">
            Chaque scan vous rapporte 10 points. Échangez-les contre des coupons de réduction proposés par les fabricants.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-[#0f4382]" />
          </div>
        ) : (
          <>
            {/* Wallet card */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[#0f4382] to-[#0a3060] p-8 text-white shadow-xl">
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <Sparkles className="size-5" />
                  <span className="text-sm font-medium">Solde actuel</span>
                </div>
                <div className="text-5xl font-bold font-display">
                  {wallet?.pointsBalance || 0}
                  <span className="text-2xl text-blue-200 ml-2 font-normal">pts</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                  <div>
                    <div className="text-xs text-blue-200 uppercase tracking-wider">Total gagné</div>
                    <div className="text-xl font-semibold mt-1">{wallet?.totalEarned || 0} pts</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-200 uppercase tracking-wider">Total dépensé</div>
                    <div className="text-xl font-semibold mt-1">{wallet?.totalRedeemed || 0} pts</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <TrendingUp className="size-6 text-[#2ebd5a] mb-2" />
                  <p className="text-sm text-[#6B7280]">
                    Continuez à scanner pour débloquer plus de récompenses !
                  </p>
                </div>
                <Button asChild className="mt-4">
                  <Link href="/produits">Scanner un produit</Link>
                </Button>
              </div>
            </div>

            {/* Coupons */}
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0f4382] mb-4 flex items-center gap-2">
                <Gift className="size-6" />
                Coupons disponibles
              </h2>
              {coupons.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <Ticket className="size-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun coupon disponible pour le moment.</p>
                  <p className="text-sm text-gray-400 mt-1">Revenez bientôt — les fabricants ajoutent régulièrement des offres.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map((c) => {
                    const affordable = (wallet?.pointsBalance || 0) >= c.pointsCost;
                    return (
                      <div
                        key={c.id}
                        className={`rounded-2xl border p-5 flex flex-col justify-between bg-white transition-all ${
                          affordable ? "border-emerald-200 shadow-sm hover:shadow-md" : "border-gray-200 opacity-70"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-[#0f4382]">{c.title}</h3>
                            {c.discountValue ? (
                              <Badge className="bg-[#F59E0B] text-white">-{c.discountValue} F</Badge>
                            ) : c.discountPercent ? (
                              <Badge className="bg-[#F59E0B] text-white">-{c.discountPercent}%</Badge>
                            ) : null}
                          </div>
                          {c.description && <p className="text-xs text-[#6B7280] mt-1">{c.description}</p>}
                          <p className="text-xs text-[#6B7280] mt-2">par {c.fabricant.name}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-[#0f4382]">{c.pointsCost} pts</div>
                            <div className="text-xs text-[#6B7280]">Plus que {c.remaining}</div>
                          </div>
                          <Button
                            size="sm"
                            disabled={!affordable || redeeming === c.id}
                            onClick={() => handleRedeem(c)}
                          >
                            {redeeming === c.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : affordable ? (
                              "Échanger"
                            ) : (
                              "Insuffisant"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My coupons */}
            {wallet && wallet.redemptions.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-[#0f4382] mb-4 flex items-center gap-2">
                  <Ticket className="size-6" />
                  Mes coupons obtenus
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {wallet.redemptions.map((r) => (
                    <div key={r.id} className="rounded-xl bg-white border-2 border-dashed border-emerald-300 p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#111827]">{r.couponTitle}</div>
                        <div className="text-xs text-[#6B7280] mt-1">
                          {new Date(r.redeemedAt).toLocaleDateString("fr-FR")} · -{r.pointsSpent} pts
                        </div>
                      </div>
                      <div className="text-right">
                        <code className="font-mono text-sm bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{r.code}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(r.code);
                            toast.success("Code copié");
                          }}
                          className="block ml-auto mt-1 text-xs text-[#0f4382] hover:underline flex items-center gap-1"
                        >
                          <Copy className="size-3" />
                          Copier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
