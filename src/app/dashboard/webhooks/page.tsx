"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Webhook as WebhookIcon,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type WebhookEvent =
  | "scan"
  | "recall"
  | "review"
  | "lot_created"
  | "lot_updated"
  | "product_created"
  | "product_updated";

type Webhook = {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  secretHint: string;
  stats: Record<string, number>;
  lastDelivery: {
    id: string;
    status: string;
    statusCode: number | null;
    event: string;
    createdAt: string;
    deliveredAt: string | null;
    lastError: string | null;
  } | null;
};

type AvailableEvent = { value: string; label: string };

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    url: "",
    events: [] as string[],
    description: "",
    isActive: true,
  });
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<{
    secret: string;
    url: string;
  } | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      if (res.ok) {
        setWebhooks(data.webhooks || []);
        setAvailableEvents(data.availableEvents || []);
      } else {
        toast.error("Erreur de chargement");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleEvent(event: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter((e) => e !== event)
        : [...f.events, event],
    }));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url.trim()) {
      toast.error("L'URL est requise");
      return;
    }
    if (!form.url.startsWith("http://") && !form.url.startsWith("https://")) {
      toast.error("L'URL doit commencer par http:// ou https://");
      return;
    }
    if (form.events.length === 0) {
      toast.error("Sélectionnez au moins un événement");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      setNewlyCreatedSecret({ secret: data.secret, url: data.url });
      setShowForm(false);
      setForm({ url: "", events: [], description: "", isActive: true });
      await load();
      toast.success("Webhook créé avec succès");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer ce webhook ? Les livraisons en attente seront perdues.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      await load();
      toast.success("Webhook supprimé");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  async function onToggle(id: string, currentActive: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      await load();
      toast.success(currentActive ? "Webhook désactivé" : "Webhook activé");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setTogglingId(null);
    }
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copié dans le presse-papier");
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function deliveryStatusBadge(status: string) {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-700">Succès</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Échec</Badge>;
      case "retry":
        return <Badge className="bg-orange-100 text-orange-700">Retry</Badge>;
      case "pending":
        return <Badge className="bg-blue-100 text-blue-700">En cours</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <WebhookIcon className="w-8 h-8 text-[#0f4382]" />
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-1">
            Notifiez vos systèmes externes (ERP, CRM, dashboards) quand un événement se produit.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/developers">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation API
            </Button>
          </Link>
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau webhook
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Activity className="w-5 h-5 text-[#0f4382] flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-medium text-[#0f4382]">Comment ça marche ?</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>
                  VerifScan envoie une requête <code className="bg-white px-1 rounded">POST</code> à
                  votre URL avec un payload JSON décrivant l'événement.
                </li>
                <li>
                  La requête est signée avec <code className="bg-white px-1 rounded">HMAC SHA-256</code> dans
                  le header <code className="bg-white px-1 rounded">X-VerifScan-Signature</code>.
                </li>
                <li>
                  Vérifiez la signature côté serveur avec le secret généré (affiché une seule fois à la création).
                </li>
                <li>Timeout de 10 secondes, 3 tentatives en cas d'échec (1min, 5min, 15min).</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Newly created secret banner */}
      {newlyCreatedSecret && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-medium text-green-700">
                  Webhook créé pour {newlyCreatedSecret.url}
                </p>
                <p className="text-sm text-muted-foreground">
                  Voici votre secret. Conservez-le précieusement : il ne sera plus jamais affiché.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-white border px-3 py-2 rounded font-mono text-sm break-all">
                    {showSecret
                      ? newlyCreatedSecret.secret
                      : "•".repeat(newlyCreatedSecret.secret.length)}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecret((s) => !s)}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copySecret(newlyCreatedSecret.secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewlyCreatedSecret(null)}
                  className="mt-2"
                >
                  J'ai copié le secret, fermer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL de destination *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://votre-erp.com/api/webhooks/verifscan"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL HTTPS qui recevra les requêtes POST.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  placeholder="Notifier l'ERP Sage à chaque scan"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Événements à écouter *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {availableEvents.map((ev) => (
                    <label
                      key={ev.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        form.events.includes(ev.value)
                          ? "border-[#0f4382] bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.events.includes(ev.value)}
                        onChange={() => toggleEvent(ev.value)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{ev.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{ev.value}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Créer le webhook
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Webhooks list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <WebhookIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun webhook configuré pour le moment.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((w) => (
            <Card key={w.id} className={!w.isActive ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {w.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Actif</Badge>
                      ) : (
                        <Badge className="bg-gray-200 text-gray-700">Désactivé</Badge>
                      )}
                      <span className="font-mono text-sm break-all">{w.url}</span>
                    </div>
                    {w.description && (
                      <p className="text-sm text-muted-foreground">{w.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {w.events.map((ev) => (
                        <Badge key={ev} variant="outline" className="text-xs font-mono">
                          {ev}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Secret : <code className="font-mono">{w.secretHint}</code> · Créé le{" "}
                      {formatDate(w.createdAt)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggle(w.id, w.isActive)}
                      disabled={togglingId === w.id}
                    >
                      {togglingId === w.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4 mr-2" />
                      )}
                      {w.isActive ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(w.id)}
                      disabled={deletingId === w.id}
                    >
                      {deletingId === w.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Stats + last delivery */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Succès (7j)
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {w.stats.success || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Échecs (7j)
                    </div>
                    <div className="text-lg font-semibold text-red-600">
                      {w.stats.failed || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Retries (7j)
                    </div>
                    <div className="text-lg font-semibold text-orange-600">
                      {w.stats.retry || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Dernière livraison
                    </div>
                    <div className="text-sm font-medium mt-1">
                      {w.lastDelivery ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {deliveryStatusBadge(w.lastDelivery.status)}
                            {w.lastDelivery.statusCode && (
                              <span className="text-xs font-mono">HTTP {w.lastDelivery.statusCode}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(w.lastDelivery.createdAt)} · event:{" "}
                            <code className="font-mono">{w.lastDelivery.event}</code>
                          </div>
                          {w.lastDelivery.lastError && (
                            <div className="text-xs text-red-600">{w.lastDelivery.lastError}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Aucune</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documentation snippet */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Exemple de vérification de signature (Node.js)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto"><code>{`import crypto from 'crypto';

app.post('/webhooks/verifscan', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-verifscan-signature'];
  const event = req.headers['x-verifscan-event'];
  const deliveryId = req.headers['x-verifscan-delivery'];

  // Recalculer la signature avec votre secret
  const expected = crypto
    .createHmac('sha256', process.env.VERIFSCAN_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(req.body);
  console.log('Event:', event, 'Data:', payload);

  // Répondre 200 rapidement (sous 10s) pour éviter le timeout
  res.status(200).send('OK');

  // Traiter l'événement de façon asynchrone
  processEvent(event, payload, deliveryId);
});`}</code></pre>
        </CardContent>
      </Card>
    </div>
  );
}
