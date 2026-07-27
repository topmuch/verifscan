"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save,
  Building2,
  AlertCircle,
  Upload,
  Loader2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ParametresPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    whatsapp: "",
    emailContact: "",
    address: "",
    logoUrl: "",
    socialFacebook: "",
    socialTwitter: "",
    socialLinkedin: "",
    socialInstagram: "",
  });

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          companyName: data.companyName || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          emailContact: data.emailContact || "",
          address: data.address || "",
          logoUrl: data.logoUrl || "",
          socialFacebook: data.socialFacebook || "",
          socialTwitter: data.socialTwitter || "",
          socialLinkedin: data.socialLinkedin || "",
          socialInstagram: data.socialInstagram || "",
        });
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, []);

  async function uploadLogo(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 MB)");
      return;
    }
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      setForm((f) => ({ ...f, logoUrl: data.url }));
      toast.success("Logo téléversé !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du téléversement");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setForm({
      companyName: data.companyName || "",
      phone: data.phone || "",
      whatsapp: data.whatsapp || "",
      emailContact: data.emailContact || "",
      address: data.address || "",
      logoUrl: data.logoUrl || "",
      socialFacebook: data.socialFacebook || "",
      socialTwitter: data.socialTwitter || "",
      socialLinkedin: data.socialLinkedin || "",
      socialInstagram: data.socialInstagram || "",
    });
    toast.success("Paramètres enregistrés !");
  }

  if (fetching) {
    return (
      <div className="p-8 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-gray-600">
          Les informations de votre entreprise seront affichées publiquement sur les fiches produits.
        </p>
      </div>

      {/* === Logo upload card === */}
      <Card className="vs-card-shadow border-emerald-100 mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="size-5 text-emerald-600" />
            Logo de l&apos;entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="size-24 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="size-8 text-emerald-300" />
              )}
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-3">
                Le logo s&apos;affiche sur la fiche publique de vos produits. Formats acceptés : JPG, PNG, WebP, SVG (max 5 MB).
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Téléversement...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      Téléverser un logo
                    </>
                  )}
                </Button>
                {form.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setForm({ ...form, logoUrl: "" })}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Retirer
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo(f);
                  e.target.value = "";
                }}
              />
              {form.logoUrl && (
                <p className="text-xs text-gray-500 mt-2 truncate">
                  URL: <code className="bg-gray-100 px-1 rounded">{form.logoUrl}</code>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === Informations entreprise === */}
      <Card className="vs-card-shadow border-emerald-100 mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="size-5 text-emerald-600" />
            Informations entreprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="size-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l&apos;entreprise *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
                className="border-emerald-200 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+221 77 123 45 67"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="+221771234567"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailContact">Email public</Label>
              <Input
                id="emailContact"
                type="email"
                placeholder="contact@entreprise.sn"
                value={form.emailContact}
                onChange={(e) => setForm({ ...form, emailContact: e.target.value })}
                className="border-emerald-200 focus-visible:ring-emerald-500"
              />
              <p className="text-xs text-gray-500">
                Email affiché sur les fiches produits pour que les consommateurs puissent vous contacter.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                placeholder="Rue MZ 12, Zone Industrielle, Dakar, Sénégal"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="border-emerald-200 focus-visible:ring-emerald-500 resize-none"
              />
            </div>

            {/* Réseaux sociaux */}
            <div className="pt-4 border-t border-emerald-100">
              <h3 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">
                Réseaux sociaux
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Ces liens apparaîtront sur la fiche publique de vos produits et permettent aux consommateurs de vous suivre.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="socialFacebook" className="flex items-center gap-2">
                    <Facebook className="size-4 text-[#1877F2]" />
                    Facebook
                  </Label>
                  <Input
                    id="socialFacebook"
                    placeholder="https://facebook.com/votre-page"
                    value={form.socialFacebook}
                    onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialTwitter" className="flex items-center gap-2">
                    <Twitter className="size-4 text-[#1DA1F2]" />
                    Twitter / X
                  </Label>
                  <Input
                    id="socialTwitter"
                    placeholder="https://twitter.com/votre-compte"
                    value={form.socialTwitter}
                    onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialLinkedin" className="flex items-center gap-2">
                    <Linkedin className="size-4 text-[#0A66C2]" />
                    LinkedIn
                  </Label>
                  <Input
                    id="socialLinkedin"
                    placeholder="https://linkedin.com/company/votre-entreprise"
                    value={form.socialLinkedin}
                    onChange={(e) => setForm({ ...form, socialLinkedin: e.target.value })}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialInstagram" className="flex items-center gap-2">
                    <Instagram className="size-4 text-[#E4405F]" />
                    Instagram
                  </Label>
                  <Input
                    id="socialInstagram"
                    placeholder="https://instagram.com/votre-compte"
                    value={form.socialInstagram}
                    onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="mr-2 size-4" />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
