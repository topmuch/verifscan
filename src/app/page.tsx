import Link from "next/link";
import {
  ArrowRight,
  ScanLine,
  ShieldCheck,
  QrCode,
  PackageSearch,
  TrendingUp,
  Smartphone,
  Globe2,
  Sparkles,
  CheckCircle2,
  Users,
  Building2,
  Package,
  Eye,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

async function getPopularProducts() {
  const products = await db.product.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      category: { select: { name: true, icon: true } },
      user: { select: { companyName: true } },
    },
  });
  return products;
}

async function getStats() {
  const [products, fabricants, lots] = await Promise.all([
    db.product.count({ where: { isVisible: true } }),
    db.user.count({ where: { role: "fabricant", isActive: true } }),
    db.lot.count({ where: { status: "active" } }),
  ]);
  return { products, fabricants, lots };
}

export default async function HomePage() {
  const [popularProducts, stats] = await Promise.all([
    getPopularProducts(),
    getStats(),
  ]);

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden vs-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 border-emerald-200"
              >
                <Sparkles className="size-3 mr-1" />
                Passeport numérique pour vos produits
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Garantissez <span className="vs-gradient-text">l'authenticité</span> de vos produits
              </h1>

              <p className="text-lg text-gray-600 max-w-xl">
                VerifScan permet aux fabricants agroalimentaires de générer des QR codes
                sécurisés pour chaque lot, offrant aux consommateurs une transparence
                totale sur l'origine, la traçabilité et l'authenticité des produits.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                >
                  <Link href="/register">
                    Devenir fabricant
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-emerald-200">
                  <Link href="/produits">
                    <PackageSearch className="mr-2 size-4" />
                    Voir les produits
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  Authenticité garantie
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Smartphone className="size-5 text-amber-500" />
                  100% mobile-friendly
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Globe2 className="size-5 text-emerald-600" />
                  Pensé pour l'Afrique
                </div>
              </div>
            </div>

            {/* Hero visual: phone mockup + QR */}
            <div className="relative">
              <div className="mx-auto max-w-sm">
                <div className="rounded-[2rem] bg-white shadow-2xl shadow-emerald-200/50 border-8 border-gray-900 overflow-hidden vs-card-shadow">
                  <div className="bg-emerald-600 px-4 py-2 flex items-center justify-between text-white text-xs">
                    <span className="font-medium">verifscan.sn</span>
                    <span className="opacity-80">9:41</span>
                  </div>
                  <div className="p-6 space-y-4 bg-gradient-to-b from-emerald-50/50 to-white">
                    <div className="flex items-center justify-center">
                      <div className="w-44 h-44 rounded-2xl bg-white border-2 border-emerald-200 p-3 shadow-inner">
                        <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-0.5">
                          {Array.from({ length: 49 }).map((_, i) => {
                            // pseudo-random pattern
                            const isOn = [0,1,2,3,4,5,6,7,13,14,16,17,18,20,21,23,24,26,27,29,30,32,33,35,36,38,39,41,42,43,44,45,46,47,48].includes(i) || Math.random() > 0.55;
                            return (
                              <div
                                key={i}
                                className={isOn ? "bg-emerald-900" : "bg-transparent"}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="size-3.5" />
                        Produit authentique
                      </div>
                      <h3 className="font-semibold text-gray-900">Jus de Bissap Bio</h3>
                      <p className="text-xs text-gray-500">Sarine Bio · 500ml</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-amber-50 p-2">
                        <p className="text-gray-500">Fabrication</p>
                        <p className="font-semibold text-gray-900">Dakar, SN</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2">
                        <p className="text-gray-500">Péremption</p>
                        <p className="font-semibold text-gray-900">12/2026</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 hidden sm:block rounded-2xl bg-amber-400 text-amber-900 px-4 py-3 shadow-lg rotate-6">
                  <div className="flex items-center gap-2">
                    <ScanLine className="size-5" />
                    <div>
                      <p className="text-xs font-medium">Scannez</p>
                      <p className="text-xs opacity-80">Vérifiez en 1 sec</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-700">{stats.fabricants}</div>
              <div className="text-sm text-gray-500">Fabricants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.products}</div>
              <div className="text-sm text-gray-500">Produits tracés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-700">{stats.lots}</div>
              <div className="text-sm text-gray-500">Lots actifs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
              Simple & rapide
            </Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Comment ça marche ?
            </h2>
            <p className="mt-3 text-gray-600">
              Trois étapes suffisent pour transformer vos produits en produits traçables
              et authentifiés.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Créez vos produits",
                desc: "Renseignez les informations de votre produit : nom, marque, photo, catégorie. En quelques clics, votre produit est enregistré dans la plateforme.",
                icon: Package,
                color: "emerald",
              },
              {
                step: "2",
                title: "Générez les QR codes",
                desc: "Pour chaque lot, créez une fiche de traçabilité complète et générez automatiquement un QR code unique à apposer sur vos étiquettes.",
                icon: QrCode,
                color: "amber",
              },
              {
                step: "3",
                title: "Scannez & vérifiez",
                desc: "Vos clients scannent le QR code avec leur smartphone et accèdent instantanément à toutes les informations d'authenticité du produit.",
                icon: ScanLine,
                color: "emerald",
              },
            ].map((s) => (
              <Card key={s.step} className="relative vs-card-shadow border-emerald-100">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                        s.color === "emerald"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <s.icon className="size-6" />
                    </div>
                    <span className="text-5xl font-bold text-emerald-50">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi VerifScan */}
      <section className="py-20 bg-emerald-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Pourquoi VerifScan ?
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                La confiance,.Scan après Scan.
              </h2>
              <p className="text-gray-600">
                Dans un marché où la contrefaçon et l'opacité sur l'origine des produits
                menacent la santé des consommateurs et la réputation des fabricants sérieux,
                VerifScan rétablit la confiance par la transparence totale.
              </p>

              <ul className="space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Authenticité garantie",
                    desc: "Chaque QR code est unique et lié à un lot officiel enregistré par le fabricant.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Statistiques de scans",
                    desc: "Suivez en temps réel où, quand et combien de fois vos produits sont scannés.",
                  },
                  {
                    icon: Globe2,
                    title: "Adapté au marché ouest-africain",
                    desc: "Pensé pour les fabricants du Sénégal et d'Afrique de l'Ouest, avec WhatsApp intégré.",
                  },
                ].map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <f.icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{f.title}</p>
                      <p className="text-sm text-gray-600">{f.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Link href="/register">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, label: "Fabricants actifs", value: stats.fabricants, color: "bg-emerald-600" },
                { icon: Package, label: "Produits tracés", value: stats.products, color: "bg-amber-500" },
                { icon: Eye, label: "Lots actifs", value: stats.lots, color: "bg-emerald-600" },
                { icon: Users, label: "Consommateurs", value: "∞", color: "bg-amber-500" },
              ].map((c) => (
                <Card key={c.label} className="vs-card-shadow border-emerald-100">
                  <CardContent className="p-6 text-center">
                    <div className={`mx-auto w-12 h-12 ${c.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                      <c.icon className="size-6" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{c.value}</div>
                    <div className="text-sm text-gray-500">{c.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Produits populaires */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                Découvrez
              </Badge>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                Produits populaires
              </h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex border-emerald-200">
              <Link href="/produits">
                Voir tout
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>

          {popularProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Aucun produit disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {popularProducts.map((p) => (
                <Link key={p.id} href={`/produit/${p.id}`} className="group">
                  <Card className="overflow-hidden vs-card-shadow border-emerald-100 transition-all group-hover:shadow-lg group-hover:-translate-y-1 h-full">
                    <div className="aspect-square bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center">
                      {p.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">{p.category?.icon || "📦"}</span>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                          {p.category?.icon} {p.category?.name}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                      <p className="text-xs text-gray-500">{p.brand} · {p.weight}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline" className="border-emerald-200">
              <Link href="/produits">
                Voir tous les produits
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Prêt à garantir l'authenticité de vos produits ?
          </h2>
          <p className="mt-4 text-emerald-50 max-w-2xl mx-auto">
            Rejoignez les fabricants qui font confiance à VerifScan pour offrir
            transparence et confiance à leurs clients.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50"
            >
              <Link href="/register">
                Créer mon compte fabricant
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
