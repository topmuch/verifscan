"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  Sparkles,
  Loader2,
  Zap,
  Crown,
  Building2,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  price: number;
  productsLimit: number;
  qrCodesLimit: number;
  description: string;
  highlighted?: boolean;
  features: {
    statistics: string;
    support: string;
    api: boolean;
    bulkQr: boolean;
    customQr: boolean;
    pdfLabels: boolean;
    exports: boolean;
  };
};

type Subscription = {
  subscription: {
    id: string;
    plan: string;
    status: string;
    qrCodesLimit: number;
    qrCodesUsed: number;
    productsLimit: number;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    invoices: {
      id: string;
      amount: number;
      plan: string;
      periodStart: string;
      periodEnd: string;
      status: string;
      invoiceNumber: string;
    }[];
  };
  plan: Plan;
  usagePercent: number;
  remaining: number;
};

const PLAN_ICONS: Record<string, any> = {
  starter: Zap,
  pro: Sparkles,
  enterprise: Crown,
};

export default function AbonnementPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/subscriptions/current").then((r) => r.json()),
      fetch("/api/subscriptions/plans").then((r) => r.json()),
    ])
      .then(([sub, planData]) => {
        if (sub.subscription) setSubscription(sub);
        setPlans(planData.plans || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, paymentMethod: "manual" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      if (data.requiresContact) {
        toast.info(data.message);
        return;
      }
      toast.success(data.message || "Abonnement activé !");
      // Refresh subscription
      const subRes = await fetch("/api/subscriptions/current");
      const subData = await subRes.json();
      if (subData.subscription) setSubscription(subData);
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <div className="grid lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.subscription.plan;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="size-7 text-emerald-600" />
          Abonnement
        </h1>
        <p className="mt-1 text-gray-600">
          Gérez votre plan, votre quota de QR codes et vos factures.
        </p>
      </div>

      {/* Current subscription status */}
      {subscription && (
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg">Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-emerald-100 text-emerald-800">
                Plan {subscription.plan.name}
              </Badge>
              <Badge
                variant="outline"
                className={
                  subscription.subscription.status === "trial"
                    ? "border-amber-200 text-amber-700"
                    : subscription.subscription.status === "active"
                    ? "border-emerald-200 text-emerald-700"
                    : "border-red-200 text-red-700"
                }
              >
                {subscription.subscription.status === "trial"
                  ? "Essai"
                  : subscription.subscription.status === "active"
                  ? "Actif"
                  : subscription.subscription.status === "past_due"
                  ? "Paiement en retard"
                  : "Annulé"}
              </Badge>
              {subscription.subscription.trialEndsAt && subscription.subscription.status === "trial" && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="size-3" />
                  Essai jusqu'au{" "}
                  {new Date(subscription.subscription.trialEndsAt).toLocaleDateString("fr-FR")}
                </span>
              )}
              {subscription.subscription.currentPeriodEnd && subscription.subscription.status === "active" && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="size-3" />
                  Prochain renouvellement le{" "}
                  {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}
                </span>
              )}
            </div>

            {/* Quota usage */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700">Quota QR codes (ce mois-ci)</span>
                <span className="text-gray-600">
                  {subscription.subscription.qrCodesUsed} /{" "}
                  {subscription.subscription.qrCodesLimit === -1
                    ? "∞"
                    : subscription.subscription.qrCodesLimit}
                </span>
              </div>
              <Progress value={subscription.usagePercent} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {subscription.remaining === Infinity
                  ? "Quota illimité"
                  : `${subscription.remaining} QR codes restants`}
                {subscription.usagePercent >= 80 && subscription.usagePercent < 100 && (
                  <span className="ml-2 text-amber-600 font-medium">
                    · Vous approchez de la limite
                  </span>
                )}
                {subscription.usagePercent >= 100 && (
                  <span className="ml-2 text-red-600 font-medium">
                    · Quota dépassé — upgrader votre plan
                  </span>
                )}
              </p>
            </div>

            {/* Invoices */}
            {subscription.subscription.invoices.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Factures récentes</p>
                <div className="space-y-2">
                  {subscription.subscription.invoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm"
                    >
                      <div>
                        <p className="font-mono text-xs text-gray-600">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(inv.periodStart).toLocaleDateString("fr-FR")} —{" "}
                          {new Date(inv.periodEnd).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {inv.amount.toLocaleString("fr-FR")} FCFA
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            inv.status === "paid"
                              ? "border-emerald-200 text-emerald-700"
                              : inv.status === "failed"
                              ? "border-red-200 text-red-700"
                              : "border-amber-200 text-amber-700"
                          )}
                        >
                          {inv.status === "paid" ? "Payée" : inv.status === "failed" ? "Échec" : "En attente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold mb-4">Changer de plan</h2>
        <div className="grid lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = PLAN_ICONS[plan.id] || Sparkles;
            const isCurrent = currentPlan === plan.id;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "vs-card-shadow relative overflow-hidden",
                  plan.highlighted ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-100"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Recommandé
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                        plan.id === "starter" && "bg-emerald-600",
                        plan.id === "pro" && "bg-amber-500",
                        plan.id === "enterprise" && "bg-gray-900"
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  <div>
                    {plan.price === 0 ? (
                      <p className="text-2xl font-bold text-gray-900">Sur devis</p>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {plan.price.toLocaleString("fr-FR")}
                        <span className="text-sm font-normal text-gray-500"> FCFA/mois</span>
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        {plan.productsLimit === -1 ? "Produits illimités" : `${plan.productsLimit} produits`}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        {plan.qrCodesLimit === -1 ? "QR codes illimités" : `${plan.qrCodesLimit} QR codes/mois`}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Statistiques {plan.features.statistics === "advanced" ? "avancées" : "basiques"}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-emerald-600 flex-shrink-0" />
                      <span>Support {plan.features.support}</span>
                    </li>
                    {plan.features.bulkQr && (
                      <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600 flex-shrink-0" />
                        <span>Génération en masse</span>
                      </li>
                    )}
                    {plan.features.customQr && (
                      <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600 flex-shrink-0" />
                        <span>QR codes personnalisés</span>
                      </li>
                    )}
                    {plan.features.pdfLabels && (
                      <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600 flex-shrink-0" />
                        <span>Planches d'étiquettes PDF</span>
                      </li>
                    )}
                    {plan.features.exports && (
                      <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600 flex-shrink-0" />
                        <span>Export de données</span>
                      </li>
                    )}
                    {plan.features.api && (
                      <li className="flex items-center gap-2">
                        <Check className="size-4 text-emerald-600 flex-shrink-0" />
                        <span>Accès API</span>
                      </li>
                    )}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || subscribing === plan.id}
                    variant={plan.highlighted ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      plan.highlighted && "bg-emerald-600 hover:bg-emerald-700",
                      isCurrent && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {subscribing === plan.id ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : null}
                    {isCurrent
                      ? "Plan actuel"
                      : plan.id === "enterprise"
                      ? "Nous contacter"
                      : `Choisir ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trial notice */}
      {subscription?.subscription.status === "trial" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Période d'essai</p>
            <p>
              Vous êtes en période d'essai du plan Pro. À la fin de l'essai, votre compte
              passera automatiquement au plan Starter sauf si vous souscrivez au plan Pro ou Enterprise.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
