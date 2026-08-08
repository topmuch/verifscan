import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Shared import library for products & lots.
 *
 * Supports CSV (via papaparse) and Excel (xlsx, both .xlsx and .xls).
 * Returns detailed per-row results so the UI can show what succeeded
 * and what failed (with the row index + error message).
 */

export type ImportRowResult = {
  rowIndex: number;
  ok: boolean;
  error?: string;
  id?: string;
  name?: string;       // for products
  lotNumber?: string;  // for lots
};

export type ImportSummary = {
  totalRows: number;
  inserted: number;
  failed: number;
  results: ImportRowResult[];
};

/* ----------------------------- Parsing ----------------------------- */

/**
 * Parse a File (CSV or Excel) into a list of objects.
 * The first row is expected to be the header.
 */
export async function parseFileToRows(file: File): Promise<Record<string, any>[]> {
  const name = file.name.toLowerCase();
  const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");

  if (isExcel) {
    return parseExcel(file);
  }
  return parseCsv(file);
}

async function parseCsv(file: File): Promise<Record<string, any>[]> {
  const Papa = (await import("papaparse")).default;
  const text = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (res) => resolve(res.data as Record<string, any>[]),
      error: (err: any) => reject(err),
    });
  });
}

async function parseExcel(file: File): Promise<Record<string, any>[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
  return rows;
}

/* --------------------------- Normalisation -------------------------- */

/**
 * Try multiple possible column names for a given logical field.
 * Example: getField(row, ["name", "nom", "produit", "nom_produit"]) → first non-empty match.
 */
export function getField(row: Record<string, any>, keys: string[]): string {
  for (const k of keys) {
    // Try exact key
    if (row[k] != null && String(row[k]).trim() !== "") {
      return String(row[k]).trim();
    }
    // Try case-insensitive
    const lowerKey = k.toLowerCase();
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === lowerKey && row[rowKey] != null && String(row[rowKey]).trim() !== "") {
        return String(row[rowKey]).trim();
      }
    }
  }
  return "";
}

/**
 * Parse a date string from a spreadsheet cell. Accepts ISO, DD/MM/YYYY, MM/DD/YYYY,
 * Excel serial numbers, and human-readable dates like "12 mars 2024".
 */
export function parseDateField(value: any): string | null {
  if (value == null || value === "") return null;
  // Excel serial date (number of days since 1900-01-01)
  if (typeof value === "number" && value > 20000 && value < 100000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
    return d.toISOString();
  }
  const s = String(value).trim();
  if (!s) return null;

  // Try ISO first
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) {
    return iso.toISOString();
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [_, dd, mm, yy] = m;
    if (yy.length === 2) yy = "20" + yy;
    const d = new Date(`${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T00:00:00Z`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

/**
 * Parse a number from a cell that might be a string like "12,5" or "12.5".
 */
export function parseNumberField(value: any): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const s = String(value).trim().replace(",", ".").replace(/[^0-9.\-]/g, "");
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/* ------------------------- Product import --------------------------- */

const productSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  description: z.string().optional(),
  photoUrl: z.string().optional().or(z.literal("")),
  weight: z.string().optional(),
  categoryId: z.string().min(1),
  isVisible: z.boolean().default(true),
  barcode: z.string().optional(),
  variety: z.string().optional(),
  regionOfProduction: z.string().optional(),
  producerStory: z.string().optional(),
  producerPhotoUrl: z.string().optional().or(z.literal("")),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
});

