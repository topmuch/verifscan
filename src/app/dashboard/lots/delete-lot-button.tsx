"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

/**
 * Delete lot button with confirmation dialog.
 * Calls DELETE /api/lots/[id] then refreshes the lot list.
 */
export function DeleteLotButton({
  lotId,
  lotNumber,
}: {
  lotId: string;
  lotNumber: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/lots/${lotId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la suppression");
        return;
      }
      toast.success(`Lot ${lotNumber} supprimé`);
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Supprimer ce lot"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce lot ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de supprimer le lot{" "}
            <code className="font-mono text-emerald-700">{lotNumber}</code> ainsi que
            tous ses QR codes et historiques de scans associés. Cette action est
            irréversible. Les éventuels QR codes déjà imprimés ne fonctionneront plus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * "Regenerate QR" button — fixes QR codes that were generated with the
 * wrong base URL (e.g. https://verifscan.sn instead of the actual
 * deployment URL). Calls POST /api/qrcodes/refresh-all for this lot only.
 */
export function RegenerateQrButton({ lotId }: { lotId: string }) {
  const [regenerating, setRegenerating] = useState(false);

  async function onRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/qrcodes/refresh-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotIds: [lotId] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la régénération");
        return;
      }
      if (data.refreshed > 0) {
        toast.success(`QR code régénéré avec l'URL actuelle`);
      } else {
        toast.info("Aucun QR code à régénérer pour ce lot");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
      title="Régénérer le QR code avec l'URL actuelle"
      onClick={onRegenerate}
      disabled={regenerating}
    >
      <RefreshCw className={`size-4 ${regenerating ? "animate-spin" : ""}`} />
    </Button>
  );
}

/**
 * "Regenerate all my QR codes" button — useful when migrating deployments.
 * Calls POST /api/qrcodes/refresh-all without lotIds (refreshes all).
 */
export function RegenerateAllQrButton() {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState(false);

  async function onRegenerateAll() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/qrcodes/refresh-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la régénération");
        return;
      }
      toast.success(
        `${data.refreshed} QR code(s) régénéré(s) avec l'URL actuelle`
      );
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="border-amber-300 text-amber-700 hover:bg-amber-50"
      onClick={onRegenerateAll}
      disabled={regenerating}
    >
      <RefreshCw className={`mr-2 size-4 ${regenerating ? "animate-spin" : ""}`} />
      {regenerating ? "Régénération..." : "Régénérer tous les QR"}
    </Button>
  );
}
