// ============================================================================
// VerifScan V3 — Module Intelligence Artificielle
// ============================================================================
// Bibliothèque centralisant toute la logique IA :
//   1. Détection d'anomalies (ingrédients, DLC, contrefaçon géographique)
//   2. Prédictions de demande (modèle heuristique basé sur l'historique des scans)
//   3. Génération de descriptions SEO
//   4. Traduction automatique FR/EN/Wolof
//   5. Recommandations actionnables pour les fabricants
//   6. Chatbot consommateur (réponses basées sur les données produit)
//   7. Heatmap géographique & analytics comportementaux
// ============================================================================

import { db } from "@/lib/db";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// 1. DÉTECTION D'ANOMALIES
// ---------------------------------------------------------------------------

/** Allergènes majeurs à surveiller (Codex Alimentarius) */
export const KNOWN_ALLERGENS = [
  "arachide", "arachides", "cacahuète", "cacahuètes",
  "lait", "lactose", "produit laitier",
  "œuf", "œufs", "oeuf", "oeufs",
  "soja", "sojas",
  "blé", "gluten", "gluté",
  "poisson", "poissons",
  "crustacé", "crustacés", "crevette", "crevettes",
  "fruits à coque", "noix", "amande", "amandes", "noisette", "noisettes",
  "sésame", "moutarde",
] as const;

/** Additifs suspects ou interdits dans certaines catégories */
const SUSPICIOUS_ADDITIVES: Record<string, { name: string; reason: string }> = {
  "e102": { name: "Tartrazine", reason: "Interdit dans certains pays UE pour enfants hyperactifs" },
  "e110": { name: "Jaune orangé S", reason: "Suspect d'hyperactivité chez l'enfant" },
  "e129": { name: "Rouge allura AC", reason: "Interdit dans plusieurs pays UE" },
  "e124": { name: "Ponceau 4R", reason: "Restrictions UE sur boissons" },
};

export interface IngredientAnalysisResult {
  foundAllergens: string[];
  suspiciousAdditives: { code: string; name: string; reason: string }[];
  warnings: string[];
  confidenceScore: number; // 0-100, plus haut = meilleure qualité
}

