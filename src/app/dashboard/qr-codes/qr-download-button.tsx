"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function QrCodeDownloadButton({
  qrCodeId,
  lotNumber,
}: {
  qrCodeId: string;
  lotNumber: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/qrcodes/${qrCodeId}/download`);
      if (!res.ok) {
        toast.error("Erreur lors du téléchargement");
        return;
      }
      const data = await res.json();
      if (!data.qrCodeImageUrl) {
        toast.error("QR code introuvable");
        return;
      }
      // Convert data URL to blob and trigger download
      const blob = await (await fetch(data.qrCodeImageUrl)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `verifscan-qr-${lotNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("QR code téléchargé");
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      onClick={onDownload}
      disabled={loading}
      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
    >
      {loading ? (
        <Loader2 className="mr-1 size-3.5 animate-spin" />
      ) : (
        <Download className="mr-1 size-3.5" />
      )}
      PNG
    </Button>
  );
}
