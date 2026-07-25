"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function B2BQuoteButton({
  fabricantId,
  productName,
}: {
  fabricantId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form, setForm] = useState({
    quantity: "500",
    message: `Bonjour, je souhaite recevoir un devis pour ${productName}.`,
  });

  async function submit() {
    setLoading(true);
    try {
      // Étape 1: créer une conversation
      const res = await fetch("/api/b2b/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fabricantId,
          content: `${form.message}\n\nQuantité souhaitée : ${form.quantity} unités`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Demande envoyée ! Le fabricant vous répondra bientôt.");
        setOpen(false);
        // Redirige vers le dashboard B2B
        setTimeout(() => router.push("/dashboard/b2b"), 1000);
      } else {
        // Si non connecté ou pas distributeur
        if (data.error?.includes("distributeur") || data.error?.includes("Réservé")) {
          toast.error("Vous devez être connecté en tant que distributeur pour demander un devis.");
          setTimeout(() => router.push("/register?role=distributor"), 1500);
        } else {
          toast.error(data.error || "Erreur");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 flex-1">
          <MessageSquare className="size-3.5 mr-1" /> Devis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Demander un devis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Quantité souhaitée</Label>
            <Input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <Label>Message au fabricant</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
            />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <MessageSquare className="size-4 mr-2" />}
            Envoyer la demande
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Vous devez être inscrit en tant que distributeur vérifié.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
