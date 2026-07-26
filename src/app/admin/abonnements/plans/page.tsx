"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Check, Star, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PlanConfig = {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  productsLimit: number; // -1 = illimité
  qrCodesLimit: number; // -1 = illimité
  stats: string;
  support: string;
  features: { label: string; included: boolean }[];
  popular?: boolean;
};

const initialPlans: PlanConfig[] = [
  {
    name: "Starter",
    monthlyPrice: 10000,
    annualPrice: 100000,
    productsLimit: 5,
    qrCodesLimit: 500,
    stats: "Basiques",
    support: "Email",
    features: [
      { label: "Création produits", included: true },
      { label: "Génération QR codes", included: true },
      { label: "Page publique", included: true },
      { label: "Statistiques avancées", included: false },
      { label: "Marketplace B2B", included: false },
      { label: "API access", included: false },
    ],
  },
  {
    name: "Pro",
    monthlyPrice: 25000,
    annualPrice: 250000,
    productsLimit: -1,
    qrCodesLimit: 5000,
    stats: "Avancées",
    support: "Prioritaire",
    popular: true,
    features: [
      { label: "Tout Starter +", included: true },
      { label: "Statistiques avancées", included: true },
      { label: "QR codes personnalisés", included: true },
      { label: "Export données", included: true },
      { label: "Marketplace B2B", included: false },
      { label: "API access", included: false },
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: 75000,
    annualPrice: 750000,
    productsLimit: -1,
    qrCodesLimit: -1,
    stats: "API + Custom",
    support: "Dédié 24/7",
    features: [
      { label: "Tout Pro +", included: true },
      { label: "Marketplace B2B", included: true },
      { label: "API access", included: true },
      { label: "White label", included: true },
      { label: "SSO", included: true },
      { label: "SLA garanti", included: true },
    ],
  },
];

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>(initialPlans);
  const [globalSettings, setGlobalSettings] = useState({
    trialDays: 14,
    cardRequired: false,
    reminderDays: 3,
    suspendDays: 7,
  });
  const [saving, setSaving] = useState(false);

  function updatePlan(idx: number, patch: Partial<PlanConfig>) {
    setPlans((list) => list.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function toggleFeature(planIdx: number, featIdx: number) {
    setPlans((list) =>
      list.map((p, i) =>
        i === planIdx
          ? {
              ...p,
              features: p.features.map((f, fi) =>
                fi === featIdx ? { ...f, included: !f.included } : f
              ),
            }
          : p
      )
    );
  }

  async function saveAll() {
    setSaving(true);
    // In a real impl, this would persist to DB via /api/admin/plans
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Configuration des plans enregistrée");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <Link href="/admin/abonnements" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827]">
          <ArrowLeft className="size-4" />
          Retour aux abonnements
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Configuration des plans
          </h1>
          <p className="mt-1 text-[#6B7280]">
            Modifiez les prix, quotas et fonctionnalités de chaque plan.
          </p>
        </div>
        <Button onClick={saveAll} disabled={saving} className="bg-[#0f4382] hover:bg-[#0a3060]">
          <Save className="mr-2 size-4" />
          {saving ? "Enregistrement..." : "Enregistrer tout"}
        </Button>
      </div>

      {/* Plans */}
      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <Card
            key={plan.name}
            className={`border-2 ${
              plan.popular ? "border-[#0f4382] vs-card-shadow-lg" : "border-[#E5E7EB]"
            } relative`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#F59E0B] text-white hover:bg-[#F59E0B]">
                  <Star className="size-3 mr-1" fill="currentColor" />
                  Le plus populaire
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center justify-between">
                <span>Plan {plan.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prix */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Prix mensuel (FCFA)</Label>
                  <Input
                    type="number"
                    value={plan.monthlyPrice}
                    onChange={(e) => updatePlan(idx, { monthlyPrice: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Prix annuel (FCFA)</Label>
                  <Input
                    type="number"
                    value={plan.annualPrice}
                    onChange={(e) => updatePlan(idx, { annualPrice: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Quotas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Limite produits (-1 = ∞)</Label>
                  <Input
                    type="number"
                    value={plan.productsLimit}
                    onChange={(e) => updatePlan(idx, { productsLimit: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Limite QR/mois (-1 = ∞)</Label>
                  <Input
                    type="number"
                    value={plan.qrCodesLimit}
                    onChange={(e) => updatePlan(idx, { qrCodesLimit: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Statistiques</Label>
                  <Input
                    value={plan.stats}
                    onChange={(e) => updatePlan(idx, { stats: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Support</Label>
                  <Input
                    value={plan.support}
                    onChange={(e) => updatePlan(idx, { support: e.target.value })}
                  />
                </div>
              </div>

              {/* Fonctionnalités */}
              <div>
                <Label className="text-xs mb-2 block">Fonctionnalités</Label>
                <div className="space-y-1.5">
                  {plan.features.map((f, fi) => (
                    <button
                      key={f.label}
                      onClick={() => toggleFeature(idx, fi)}
                      className="w-full flex items-center justify-between p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-left"
                    >
                      <span className="text-sm text-[#374151]">{f.label}</span>
                      {f.included ? (
                        <span className="size-5 rounded-full bg-[#DCFCE7] flex items-center justify-center">
                          <Check className="size-3 text-[#065F46]" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="size-5 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                          <X className="size-3 text-[#9CA3AF]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paramètres globaux */}
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Paramètres globaux d&apos;abonnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Durée essai gratuit (jours)</Label>
              <Input
                type="number"
                value={globalSettings.trialDays}
                onChange={(e) => setGlobalSettings((s) => ({ ...s, trialDays: Number(e.target.value) }))}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-sm">Relance avant échéance (jours)</Label>
              <Input
                type="number"
                value={globalSettings.reminderDays}
                onChange={(e) => setGlobalSettings((s) => ({ ...s, reminderDays: Number(e.target.value) }))}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="text-sm">Suspension après échec paiement (jours)</Label>
              <Input
                type="number"
                value={globalSettings.suspendDays}
                onChange={(e) => setGlobalSettings((s) => ({ ...s, suspendDays: Number(e.target.value) }))}
                className="font-mono"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={globalSettings.cardRequired}
                onCheckedChange={(v) => setGlobalSettings((s) => ({ ...s, cardRequired: v }))}
              />
              <Label className="text-sm">Carte bancaire requise pour l&apos;essai</Label>
            </div>
          </div>
          <Button onClick={saveAll} disabled={saving} className="bg-[#0f4382] hover:bg-[#0a3060]">
            <Save className="mr-2 size-4" />
            Enregistrer les paramètres globaux
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
