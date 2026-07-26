"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Award, Plus, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

type Cert = {
  id: string;
  type: string;
  issuer: string;
  certificateNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  verified: boolean;
  verificationMethod: string | null;
};

const typeLabels: Record<string, string> = {
  bio: "Bio",
  halal: "Halal",
  iso22000: "ISO 22000",
  fda: "FDA",
  haccp: "HACCP",
  nsf: "NSF",
  cedeao: "CEDEAO",
};

const typeColors: Record<string, string> = {
  bio: "bg-green-100 text-green-700",
  halal: "bg-emerald-100 text-emerald-700",
  iso22000: "bg-blue-100 text-blue-700",
  fda: "bg-purple-100 text-purple-700",
  haccp: "bg-orange-100 text-orange-700",
  nsf: "bg-cyan-100 text-cyan-700",
  cedeao: "bg-amber-100 text-amber-700",
};

export function CertificationsManager({ initialCertifications }: { initialCertifications: Cert[] }) {
  const [certs, setCerts] = useState(initialCertifications);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "halal",
    issuer: "",
    certificateNumber: "",
    issuedAt: "",
    expiresAt: "",
    documentUrl: "",
  });

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          issuedAt: form.issuedAt || null,
          expiresAt: form.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Certification ajoutée. Vérification en cours (48h max).");
        setCerts([{
          id: data.certification.id,
          type: data.certification.type,
          issuer: data.certification.issuer,
          certificateNumber: data.certification.certificateNumber,
          issuedAt: data.certification.issuedAt ? new Date(data.certification.issuedAt).toISOString() : null,
          expiresAt: data.certification.expiresAt ? new Date(data.certification.expiresAt).toISOString() : null,
          verified: data.certification.verified,
          verificationMethod: data.certification.verificationMethod,
        }, ...certs]);
        setOpen(false);
        setForm({
          type: "halal",
          issuer: "",
          certificateNumber: "",
          issuedAt: "",
          expiresAt: "",
          documentUrl: "",
        });
      } else {
        toast.error(data.error || "Erreur");
      }
    } finally {
      setLoading(false);
    }
  }

  function getDaysToExpiry(expiresAt: string | null): number | null {
    if (!expiresAt) return null;
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{certs.length} certification(s)</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-3.5 mr-1" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter une certification</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Organisme émetteur</Label>
                <Input
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  placeholder="ex: COSMOS Bio, SGS, Bureau Veritas"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>N° certificat</Label>
                  <Input
                    value={form.certificateNumber}
                    onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>URL document</Label>
                  <Input
                    value={form.documentUrl}
                    onChange={(e) => setForm({ ...form, documentUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Date d'émission</Label>
                  <Input
                    type="date"
                    value={form.issuedAt}
                    onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date d'expiration</Label>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={submit} disabled={loading || !form.issuer} className="w-full">
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Award className="size-4 mr-2" />}
                Soumettre pour vérification
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {certs.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <Award className="size-12 mx-auto mb-2 text-amber-400" />
          <p className="text-sm">Aucune certification. Ajoutez-en pour gagner la confiance des consommateurs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {certs.map((c) => {
            const days = getDaysToExpiry(c.expiresAt);
            const expiringSoon = days !== null && days < 90 && days > 0;
            const expired = days !== null && days <= 0;
            return (
              <Card key={c.id} className={`border-l-4 ${expired ? "border-l-red-500" : expiringSoon ? "border-l-amber-500" : c.verified ? "border-l-emerald-500" : "border-l-gray-300"}`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`text-xs ${typeColors[c.type] || "bg-gray-100"}`}>
                          {typeLabels[c.type] || c.type}
                        </Badge>
                        {c.verified ? (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                            <CheckCircle2 className="size-3 mr-1" /> Vérifié
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                            <Loader2 className="size-3 mr-1" /> En attente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{c.issuer}</p>
                      {c.certificateNumber && (
                        <p className="text-xs text-gray-500">N° {c.certificateNumber}</p>
                      )}
                      {c.expiresAt && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${expired ? "text-red-600" : expiringSoon ? "text-amber-600" : "text-gray-500"}`}>
                          <Calendar className="size-3" />
                          {expired ? "Expiré" : "Expire le"} {new Date(c.expiresAt).toLocaleDateString("fr-FR")}
                          {days !== null && days > 0 && expiringSoon && ` (dans ${days}j)`}
                        </p>
                      )}
                      {c.verificationMethod && (
                        <p className="text-xs text-gray-400 mt-1">Vérif: {c.verificationMethod}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
