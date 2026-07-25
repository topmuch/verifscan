"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Globe } from "lucide-react";

type Product = { id: string; name: string };

type HeatPoint = {
  lat: number;
  lng: number;
  count: number;
  city: string;
  country: string;
};

export function HeatmapView({ products }: { products: Product[] }) {
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [daysBack, setDaysBack] = useState(30);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);

  // Charge Leaflet dynamiquement (côté client uniquement)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      // @ts-ignore
      await import("leaflet.heat");
      if (cancelled || !mapRef.current) return;
      if (map) {
        map.remove();
      }
      const m = L.map(mapRef.current, { attributionControl: false }).setView([14.4974, -14.4524], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(m);
      setMap(m);
    })();
    return () => { cancelled = true; };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProductId) params.set("productId", selectedProductId);
      params.set("daysBack", String(daysBack));
      const res = await fetch(`/api/ai/heatmap?${params}`);
      const data = await res.json();
      setPoints(data.points || []);
      // Met à jour la heat layer
      if (map) {
        // @ts-ignore
        const heatLayer = (window as any).__heatLayer;
        if (heatLayer) map.removeLayer(heatLayer);
        if (data.points.length > 0) {
          const heatData = data.points.map((p: HeatPoint) => [p.lat, p.lng, p.count]);
          // @ts-ignore
          const L = (await import("leaflet")).default;
          // @ts-ignore
          const layer = (L as any).heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: Math.max(...data.points.map((p: HeatPoint) => p.count)),
            gradient: { 0.2: "#86efac", 0.4: "#4ade80", 0.6: "#facc15", 0.8: "#fb923c", 1.0: "#dc2626" },
          }).addTo(map);
          // @ts-ignore
          (window as any).__heatLayer = layer;
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (map) {
      loadData();
    }
  }, [map, selectedProductId, daysBack]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
        >
          <option value="">Tous les produits</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={daysBack}
          onChange={(e) => setDaysBack(parseInt(e.target.value))}
          className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
        </select>
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
          Actualiser
        </Button>
        <Badge variant="outline" className="text-xs">
          {points.length} zone(s)
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Carte */}
        <div className="md:col-span-2">
          <div
            ref={mapRef}
            className="w-full h-72 rounded-lg border border-emerald-100 bg-emerald-50/30"
            style={{ minHeight: 288 }}
          />
          <p className="text-xs text-gray-500 mt-1">
            Carte thermique des scans (verts → rouge = densité faible → élevée)
          </p>
        </div>

        {/* Liste points */}
        <div className="max-h-72 overflow-y-auto vs-scroll space-y-1.5 pr-1">
          {points.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune donnée géo</p>
          ) : (
            points.map((p, i) => (
              <div key={i} className="p-2 rounded border border-gray-100 bg-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="size-3.5 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.city}</p>
                    <p className="text-xs text-gray-500 truncate">{p.country}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{p.count}</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
