"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Trophy, TrendingUp, Users } from "lucide-react";

export default function ConcurrentsPage() {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  useEffect(() => {
    fetch("/api/insights/competitors")
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 402) {
          setUpgradeRequired(true);
        } else {
          setBenchmarks(data.benchmarks || []);
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
          <h1 className="font-display text-3xl font-bold text-[#0f4382]">Comparaison concurrents</h1>
          <p className="text-[#6B7280] mt-2">Position de marché par catégorie · Plan Pro requis</p>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="size-12 text-amber-500 mx-auto" />
            <div>
              <h2 className="font-display text-xl font-bold text-[#0f4382]">Fonctionnalité premium</h2>
              <p className="text-[#4B5563] mt-2 max-w-md mx-auto">
                La position de marché (parts de scans anonymisées par catégorie) est disponible à partir du plan Pro.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0f4382]">Comparaison concurrents</h1>
        <p className="text-[#6B7280] mt-2">Votre part de marché par catégorie (30 derniers jours, anonymisé)</p>
      </div>

      {benchmarks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Trophy className="size-12 text-gray-300 mx-auto" />
            <p className="text-[#6B7280]">Aucune donnée de marché disponible pour vos produits.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {benchmarks.map((b, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0f4382] text-lg">{b.categoryName}</h3>
                      {b.rank === 1 && (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Trophy className="size-3 mr-1" />
                          Leader
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {b.totalCategoryScans} scans au total dans cette catégorie
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#0f4382]">{b.fabricantSharePct}%</div>
                    <div className="text-xs text-[#6B7280]">votre part</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6B7280] w-16">Vous</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0f4382] to-[#2ebd5a] flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(8, b.fabricantSharePct)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{b.fabricantScans}</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#0f4382] font-semibold w-12 text-right">#{b.rank}</span>
                  </div>
                  {b.topCompetitorSharePct != null && (
                    <div className="flex items-center gap-3 opacity-60">
                      <span className="text-xs text-[#6B7280] w-16">Leader</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-gray-400 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(8, b.topCompetitorSharePct)}%` }}
                        >
                          <span className="text-xs text-white font-medium">{b.topCompetitorSharePct}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#6B7280] w-12 text-right">anonyme</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
