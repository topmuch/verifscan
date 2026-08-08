"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  AlertTriangle,
  MapPin,
  Award,
  Package,
  Loader2,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { getDeviceFingerprint, getLocalHistory, clearLocalHistory } from "@/lib/offline";

interface HistoryItem {
  scanId: string;
  scannedAt: string;
  lotId: string;
  lotNumber: string;
  product: { id: string; name: string; brand?: string; photoUrl?: string };
  isAuthentic: boolean;
  lotStatus: string;
  expirationDate: string;
  region?: string;
  pointsEarned: number;
  photoUrl?: string;
}

interface RecallAlert {
  lotId: string;
  title: string;
  reason: string;
  severity: string;
}

export default function MonHistoriquePage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [recalls, setRecalls] = useState<RecallAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fp, setFp] = useState<string>("");

  useEffect(() => {
    const fingerprint = getDeviceFingerprint();
    setFp(fingerprint);

    fetch(`/api/scans/history?fp=${encodeURIComponent(fingerprint)}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data.history || []);
        setRecalls(data.recalls || []);
      })
      .catch(() => {
        // Offline — fall back to local history
        const local = getLocalHistory();
        setHistory(local.map((l) => ({
          scanId: l.id,
          scannedAt: l.scannedAt,
          lotId: l.lotId,
          lotNumber: "",
          product: { id: "", name: l.productName, brand: l.brand, photoUrl: l.photoUrl },
          isAuthentic: l.isAuthentic,
          lotStatus: "active",
          expirationDate: "",
          region: l.region,
          pointsEarned: l.pointsEarned || 0,
          photoUrl: l.photoUrl,
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleClear = () => {
    if (!confirm("Vider l'historique local ? Les données serveur sont conservées.")) return;
    clearLocalHistory();
    setHistory([]);
  };

  return (
    <PublicShell>
      <section className="vs-gradient-hero border-b border-blue-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
            <History className="size-3 mr-1" />
            Mon historique
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0f4382] mb-3">
            Mes produits scannés
          </h1>
          <p className="text-lg text-[#4B5563] max-w-2xl">
            Retrouvez tous les produits que vous avez scannés, vos points gagnés et les alertes de rappel qui vous concernent.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Recall alerts */}
        {recalls.length > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <AlertTriangle className="size-5" />
              {recalls.length} alerte{recalls.length > 1 ? "s" : ""} de rappel
            </div>
            {recalls.map((r, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                <p className="font-medium text-red-900">{r.title}</p>
                <p className="text-sm text-red-700 mt-1">{r.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0f4382]">
              {history.length} scan{history.length > 1 ? "s" : ""}
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              Identifiant appareil : <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{fp}</code>
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/mes-recompenses">
                <Award className="size-4 mr-2" />
                Mes récompenses
              </Link>
            </Button>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-600">
                <Trash2 className="size-4 mr-2" />
                Vider le cache local
              </Button>
            )}
          </div>
        </div>

        {/* History list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-[#0f4382]" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Package className="size-12 text-gray-300 mx-auto" />
            <p className="text-gray-500">Aucun scan pour le moment.</p>
            <Button asChild>
              <Link href="/produits">Découvrir des produits</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {history.map((h) => (
              <div
                key={h.scanId}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="size-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {h.product.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.product.photoUrl} alt={h.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="size-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[#111827] truncate">{h.product.name}</h3>
                    {h.isAuthentic ? (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <ShieldCheck className="size-3 mr-1" />
                        Authentique
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        <AlertTriangle className="size-3 mr-1" />
                        Rappelé
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Lot {h.lotNumber} · {new Date(h.scannedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {h.region && (
                      <span className="inline-flex items-center gap-1 text-[#6B7280]">
                        <MapPin className="size-3" />
                        {h.region}
                      </span>
                    )}
                    {h.pointsEarned > 0 && (
                      <span className="inline-flex items-center gap-1 text-[#2ebd5a] font-medium">
                        <Award className="size-3" />
                        +{h.pointsEarned} pts
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/p/${h.lotId}`}>Voir</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
