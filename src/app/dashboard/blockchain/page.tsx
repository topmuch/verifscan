import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink, Boxes, CheckCircle2 } from "lucide-react";
import { BlockchainCertifyButton } from "./certify-button";

export default async function BlockchainPage() {
  const user = await requireFabricant();
  if (!user) redirect("/login");

  const lots = await db.lot.findMany({
    where: { product: { userId: user.id } },
    include: {
      product: { select: { name: true, brand: true } },
      blockchainCertificate: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const certifiedCount = lots.filter((l) => l.blockchainCertificate).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="size-7 text-indigo-600" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Certification Blockchain</h1>
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">V3</Badge>
          </div>
          <p className="text-gray-500 text-sm md:text-base">
            Certifiez vos lots sur Polygon (immuabilité cryptographique)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Boxes className="size-4 text-indigo-500" />
              <span className="text-xs text-gray-500">Total lots</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{lots.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Lots certifiés</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{certifiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="size-4 text-purple-500" />
              <span className="text-xs text-gray-500">Taux certification</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {lots.length > 0 ? Math.round((certifiedCount / lots.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/30 to-white">
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <ShieldCheck className="size-4 text-indigo-600" />
            Pourquoi certifier sur la blockchain ?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ <strong>Immuabilité</strong> — Une fois écrit, le hash ne peut plus être modifié</li>
            <li>✓ <strong>Transparence</strong> — Les consommateurs peuvent vérifier sur Polygonscan</li>
            <li>✓ <strong>Confiance</strong> — Argument marketing différenciant vs concurrents</li>
            <li>✓ <strong>Conformité</strong> — Preuve d'origine pour export UE / CEDEAO / FDA</li>
            <li>✓ <strong>Coût</strong> — &lt;$0.01 par lot sur Polygon (vs Ethereum mainnet)</li>
          </ul>
        </CardContent>
      </Card>

      {/* Liste des lots */}
      <Card>
        <CardHeader>
          <CardTitle>Lots à certifier</CardTitle>
          <CardDescription>Certifiez chaque lot individuellement sur Polygon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto vs-scroll">
            {lots.map((lot) => (
              <div
                key={lot.id}
                className={`p-3 rounded-lg border ${lot.blockchainCertificate ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 bg-white"} flex items-center justify-between gap-3 flex-wrap`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{lot.lotNumber}</span>
                    {lot.blockchainCertificate ? (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                        <CheckCircle2 className="size-3 mr-1" /> Certifié Polygon
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500">Non certifié</Badge>
                    )}
                    {lot.status === "recalled" && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200">Rappelé</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {lot.product.name} · {lot.product.brand}
                  </p>
                  <p className="text-xs text-gray-400">
                    Fabriqué le {lot.manufacturingDate.toLocaleDateString("fr-FR")} · Expire le {lot.expirationDate.toLocaleDateString("fr-FR")}
                  </p>
                  {lot.blockchainCertificate && (
                    <div className="mt-2 p-2 rounded bg-white border border-emerald-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Hash :</span>
                        <code className="text-emerald-700">{lot.blockchainCertificate.dataHash.slice(0, 24)}...</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tx :</span>
                        <a
                          href={`https://polygonscan.com/tx/${lot.blockchainCertificate.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          {lot.blockchainCertificate.txHash.slice(0, 14)}... <ExternalLink className="size-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Bloc :</span>
                        <span className="text-gray-700">#{lot.blockchainCertificate.blockNumber.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
                {!lot.blockchainCertificate && (
                  <BlockchainCertifyButton lotId={lot.id} lotNumber={lot.lotNumber} />
                )}
              </div>
            ))}
            {lots.length === 0 && (
              <p className="text-center py-6 text-gray-400">Aucun lot. Créez-en depuis la section Lots.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
