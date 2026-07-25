"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink, Loader2, CheckCircle2, Boxes } from "lucide-react";

type Certificate = {
  txHash: string;
  blockNumber: number;
  dataHash: string;
  contractAddress: string;
  network: string;
  certifiedAt: string;
};

export function BlockchainBadge({ lotId }: { lotId: string }) {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/blockchain/certificates/${lotId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.certified) {
            setCert({
              txHash: data.certificate.txHash,
              blockNumber: data.certificate.blockNumber,
              dataHash: data.certificate.dataHash,
              contractAddress: data.certificate.contractAddress,
              network: data.certificate.network,
              certifiedAt: data.certificate.certifiedAt,
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [lotId]);

  if (loading) {
    return (
      <Card className="border-indigo-100">
        <CardContent className="p-3 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin text-indigo-500" />
          Vérification blockchain...
        </CardContent>
      </Card>
    );
  }

  if (!cert) return null;

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Boxes className="size-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Certifié sur Polygon Blockchain</h3>
              <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200">
                <CheckCircle2 className="size-3 mr-1" /> Immuable
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Les données de ce lot sont cryptographiquement protégées contre toute modification rétroactive.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-white border border-indigo-100">
            <p className="text-gray-500">Hash données (SHA-256)</p>
            <code className="text-indigo-700 break-all">{cert.dataHash.slice(0, 24)}...</code>
          </div>
          <div className="p-2 rounded bg-white border border-indigo-100">
            <p className="text-gray-500">Bloc Polygon</p>
            <p className="font-semibold text-indigo-700">#{cert.blockNumber.toLocaleString()}</p>
          </div>
        </div>

        <a
          href={`https://polygonscan.com/tx/${cert.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
        >
          <ExternalLink className="size-3" />
          Vérifier sur Polygonscan
        </a>

        <p className="text-xs text-gray-400 italic">
          ⚡ Certification effectuée le {new Date(cert.certifiedAt).toLocaleString("fr-FR")} — Network: {cert.network}
        </p>
      </CardContent>
    </Card>
  );
}
