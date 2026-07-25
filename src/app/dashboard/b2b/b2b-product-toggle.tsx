"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Store } from "lucide-react";
import { toast } from "sonner";

type Props = {
  product: {
    id: string;
    name: string;
    brand: string;
    categoryName: string;
    b2bInfo: {
      id: string;
      moq: number;
      leadTimeDays: number;
      monthlyCapacity: number | null;
      paymentTerms: string | null;
      isB2BVisible: boolean;
      distributorPriceTiers: string | null;
    } | null;
  };
};

export function B2BProductToggle({ product }: Props) {
  const [enabled, setEnabled] = useState(product.b2bInfo?.isB2BVisible || false);
  const [moq, setMoq] = useState(product.b2bInfo?.moq?.toString() || "100");
  const [leadTime, setLeadTime] = useState(product.b2bInfo?.leadTimeDays?.toString() || "7");
  const [capacity, setCapacity] = useState(product.b2bInfo?.monthlyCapacity?.toString() || "");
  const [paymentTerms, setPaymentTerms] = useState(product.b2bInfo?.paymentTerms || "30 jours net");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/b2b/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          moq: parseInt(moq) || 1,
          leadTimeDays: parseInt(leadTime) || 7,
          monthlyCapacity: capacity ? parseInt(capacity) : null,
          paymentTerms,
          isB2BVisible: enabled,
        }),
      });
      if (res.ok) {
        toast.success(`${product.name} ${enabled ? "activé" : "désactivé"} en B2B`);
      } else {
        toast.error("Erreur");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-sm">{product.name}</span>
            <Badge variant="outline" className="text-xs">{product.categoryName}</Badge>
            {enabled && (
              <Badge className="text-xs bg-orange-100 text-orange-700">B2B actif</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">Marque {product.brand}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`sw-${product.id}`} className="text-xs text-gray-500">B2B</Label>
          <Switch
            id={`sw-${product.id}`}
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      {enabled && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
          <div>
            <Label className="text-xs">MOQ</Label>
            <Input value={moq} onChange={(e) => setMoq(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Délai (jours)</Label>
            <Input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Capacité/mois</Label>
            <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} className="h-8 text-sm" placeholder="ex: 5000" />
          </div>
          <div>
            <Label className="text-xs">Paiement</Label>
            <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
      )}

      {enabled && (
        <Button onClick={save} disabled={saving} size="sm" className="w-full">
          {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Store className="size-3.5 mr-1" />}
          Enregistrer
        </Button>
      )}
    </div>
  );
}
