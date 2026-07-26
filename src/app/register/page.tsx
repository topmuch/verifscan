"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Mail,
  Lock,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  MessageCircle,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
    emailContact: "",
    address: "",
  });

  function setField(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      // Auto-login
      const signRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signRes?.error) {
        toast.success("Compte créé ! Connectez-vous pour continuer.");
        router.push("/login");
      } else {
        toast.success("Bienvenue sur VerifScan !");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">Devenir fabricant</h1>
            <p className="mt-1 text-sm text-gray-600">
              Créez votre compte entreprise pour commencer à tracer vos produits avec VerifScan.
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="size-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="companyName"
                      placeholder="Sarine Bio"
                      className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                      value={form.companyName}
                      onChange={(e) => setField("companyName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de connexion *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@entreprise.sn"
                      className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="password">Mot de passe * (min. 6 caractères)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 border-emerald-200 focus-visible:ring-emerald-500"
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Afficher/masquer"
                    >
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="+221 77 123 45 67"
                      className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="whatsapp"
                      placeholder="+221771234567"
                      className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                      value={form.whatsapp}
                      onChange={(e) => setField("whatsapp", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailContact">Email public</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="emailContact"
                      type="email"
                      placeholder="contact@entreprise.sn"
                      className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                      value={form.emailContact}
                      onChange={(e) => setField("emailContact", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="address"
                      placeholder="Dakar, Sénégal"
                      className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? "Création..." : "Créer mon compte"}
                {!loading && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm">
              <p className="text-gray-600">
                Déjà fabricant ?{" "}
                <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
