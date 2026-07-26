"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Check } from "lucide-react";
import { toast } from "sonner";

type Rec = {
  id: string;
  type: string;
  content: string;
  expectedImpactPct: number;
};

const typeColors: Record<string, string> = {
  seo: "bg-emerald-100 text-emerald-700",
  trust: "bg-blue-100 text-blue-700",
  publish_time: "bg-purple-100 text-purple-700",
  competitive: "bg-orange-100 text-orange-700",
  translation: "bg-cyan-100 text-cyan-700",
};

const typeLabels: Record<string, string> = {
  seo: "SEO",
  trust: "Confiance",
  publish_time: "Heure de publication",
  competitive: "Compétitivité",
  translation: "Traduction",
};

export function AIRecommendationsList({ initialRecommendations }: { initialRecommendations: Rec[] }) {
  const [recs, setRecs] = useState(initialRecommendations);

  async function updateStatus(id: string, status: "applied" | "dismissed") {
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setRecs(recs.filter((r) => r.id !== id));
        toast.success(status === "applied" ? "Marquée comme appliquée" : "Recommandation ignorée");
      }
    } catch (e) {
      toast.error("Erreur");
    }
  }

  if (recs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Sparkles className="size-12 mx-auto mb-2 text-purple-400" />
        <p>Aucune recommandation en attente. Profil optimisé !</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto vs-scroll pr-1">
      {recs.map((r) => (
        <div
          key={r.id}
          className="p-3 rounded-lg border border-purple-100 bg-gradient-to-r from-purple-50/50 to-white hover:border-purple-200 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className={`text-xs ${typeColors[r.type] || "bg-gray-100"}`}>
                  {typeLabels[r.type] || r.type}
                </Badge>
                {r.expectedImpactPct > 0 && (
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                    +{r.expectedImpactPct}% impact estimé
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700">{r.content}</p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="text-emerald-600 hover:bg-emerald-50"
                onClick={() => updateStatus(r.id, "applied")}
                title="Marquer comme appliqué"
              >
                <Check className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:bg-gray-100"
                onClick={() => updateStatus(r.id, "dismissed")}
                title="Ignorer"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
