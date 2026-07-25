"use client";

import { useState, useEffect } from "react";
import { Save, Building2, AlertCircle } from "lucide-react";
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

  const [form, setForm] = useState({
    companyName: "",
    phone: "",
    whatsapp: "",
    emailContact: "",
    address: "",
    logoUrl: "",
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
        });
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, []);

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-gray-600">
          Les informations de votre entreprise seront affichées publiquement sur les fiches produits.
        </p>
      </div>

      <Card className="vs-card-shadow border-emerald-100">
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
              <Label htmlFor="companyName">Nom de l'entreprise *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL du logo</Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://exemple.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="border-emerald-200 focus-visible:ring-emerald-500"
              />
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
