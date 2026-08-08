import { PublicShell } from "@/components/public-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code2, Key, Zap, Shield, Webhook } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "API Developers — VerifScan",
  description: "Documentation officielle de l'API REST VerifScan. Connectez votre ERP, CRM, marketplace ou application mobile.",
};

export default function DevelopersPage() {
  return (
    <PublicShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        {/* Hero */}
        <section className="px-4 py-16 sm:py-24 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <Code2 className="size-4" />
            API REST v1
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#0f4382] mb-4">
            Connectez vos systèmes à VerifScan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Synchronisez vos produits, lots et scans avec votre ERP, votre marketplace,
            ou votre application mobile via notre API REST sécurisée.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-[#0f4382] hover:bg-[#0d3a72]">
              <Link href="/dashboard/api-keys">
                <Key className="mr-2 size-4" />
                Créer une clé API
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#endpoints">
                Voir les endpoints
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#webhooks">
                <Webhook className="mr-2 size-4" />
                Webhooks
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-12 max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Zap className="size-10 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">REST JSON</h3>
                <p className="text-sm text-gray-600">
                  API REST standard, réponses JSON. Compatible tous langages.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="size-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Sécurisée</h3>
                <p className="text-sm text-gray-600">
                  Authentification par clé API (bcrypt hash). Permissions granulaires.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Key className="size-10 text-[#0f4382] mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">Self-service</h3>
                <p className="text-sm text-gray-600">
                  Générez et révoquez vos clés depuis votre dashboard, sans contact support.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick start */}
        <section className="px-4 py-12 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0f4382]">Démarrage rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li>
                  Créez une clé API depuis votre{" "}
                  <Link href="/dashboard/api-keys" className="text-blue-700 underline">
                    dashboard
                  </Link>
                  {" "}— choisissez les permissions adaptées (lecture seule recommandée).
                </li>
                <li>
                  Copiez la clé générée (format <code className="bg-gray-100 px-1 rounded">vsk_live_...</code>).
                  Elle ne sera plus jamais affichée.
                </li>
                <li>
                  Envoyez-la dans l'en-tête <code className="bg-gray-100 px-1 rounded">Authorization: Bearer ...</code>
                  {" "}de chaque requête.
                </li>
              </ol>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <div className="text-xs text-gray-400 mb-2">Exemple — curl</div>
                <pre className="text-sm font-mono">
{`curl https://votre-domaine.com/api/v1/products \\
  -H "Authorization: Bearer vsk_live_xxxxxxxxxxxxxxxxxxxxxxxx"`}
                </pre>
              </div>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <div className="text-xs text-gray-400 mb-2">Exemple — JavaScript (fetch)</div>
                <pre className="text-sm font-mono">
{`const res = await fetch("https://votre-domaine.com/api/v1/products", {
  headers: { Authorization: "Bearer vsk_live_xxxx..." }
});
const data = await res.json();
console.log(data.items);`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="px-4 py-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0f4382] mb-6">Endpoints disponibles</h2>

          <div className="space-y-4">
            <Endpoint
              method="GET"
              path="/api/v1/me"
              title="Identité de la clé"
              desc="Retourne l'utilisateur propriétaire de la clé et ses permissions. Utile pour vérifier qu'une clé fonctionne."
              params={[]}
              example={`{
  "user": {
    "id": "clx...",
    "email": "contact@soprim.sn",
    "role": "fabricant",
    "companyName": "SOPRIM",
    "isActive": true
  },
  "permissions": "read",
  "apiKeyId": "clx..."
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/products"
              title="Liste des produits"
              desc="Retourne tous les produits du compte avec leur catégorie et nombre de lots."
              params={[
                { name: "search", type: "string", desc: "Recherche dans name, brand, barcode" },
                { name: "categoryId", type: "string", desc: "Filtrer par catégorie" },
                { name: "limit", type: "number", desc: "Nb d'items (défaut 50, max 100)" },
                { name: "offset", type: "number", desc: "Pagination (défaut 0)" },
              ]}
              example={`{
  "items": [{
    "id": "clx...",
    "name": "Mangue Kent",
    "brand": "SOPRIM",
    "barcode": "6112345678905",
    "weight": "5kg",
    "category": { "name": "Fruits", "icon": "🥭" },
    "_count": { "lots": 3 }
  }],
  "total": 12,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/lots"
              title="Liste des lots"
              desc="Retourne tous les lots du compte avec produit et QR code associé."
              params={[
                { name: "search", type: "string", desc: "Recherche dans lotNumber" },
                { name: "productId", type: "string", desc: "Filtrer par produit" },
                { name: "status", type: "active | recalled", desc: "Filtrer par statut" },
                { name: "limit", type: "number", desc: "Pagination (max 100)" },
                { name: "offset", type: "number", desc: "Pagination" },
              ]}
              example={`{
  "items": [{
    "id": "clx...",
    "lotNumber": "LOT-20260728-0001",
    "manufacturingDate": "2026-07-01T00:00:00.000Z",
    "expirationDate": "2026-07-15T00:00:00.000Z",
    "status": "active",
    "product": { "name": "Mangue Kent", "barcode": "6112345678905" },
    "qrCodes": [{ "qrCodeImageUrl": "data:image/png;base64,..." }]
  }]
}`}
            />

            <Endpoint
              method="GET"
              path="/api/v1/scans"
              title="Statistiques de scans"
              desc="Retourne les scans agrégés par pays + 100 derniers scans détaillés."
              params={[
                { name: "days", type: "number", desc: "Période en jours (défaut 30, max 365)" },
                { name: "lotId", type: "string", desc: "Filtrer sur un lot spécifique" },
              ]}
              example={`{
  "totalScans": 1247,
  "days": 30,
  "since": "2026-06-28T...",
  "byCountry": [
    { "country": "Sénégal", "count": 842 },
    { "country": "France", "count": 213 }
  ],
  "recentScans": [...]
}`}
            />

            <Endpoint
              method="POST"
              path="/api/v1/products"
              title="Créer un produit"
              desc="Crée un nouveau produit. Nécessite la permission 'readwrite' ou 'admin'. Déclenche le webhook 'product_created'."
              params={[
                { name: "name", type: "string", desc: "Nom du produit (min 2 caractères)" },
                { name: "brand", type: "string", desc: "Marque" },
                { name: "categoryId", type: "string", desc: "ID de la catégorie" },
                { name: "barcode", type: "string?", desc: "Code-barres EAN/UPC (optionnel)" },
                { name: "description", type: "string?", desc: "Description (optionnel)" },
                { name: "weight", type: "string?", desc: "Poids/format (optionnel)" },
                { name: "isVisible", type: "boolean?", desc: "Visible publiquement (défaut true)" },
              ]}
              example={`curl -X POST https://verifscan.roomscan.pro/api/v1/products \\
  -H "Authorization: Bearer vsk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Mangue Kent",
    "brand": "SOPRIM",
    "categoryId": "clx...",
    "barcode": "6112345678905",
    "weight": "5kg"
  }'

# Réponse 201:
{
  "id": "clx...",
  "name": "Mangue Kent",
  "brand": "SOPRIM",
  "barcode": "6112345678905",
  "category": { "name": "Fruits", "icon": "🥭" },
  "createdAt": "2026-07-28T..."
}`}
            />

            <Endpoint
              method="PUT"
              path="/api/v1/products/[id]"
              title="Mettre à jour un produit"
              desc="Met à jour tout sous-ensemble de champs. Déclenche le webhook 'product_updated'."
              params={[
                { name: "name", type: "string?", desc: "Nouveau nom" },
                { name: "brand", type: "string?", desc: "Nouvelle marque" },
                { name: "categoryId", type: "string?", desc: "Changer de catégorie" },
                { name: "isVisible", type: "boolean?", desc: "Masquer/afficher" },
              ]}
              example={`curl -X PUT https://verifscan.roomscan.pro/api/v1/products/clx... \\
  -H "Authorization: Bearer vsk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "isVisible": false }'

# Réponse 200: produit complet mis à jour`}
            />

            <Endpoint
              method="DELETE"
              path="/api/v1/products/[id]"
              title="Supprimer un produit"
              desc="Supprime un produit et CASCADE sur tous les lots, QR codes, scans associés. Irréversible."
              params={[]}
              example={`curl -X DELETE https://verifscan.roomscan.pro/api/v1/products/clx... \\
  -H "Authorization: Bearer vsk_live_xxx"

# Réponse 200:
{
  "ok": true,
  "deletedProductId": "clx...",
  "deletedProductName": "Mangue Kent",
  "cascadedLotsCount": 3
}`}
            />

            <Endpoint
              method="POST"
              path="/api/v1/lots"
              title="Créer un lot + QR code"
              desc="Crée un nouveau lot pour un produit existant et génère automatiquement un QR code. Déclenche le webhook 'lot_created'."
              params={[
                { name: "productId", type: "string", desc: "ID du produit parent (obligatoire)" },
                { name: "lotNumber", type: "string?", desc: "Numéro de lot (auto-généré si absent)" },
                { name: "manufacturingDate", type: "ISO date", desc: "Date de fabrication" },
                { name: "expirationDate", type: "ISO date", desc: "Date de péremption" },
                { name: "generateQrCode", type: "boolean?", desc: "Générer le QR (défaut true)" },
                { name: "ingredients", type: "string?", desc: "Ingrédients (optionnel)" },
              ]}
              example={`curl -X POST https://verifscan.roomscan.pro/api/v1/lots \\
  -H "Authorization: Bearer vsk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "clx...",
    "lotNumber": "LOT-2026-001",
    "manufacturingDate": "2026-07-01",
    "expirationDate": "2026-07-15"
  }'

# Réponse 201: { lot, qrCode }`}
            />

            <Endpoint
              method="PUT"
              path="/api/v1/lots/[id]"
              title="Mettre à jour un lot"
              desc="Met à jour un lot. Si status passe à 'recalled', déclenche aussi le webhook 'recall'."
              params={[
                { name: "status", type: "'active' | 'recalled'", desc: "Changer le statut" },
                { name: "recallReason", type: "string?", desc: "Raison du rappel" },
                { name: "expirationDate", type: "ISO date?", desc: "Nouvelle date de péremption" },
              ]}
              example={`curl -X PUT https://verifscan.roomscan.pro/api/v1/lots/clx... \\
  -H "Authorization: Bearer vsk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "recalled", "recallReason": "Contamination détectée" }'

# Réponse 200: lot mis à jour`}
            />

            <Endpoint
              method="DELETE"
              path="/api/v1/lots/[id]"
              title="Supprimer un lot"
              desc="Supprime un lot et CASCADE sur QR codes + scans associés. Irréversible."
              params={[]}
              example={`curl -X DELETE https://verifscan.roomscan.pro/api/v1/lots/clx... \\
  -H "Authorization: Bearer vsk_live_xxx"

# Réponse 200: { ok: true, deletedLotId, cascadedQrCodesCount }`}
            />
          </div>
        </section>

        {/* Webhooks */}
        <section id="webhooks" className="px-4 py-12 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0f4382] mb-4">Webhooks</h2>
          <p className="text-gray-600 mb-6">
            Recevez une notification HTTP POST en temps réel quand un événement se produit sur votre compte.
            Parfait pour synchroniser votre ERP, déclencher un processus métier, ou alerter votre équipe.
          </p>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base text-[#0f4382]">Événements disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { event: "scan", desc: "Déclenché à chaque scan d'un QR code (page /p/[lotId])" },
                { event: "recall", desc: "Déclenché quand un lot passe en statut 'recalled'" },
                { event: "review", desc: "Déclenché quand un consommateur laisse un avis" },
                { event: "lot_created", desc: "Déclenché à la création d'un lot (POST /api/v1/lots ou dashboard)" },
                { event: "lot_updated", desc: "Déclenché à la mise à jour d'un lot" },
                { event: "product_created", desc: "Déclenché à la création d'un produit" },
                { event: "product_updated", desc: "Déclenché à la mise à jour d'un produit" },
              ].map((e) => (
                <div key={e.event} className="flex items-start gap-3 text-sm">
                  <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-mono">{e.event}</code>
                  <span className="text-gray-700">{e.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base text-[#0f4382]">Format de la requête</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">Headers :</p>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">{`POST /votre-endpoint HTTP/1.1
Host: votre-erp.com
Content-Type: application/json
User-Agent: VerifScan-Webhook/1.0
X-VerifScan-Event: scan
X-VerifScan-Delivery: clx...
X-VerifScan-Signature: <hmac-sha256-hex>`}</pre>

              <p className="text-sm text-gray-600 mt-3">Body (exemple pour l'événement <code>scan</code>) :</p>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">{`{
  "event": "scan",
  "timestamp": "2026-07-28T14:32:00.000Z",
  "data": {
    "scanId": "clx...",
    "qrCodeId": "clx...",
    "lotId": "clx...",
    "product": { "name": "Mangue Kent", "brand": "SOPRIM" },
    "scannedAt": "2026-07-28T14:32:00.000Z",
    "location": { "country": "Sénégal", "city": "Dakar", "region": "Dakar" },
    "device": { "type": "mobile" }
  }
}`}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#0f4382]">Vérification de la signature (Node.js)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">{`import crypto from 'crypto';

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-verifscan-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.VERIFSCAN_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');
  if (sig !== expected) return res.status(401).send('Invalid signature');

  res.status(200).send('OK'); // répondre vite (timeout 10s)
  const payload = JSON.parse(req.body);
  // Traiter l'événement de façon asynchrone
});`}</pre>
              <p className="text-xs text-gray-500 mt-3">
                💡 Si votre serveur ne répond pas 2xx dans les 10 secondes, VerifScan réessaiera
                jusqu'à 3 fois (à 1 min, 5 min, 15 min).
              </p>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button asChild size="lg">
              <Link href="/dashboard/webhooks">
                <Webhook className="mr-2 size-4" />
                Configurer mes webhooks
              </Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 max-w-3xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-[#0f4382] to-[#2ebd5a] text-white border-0">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-3">Prêt à intégrer VerifScan ?</h2>
              <p className="mb-5 opacity-90">
                Connectez votre ERP, CRM, marketplace ou application mobile en quelques minutes.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard/api-keys">
                  <Key className="mr-2 size-4" />
                  Créer ma clé API
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicShell>
  );
}

function Endpoint({
  method,
  path,
  title,
  desc,
  params,
  example,
}: {
  method: string;
  path: string;
  title: string;
  desc: string;
  params: { name: string; type: string; desc: string }[];
  example: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="font-mono">{method}</Badge>
          <code className="text-blue-700 font-mono font-semibold">{path}</code>
        </div>
        <CardTitle className="text-base mt-2 text-[#0f4382]">{title}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">{desc}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {params.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Paramètres</div>
            <div className="space-y-1">
              {params.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{p.name}</code>
                  <span className="text-xs text-gray-500">{p.type}</span>
                  <span className="text-gray-700">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Exemple de réponse</div>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
{example}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
