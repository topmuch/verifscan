"use client";

import { useEffect, useState } from "react";
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
  Plus,
  Key,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Code2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  permissions: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", permissions: "read" });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      if (res.ok) setKeys(data.keys || []);
      else toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Donnez un nom à votre clé");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setNewlyCreatedKey(data.plaintextKey);
      setKeys((k) => [{ ...data.key, lastUsedAt: null, revokedAt: null }, ...k]);
      setForm({ name: "", permissions: "read" });
      setShowForm(false);
      toast.success("Clé API créée. Copiez-la maintenant !");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setCreating(false);
    }
  }

  async function onRevoke(id: string, name: string) {
    if (!confirm(`Révoquer la clé "${name}" ? Elle ne pourra plus être utilisée. Action irréversible.`)) return;
    setRevokingId(id);
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setKeys((k) => k.map((key) => (key.id === id ? { ...key, revokedAt: new Date().toISOString() } : key)));
      toast.success("Clé révoquée");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setRevokingId(null);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Clé copiée dans le presse-papier");
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  }

  const permLabel: Record<string, { label: string; color: string }> = {
    read: { label: "Lecture seule", color: "bg-blue-100 text-blue-700" },
    readwrite: { label: "Lecture + Écriture", color: "bg-amber-100 text-amber-700" },
    admin: { label: "Admin", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#0f4382] flex items-center gap-2">
          <Code2 className="size-7" />
          API &amp; Intégrations
        </h1>
        <p className="text-[#6B7280] mt-2">
          Générez des clés API pour connecter votre ERP, CRM, marketplace ou application mobile à VerifScan.
        </p>
      </div>

      {/* Banner: nouveau clé secret */}
      {newlyCreatedKey && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Clé créée avec succès</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Copiez cette clé maintenant. Pour des raisons de sécurité, elle ne sera plus jamais affichée.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setNewlyCreatedKey(null)}>
                Fermer
              </Button>
            </div>
            <div className="flex items-center gap-2 bg-white border border-emerald-300 rounded-md p-2">
              <code className="flex-1 text-sm font-mono text-emerald-900 break-all">
                {newlyCreatedKey}
              </code>
              <Button size="sm" onClick={() => copyKey(newlyCreatedKey)}>
                <Copy className="size-3.5 mr-1" />
                Copier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section : création + liste */}
      <Card className="vs-card-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-t-lg">
          <CardTitle className="text-[#0f4382] flex items-center gap-2">
            <Key className="size-5" />
            Mes clés API ({keys.filter((k) => !k.revokedAt).length} active{keys.filter((k) => !k.revokedAt).length > 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 size-4" />
              Créer une nouvelle clé
            </Button>
          )}

          {showForm && (
            <form onSubmit={onCreate} className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/40 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom de la clé *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: ERP Sage, Marketplace Jumia, App Mobile..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="permissions">Permissions</Label>
                  <Select
                    value={form.permissions}
                    onValueChange={(v) => setForm({ ...form, permissions: v })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Lecture seule (GET)</SelectItem>
                      <SelectItem value="readwrite">Lecture + Écriture</SelectItem>
                      <SelectItem value="admin">Admin (toutes opérations)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 size-4" />
                      Générer la clé
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {/* Liste */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-[#0f4382]" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-gray-300">
              <Key className="size-12 text-gray-300 mx-auto mb-2" />
              <p className="text-[#6B7280]">Aucune clé API pour le moment.</p>
              <p className="text-sm text-gray-400 mt-1">
                Créez votre première clé pour connecter un système externe.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => {
                const perm = permLabel[k.permissions] || permLabel.read;
                const isRevoked = !!k.revokedAt;
                return (
                  <div
                    key={k.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${isRevoked ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200"}`}
                  >
                    <div className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isRevoked ? "bg-gray-100" : "bg-blue-50"}`}>
                      <Key className={`size-5 ${isRevoked ? "text-gray-400" : "text-blue-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{k.name}</span>
                        <Badge className={perm.color}>{perm.label}</Badge>
                        {isRevoked && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            Révoquée
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <code className="font-mono">{k.prefix}</code>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          Créée : {formatDate(k.createdAt)}
                        </span>
                        {k.lastUsedAt && (
                          <span>Dernière utilisation : {formatDate(k.lastUsedAt)}</span>
                        )}
                      </div>
                    </div>
                    {!isRevoked && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={revokingId === k.id}
                        onClick={() => onRevoke(k.id, k.name)}
                        className="text-red-600 hover:bg-red-50 flex-shrink-0"
                      >
                        {revokingId === k.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="size-4 mr-1" />
                            Révoquer
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Bon à savoir</p>
              <p className="mt-0.5">
                Les clés API donnent accès à vos données produits, lots et scans via l'API REST publique.
                Ne partagez jamais une clé en clair. Si une clé est compromise, révoquez-la immédiatement.
                Maximum 10 clés actives par compte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0f4382] flex items-center gap-2">
            <ExternalLink className="size-5" />
            Documentation API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-gray-600">
            Tous les endpoints sont accessibles via <code className="bg-gray-100 px-1.5 py-0.5 rounded">Authorization: Bearer vsk_live_...</code>
          </p>
          <div className="rounded-md border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-semibold text-gray-700">Endpoint</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Méthode</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-blue-700">/api/v1/me</td>
                  <td className="px-3 py-2"><Badge variant="outline">GET</Badge></td>
                  <td className="px-3 py-2 text-gray-600">Identité et permissions de la clé</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-blue-700">/api/v1/products</td>
                  <td className="px-3 py-2"><Badge variant="outline">GET</Badge></td>
                  <td className="px-3 py-2 text-gray-600">Liste de vos produits</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-blue-700">/api/v1/lots</td>
                  <td className="px-3 py-2"><Badge variant="outline">GET</Badge></td>
                  <td className="px-3 py-2 text-gray-600">Liste de vos lots (avec QR codes)</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-blue-700">/api/v1/scans</td>
                  <td className="px-3 py-2"><Badge variant="outline">GET</Badge></td>
                  <td className="px-3 py-2 text-gray-600">Statistiques de scans (pays, appareils)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/developers">
              <ExternalLink className="mr-2 size-4" />
              Voir la documentation complète
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
