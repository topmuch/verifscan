"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fill demo creds if ?demo=fabricant or ?demo=admin
  useEffect(() => {
    const demo = searchParams.get("demo");
    if (demo === "fabricant") {
      setEmail("sarine@verifscan.sn");
      setPassword("fabricant123");
    } else if (demo === "admin") {
      setEmail("admin@verifscan.sn");
      setPassword("admin123");
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect, ou compte désactivé.");
      return;
    }
    toast.success("Connexion réussie !");
    // Determine redirect based on role
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;
    router.push(role === "superadmin" ? "/admin" : callbackUrl);
    router.refresh();
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
            <p className="mt-1 text-sm text-gray-600">
              Accédez à votre tableau de bord fabricant ou administrateur.
            </p>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="size-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@entreprise.sn"
                    className="pl-10 border-emerald-200 focus-visible:ring-emerald-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 border-emerald-200 focus-visible:ring-emerald-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Afficher/masquer le mot de passe"
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
                {!loading && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm">
              <p className="text-gray-600">
                Pas encore fabricant ?{" "}
                <Link href="/register" className="font-semibold text-emerald-700 hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>

            {/* Demo accounts */}
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
              <p className="font-semibold text-amber-900 mb-2">🧪 Comptes de démonstration</p>
              <div className="space-y-1.5 text-amber-800">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@verifscan.sn");
                    setPassword("admin123");
                  }}
                  className="block w-full text-left hover:underline"
                >
                  • SuperAdmin : admin@verifscan.sn / admin123
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("sarine@verifscan.sn");
                    setPassword("fabricant123");
                  }}
                  className="block w-full text-left hover:underline"
                >
                  • Fabricant : sarine@verifscan.sn / fabricant123
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
