"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Package,
  Layers,
  Eye,
  ShieldCheck,
  Calendar,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ExportPage() {
  const [scansLoading, setScansLoading] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const downloadFile = (url: string, fallbackFilename?: string) => {
    const link = document.createElement("a");
    link.href = url;
    if (fallbackFilename) link.download = fallbackFilename;
    link.click();
  };

  const handleExportProducts = () => {
    toast.info("Génération de l'export des produits...");
    downloadFile("/api/export/products");
  };

  const handleExportLots = () => {
    toast.info("Génération de l'export des lots...");
    downloadFile("/api/export/lots");
  };

  const handleExportScans = async () => {
    setScansLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const url = `/api/export/scans${params.toString() ? `?${params.toString()}` : ""}`;
      toast.info("Génération de l'export des scans...");
      downloadFile(url);
    } finally {
      setScansLoading(false);
    }
  };

  const handleExportCompliance = async () => {
    setComplianceLoading(true);
    try {
      const res = await fetch("/api/export/compliance");
      if (!res.ok) {
        toast.error("Erreur lors de la génération du rapport");
        return;
      }
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success("Rapport de conformité ouvert dans un nouvel onglet");
    } finally {
      setComplianceLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Download className="size-7 text-emerald-600" />
          Export de données
        </h1>
        <p className="mt-1 text-gray-600">
          Téléchargez vos données en CSV, ou générez un rapport de conformité imprimable.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Products export */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Package className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Liste des produits</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Export complet de tous vos produits avec catégorie, marque, poids,
                  nombre de lots et date de création.
                </p>
                <Badge variant="outline" className="mt-2 border-emerald-200 text-emerald-700">
                  Format CSV
                </Badge>
                <Button
                  onClick={handleExportProducts}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="size-4 mr-2" />
                  Exporter les produits
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lots export */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Layers className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Historique des lots</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Export de tous vos lots avec dates de fabrication/péremption, statut,
                  lieux et nombre de QR codes générés.
                </p>
                <Badge variant="outline" className="mt-2 border-emerald-200 text-emerald-700">
                  Format CSV
                </Badge>
                <Button
                  onClick={handleExportLots}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="size-4 mr-2" />
                  Exporter les lots
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scans export */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Eye className="size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Statistiques de scans</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Historique détaillé des scans : date, heure, produit, lot, appareil,
                  localisation. Filtrable par période.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <Label className="text-xs text-gray-500">Date début</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Date fin</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                </div>
                <Badge variant="outline" className="mt-2 border-emerald-200 text-emerald-700">
                  Format CSV
                </Badge>
                <Button
                  onClick={handleExportScans}
                  disabled={scansLoading}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  {scansLoading ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="size-4 mr-2" />
                  )}
                  Exporter les scans
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance report */}
        <Card className="vs-card-shadow border-emerald-100 ring-2 ring-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="size-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Rapport de conformité</h3>
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Officiel</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Document officiel attestant de la traçabilité de vos produits.
                  Présentable aux autorités sanitaires et services de contrôle (douanes, ANSD).
                </p>
                <Badge variant="outline" className="mt-2 border-emerald-200 text-emerald-700">
                  <FileText className="size-3 mr-1" />
                  Format PDF (impression)
                </Badge>
                <Button
                  onClick={handleExportCompliance}
                  disabled={complianceLoading}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  {complianceLoading ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4 mr-2" />
                  )}
                  Générer le rapport
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="bg-emerald-50/50 border-emerald-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Calendar className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium text-emerald-800 mb-1">Exports planifiés (V2 - bientôt disponible)</p>
              <p>
                Bénéficiez d'exports automatiques envoyés par email chaque semaine ou chaque mois.
                Cette fonctionnalité sera disponible avec le plan Pro et Enterprise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
