"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Result = {
  rowIndex: number;
  ok: boolean;
  error?: string;
  id?: string;
  name?: string;
  lotNumber?: string;
};

type Summary = {
  totalRows: number;
  inserted: number;
  failed: number;
  results: Result[];
};

type Mode = "products" | "lots";

export default function ImportPage({ mode }: { mode: Mode }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isProducts = mode === "products";
  const endpoint = isProducts ? "/api/products/import" : "/api/lots/import";
  const pageTitle = isProducts ? "Importer des produits" : "Importer des lots";
  const pageDesc = isProducts
    ? "Ajoutez plusieurs produits en une seule fois depuis un fichier CSV ou Excel (.xlsx, .xls)."
    : "Ajoutez plusieurs lots en une seule fois depuis un fichier CSV ou Excel (.xlsx, .xls).";
  const entityLabel = isProducts ? "produit" : "lot";

  const sampleColumns = isProducts
    ? ["name", "brand", "category", "description", "weight", "barcode", "variety", "region", "gpsLat", "gpsLng"]
    : ["productName", "lotNumber", "manufacturingDate", "expirationDate", "ingredients", "manufacturingLocation", "salesCountries"];

  function handleFileChange(f: File | null) {
    const name = (f?.name || "").toLowerCase();
    if (f && !name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Format non supporté. Acceptés : .csv, .xlsx, .xls");
      return;
    }
    setFile(f);
    setSummary(null);
  }

  async function handleUpload() {
    if (!file) {
      toast.error("Sélectionnez un fichier");
      return;
    }
    setLoading(true);
    setSummary(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'import");
      setSummary(data.summary);
      if (data.summary.failed === 0) {
        toast.success(`${data.summary.inserted} ${entityLabel}(s) importé(s) avec succès`);
      } else if (data.summary.inserted > 0) {
        toast.warning(
          `${data.summary.inserted} importé(s), ${data.summary.failed} en erreur — voir le détail ci-dessous`
        );
      } else {
        toast.error("Aucune ligne n'a pu être importée. Voir le détail ci-dessous.");
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const header = sampleColumns.join(",");
    const example = isProducts
      ? "Mangue Kent,Soprim,Fruits,\",30,6112345678905,Kent,Casamance,12.5,-16.5"
      : "Mangue Kent,LOT-20260728-0001,2026-07-01,2026-07-15,\"Mangue fraîche\",Dakar,\"Sénégal,Mali\"";
    const csv = `${header}\n${example}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isProducts ? "modele-import-produits.csv" : "modele-import-lots.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={isProducts ? "/dashboard/produits" : "/dashboard/lots"}>
            <ArrowLeft className="size-4 mr-1" />
            Retour
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-[#0f4382]">{pageTitle}</h1>
        <p className="text-[#6B7280] mt-2">{pageDesc}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column: upload + results */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="vs-card-shadow">
            <CardHeader>
              <CardTitle className="text-[#0f4382] flex items-center gap-2">
                <FileSpreadsheet className="size-5" />
                Fichier à importer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Upload className="mr-2 size-4" />
                  {file ? "Changer le fichier" : "Choisir un fichier"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 flex-1 min-w-0">
                    <FileText className="size-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700 ml-1 flex-shrink-0"
                      aria-label="Retirer le fichier"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 size-4" />
                      Importer le fichier
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-2 size-4" />
                  Modèle CSV
                </Button>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3 border border-gray-200">
                <p className="font-semibold text-gray-700 mb-1">Contraintes :</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>Formats acceptés : <code>.csv</code>, <code>.xlsx</code>, <code>.xls</code></li>
                  <li>Taille maximale : 5 MB</li>
                  <li>Nombre maximal de lignes : 500 par import</li>
                  <li>La première ligne doit contenir les en-têtes de colonnes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#0f4382] flex items-center gap-2">
                  <CheckCircle2 className="size-5" />
                  Résultats de l'import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{summary.totalRows}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Lignes traitées</div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{summary.inserted}</div>
                    <div className="text-xs text-emerald-600 mt-0.5">Importés</div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                    <div className="text-2xl font-bold text-red-700">{summary.failed}</div>
                    <div className="text-xs text-red-600 mt-0.5">En erreur</div>
                  </div>
                </div>

                {summary.results.length > 0 && (
                  <div className="max-h-96 overflow-y-auto vs-scroll border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-semibold text-gray-700">Ligne</th>
                          <th className="px-3 py-2 font-semibold text-gray-700">Statut</th>
                          <th className="px-3 py-2 font-semibold text-gray-700">Détail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.results.map((r) => (
                          <tr key={r.rowIndex} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-500">#{r.rowIndex}</td>
                            <td className="px-3 py-2">
                              {r.ok ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                  OK
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                  Erreur
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {r.ok ? (
                                <span>
                                  {isProducts
                                    ? `Produit créé : ${r.name}`
                                    : `Lot créé : ${r.lotNumber}`}
                                </span>
                              ) : (
                                <span className="text-red-700 flex items-start gap-1">
                                  <AlertCircle className="size-3.5 mt-0.5 flex-shrink-0" />
                                  {r.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side column: column guide */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-[#0f4382] text-base">Colonnes attendues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-xs text-gray-500">
              Les en-têtes sont <strong>insensibles à la casse</strong>. Noms français ou anglais acceptés.
            </p>
            <div className="space-y-1.5">
              {sampleColumns.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-gray-50 border border-gray-200"
                >
                  <code className="text-blue-700 font-mono">{col}</code>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <p className="font-semibold flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {isProducts ? "Catégorie" : "Produit"}
              </p>
              <p className="mt-1">
                {isProducts
                  ? "Vous pouvez indiquer le nom de la catégorie (ex: \"Fruits de mer\") ou son ID."
                  : "Le nom du produit doit correspondre exactement à un produit déjà créé dans votre compte."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