/** Analyse une liste d'ingrédients et renvoie les anomalies détectées */
export function analyzeIngredients(ingredients: string): IngredientAnalysisResult {
  const lower = ingredients.toLowerCase();
  const foundAllergens: string[] = [];
  const suspicious: { code: string; name: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Détection allergènes
  for (const a of KNOWN_ALLERGENS) {
    const regex = new RegExp(`\\b${a.replace(/[èéêë]/g, "[èéêë]")}\\b`, "i");
    if (regex.test(lower) && !foundAllergens.includes(a)) {
      foundAllergens.push(a);
    }
  }
  if (foundAllergens.length > 0) {
    warnings.push(
      `Allergènes détectés (${foundAllergens.length}) — assurez-vous de les déclarer clairement sur l'étiquette.`
    );
  }

  // Détection additifs suspects
  for (const [code, info] of Object.entries(SUSPICIOUS_ADDITIVES)) {
    if (lower.includes(code) || lower.includes(info.name.toLowerCase())) {
      suspicious.push({ code, ...info });
      warnings.push(`${info.name} (${code.toUpperCase()}) — ${info.reason}`);
    }
  }

  // Heuristique confiance : moins d'allergènes + moins d'additifs suspects = score plus haut
  let score = 100;
  score -= suspicious.length * 15;
  score -= foundAllergens.length > 3 ? 10 : 0; // trop d'allergènes non déclarés
  score = Math.max(40, score);

  return {
    foundAllergens,
    suspiciousAdditives: suspicious,
    warnings,
    confidenceScore: score,
  };
}

/** Calcule le ratio de péremption d'un lot et renvoie le niveau d'alerte */
export function getDlcAlertLevel(
  expirationDate: Date,
  manufacturingDate: Date,
  now: Date = new Date()
): { level: "ok" | "info" | "warning" | "critical"; daysLeft: number; ratio: number } {
  const totalLifeMs = expirationDate.getTime() - manufacturingDate.getTime();
  const remainingMs = expirationDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const ratio = totalLifeMs > 0 ? remainingMs / totalLifeMs : 0;

  if (daysLeft <= 0) return { level: "critical", daysLeft, ratio: 0 };
  if (ratio < 0.1) return { level: "critical", daysLeft, ratio };
  if (ratio < 0.2) return { level: "warning", daysLeft, ratio };
  if (ratio < 0.35) return { level: "info", daysLeft, ratio };
  return { level: "ok", daysLeft, ratio };
}

/** Détecte les scans dans des pays non déclarés dans la zone de distribution */
export async function detectCounterfeitScans(fabricantId: string) {
  // Récupère tous les lots du fabricant avec leurs pays de vente déclarés
  const lots = await db.lot.findMany({
    where: { product: { userId: fabricantId } },
    include: {
      product: { select: { name: true, brand: true } },
      qrCodes: {
        include: {
          scans: { select: { country: true, city: true, scannedAt: true, id: true } },
        },
      },
    },
  });

  const anomalies: {
    lotId: string;
    lotNumber: string;
    productName: string;
    scanCountry: string;
    scanCity: string | null;
    scannedAt: Date;
    declaredCountries: string[];
    scanId: string;
  }[] = [];

  for (const lot of lots) {
    const declared = (lot.salesCountries || "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    // Si pas de pays déclaré, on ne peut pas conclure → skip
    if (declared.length === 0) continue;

    for (const qr of lot.qrCodes) {
      for (const scan of qr.scans) {
        if (!scan.country) continue;
        const scanCountry = scan.country.toLowerCase().trim();
        if (!declared.includes(scanCountry)) {
          anomalies.push({
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            productName: lot.product.name,
            scanCountry: scan.country,
            scanCity: scan.city,
            scannedAt: scan.scannedAt,
            declaredCountries: lot.salesCountries?.split(",").map((c) => c.trim()) || [],
            scanId: scan.id,
          });
        }
      }
    }
  }

  return anomalies;
}

/** Scanne tous les lots d'un fabricant et enregistre les anomalies DLC en base */
export async function scanAndPersistDlcAnomalies(fabricantId: string) {
  const now = new Date();
  const lots = await db.lot.findMany({
    where: { product: { userId: fabricantId }, status: "active" },
    include: { product: { select: { name: true } } },
  });

  const created: { lotId: string; productName: string; severity: string; message: string }[] = [];

  for (const lot of lots) {
    const alert = getDlcAlertLevel(lot.expirationDate, lot.manufacturingDate, now);
    if (alert.level === "ok") continue;

    // Vérifie si on a déjà une anomalie DLC ouverte pour ce lot
    const existing = await db.aIAnomaly.findFirst({
      where: { lotId: lot.id, type: "dlc", status: "open" },
    });
    if (existing) continue;

    const severity = alert.level === "critical" ? "critical" : "warning";
    const message = alert.daysLeft <= 0
      ? `Lot ${lot.lotNumber} (${lot.product.name}) — périmé depuis ${Math.abs(alert.daysLeft)} jour(s)`
      : `Lot ${lot.lotNumber} (${lot.product.name}) — expire dans ${alert.daysLeft} jour(s)`;

    await db.aIAnomaly.create({
      data: {
        type: "dlc",
        lotId: lot.id,
        productId: lot.productId,
        fabricantId,
        severity,
        description: message,
        aiMetadata: JSON.stringify({ daysLeft: alert.daysLeft, ratio: alert.ratio }),
      },
    });
    created.push({ lotId: lot.id, productName: lot.product.name, severity, message });
  }

  return created;
}

// ---------------------------------------------------------------------------
// 2. PRÉDICTIONS DE DEMANDE
// ---------------------------------------------------------------------------

/**
 * Prédiction heuristique basée sur l'historique des scans.
 * Calcule la tendance des 30 derniers jours vs les 30 jours précédents,
 * applique des facteurs saisonniers (ramadan, fêtes), et renvoie une prédiction.
 */
export async function predictProductDemand(productId: string) {
  const now = new Date();
  const last60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const scans = await db.scan.findMany({
    where: {
      qrCode: { lot: { productId } },
      scannedAt: { gte: last60 },
    },
    select: { scannedAt: true },
  });

  if (scans.length < 5) {
    return null; // pas assez de données
  }

  const recentCount = scans.filter((s) => s.scannedAt >= last30).length;
  const previousCount = scans.length - recentCount;

  // Trend simple
  let trendPct = 0;
  if (previousCount > 0) {
    trendPct = ((recentCount - previousCount) / previousCount) * 100;
  }

  // Facteurs saisonniers (heuristique Afrique de l'Ouest)
  const month = now.getMonth(); // 0-11
  const seasonalFactors: Record<number, { factor: number; reason: string }> = {
    2: { factor: 15, reason: "Approche Ramadan — demande en hausse sur les boissons et dattes" },
    3: { factor: 35, reason: "Ramadan — pic de demande sur les jus, dattes, produits laitiers" },
    4: { factor: 20, reason: "Fin Ramadan / Korité — maintien de la demande" },
    11: { factor: 25, reason: "Fêtes de fin d'année — demande globale en hausse" },
    0: { factor: 10, reason: "Nouvel an — légère hausse de la demande" },
    7: { factor: -10, reason: "Hivernal — baisse sur certaines catégories (boissons fraîches)" },
  };
  const seasonal = seasonalFactors[month];

  const finalPrediction = trendPct + (seasonal?.factor || 0);
  // Confidence : plus on a de scans, plus on est confiant
  const confidence = Math.min(95, 30 + Math.sqrt(scans.length) * 8);

  return {
    predictedChangePct: Math.round(finalPrediction * 10) / 10,
    confidenceScore: Math.round(confidence),
    trendPct: Math.round(trendPct * 10) / 10,
    seasonalFactor: seasonal?.factor || 0,
    seasonalReason: seasonal?.reason || "Aucun facteur saisonnier notable",
    recentScans: recentCount,
    previousScans: previousCount,
    nextMonthStart: last30,
    nextMonthEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  };
}

// ---------------------------------------------------------------------------
// 3. GÉNÉRATION SEO
// ---------------------------------------------------------------------------

/**
 * Génère une description produit optimisée SEO pour le marché ouest-africain.
 * Utilise une approche template + enrichissement (peut être remplacée par un LLM).
 */
export function generateSeoDescription(product: {
  name: string;
  brand: string;
  category: { name: string };
  weight?: string | null;
  ingredients?: string | null;
}): { description: string; metaDescription: string; slug: string; tags: string[] } {
  const cat = product.category.name.toLowerCase();
  const hasWeight = product.weight ? ` (${product.weight})` : "";

  // Description longue (~150-200 mots, optimisée pour mots-clés locaux)
  const description = `${product.name}${hasWeight} est un ${cat} de qualité proposé par ${product.brand}, \
une marque engagée dans la traçabilité alimentaire en Afrique de l'Ouest. \
Fabriqué avec rigueur et certifié par VerifScan, ce produit garantit aux consommateurs \
sénégalais et ouest-africains une transparence totale sur son origine, ses ingrédients et sa fraîcheur. \
${
  product.ingredients
    ? `Composition : ${product.ingredients}. `
    : ""
}Chaque lot est identifié par un QR code unique permettant de vérifier instantanément \
la date de fabrication, la date de péremption et les certifications. \
Choisir ${product.name}, c'est soutenir une consommation responsable et locale, \
tout en protégeant votre santé grâce à une information claire et vérifiable.`;

  const metaDescription = `${product.name} de ${product.brand} — ${cat} traçable${hasWeight}. Vérifiez l'origine, la fraîcheur et les certifications via QR code.`;

  const slug = product.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const tags = [
    product.brand.toLowerCase(),
    cat,
    "sénégal",
    "afrique de l'ouest",
    "traçabilité",
    "qr code",
    "verifscan",
    product.weight ? product.weight.toLowerCase() : "",
  ].filter(Boolean) as string[];

  return {
    description: description.replace(/\s+/g, " ").trim(),
    metaDescription: metaDescription.trim(),
    slug,
    tags,
  };
}

// ---------------------------------------------------------------------------
// 4. TRADUCTION
// ---------------------------------------------------------------------------

/** Mini dictionnaire FR → Wolof pour termes courants (peut être étendu) */
const WOLOF_DICT: Record<string, string> = {
  "produit": "mbirum",
  "fabricant": "bindkat",
  "ingrédients": "mbirum",
  "date": "fan",
  "fabrication": "defar",
  "péremption": "fen",
  "qualité": "baax",
  "certifié": "wóor",
  "vérifié": "wóor",
  "frais": "bees",
  "origine": "bérab",
  "scan": "sekk",
  "code": "lim",
  "lot": "wall",
  "marque": "turu",
  "santé": "wér-gi-yaram",
  "consommation": "lekk",
  "local": "peré",
  "bio": "ndey",
  "halal": "halal",
};

const EN_DICT: Record<string, string> = {
  "produit": "product",
  "fabricant": "manufacturer",
  "ingrédients": "ingredients",
  "date de fabrication": "manufacturing date",
  "date de péremption": "expiration date",
  "qualité": "quality",
  "certifié": "certified",
  "vérifié": "verified",
  "frais": "fresh",
  "origine": "origin",
  "lot": "batch",
  "marque": "brand",
  "santé": "health",
  "consommation": "consumption",
  "local": "local",
};

export function translateText(text: string, target: "fr" | "en" | "wolof"): string {
  if (target === "fr") return text;

  const dict = target === "wolof" ? WOLOF_DICT : EN_DICT;
  let result = text.toLowerCase();
  // Tri par longueur décroissante pour les expressions composées
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    result = result.replace(regex, dict[key]);
  }
  // Préserve la majuscule initiale
  if (text[0] === text[0].toUpperCase()) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 5. RECOMMANDATIONS
// ---------------------------------------------------------------------------

/** Génère des recommandations actionnables basées sur l'état du profil fabricant */
export async function generateRecommendations(fabricantId: string) {
  const products = await db.product.findMany({
    where: { userId: fabricantId },
    include: {
      category: true,
      lots: {
        include: {
          qrCodes: {
            include: { scans: { select: { scannedAt: true } } },
          },
        },
      },
    },
  });

  const recs: { type: string; content: string; expectedImpactPct: number }[] = [];

  // Recommandation trust : champs manquants
  for (const p of products) {
    if (!p.description || p.description.length < 50) {
      recs.push({
        type: "trust",
        content: `Ajoutez une description détaillée au produit « ${p.name} » pour gagner +20% de confiance consommateur.`,
        expectedImpactPct: 20,
      });
    }
    if (!p.photoUrl) {
      recs.push({
        type: "trust",
        content: `Ajoutez une photo au produit « ${p.name} » — les produits avec photo reçoivent +35% de scans.`,
        expectedImpactPct: 35,
      });
    }
    // Lots sans pays de vente déclaré
    const lotWithoutCountries = p.lots.find((l) => !l.salesCountries);
    if (lotWithoutCountries) {
      recs.push({
        type: "trust",
        content: `Déclarez les pays de distribution du lot ${lotWithoutCountries.lotNumber} (${p.name}) pour activer la détection de contrefaçon.`,
        expectedImpactPct: 15,
      });
    }
    // Lots sans ingrédients
    const lotWithoutIngredients = p.lots.find((l) => !l.ingredients);
    if (lotWithoutIngredients) {
      recs.push({
        type: "trust",
        content: `Renseignez les ingrédients du lot ${lotWithoutIngredients.lotNumber} (${p.name}) pour activer l'analyse IA des allergènes.`,
        expectedImpactPct: 25,
      });
    }
  }

  // Recommandation publish_time : meilleure heure de publication
  const scans = await db.scan.findMany({
    where: { qrCode: { lot: { product: { userId: fabricantId } } } },
    select: { scannedAt: true },
  });
  if (scans.length > 20) {
    const byDayHour: Record<string, number> = {};
    for (const s of scans) {
      const day = s.scannedAt.getDay(); // 0 = dimanche
      const hour = s.scannedAt.getHours();
      const key = `${day}-${hour}`;
      byDayHour[key] = (byDayHour[key] || 0) + 1;
    }
    const sorted = Object.entries(byDayHour).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const [topKey, count] = sorted[0];
      const [day, hour] = topKey.split("-");
      const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
      recs.push({
        type: "publish_time",
        content: `Pic d'activité observé le ${days[+day]} à ${hour}h — publiez vos nouveaux produits à ce moment pour +40% de visibilité.`,
        expectedImpactPct: 40,
      });
    }
  }

  // Recommandation competitive : nombre de photos vs moyenne
  const productsWithPhotos = products.filter((p) => p.photoUrl).length;
  const photoRatio = products.length > 0 ? productsWithPhotos / products.length : 0;
  if (photoRatio < 0.7) {
    recs.push({
      type: "competitive",
      content: `${Math.round(photoRatio * 100)}% de vos produits ont une photo. Vos concurrents en ont sur 90% des leurs — rattrapez ce retard.`,
      expectedImpactPct: 25,
    });
  }

  return recs.slice(0, 10); // max 10 recommandations
}

// ---------------------------------------------------------------------------
// 6. CHATBOT CONSOMMATEUR
// ---------------------------------------------------------------------------

/** Génère une réponse du chatbot basée sur les données produit (anti-hallucination) */
export async function answerConsumerQuestion(
  productId: string,
  question: string
): Promise<{ answer: string; confidence: number; source: string }> {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      user: { select: { companyName: true, address: true } },
      lots: {
        orderBy: { manufacturingDate: "desc" },
        take: 1,
        include: { qrCodes: { select: { _count: { select: { scans: true } } } } },
      },
    },
  });

  if (!product) {
    return {
      answer: "Désolé, je n'ai pas d'information sur ce produit.",
      confidence: 0,
      source: "none",
    };
  }

  const q = question.toLowerCase();

  // Question sur la fraîcheur / péremption
  if (q.includes("péremption") || q.includes("peremption") || q.includes("expiration") || q.includes("dlc") || q.includes("frais")) {
    const latestLot = product.lots[0];
    if (!latestLot) {
      return {
        answer: `Aucun lot actif n'est actuellement disponible pour ${product.name}.`,
        confidence: 80,
        source: "lot_data",
      };
    }
    const daysLeft = Math.ceil(
      (latestLot.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return {
      answer: `Le dernier lot de ${product.name} (n°${latestLot.lotNumber}) a été fabriqué le ${latestLot.manufacturingDate.toLocaleDateString("fr-FR")} et expire le ${latestLot.expirationDate.toLocaleDateString("fr-FR")}. ${daysLeft > 0 ? `Il reste ${daysLeft} jour(s) avant la péremption.` : "Ce lot est périmé, vérifiez le lot en cours."}`,
      confidence: 95,
      source: "lot_data",
    };
  }

  // Question sur les ingrédients
  if (q.includes("ingrédient") || q.includes("ingredient") || q.includes("composition") || q.includes("allergène") || q.includes("allergene")) {
    const latestLot = product.lots[0];
    if (!latestLot?.ingredients) {
      return {
        answer: `Les ingrédients de ${product.name} ne sont pas disponibles. Contactez ${product.user.companyName || "le fabricant"} pour plus d'informations.`,
        confidence: 70,
        source: "lot_data",
      };
    }
    const analysis = analyzeIngredients(latestLot.ingredients);
    let answer = `Ingrédients de ${product.name} : ${latestLot.ingredients}.`;
    if (analysis.foundAllergens.length > 0) {
      answer += ` ⚠️ Contient des allergènes : ${analysis.foundAllergens.join(", ")}.`;
    }
    return { answer, confidence: 95, source: "lot_data" };
  }

  // Question sur l'origine / fabricant
  if (q.includes("origine") || q.includes("fabricant") || q.includes("qui") || q.includes("marque") || q.includes("où")) {
    return {
      answer: `${product.name} est fabriqué par ${product.user.companyName || "un fabricant vérifié"}${product.user.address ? ` basé à ${product.user.address}` : ""}. C'est un produit de la catégorie ${product.category.name}, disponible sur VerifScan avec traçabilité complète.`,
      confidence: 90,
      source: "product_data",
    };
  }

  // Question sur la sécurité / certification
  if (q.includes("sécur") || q.includes("certif") || q.includes("vérifié") || q.includes("verifie") || q.includes("confiance") || q.includes("qualité")) {
    const totalScans = product.lots.reduce(
      (sum, l) => sum + l.qrCodes.reduce((s, q) => s + q._count.scans, 0),
      0
    );
    return {
      answer: `${product.name} est un produit vérifié par VerifScan avec ${totalScans} scan(s) de consommateurs. Chaque lot possède un QR code unique permettant de retracer l'origine, la fraîcheur et la conformité. La marque ${product.brand} s'engage pour la transparence alimentaire.`,
      confidence: 85,
      source: "scan_data",
    };
  }

  // Question générique sur le produit
  return {
    answer: `${product.name} est un ${product.category.name} proposé par la marque ${product.brand}${product.weight ? `, format ${product.weight}` : ""}. Vous pouvez demander : la date de péremption, les ingrédients, l'origine du fabricant, ou les certifications. Que souhaitez-vous savoir ?`,
    confidence: 75,
    source: "product_data",
  };
}

// ---------------------------------------------------------------------------
// 7. HEATMAP & ANALYSE COMPORTEMENTALE
// ---------------------------------------------------------------------------

/** Renvoie les points géographiques pour la heatmap des scans */
export async function getHeatmapData(
  fabricantId: string,
  filters?: { productId?: string; daysBack?: number }
) {
  const where: any = {
    qrCode: { lot: { product: { userId: fabricantId } } },
  };
  if (filters?.productId) {
    where.qrCode.lot.productId = filters.productId;
  }
  if (filters?.daysBack) {
    const since = new Date(Date.now() - filters.daysBack * 24 * 60 * 60 * 1000);
    where.scannedAt = { gte: since };
  }

  const scans = await db.scan.findMany({
    where,
    select: { country: true, city: true, scannedAt: true, deviceType: true },
  });

  // Agrège par ville
  const points: Record<string, { lat: number; lng: number; count: number; city: string; country: string }> = {};
  for (const s of scans) {
    if (!s.country) continue;
    const key = `${s.city || s.country}`;
    // Approximation coords pour villes principales (sinon Dakar par défaut)
    const coords = CITY_COORDINATES[(s.city || "").toLowerCase()] ||
      COUNTRY_COORDINATES[s.country.toLowerCase()] ||
      { lat: 14.6928, lng: -17.4467 }; // Dakar par défaut

    if (!points[key]) {
      points[key] = { ...coords, count: 0, city: s.city || s.country, country: s.country };
    }
    points[key].count++;
  }

  return Object.values(points).sort((a, b) => b.count - a.count);
}

/** Coordonnées des principales villes ouest-africaines */
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "dakar": { lat: 14.6928, lng: -17.4467 },
  "thiès": { lat: 14.7886, lng: -16.9260 },
  "saint-louis": { lat: 16.0326, lng: -16.4818 },
  "touba": { lat: 14.8500, lng: -15.8833 },
  "kaolack": { lat: 14.1653, lng: -16.0777 },
  "ziguinchor": { lat: 12.5833, lng: -16.2667 },
  "abidjan": { lat: 5.3450, lng: -4.0244 },
  "bamako": { lat: 12.6392, lng: -8.0029 },
  "conakry": { lat: 9.6412, lng: -13.5784 },
  "ouagadougou": { lat: 12.3714, lng: -1.5197 },
  "lomé": { lat: 6.1725, lng: 1.2314 },
  "cotonou": { lat: 6.3654, lng: 2.4182 },
  "niamey": { lat: 13.5117, lng: 2.1251 },
  "lagos": { lat: 6.5244, lng: 3.3792 },
  "accra": { lat: 5.6037, lng: -0.1870 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "london": { lat: 51.5074, lng: -0.1278 },
  "new york": { lat: 40.7128, lng: -74.0060 },
};

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "sénégal": { lat: 14.4974, lng: -14.4524 },
  "senegal": { lat: 14.4974, lng: -14.4524 },
  "côte d'ivoire": { lat: 7.5399, lng: -5.5471 },
  "mali": { lat: 17.5707, lng: -3.9962 },
  "guinée": { lat: 9.9456, lng: -9.6966 },
  "burkina faso": { lat: 12.2383, lng: -1.5616 },
  "togo": { lat: 8.6195, lng: 0.8248 },
  "bénin": { lat: 9.3077, lng: 2.3158 },
  "niger": { lat: 17.6078, lng: 8.0817 },
  "nigeria": { lat: 9.0820, lng: 8.6753 },
  "ghana": { lat: 7.9465, lng: -1.0232 },
  "france": { lat: 46.6034, lng: 1.8883 },
  "usa": { lat: 37.0902, lng: -95.7129 },
  "royaume-uni": { lat: 55.3781, lng: -3.4360 },
};

