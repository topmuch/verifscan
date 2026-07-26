"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Anomaly = {
  id: string;
  type: string;
  severity: string;
  description: string;
  detectedAt: string;
  lotNumber: string | null;
  productName: string | null;
};

const typeLabels: Record<string, string> = {
  dlc: "DLC proche",
  counterfeit: "Contrefaçon",
  allergen: "Allergène",
  ingredient: "Ingrédient suspect",
  cert_expiring: "Certificat expirant",
};

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

export function AIAnomalyList({ initialAnomalies }: { initialAnomalies: Anomaly[] }) {
  const [anomalies, setAnomalies] = useState(initialAnomalies);
  const [scanning, setScanning] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);

  async function runScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/ai/anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanType: "all" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Recharge la liste
        const refresh = await fetch("/api/ai/anomalies");
        const refreshData = await refresh.json();
        setAnomalies(refreshData.anomalies.map((a: any) => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          description: a.description,
          detectedAt: a.detectedAt,
          lotNumber: a.lot?.lotNumber || null,
          productName: a.lot?.product?.name || null,
        })));
      } else {
        toast.error("Erreur lors du scan");
      }
    } catch (e) {
      toast.error("Erreur réseau");
    } finally {
      setScanning(false);
    }
  }

  async function resolve(id: string) {
    setResolving(id);
    try {
      const res = await fetch(`/api/ai/anomalies/${id}/resolve`, { method: "PUT" });
      if (res.ok) {
        toast.success("Anomalie marquée comme résolue");
        setAnomalies(anomalies.filter((a) => a.id !== id));
      } else {
        toast.error("Erreur");
      }
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">
          {anomalies.length} anomalie(s) ouverte(s) détectée(s) par l'IA
        </p>
        <Button onClick={runScan} disabled={scanning} size="sm" variant="default">
          {scanning ? (
            <><Loader2 className="size-4 mr-2 animate-spin" /> Scan en cours...</>
          ) : (
            <><RefreshCw className="size-4 mr-2" /> Lancer un scan IA</>
          )}
        </Button>
      </div>

      {anomalies.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <CheckCircle2 className="size-12 mx-auto mb-2 text-emerald-400" />
          <p>Aucune anomalie détectée. Tout va bien !</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto vs-scroll pr-1">
          {anomalies.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded-lg border ${severityColors[a.severity] || "bg-gray-50 border-gray-200"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[a.type] || a.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {a.severity}
                    </Badge>
                    {a.productName && (
                      <span className="text-xs text-gray-500">
                        {a.productName} {a.lotNumber && `· Lot ${a.lotNumber}`}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{a.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(a.detectedAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resolve(a.id)}
                  disabled={resolving === a.id}
                >
                  {resolving === a.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
