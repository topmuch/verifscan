"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, MapPin, Clock, Lock, Sparkles } from "lucide-react";

export default function InsightsPage() {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  useEffect(() => {
    fetch("/api/insights/market")
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 402) {
          setUpgradeRequired(true);
        } else {
          setInsight(data.insight);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#0f4382]" />
      </div>
    );
  }

  if (upgradeRequired) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0f4382]">Insights marché</h1>
          <p className="text-[#6B7280] mt-2">Rapport hebdomadaire premium · Plan Pro requis</p>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="size-12 text-amber-500 mx-auto" />
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f4382]">Fonctionnalité premium</h2>
              <p className="text-[#4B5563] mt-2 max-w-md mx-auto">
                Les insights marché détaillés (région en tête, heure de pointe, comparaison vs semaine précédente) sont disponibles à partir du plan Pro.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/abonnement">Passer au plan Pro</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="text-center py-20">
        <p className="text-[#6B7280]">Aucun insight disponible.</p>
      </div>
    );
  }

  const regions = Array.isArray(insight.regionsBreakdown) ? insight.regionsBreakdown : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0f4382]">Insights marché</h1>
          <p className="text-[#6B7280] mt-2">
            Semaine du {new Date(insight.periodStart).toLocaleDateString("fr-FR")} au {new Date(insight.periodEnd).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <Badge className="bg-[#0f4382] text-white">
          <Sparkles className="size-3 mr-1" />
          Premium
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <TrendingUp className="size-3" /> Scans (7j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0f4382]">{insight.totalScans}</div>
            {insight.growthPct !== null && (
              <div className={`text-xs mt-1 ${insight.growthPct >= 0 ? "text-[#2ebd5a]" : "text-red-500"}`}>
                {insight.growthPct >= 0 ? "+" : ""}{insight.growthPct}% vs semaine précédente
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <Users className="size-3" /> Consommateurs uniques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0f4382]">{insight.uniqueConsumers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <MapPin className="size-3" /> Région en tête
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#0f4382]">{insight.topRegion || "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#6B7280] flex items-center gap-1.5">
              <Clock className="size-3" /> Jour le plus actif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#0f4382]">{insight.topDayOfWeek || "—"}</div>
          </CardContent>
        </Card>
      </div>

      {regions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0f4382]">Répartition par région</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {regions.slice(0, 10).map((r: any) => (
              <div key={r.region} className="flex items-center gap-3">
                <div className="w-32 text-sm font-medium">{r.region}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0f4382] to-[#2ebd5a] flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(20, r.share)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{r.scans}</span>
                  </div>
                </div>
                <div className="w-12 text-right text-sm text-[#6B7280]">{r.share}%</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {insight.summaryHtml && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0f4382]">Synthèse</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none text-[#374151]"
              dangerouslySetInnerHTML={{ __html: insight.summaryHtml }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
