/**
 * PDF text extraction & field auto-detection for certification uploads.
 *
 * Uses pdfjs-dist (Mozilla PDF.js) to extract plain text from uploaded PDF
 * certificates, then runs regex heuristics to pre-fill the form:
 *
 *   - certificateNumber (the "N°", "Certificate No", "Référence" field)
 *   - issuedAt / expiresAt (dates, multiple locale formats)
 *   - issuer (organization name, often near "délivré par" / "issued by")
 *
 * Important: pdfjs-dist v6 ships ESM-only. In a Next.js server runtime we
 * must:
 *   1. Disable the worker (set `useWorkerFetch: false`, `isEvalSupported: false`).
 *   2. Provide a stub `canvas`/`CanvasFactory` because Node has no DOM canvas.
 *   3. Use `getDocument` with the raw bytes (Buffer / Uint8Array).
 *
 * The extraction is best-effort: returns `null` for any field we couldn't
 * find, so the caller can fall back to manual entry.
 */

import "pdfjs-dist/build/pdf.worker.mjs";
import * as pdfjs from "pdfjs-dist";

export type ExtractedCertFields = {
  certificateNumber: string | null;
  issuedAt: string | null; // ISO yyyy-mm-dd
  expiresAt: string | null; // ISO yyyy-mm-dd
  issuer: string | null;
  rawText: string;
  confidence: "high" | "medium" | "low";
};

/* ------------------------------------------------------------------ */
/* Date parsing helpers                                                */
/* ------------------------------------------------------------------ */

const MONTHS_FR: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
  decembre: 12,
};
const MONTHS_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Try to parse a date from a string fragment like:
 *   "12/03/2024", "2024-03-12", "12 mars 2024", "March 12, 2024", "12-MAR-2024"
 */
