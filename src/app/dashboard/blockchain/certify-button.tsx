"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function BlockchainCertifyButton({ lotId, lotNumber }: { lotId: string; lotNumber: string }) {
  const [loading, setLoading] = useState(false);

  async function certify() {
    setLoading(true);
    try {
      const res = await fetch(`/api/blockchain/certify-lot/${lotId}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Lot ${lotNumber} certifié sur Polygon !`);
        // Recharge la page après 1.5s
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data.error || "Erreur");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={certify} disabled={loading} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
      {loading ? (
        <><Loader2 className="size-3.5 mr-1 animate-spin" /> Certification...</>
      ) : (
        <><ShieldCheck className="size-3.5 mr-1" /> Certifier</>
      )}
    </Button>
  );
}
