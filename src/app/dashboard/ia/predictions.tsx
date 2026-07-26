"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2, BarChart3 } from "lucide-react";

type Product = { id: string; name: string; brand: string; category: string };

type Prediction = {
  predictedChangePct: number;
  confidenceScore: number;
  trendPct: number;
  seasonalFactor: number;
  seasonalReason: string;
  recentScans: number;
  previousScans: number;
};

export function AIPredictions({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPrediction(productId: string) {
    setSelectedId(productId);
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const res = await fetch(`/api/ai/predictions/${productId}`);
      const data = await res.json();
      if (res.ok) {
        setPrediction(data.prediction);
      } else {
        setError(data.error || "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Sélectionnez un produit pour voir la prédiction de demande du mois prochain
      </p>

      <div className="flex flex-wrap gap-2">
        {products.slice(0, 12).map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={selectedId === p.id ? "default" : "outline"}
            onClick={() => loadPrediction(p.id)}
          >
            {p.name}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="size-5 mr-2 animate-spin" /> Analyse en cours...
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          {error}
        </div>
      )}

      {prediction && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500">Prédiction (30j)</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${prediction.predictedChangePct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {prediction.predictedChangePct >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                  {prediction.predictedChangePct > 0 ? "+" : ""}{prediction.predictedChangePct}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Confiance</p>
                <p className="text-2xl font-bold text-purple-600">{prediction.confidenceScore}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Scans 30j</p>
                <p className="text-2xl font-bold text-blue-600">{prediction.recentScans}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Scans 30j précédents</p>
                <p className="text-2xl font-bold text-gray-600">{prediction.previousScans}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tendance brute</span>
                <Badge variant="outline" className={prediction.trendPct >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {prediction.trendPct > 0 ? "+" : ""}{prediction.trendPct}%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Facteur saisonnier</span>
                <Badge variant="outline" className={prediction.seasonalFactor >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {prediction.seasonalFactor > 0 ? "+" : ""}{prediction.seasonalFactor}%
                </Badge>
              </div>
              <p className="text-xs text-gray-500 italic mt-2 flex items-center gap-1">
                <BarChart3 className="size-3" /> {prediction.seasonalReason}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
