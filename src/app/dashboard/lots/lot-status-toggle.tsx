"use client";

import { useRouter } from "next/navigation";
import { AlertOctagon, CheckCircle2 } from "lucide-react";
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

export function LotStatusToggle({
  lotId,
  currentStatus,
}: {
  lotId: string;
  currentStatus: "active" | "recalled";
}) {
  const router = useRouter();
  const isRecalled = currentStatus === "recalled";
  const newStatus = isRecalled ? "active" : "recalled";

  async function onToggle() {
    const res = await fetch(`/api/lots/${lotId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      toast.error("Erreur lors du changement de statut");
      return;
    }
    toast.success(
      newStatus === "recalled"
        ? "Lot marqué comme rappelé"
        : "Lot réactivé"
    );
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant={isRecalled ? "outline" : "destructive"}
          className={isRecalled ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : ""}
        >
          {isRecalled ? (
            <>
              <CheckCircle2 className="mr-2 size-4" />
              Réactiver
            </>
          ) : (
            <>
              <AlertOctagon className="mr-2 size-4" />
              Rappeler
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRecalled ? "Réactiver ce lot ?" : "Marquer ce lot comme rappelé ?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRecalled
              ? "Le lot sera à nouveau visible comme authentique et actif pour les consommateurs."
              : "Ce lot sera marqué comme rappelé. Les consommateurs qui scanneront le QR code verront un avertissement rouge. À utiliser en cas de retrait produit."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onToggle}
            className={isRecalled ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
          >
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
