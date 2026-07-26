"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, Flame, TrendingUp } from "lucide-react";

interface Region {
  region: string;
  total: number;
  lat: number | null;
  lng: number | null;
}

export default function CartePage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [since, setSince] = useState<string>("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/heatmap?days=30`)
      .then((r) => r.json())
      .then((data) => {
        setRegions(data.regions || []);
        setTotal(data.totalScans || 0);
        setSince(data.since ? new Date(data.since).toLocaleDateString("fr-FR") : "");
      })
      .finally(() => setLoading(false));
  }, []);

  const maxTotal = regions.length > 0 ? regions[0].total : 1;

  return (
    <PublicShell>
      <section className="vs-gradient-hero border-b border-blue-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
            <MapPin className="size-3 mr-1" />
            Carte de chaleur
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0f4382] mb-3">
            Où sont scannés les produits ?
          </h1>
          <p className="text-lg text-[#4B5563] max-w-2xl">
            Visualisation anonymisée des scans par région. Les pics anormaux peuvent signaler des zones de contrefaçon.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-[#0f4382]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-[#6B7280] uppercase tracking-wider">Scans (30j)</div>
                <div className="text-2xl font-bold text-[#0f4382] mt-1">{total.toLocaleString("fr-FR")}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-[#6B7280] uppercase tracking-wider">Régions actives</div>
                <div className="text-2xl font-bold text-[#2ebd5a] mt-1">{regions.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-[#6B7280] uppercase tracking-wider">Depuis</div>
                <div className="text-lg font-semibold text-[#111827] mt-1">{since}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-display text-xl font-bold text-[#0f4382] mb-4 flex items-center gap-2">
                <Flame className="size-5 text-[#F59E0B]" />
                Top régions par scans
              </h2>
              <div className="space-y-3">
                {regions.slice(0, 15).map((r, i) => {
                  const intensity = (r.total / maxTotal) * 100;
                  return (
                    <div key={r.region} className="flex items-center gap-4">
                      <div className="w-6 text-right text-sm font-semibold text-[#6B7280]">#{i + 1}</div>
                      <div className="w-32 text-sm font-medium text-[#111827]">{r.region}</div>
                      <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max(15, intensity)}%`,
                            background: `linear-gradient(90deg, #2ebd5a 0%, #F59E0B ${intensity > 70 ? 50 : 100}%, #ef4444 ${intensity > 70 ? 100 : 100}%)`,
                          }}
                        >
                          <span className="text-xs font-semibold text-white">{r.total}</span>
                        </div>
                      </div>
                      {intensity > 70 && (
                        <TrendingUp className="size-4 text-[#F59E0B]" title="Pic détecté" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
              <p className="text-sm text-[#4B5563]">
                <strong className="text-[#0f4382]">À propos de cette carte</strong> — Les données sont agrégées par région et anonymisées.
                Les fabricants disposent d'une carte plus détaillée (par ville, heure, jour) dans le module <strong>Insights marché</strong> (plan Pro).
              </p>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
