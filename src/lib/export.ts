import { db } from "@/lib/db";

/**
 * Escapes a value for CSV output.
 */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV string from rows.
 */
export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

/**
 * Returns the products export for a fabricant.
 */
export async function buildProductsExport(userId: string) {
  const products = await db.product.findMany({
    where: { userId },
    include: {
      category: { select: { name: true } },
      _count: { select: { lots: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "ID", "Nom", "Marque", "Catégorie", "Poids", "Description",
    "Visible", "Nombre de lots", "Date de création",
  ];

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.brand,
    p.category?.name || "",
    p.weight || "",
    p.description || "",
    p.isVisible ? "Oui" : "Non",
    p._count.lots,
    p.createdAt.toISOString().split("T")[0],
  ]);

  return {
    csv: buildCsv(headers, rows),
    filename: `produits-${new Date().toISOString().split("T")[0]}.csv`,
    data: products,
  };
}

/**
 * Returns the lots export for a fabricant.
 */
export async function buildLotsExport(userId: string) {
  const lots = await db.lot.findMany({
    where: { product: { userId } },
    include: {
      product: { select: { name: true, brand: true } },
      _count: { select: { qrCodes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "ID", "Numéro de lot", "Produit", "Marque",
    "Date de fabrication", "Date de péremption",
    "Lieu de fabrication", "Lieu de transformation",
    "Pays de vente", "Ingrédients", "Statut",
    "Nombre de QR codes", "Date de création",
  ];

  const rows = lots.map((l) => [
    l.id,
    l.lotNumber,
    l.product.name,
    l.product.brand,
    l.manufacturingDate.toISOString().split("T")[0],
    l.expirationDate.toISOString().split("T")[0],
    l.manufacturingLocation || "",
    l.transformationLocation || "",
    l.salesCountries || "",
    l.ingredients || "",
    l.status === "recalled" ? "Rappelé" : "Actif",
    l._count.qrCodes,
    l.createdAt.toISOString().split("T")[0],
  ]);

  return {
    csv: buildCsv(headers, rows),
    filename: `lots-${new Date().toISOString().split("T")[0]}.csv`,
    data: lots,
  };
}

/**
 * Returns the scans export for a fabricant.
 */
export async function buildScansExport(userId: string, startDate?: Date, endDate?: Date) {
  const scans = await db.scan.findMany({
    where: {
      qrCode: { lot: { product: { userId } } },
      ...(startDate || endDate
        ? { scannedAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } }
        : {}),
    },
    include: {
      qrCode: {
        select: {
          lot: {
            select: {
              lotNumber: true,
              product: { select: { name: true, brand: true } },
            },
          },
        },
      },
    },
    orderBy: { scannedAt: "desc" },
    take: 10000, // safety limit
  });

  const headers = [
    "Date du scan", "Heure", "Produit", "Marque", "Numéro de lot",
    "Type d'appareil", "Pays", "Ville", "User Agent",
  ];

  const rows = scans.map((s) => {
    const d = s.scannedAt;
    return [
      d.toISOString().split("T")[0],
      d.toTimeString().split(" ")[0],
      s.qrCode.lot.product.name,
      s.qrCode.lot.product.brand,
      s.qrCode.lot.lotNumber,
      s.deviceType || "",
      s.country || "",
      s.city || "",
      s.userAgent || "",
    ];
  });

  return {
    csv: buildCsv(headers, rows),
    filename: `scans-${new Date().toISOString().split("T")[0]}.csv`,
    data: scans,
  };
}

/**
 * Builds a compliance report (HTML for PDF conversion).
 */
export async function buildComplianceReport(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { companyName: true, email: true, phone: true, address: true },
  });

  const [products, lots, qrCodes, scans] = await Promise.all([
    db.product.count({ where: { userId } }),
    db.lot.count({ where: { product: { userId } } }),
    db.qRCode.count({ where: { lot: { product: { userId } } } }),
    db.scan.count({ where: { qrCode: { lot: { product: { userId } } } } }),
  ]);

  const recalledLots = await db.lot.count({
    where: { product: { userId }, status: "recalled" },
  });

  return {
    company: user,
    stats: { products, lots, qrCodes, scans, recalledLots },
    generatedAt: new Date(),
  };
}
