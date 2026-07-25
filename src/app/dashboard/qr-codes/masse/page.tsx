"use client";

import { useEffect, useState } from "react";
import { Layers3, Palette, Loader2, CheckCircle2, AlertCircle, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type Lot = {
  id: string;
  lotNumber: string;
  status: string;
  product: { name: string; brand: string };
  qrCodes: { id: string; qrCodeImageUrl: string | null }[];
};

type GeneratedQr = {
  lotId: string;
  lotNumber: string;
  productName: string;
  brand: string;
  qrCodeDataUrl: string;
  qrCodeId: string;
};

const PRESET_COLORS = [
  { name: "Émeraude", fg: "#065f46", bg: "#ffffff" },
  { name: "Ambre", fg: "#b45309", bg: "#ffffff" },
  { name: "Rouge", fg: "#b91c1c", bg: "#ffffff" },
  { name: "Bleu nuit", fg: "#1e3a8a", bg: "#ffffff" },
  { name: "Violet", fg: "#6b21a8", bg: "#ffffff" },
  { name: "Noir", fg: "#000000", bg: "#ffffff" },
];

export default function GenerationMassePage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fgColor, setFgColor] = useState("#065f46");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedQr[]>([]);
  const [labelLayout, setLabelLayout] = useState<"a4_10" | "a4_24" | "a4_40" | "a4_6">("a4_10");

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lots");
      if (res.ok) {
        const data = await res.json();
        setLots(data.lots || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === lots.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(lots.map((l) => l.id)));
    }
  };

  const handleGenerate = async () => {
    if (selected.size === 0) {
      toast.error("Veuillez sélectionner au moins un lot");
      return;
    }
    setGenerating(true);
    setGenerated([]);
    try {
      const res = await fetch("/api/qrcodes/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotIds: Array.from(selected),
          customization: { fgColor, bgColor },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la génération");
        return;
      }
      setGenerated(data.qrCodes);
      toast.success(`${data.count} QR codes générés avec succès !`);
      fetchLots();
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateLabels = async () => {
    if (selected.size === 0) {
      toast.error("Veuillez sélectionner au moins un lot");
      return;
    }
    try {
      const res = await fetch("/api/qrcodes/labels-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotIds: Array.from(selected),
          layout: labelLayout,
          paperSize: "a4",
          cutLines: true,
          includeLotNumber: true,
          includeProductName: true,
          includeBrand: true,
          fgColor,
        }),
      });
      if (!res.ok) {
        toast.error("Erreur lors de la génération de la planche");
        return;
      }
      const html = await res.text();
      // Open in new tab
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success("Planche d'étiquettes ouverte dans un nouvel onglet");
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau");
    }
  };

  const downloadQr = (qr: GeneratedQr) => {
    const link = document.createElement("a");
    link.href = qr.qrCodeDataUrl;
    link.download = `QR-${qr.lotNumber}.png`;
    link.click();
  };

  const downloadAll = () => {
    generated.forEach((qr, i) => {
      setTimeout(() => downloadQr(qr), i * 200);
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Layers3 className="size-7 text-emerald-600" />
          Génération en masse
        </h1>
        <p className="mt-1 text-gray-600">
          Générez et personnalisez vos QR codes par lot, ou créez une planche d'étiquettes imprimable.
        </p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList className="bg-white border border-emerald-100">
          <TabsTrigger value="generate" className="data-[state=active]:bg-emerald-50">
            Génération en masse
          </TabsTrigger>
          <TabsTrigger value="labels" className="data-[state=active]:bg-emerald-50">
            Planche d'étiquettes PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Customization panel */}
            <Card className="vs-card-shadow border-emerald-100 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="size-5 text-emerald-600" />
                  Personnalisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Couleur du QR code</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setFgColor(c.fg)}
                        className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          fgColor === c.fg
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-200"
                        }`}
                        style={{ color: c.fg }}
                      >
                        <div className="w-full h-6 rounded mb-1" style={{ background: c.fg }} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">Couleur premier plan</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Couleur de fond</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="border-t pt-4">
                  <Label className="text-xs mb-2 block">Aperçu</Label>
                  <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                    <div
                      className="w-32 h-32 rounded-lg flex items-center justify-center text-2xl font-bold"
                      style={{ background: bgColor, color: fgColor }}
                    >
                      QR
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || selected.size === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Layers3 className="size-4 mr-2" />
                      Générer {selected.size} QR code{selected.size > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                {selected.size === 0 && (
                  <p className="text-xs text-amber-600 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="size-3" />
                    Sélectionnez au moins un lot ci-dessous
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Lots selection */}
            <Card className="vs-card-shadow border-emerald-100 lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Lots disponibles ({lots.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    {selected.size === lots.length && lots.length > 0
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : lots.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Aucun lot. Créez d'abord des lots dans la section Lots.
                  </p>
                ) : (
                  <div className="max-h-[480px] overflow-y-auto vs-scroll space-y-2 pr-1">
                    {lots.map((lot) => {
                      const isSelected = selected.has(lot.id);
                      const hasQr = lot.qrCodes.some((q) => q.qrCodeImageUrl && q.isActive !== false);
                      return (
                        <label
                          key={lot.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50"
                              : "border-gray-100 hover:border-emerald-200"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(lot.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {lot.product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {lot.lotNumber} · {lot.product.brand}
                            </p>
                          </div>
                          {hasQr && (
                            <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                              QR existant
                            </Badge>
                          )}
                          {lot.status === "recalled" && (
                            <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                              Rappelé
                            </Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated QR codes */}
          {generated.length > 0 && (
            <Card className="vs-card-shadow border-emerald-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    QR codes générés ({generated.length})
                  </CardTitle>
                  <Button onClick={downloadAll} variant="outline" size="sm">
                    <Download className="size-4 mr-2" />
                    Tout télécharger
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto vs-scroll">
                  {generated.map((qr) => (
                    <div
                      key={qr.qrCodeId}
                      className="flex flex-col items-center p-3 rounded-lg border border-emerald-100 bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qr.qrCodeDataUrl}
                        alt={qr.lotNumber}
                        className="w-24 h-24 object-contain"
                      />
                      <p className="mt-2 text-xs font-medium text-gray-900 truncate w-full text-center">
                        {qr.productName}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">{qr.lotNumber}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full text-xs h-7"
                        onClick={() => downloadQr(qr)}
                      >
                        <Download className="size-3 mr-1" />
                        PNG
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="labels" className="space-y-6 mt-4">
          <Card className="vs-card-shadow border-emerald-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-emerald-600" />
                Génération de planche d'étiquettes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-medium text-emerald-800 mb-1">Comment ça marche ?</p>
                <p>
                  Sélectionnez vos lots, choisissez une mise en page, puis cliquez sur générer.
                  Une page HTML s'ouvrira dans un nouvel onglet, prête à imprimer ou à enregistrer en PDF.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Mise en page</Label>
                <Select value={labelLayout} onValueChange={(v: any) => setLabelLayout(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4_6">A4 · 6 étiquettes (90×80mm) — Grandes étiquettes</SelectItem>
                    <SelectItem value="a4_10">A4 · 10 étiquettes (90×50mm) — Format standard</SelectItem>
                    <SelectItem value="a4_24">A4 · 24 étiquettes (60×30mm) — Format compact</SelectItem>
                    <SelectItem value="a4_40">A4 · 40 étiquettes (45×25mm) — Format mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Couleur du QR code</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-9 p-1 cursor-pointer"
                  />
                  <span className="text-sm font-mono text-gray-600">{fgColor}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-700 mb-2">
                  Lots sélectionnés : <span className="font-semibold">{selected.size}</span>
                </p>
                <Button
                  onClick={handleGenerateLabels}
                  disabled={selected.size === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <FileText className="size-4 mr-2" />
                  Générer la planche d'étiquettes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
