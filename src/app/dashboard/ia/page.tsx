import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { AIAnomalyList } from "./anomaly-list";
import { AIRecommendationsList } from "./recommendations-list";
import { AIPredictions } from "./predictions";
import { AISeoGenerator } from "./seo-generator";
import { CertificationsManager } from "./certifications-manager";
import { HeatmapView } from "./heatmap-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, Sparkles, TrendingUp, Search, Globe, Award } from "lucide-react";

export default async function IAHomePage() {
  const user = await requireFabricant();
  if (!user) redirect("/login");

  // Récupère les données initiales
  const [anomalies, recommendations, certifications, products] = await Promise.all([
    db.aIAnomaly.findMany({
      where: { fabricantId: user.id, status: "open" },
      include: {
        lot: { select: { lotNumber: true, product: { select: { name: true, brand: true } } } },
      },
      orderBy: { detectedAt: "desc" },
      take: 20,
    }),
    db.aIRecommendation.findMany({
      where: { fabricantId: user.id, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.certification.findMany({
      where: { fabricantId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.product.findMany({
      where: { userId: user.id },
      include: { category: true },
      take: 50,
    }),
  ]);

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const warningCount = anomalies.filter((a) => a.severity === "warning").length;
  const verifiedCertCount = certifications.filter((c) => c.verified).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="size-7 text-emerald-600" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Intelligence Artificielle</h1>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">V3</Badge>
          </div>
          <p className="text-gray-500 text-sm md:text-base">
            Détection d'anomalies, prédictions de demande, recommandations actionnables et génération SEO
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="size-4 text-red-500" />
              <span className="text-xs text-gray-500">Anomalies critiques</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="size-4 text-amber-500" />
              <span className="text-xs text-gray-500">Avertissements</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-4 text-purple-500" />
              <span className="text-xs text-gray-500">Recommandations</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{recommendations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="size-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Certifications actives</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{verifiedCertCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Anomalies détectées */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                Détection d'anomalies
              </CardTitle>
              <CardDescription>
                DLC proches, contrefaçons géographiques, ingrédients suspects
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {anomalies.length} ouvertes
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AIAnomalyList initialAnomalies={anomalies.map((a) => ({
            id: a.id,
            type: a.type,
            severity: a.severity,
            description: a.description,
            detectedAt: a.detectedAt.toISOString(),
            lotNumber: a.lot?.lotNumber || null,
            productName: a.lot?.product.name || null,
          }))} />
        </CardContent>
      </Card>

      {/* Section 2: Prédictions de demande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-blue-500" />
            Prédictions de demande
          </CardTitle>
          <CardDescription>
            Analyse prédictive basée sur l'historique des scans et facteurs saisonniers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIPredictions products={products.map((p) => ({ id: p.id, name: p.name, brand: p.brand, category: p.category.name }))} />
        </CardContent>
      </Card>

      {/* Section 3: Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-purple-500" />
            Recommandations actionnables
          </CardTitle>
          <CardDescription>
            Suggestions personnalisées pour améliorer la confiance et la visibilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIRecommendationsList initialRecommendations={recommendations.map((r) => ({
            id: r.id,
            type: r.type,
            content: r.content,
            expectedImpactPct: r.expectedImpactPct || 0,
          }))} />
        </CardContent>
      </Card>

      {/* Section 4: Assistant SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5 text-emerald-500" />
            Assistant SEO
          </CardTitle>
          <CardDescription>
            Génération automatique de descriptions optimisées et traduction multilingue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AISeoGenerator products={products.map((p) => ({ id: p.id, name: p.name, brand: p.brand, categoryId: p.categoryId, weight: p.weight, ingredients: null }))} />
        </CardContent>
      </Card>

      {/* Section 5: Heatmap géographique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5 text-cyan-500" />
            Heatmap des scans
          </CardTitle>
          <CardDescription>
            Visualisation géographique des scans par produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HeatmapView products={products.map((p) => ({ id: p.id, name: p.name }))} />
        </CardContent>
      </Card>

      {/* Section 6: Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            Certifications & Conformité
          </CardTitle>
          <CardDescription>
            Upload, vérification, alertes expiration, badges visibles publiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CertificationsManager initialCertifications={certifications.map((c) => ({
            id: c.id,
            type: c.type,
            issuer: c.issuer,
            certificateNumber: c.certificateNumber,
            issuedAt: c.issuedAt?.toISOString() || null,
            expiresAt: c.expiresAt?.toISOString() || null,
            verified: c.verified,
            verificationMethod: c.verificationMethod,
          }))} />
        </CardContent>
      </Card>
    </div>
  );
}
