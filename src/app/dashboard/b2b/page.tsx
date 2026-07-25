import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Package, MessageSquare, FileText, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { B2BProductToggle } from "./b2b-product-toggle";

export default async function B2BDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Si distributeur, afficher la vue distributeur
  if (user.role === "distributor") {
    const distributor = await db.distributor.findUnique({
      where: { userId: user.id },
      include: {
        b2bOrders: {
          include: {
            fabricant: { select: { companyName: true } },
            items: { include: { b2bProduct: { include: { product: { select: { name: true } } } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        conversations: {
          include: {
            fabricant: { select: { companyName: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { lastMessageAt: "desc" },
        },
      },
    });

    return (
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Store className="size-7 text-orange-600" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Marketplace B2B</h1>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">V3</Badge>
          </div>
          <p className="text-gray-500">Bienvenue {distributor?.companyName} — Votre espace distributeur</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <Package className="size-5 text-orange-500 mb-1" />
              <p className="text-xs text-gray-500">Commandes B2B</p>
              <p className="text-2xl font-bold">{distributor?.b2bOrders.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <MessageSquare className="size-5 text-purple-500 mb-1" />
              <p className="text-xs text-gray-500">Conversations</p>
              <p className="text-2xl font-bold">{distributor?.conversations.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Star className="size-5 text-amber-500 mb-1" />
              <p className="text-xs text-gray-500">Statut vérification</p>
              <Badge className={distributor?.verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                {distributor?.verified ? "Vérifié" : "En attente"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catalogue B2B</CardTitle>
            <CardDescription>Parcourez les produits des fabricants vérifiés</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/marketplace">
                <Store className="size-4 mr-2" /> Accéder au catalogue
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto vs-scroll">
              {distributor?.b2bOrders.length === 0 && (
                <p className="text-center text-gray-400 py-6">Aucune commande</p>
              )}
              {distributor?.b2bOrders.map((o) => (
                <div key={o.id} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-sm">{o.orderNumber}</p>
                      <p className="text-xs text-gray-500">{o.fabricant.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{o.totalAmount.toLocaleString("fr-FR")} FCFA</p>
                      <Badge variant="outline" className="text-xs">{o.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sinon fabricant
  if (user.role !== "fabricant") redirect("/admin");

  const [products, orders, conversations, reviews] = await Promise.all([
    db.product.findMany({
      where: { userId: user.id },
      include: { category: true, b2bInfo: true },
      orderBy: { createdAt: "desc" },
    }),
    db.b2BOrder.findMany({
      where: { fabricantId: user.id },
      include: {
        distributor: { include: { user: { select: { companyName: true } } } },
        items: { include: { b2bProduct: { include: { product: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.conversation.findMany({
      where: { fabricantId: user.id },
      include: {
        distributor: { include: { user: { select: { companyName: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
    }),
    db.b2BReview.findMany({
      where: { fabricantReviewedId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.reliabilityScore + r.qualityScore + r.professionalismScore) / 3, 0) / reviews.length
    : 0;
  const b2bEnabledCount = products.filter((p) => p.b2bInfo?.isB2BVisible).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Store className="size-7 text-orange-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Marketplace B2B</h1>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">V3</Badge>
        </div>
        <p className="text-gray-500 text-sm md:text-base">
          Vendez en gros à des distributeurs vérifiés — commandes, devis, messagerie, avis
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <Package className="size-4 text-orange-500 mb-1" />
            <p className="text-xs text-gray-500">Produits B2B</p>
            <p className="text-2xl font-bold">{b2bEnabledCount}/{products.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <FileText className="size-4 text-blue-500 mb-1" />
            <p className="text-xs text-gray-500">Commandes reçues</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <MessageSquare className="size-4 text-purple-500 mb-1" />
            <p className="text-xs text-gray-500">Conversations</p>
            <p className="text-2xl font-bold">{conversations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Star className="size-4 text-amber-500 mb-1" />
            <p className="text-xs text-gray-500">Note moyenne</p>
            <p className="text-2xl font-bold">{avgRating.toFixed(1)}/5</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration produits B2B */}
      <Card>
        <CardHeader>
          <CardTitle>Mes produits B2B</CardTitle>
          <CardDescription>Activez et configurez vos produits pour la vente en gros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto vs-scroll">
            {products.map((p) => (
              <div key={p.id} className="p-3 border border-gray-100 rounded-lg">
                <B2BProductToggle
                  product={{
                    id: p.id,
                    name: p.name,
                    brand: p.brand,
                    categoryName: p.category.name,
                    b2bInfo: p.b2bInfo ? {
                      id: p.b2bInfo.id,
                      moq: p.b2bInfo.moq,
                      leadTimeDays: p.b2bInfo.leadTimeDays,
                      monthlyCapacity: p.b2bInfo.monthlyCapacity,
                      paymentTerms: p.b2bInfo.paymentTerms,
                      isB2BVisible: p.b2bInfo.isB2BVisible,
                      distributorPriceTiers: p.b2bInfo.distributorPriceTiers,
                    } : null,
                  }}
                />
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-center text-gray-400 py-6">Aucun produit. Créez-en d'abord.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commandes reçues */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes B2B reçues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto vs-scroll">
            {orders.length === 0 && <p className="text-center text-gray-400 py-6">Aucune commande</p>}
            {orders.map((o) => (
              <div key={o.id} className="p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm">{o.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      De {o.distributor.user.companyName} · {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {o.items.length} article(s) — {o.items.map((i) => i.b2bProduct.product.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{o.totalAmount.toLocaleString("fr-FR")} FCFA</p>
                    <Badge variant="outline" className="text-xs capitalize">{o.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Avis reçus */}
      <Card>
        <CardHeader>
          <CardTitle>Avis B2B reçus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto vs-scroll">
            {reviews.length === 0 && <p className="text-center text-gray-400 py-6">Aucun avis encore</p>}
            {reviews.map((r) => (
              <div key={r.id} className="p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`size-3.5 ${n <= Math.round((r.reliabilityScore + r.qualityScore + r.professionalismScore) / 3) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-700 italic">"{r.comment}"</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Fiabilité {r.reliabilityScore}/5 · Qualité {r.qualityScore}/5 · Pro {r.professionalismScore}/5
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
