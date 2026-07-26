"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ShieldCheck, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function CertificationsPage() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try {
      const r = await fetch("/api/certifications/sync");
      const data = await r.json();
      setCerts(data.certifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSync = async (source: string) => {
    setSyncing(true);
    try {
      const r = await fetch(`/api/certifications/sync?source=${source}`, { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        toast.success(`${data.synced} certification(s) synchronisée(s)`);
        setCerts(data.all || []);
      } else {
        toast.error(data.error || "Erreur");
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#0f4382]" />
      </div>
    );
  }

  const sources = [
    { id: "sonac", name: "SONAC", desc: "Société Nationale d'Avitaillement (Sénégal)" },
    { id: "halal", name: "Halal", desc: "Certification Halal internationale" },
    { id: "bio", name: "Bio", desc: "Agriculture biologique (UE/CEDEAO)" },
    { id: "iso", name: "ISO 22000", desc: "Sécurité des denrées alimentaires" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0f4382]">Certifications officielles</h1>
        <p className="text-[#6B7280] mt-2">
          Synchronisez automatiquement vos certifications depuis les registres officiels.
        </p>
      </div>

      {/* Sync sources */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sources.map((s) => (
          <Card key={s.id}>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <Building2 className="size-8 text-[#0f4382]" />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={syncing}
                  onClick={() => handleSync(s.id)}
                >
                  {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  <span className="ml-1">Sync</span>
                </Button>
              </div>
              <div>
                <div className="font-semibold text-[#0f4382]">{s.name}</div>
                <p className="text-xs text-[#6B7280] mt-0.5">{s.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0f4382] flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Mes certifications ({certs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certs.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="size-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[#6B7280]">Aucune certification synchronisée.</p>
              <p className="text-sm text-gray-400 mt-1">Cliquez sur "Sync" ci-dessus pour interroger les registres officiels.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certs.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isExpiringSoon = c.expiresAt && !isExpired && (new Date(c.expiresAt).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
                return (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="uppercase text-xs">{c.source}</Badge>
                        <span className="font-mono text-xs text-[#6B7280]">{c.certNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className={`flex items-center gap-1 ${isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-[#6B7280]"}`}>
                          <Calendar className="size-3.5" />
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("fr-FR") : "—"}
                        </span>
                        <span className="text-[#6B7280]">
                          Sync: {new Date(c.lastSyncedAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    <Badge className={
                      isExpired ? "bg-red-100 text-red-700" :
                      isExpiringSoon ? "bg-amber-100 text-amber-700" :
                      "bg-emerald-100 text-emerald-700"
                    }>
                      {isExpired ? "Expirée" : isExpiringSoon ? "Expire bientôt" : "Valide"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
