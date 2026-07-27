"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Building2,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  AlertCircle,
  Plus,
  CheckCircle2,
  CloudUpload,
} from "lucide-react";
import { toast } from "sonner";

/* ============================ Types ============================ */

type ManualCert = {
  id: string;
  type: string;
  issuer: string;
  certificateNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  documentUrl: string | null;
  verified: boolean;
  verificationMethod: string | null;
  createdAt: string;
};

type SyncedCert = {
  id: string;
  source: string;
  externalId: string;
  certNumber: string | null;
  expiresAt: string | null;
  status: string;
  lastSyncedAt: string;
};

/* ============================ Constants ============================ */

const CERT_TYPES: { value: string; label: string; desc: string }[] = [
  { value: "phytosanitaire", label: "Phytosanitaire", desc: "Certificat phytosanitaire (UE/CEDEAO)" },
  { value: "globalgap",      label: "GlobalG.A.P.",   desc: "Bonne pratiques agricoles" },
  { value: "bio",            label: "Bio",            desc: "Agriculture biologique (UE/CEDEAO)" },
  { value: "origine",        label: "Origine",        desc: "Certificat d'origine / préférence tarifaire" },
  { value: "haccp",          label: "HACCP",          desc: "Analyse des dangers – points critiques" },
  { value: "iso22000",       label: "ISO 22000",      desc: "Sécurité des denrées alimentaires" },
  { value: "halal",          label: "Halal",          desc: "Certification Halal internationale" },
  { value: "fda",            label: "FDA",            desc: "Food and Drug Administration (USA)" },
  { value: "nsf",            label: "NSF",            desc: "NSF International" },
  { value: "cedeao",         label: "CEDEAO",         desc: "Norme régionale ouest-africaine" },
];

const CERT_TYPE_LABEL: Record<string, string> = CERT_TYPES.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {} as Record<string, string>
);

/* ============================ Helpers ============================ */