function parseDateCandidate(input: string): string | null {
  const s = input.trim();
  if (!s) return null;

  // ISO: 2024-03-12
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return toIso(+y, +mo, +d);
  }

  // Numeric DD/MM/YYYY or DD-MM-YYYY
  m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    // Sanity: month must be 1-12
    if (+mo >= 1 && +mo <= 12) return toIso(+y, +mo, +d);
  }

  // "12 mars 2024" or "12 mars 24"
  m = s.match(/^(\d{1,2})\s+([a-zéûôîàèùç]+)\.?\s+(\d{4})$/i);
  if (m) {
    const [, d, mon, y] = m;
    const mo = MONTHS_FR[mon.toLowerCase()] || MONTHS_EN[mon.toLowerCase()];
    if (mo) return toIso(+y, mo, +d);
  }

  // "March 12, 2024" / "March 12 2024"
  m = s.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (m) {
    const [, mon, d, y] = m;
    const mo = MONTHS_EN[mon.toLowerCase()] || MONTHS_FR[mon.toLowerCase()];
    if (mo) return toIso(+y, mo, +d);
  }

  // "12-MAR-2024" (3-letter month abbreviation, EN)
  m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/);
  if (m) {
    const [, d, mon, y] = m;
    const key = mon.toLowerCase();
    const mo = MONTHS_EN[key.charAt(0) + key.slice(1)] || MONTHS_FR[key];
    if (mo) return toIso(+y, mo, +d);
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Field extraction heuristics                                         */
/* ------------------------------------------------------------------ */

/**
 * Extract a certificate number — matches patterns like:
 *   N° 12345 / No 12345 / Réf. SN-2024-001 / Certificate No: ABC123
 */
function extractCertificateNumber(text: string): string | null {
  const patterns = [
    /(?:n°\s*|n°\s*:?\s*|no\.?\s*:?\s*|num(?:e)?ro\s*:?\s*|réf(?:érence)?\.?\s*:?\s*|reference\s*:?\s*|certificate\s*(?:no|number|#)\s*:?\s*)([A-Z0-9][A-Z0-9\-\/_.]{4,40})\b/i,
    /\b([A-Z]{2,5}[-]?\d{4,6}[-]?\d{0,4})\b/, // SN-2024-001234
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

/**
 * Extract issued / expiry dates. Looks for keywords in FR + EN near a date.
 */
function extractDates(text: string): { issuedAt: string | null; expiresAt: string | null } {
  const dateRegex =
    /(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/\-]\d{1,2}[/\-]\d{4}|\d{1,2}\s+[a-zéûôîàèùç]+\.?\s+\d{4}|[a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}-[A-Z]{3}-\d{4})/i;

  // Issued
  let issuedAt: string | null = null;
  const issueMatch = text.match(
    new RegExp(
      `(?:date\\s+d['']émission|émis\\s+le|date\\s+of\\s+issue|issued?\\s*(?:on|le|:)?|délivré\\s+le|délivrance)\\s*[:\\-]?\\s*(${dateRegex.source})`,
      "i"
    )
  );
  if (issueMatch && issueMatch[1]) {
    issuedAt = parseDateCandidate(issueMatch[1]);
  }

  // Expires
  let expiresAt: string | null = null;
  const expMatch = text.match(
    new RegExp(
      `(?:date\\s+d['']expiration|expire\\s+le|valable\\s+(?:jusqu['']au|au)|date\\s+of\\s+expiry|expir(?:y|es)\\s*(?:on|le|:)?|valid\\s+(?:until|through|to)\\s*[:\\-]?)\\s*(${dateRegex.source})`,
      "i"
    )
  );
  if (expMatch && expMatch[1]) {
    expiresAt = parseDateCandidate(expMatch[1]);
  }

  // Fallback: if no explicit keywords, take first two dates in the text.
  if (!issuedAt && !expiresAt) {
    const allDates = text.match(new RegExp(dateRegex.source, "gi")) || [];
    if (allDates.length >= 2) {
      issuedAt = parseDateCandidate(allDates[0] as string);
      expiresAt = parseDateCandidate(allDates[1] as string);
    } else if (allDates.length === 1) {
      // Single date — assume expiry (most useful for the form).
      expiresAt = parseDateCandidate(allDates[0] as string);
    }
  }

  return { issuedAt, expiresAt };
}

/**
 * Extract the issuer (organization name). Looks for keywords like:
 *   "Délivré par : SONAC" / "Issued by: Bureau Veritas" / "Organisme : SGS"
 */
function extractIssuer(text: string): string | null {
  const patterns = [
    /(?:délivré\s+par|émis\s+par|organisme(?:\s+certificateur)?|issued\s+by|certifying\s+(?:body|authority)|authority)\s*[:\-]?\s*([^\n\r,;]{3,80})/i,
    /\b(SGS|Bureau\s+Veritas|Veritas|Intertek|TÜV|TUV|Rheinland|DNV|UL\s+Solutions|Eurofins|Cotecna|SONAC|SOCOCENP|ISODC|Ecocert|Certisys|QC\x26I|Lloyd's\s+Register|ABS\s+Quality)\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const candidate = m[1].trim();
      // Filter out obviously wrong captures (single digits, only punctuation)
      if (candidate.length >= 3 && /[a-zA-Z]/.test(candidate)) {
        return candidate.replace(/\s+/g, " ").slice(0, 100);
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Main entry: extractText + extractFields                            */
/* ------------------------------------------------------------------ */

/**
 * Extracts concatenated plain text from all pages of a PDF.
 * Uses pdfjs-dist in workerless mode (server-side Node).
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // Configure pdfjs for Node: no worker, no canvas, no fetch.
  // Setting workerSrc to an empty string disables the worker thread.
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    // Disable worker — runs on main thread
    useWorkerFetch: false,
    useSystemFonts: true,
    // pdfjs-dist v6: disableWorker is a valid option but not typed in DocumentInitParameters
    ...({ disableWorker: true } as Record<string, unknown>),
  });

  const doc = await loadingTask.promise;
  const totalPages = Math.min(doc.numPages, 10); // cap at 10 pages
  let fullText = "";

  for (let i = 1; i <= totalPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Concatenate text items with a space. Preserve line breaks when the
    // y-position drops significantly.
    let lastY: number | null = null;
    const parts: string[] = [];
    for (const item of content.items as Array<{ str: string; transform?: number[] }>) {
      if (typeof item.str === "string") {
        const y = item.transform ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
          parts.push("\n");
        }
        parts.push(item.str);
        lastY = y;
      }
    }
    fullText += parts.join(" ") + "\n\n";
    page.cleanup();
  }

  // PDFDocumentProxy in pdfjs-dist v6 exposes a cleanup() method,
  // and loadingTask.destroy() also works.
  try {
    await loadingTask.destroy();
  } catch {
    /* ignore */
  }

  return fullText;
}

/**
 * Runs all heuristics on the extracted text and returns the best-guess
 * structured fields.
 */
export function extractCertFields(text: string): ExtractedCertFields {
  if (!text || text.trim().length === 0) {
    return {
      certificateNumber: null,
      issuedAt: null,
      expiresAt: null,
      issuer: null,
      rawText: "",
      confidence: "low",
    };
  }

  const certificateNumber = extractCertificateNumber(text);
  const { issuedAt, expiresAt } = extractDates(text);
  const issuer = extractIssuer(text);

  // Confidence score
  const hits = [certificateNumber, issuedAt, expiresAt, issuer].filter(Boolean).length;
  const confidence: ExtractedCertFields["confidence"] =
    hits >= 3 ? "high" : hits === 2 ? "medium" : "low";

  return {
    certificateNumber,
    issuedAt,
    expiresAt,
    issuer,
    rawText: text,
    confidence,
  };
}

/**
 * High-level helper: takes a PDF buffer, returns extracted fields.
 * Safe to call from API routes.
 */
export async function analyzePdfCertificate(
  bytes: Uint8Array
): Promise<ExtractedCertFields> {
  try {
    const text = await extractPdfText(bytes);
    return extractCertFields(text);
  } catch (err) {
    console.error("[pdf-extract] error:", err);
    return {
      certificateNumber: null,
      issuedAt: null,
      expiresAt: null,
      issuer: null,
      rawText: "",
      confidence: "low",
    };
  }
}