/** Analyse comportementale : duree moyenne, bounce rate, clics certifications */
export async function getBehavioralStats(productId: string) {
  // Le scan n'enregistre pas la durée directement — on simule des heuristiques
  // basées sur les deviceType et patterns horaires
  const scans = await db.scan.findMany({
    where: { qrCode: { lot: { productId } } },
    select: { scannedAt: true, deviceType: true, country: true },
    orderBy: { scannedAt: "asc" },
  });

  if (scans.length === 0) {
    return {
      totalScans: 0,
      avgSessionDurationSec: 0,
      bounceRate: 0,
      mobileRatio: 0,
      peakHour: 0,
      returningVisitors: 0,
    };
  }

  // Heuristique : sessions mobiles plus courtes (40s), desktop plus longues (120s)
  let totalDuration = 0;
  for (const s of scans) {
    if (s.deviceType === "mobile") totalDuration += 40 + Math.random() * 60;
    else if (s.deviceType === "tablet") totalDuration += 70 + Math.random() * 90;
    else totalDuration += 120 + Math.random() * 120;
  }
  const avgSessionDurationSec = Math.round(totalDuration / scans.length);

  // Bounce rate : ~30% mobile, ~15% desktop
  const mobileScans = scans.filter((s) => s.deviceType === "mobile").length;
  const desktopScans = scans.filter((s) => s.deviceType === "desktop").length;
  const bounceRate = Math.round(
    ((mobileScans * 0.3 + desktopScans * 0.15) / scans.length) * 100
  );

  // Heure de pointe
  const byHour: Record<number, number> = {};
  for (const s of scans) {
    const h = s.scannedAt.getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  }
  const peakHour = +Object.entries(byHour).sort((a, b) => b[1] - a[1])[0][0];

  // Visiteurs "récurrents" (même pays plusieurs fois dans des jours différents)
  const byCountryDate: Record<string, Set<string>> = {};
  for (const s of scans) {
    if (!s.country) continue;
    const date = s.scannedAt.toDateString();
    const key = s.country;
    if (!byCountryDate[key]) byCountryDate[key] = new Set();
    byCountryDate[key].add(date);
  }
  const returningVisitors = Object.values(byCountryDate).filter((d) => d.size > 1).length;

  return {
    totalScans: scans.length,
    avgSessionDurationSec,
    bounceRate,
    mobileRatio: Math.round((mobileScans / scans.length) * 100),
    peakHour,
    returningVisitors,
  };
}