function formatDateSafe(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/* ============================ Component ============================ */

export default function CertificationsPage() {
  const [syncedCerts, setSyncedCerts] = useState<SyncedCert[]>([]);
  const [manualCerts, setManualCerts] = useState<ManualCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "phytosanitaire",
    issuer: "",
    certificateNumber: "",
    issuedAt: "",
    expiresAt: "",
    documentUrl: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ----- Load both lists on mount ----- */
  const load = async () => {
    setLoading(true);
    try {
      const [syncRes, manualRes] = await Promise.all([
        fetch("/api/certifications/sync"),
        fetch("/api/certifications"),
      ]);
      const syncData = await syncRes.json();
      const manualData = await manualRes.json();
      setSyncedCerts(syncData.certifications || []);
      setManualCerts(manualData.certifications || []);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ----- Sync official sources ----- */
  const handleSync = async (source: string) => {
    setSyncing(true);
    try {
      const r = await fetch(`/api/certifications/sync?source=${source}`, { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        toast.success(`${data.synced || 0} certification(s) synchronisée(s)`);
        setSyncedCerts(data.all || []);
      } else {
        toast.error(data.error || "Erreur");
      }
    } finally {
      setSyncing(false);
    }
  };

  /* ----- Upload PDF ----- */
  async function uploadPdf(file: File): Promise<string | null> {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF trop volumineux (max 10 MB)");
      return null;
    }
    if (file.type !== "application/pdf") {
      toast.error("Le fichier doit être un PDF");
      return null;
    }
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "pdf");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      return data.url as string;
    } catch (e: any) {
      toast.error(e.message || "Erreur d'upload PDF");
      return null;
    } finally {
      setUploadingPdf(false);
    }
  }

  /* ----- Submit manual cert ----- */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.issuer.trim()) {
      toast.error("Veuillez indiquer l'organisme émetteur");
      return;
    }

    setSubmitting(true);

    let finalDocUrl = form.documentUrl.trim();

    // If a PDF file was selected, upload it first
    if (pdfFile) {
      const uploadedUrl = await uploadPdf(pdfFile);
      if (!uploadedUrl) {
        setSubmitting(false);
        return;
      }
      finalDocUrl = uploadedUrl;
    }

    try {
      const res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          issuer: form.issuer.trim(),
          certificateNumber: form.certificateNumber.trim() || undefined,
          issuedAt: form.issuedAt || undefined,
          expiresAt: form.expiresAt || undefined,
          documentUrl: finalDocUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      toast.success("Certificat ajouté");
      setManualCerts((c) => [data.certification, ...c]);
      // Reset form
      setForm({
        type: "phytosanitaire",
        issuer: "",
        certificateNumber: "",
        issuedAt: "",
        expiresAt: "",
        documentUrl: "",
      });
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  /* ----- Delete manual cert ----- */
  async function onDelete(id: string) {
    if (!confirm("Supprimer ce certificat ? Le PDF associé ne sera plus accessible depuis la page produit.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/certifications/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setManualCerts((c) => c.filter((x) => x.id !== id));
      toast.success("Certificat supprimé");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  /* ============================ Render ============================ */

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-[#0f4382]" />
      </div>
    );
  }

  const sources = [
    { id: "sonac",  name: "SONAC",  desc: "Société Nationale d'Avitaillement (Sénégal)" },
    { id: "halal",  name: "Halal",  desc: "Certification Halal internationale" },
    { id: "bio",    name: "Bio",    desc: "Agriculture biologique (UE/CEDEAO)" },
    { id: "iso",    name: "ISO 22000", desc: "Sécurité des denrées alimentaires" },
  ];

  return (
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0f4382]">
          Certifications & Documents officiels
        </h1>
        <p className="text-[#6B7280] mt-2">
          Téléversez vos certificats en PDF (ils seront visibles sur la page produit scannée par QR code)
          et synchronisez automatiquement les registres officiels.
        </p>
      </div>

      {/* ============ Section 1: Upload manuel de PDF ============ */}
      <Card className="vs-card-shadow border-emerald-100">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-t-lg">
          <CardTitle className="text-[#0f4382] flex items-center gap-2">
            <CloudUpload className="size-5" />
            Mes certificats PDF ({manualCerts.length})
          </CardTitle>
          <p className="text-sm text-[#6B7280] mt-1">
            Ajoutez vos certificats scannés (PDF, max 10 MB). Ils apparaîtront en téléchargement sur la page produit.
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Toggle button */}
          {!showForm && (
            <Button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 size-4" />
              Ajouter un certificat
            </Button>
          )}

          {/* Upload form */}
          {showForm && (
            <form onSubmit={onSubmit} className="space-y-4 border border-emerald-200 rounded-lg p-4 bg-emerald-50/40">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="type">Type de certificat *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CERT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{t.label}</span>
                            <span className="text-xs text-gray-500">{t.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Issuer */}
                <div className="space-y-1.5">
                  <Label htmlFor="issuer">Organisme émetteur *</Label>
                  <Input
                    id="issuer"
                    placeholder="Ex : Ministère de l'Agriculture, SGS, Bureau Veritas..."
                    value={form.issuer}
                    onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>

                {/* Certificate number */}
                <div className="space-y-1.5">
                  <Label htmlFor="certificateNumber">N° de certificat</Label>
                  <Input
                    id="certificateNumber"
                    placeholder="Ex : SN-2026-PHYTO-001234"
                    value={form.certificateNumber}
                    onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })}
                    className="bg-white"
                  />
                </div>

                {/* Issued at */}
                <div className="space-y-1.5">
                  <Label htmlFor="issuedAt">Date d'émission</Label>
                  <Input
                    id="issuedAt"
                    type="date"
                    value={form.issuedAt}
                    onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                    className="bg-white"
                  />
                </div>

                {/* Expires at */}
                <div className="space-y-1.5">
                  <Label htmlFor="expiresAt">Date d'expiration</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* PDF upload */}
              <div className="space-y-2">
                <Label>Fichier PDF (max 10 MB)</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    {uploadingPdf ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Téléversement...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 size-4" />
                        {pdfFile ? "Changer le PDF" : "Choisir un PDF"}
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setPdfFile(f);
                    }}
                  />
                  {pdfFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 px-3 py-1 rounded-md bg-blue-50 border border-blue-200">
                      <FileText className="size-4 text-blue-600" />
                      <span className="truncate max-w-[280px]">{pdfFile.name}</span>
                      <span className="text-xs text-gray-500">({Math.round(pdfFile.size / 1024)} KB)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-red-500 hover:text-red-700 ml-1"
                        aria-label="Retirer le PDF"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Ou collez une URL externe si le PDF est déjà hébergé :
                </p>
                <Input
                  type="url"
                  placeholder="https://exemple.com/certificat.pdf"
                  value={form.documentUrl}
                  onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                  disabled={!!pdfFile}
                  className="bg-white"
                />
                {pdfFile && form.documentUrl && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    Le fichier sélectionné remplace l'URL externe.
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={submitting || uploadingPdf}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 size-4" />
                      Enregistrer le certificat
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setForm({
                      type: "phytosanitaire",
                      issuer: "",
                      certificateNumber: "",
                      issuedAt: "",
                      expiresAt: "",
                      documentUrl: "",
                    });
                    setPdfFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {/* List of manual certs */}
          {manualCerts.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-gray-300">
              <FileText className="size-12 text-gray-300 mx-auto mb-2" />
              <p className="text-[#6B7280]">Aucun certificat PDF ajouté pour le moment.</p>
              <p className="text-sm text-gray-400 mt-1">
                Cliquez sur « Ajouter un certificat » pour téléverser votre premier PDF.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {manualCerts.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isExpiringSoon =
                  c.expiresAt &&
                  !isExpired &&
                  new Date(c.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="size-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="uppercase text-xs font-semibold border-[#0f4382] text-[#0f4382]"
                          >
                            {CERT_TYPE_LABEL[c.type] || c.type}
                          </Badge>
                          {c.verified ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              <CheckCircle2 className="size-3 mr-1" /> Vérifié
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              En attente
                            </Badge>
                          )}
                          {c.certificateNumber && (
                            <span className="text-xs font-mono text-gray-500">
                              {c.certificateNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{c.issuer}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                          {c.issuedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              Émis : {formatDateSafe(c.issuedAt)}
                            </span>
                          )}
                          {c.expiresAt && (
                            <span
                              className={`flex items-center gap-1 ${
                                isExpired
                                  ? "text-red-600 font-medium"
                                  : isExpiringSoon
                                    ? "text-amber-600 font-medium"
                                    : ""
                              }`}
                            >
                              <Calendar className="size-3" />
                              Expire : {formatDateSafe(c.expiresAt)}
                              {isExpired && " (expiré)"}
                              {isExpiringSoon && " (bientôt)"}
                            </span>
                          )}
                        </div>
                        {c.documentUrl && (
                          <a
                            href={c.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline mt-2"
                          >
                            <ExternalLink className="size-3" />
                            Voir / Télécharger le PDF
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={deletingId === c.id || c.verified}
                      onClick={() => onDelete(c.id)}
                      className="text-red-600 hover:bg-red-50 flex-shrink-0"
                      title={
                        c.verified
                          ? "Certificat vérifié — suppression désactivée"
                          : "Supprimer"
                      }
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info note */}
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Bon à savoir</p>
              <p className="mt-0.5">
                Les certificats ajoutés manuellement sont marqués « En attente » jusqu'à vérification
                par notre équipe. Ils restent visibles et téléchargeables sur la page produit publique.
                Les certificats vérifiés ne peuvent plus être supprimés (contactez le support).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ Section 2: Sync sources (auto) ============ */}
      <Card className="vs-card-shadow">
        <CardHeader>
          <CardTitle className="text-[#0f4382] flex items-center gap-2">
            <RefreshCw className="size-5" />
            Synchronisation automatique des registres officiels
          </CardTitle>
          <p className="text-sm text-[#6B7280] mt-1">
            Interrogez automatiquement les registres des organismes certificateurs partenaires.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sources.map((s) => (
              <Card key={s.id} className="border-blue-100">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Building2 className="size-8 text-[#0f4382]" />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncing}
                      onClick={() => handleSync(s.id)}
                    >
                      {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      <span className="ml-1">Sync</span>
                    </Button>
                  </div>
                  <div>
                    <div className="font-semibold text-[#0f4382]">{s.name}</div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {syncedCerts.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-semibold text-gray-700">
                Certifications synchronisées ({syncedCerts.length})
              </p>
              {syncedCerts.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isExpiringSoon =
                  c.expiresAt &&
                  !isExpired &&
                  new Date(c.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="uppercase text-xs">
                          {c.source}
                        </Badge>
                        <span className="font-mono text-xs text-[#6B7280]">
                          {c.certNumber || c.externalId}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs">
                        <span
                          className={`flex items-center gap-1 ${
                            isExpired
                              ? "text-red-600"
                              : isExpiringSoon
                                ? "text-amber-600"
                                : "text-[#6B7280]"
                          }`}
                        >
                          <Calendar className="size-3" />
                          {c.expiresAt ? formatDateSafe(c.expiresAt) : "—"}
                        </span>
                        <span className="text-[#6B7280]">
                          Sync : {formatDateSafe(c.lastSyncedAt)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={
                        isExpired
                          ? "bg-red-100 text-red-700 hover:bg-red-100"
                          : isExpiringSoon
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      }
                    >
                      {isExpired ? "Expirée" : isExpiringSoon ? "Expire bientôt" : "Valide"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ Footer info ============ */}
      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 p-4 flex items-start gap-3">
        <ShieldCheck className="size-5 text-[#0f4382] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-semibold text-[#0f4382]">Pourquoi ajouter des certificats ?</p>
          <p className="mt-1">
            Les certificats PDF téléversés apparaissent automatiquement sur la page produit publique
            (section « Certifications & Documents »), avec un lien de téléchargement direct.
            Ils rassurent les acheteurs et distributeurs, et facilitent l'export vers l'UE, la CEDEAO
            et les États-Unis.
          </p>
        </div>
      </div>
    </div>
  );
}