export async function importProducts(
  rows: Record<string, any>[],
  userId: string
): Promise<ImportSummary> {
  const results: ImportRowResult[] = [];

  // Pre-fetch categories by name (case-insensitive) to allow CSV import by category name
  const allCategories = await db.category.findMany({ select: { id: true, name: true } });
  const catByName = new Map<string, string>();
  for (const c of allCategories) {
    catByName.set(c.name.toLowerCase(), c.id);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // +2 because header is row 1, data starts at row 2

    try {
      const categoryName = getField(row, ["category", "categorie", "catégorie", "categoryId", "category_id"]);
      const categoryId =
        catByName.get(categoryName.toLowerCase()) ||
        (categoryName ? categoryName : ""); // fallback: assume it's already an ID

      const payload = {
        name: getField(row, ["name", "nom", "produit", "nom_produit"]),
        brand: getField(row, ["brand", "marque", "fabricant"]),
        description: getField(row, ["description", "desc"]) || undefined,
        photoUrl: getField(row, ["photoUrl", "photo", "photo_url", "image"]) || undefined,
        weight: getField(row, ["weight", "poids", "poids_net", "conditionnement"]) || undefined,
        categoryId,
        isVisible: getField(row, ["isVisible", "visible", "publie"]).toLowerCase() !== "non",
        barcode: getField(row, ["barcode", "code_barre", "codebarre", "ean", "gtin", "upc"]) || undefined,
        variety: getField(row, ["variety", "variete", "variété"]) || undefined,
        regionOfProduction: getField(row, ["regionOfProduction", "region", "région", "origine_region"]) || undefined,
        producerStory: getField(row, ["producerStory", "histoire_producteur"]) || undefined,
        producerPhotoUrl: getField(row, ["producerPhotoUrl", "photo_producteur"]) || undefined,
        gpsLat: parseNumberField(getField(row, ["gpsLat", "latitude", "lat"])) ?? undefined,
        gpsLng: parseNumberField(getField(row, ["gpsLng", "longitude", "lng", "lon"])) ?? undefined,
      };

      const parsed = productSchema.safeParse(payload);
      if (!parsed.success) {
        results.push({
          rowIndex,
          ok: false,
          error: parsed.error.issues[0]?.message || "Données invalides",
        });
        continue;
      }

      const product = await db.product.create({
        data: {
          userId,
          categoryId: parsed.data.categoryId,
          name: parsed.data.name.trim(),
          brand: parsed.data.brand.trim(),
          description: parsed.data.description?.trim() || null,
          photoUrl: parsed.data.photoUrl || null,
          weight: parsed.data.weight?.trim() || null,
          isVisible: parsed.data.isVisible,
          barcode: parsed.data.barcode?.trim() || null,
          variety: parsed.data.variety?.trim() || null,
          regionOfProduction: parsed.data.regionOfProduction?.trim() || null,
          producerStory: parsed.data.producerStory?.trim() || null,
          producerPhotoUrl: parsed.data.producerPhotoUrl || null,
          gpsLat: parsed.data.gpsLat ?? null,
          gpsLng: parsed.data.gpsLng ?? null,
        },
      });

      results.push({
        rowIndex,
        ok: true,
        id: product.id,
        name: product.name,
      });
    } catch (err: any) {
      results.push({
        rowIndex,
        ok: false,
        error: err?.message || "Erreur inattendue",
      });
    }
  }

  return {
    totalRows: rows.length,
    inserted: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

/* --------------------------- Lot import ---------------------------- */

const lotSchema = z.object({
  productName: z.string().min(1),
  lotNumber: z.string().min(3).max(60).optional(),
  manufacturingDate: z.string(),
  expirationDate: z.string(),
  ingredients: z.string().optional(),
  manufacturingLocation: z.string().optional(),
  transformationLocation: z.string().optional(),
  salesCountries: z.string().optional(),
  status: z.enum(["active", "recalled"]).default("active"),
});

export async function importLots(
  rows: Record<string, any>[],
  userId: string
): Promise<ImportSummary> {
  const results: ImportRowResult[] = [];

  // Pre-fetch user products to resolve by name
  const userProducts = await db.product.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const productByName = new Map<string, string>();
  for (const p of userProducts) {
    productByName.set(p.name.toLowerCase(), p.id);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2;

    try {
      const productName = getField(row, ["productName", "produit", "nom_produit", "product_name", "name"]);
      const productId = productByName.get(productName.toLowerCase());

      if (!productId) {
        results.push({
          rowIndex,
          ok: false,
          error: `Produit introuvable: "${productName}". Importez d'abord le produit.`,
        });
        continue;
      }

      const manufacturingDate = parseDateField(getField(row, ["manufacturingDate", "date_fabrication", "fabrication", "date_prod"]));
      const expirationDate = parseDateField(getField(row, ["expirationDate", "date_expiration", "expiration", "dlc", "date_peremption"]));

      if (!manufacturingDate || !expirationDate) {
        results.push({
          rowIndex,
          ok: false,
          error: "Dates de fabrication/expiration manquantes ou invalides",
        });
        continue;
      }

      const payload = {
        productName,
        lotNumber: getField(row, ["lotNumber", "lot", "n_lot", "numero_lot"]) || undefined,
        manufacturingDate,
        expirationDate,
        ingredients: getField(row, ["ingredients", "ingrediens"]) || undefined,
        manufacturingLocation: getField(row, ["manufacturingLocation", "lieu_fabrication", "lieu"]) || undefined,
        transformationLocation: getField(row, ["transformationLocation", "lieu_transformation"]) || undefined,
        salesCountries: getField(row, ["salesCountries", "pays_vente", "destinations"]) || undefined,
        status: (getField(row, ["status", "statut"]).toLowerCase() === "recalled" ? "recalled" : "active") as "active" | "recalled",
      };

      const parsed = lotSchema.safeParse(payload);
      if (!parsed.success) {
        results.push({
          rowIndex,
          ok: false,
          error: parsed.error.issues[0]?.message || "Données invalides",
        });
        continue;
      }

      // Generate lot number if not provided
      let lotNumber = parsed.data.lotNumber;
      if (!lotNumber) {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const count = await db.lot.count({ where: { product: { userId } } });
        lotNumber = `LOT-${yyyy}${mm}${dd}-${String(count + 1).padStart(4, "0")}`;
      }

      const lot = await db.lot.create({
        data: {
          productId,
          lotNumber,
          manufacturingDate: new Date(parsed.data.manufacturingDate),
          expirationDate: new Date(parsed.data.expirationDate),
          ingredients: parsed.data.ingredients || null,
          manufacturingLocation: parsed.data.manufacturingLocation || null,
          transformationLocation: parsed.data.transformationLocation || null,
          salesCountries: parsed.data.salesCountries || null,
          status: parsed.data.status,
        },
      });

      results.push({
        rowIndex,
        ok: true,
        id: lot.id,
        lotNumber: lot.lotNumber,
      });
    } catch (err: any) {
      results.push({
        rowIndex,
        ok: false,
        error: err?.message || "Erreur inattendue",
      });
    }
  }

  return {
    totalRows: rows.length,
    inserted: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