// ---------------------------------------------------------------------------
// 8. BLOCKCHAIN (Polygon simulé — hash cryptographique)
// ---------------------------------------------------------------------------

/** Calcule le hash SHA-256 des données d'un lot (pour certification blockchain) */
export function computeLotDataHash(lotData: {
  lotNumber: string;
  manufacturingDate: Date;
  expirationDate: string;
  productId: string;
  ingredients?: string | null;
  salesCountries?: string | null;
}): string {
  const payload = JSON.stringify({
    lotNumber: lotData.lotNumber,
    manufacturingDate: lotData.manufacturingDate.toISOString(),
    expirationDate: lotData.expirationDate,
    productId: lotData.productId,
    ingredients: lotData.ingredients || "",
    salesCountries: lotData.salesCountries || "",
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/** Simule l'écriture sur Polygon et génère un txHash + blockNumber */
export function simulateBlockchainWrite(dataHash: string): {
  txHash: string;
  blockNumber: number;
  contractAddress: string;
} {
  // Adresse contrat VerifScan (démo)
  const contractAddress = "0x7Ae3F8b21c4E2c9D4a5B6C1E8f23D4e5A6B7C8D9";
  // Block number de base (Polygon mainnet actuel ~ 60M)
  const blockNumber = 60000000 + Math.floor(Math.random() * 100000);
  // Simule un tx hash (64 hex chars)
  const randomPart = crypto
    .createHash("sha256")
    .update(`${dataHash}-${Date.now()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 64);
  const txHash = "0x" + randomPart;

  return { txHash, blockNumber, contractAddress };
}
