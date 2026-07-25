import QRCode from "qrcode";
import { db } from "@/lib/db";

/**
 * Generates a QR code PNG as a data URL.
 * The QR code encodes the public URL of the lot.
 */
export async function generateQrCodeDataUrl(
  publicUrl: string,
  options?: { width?: number; margin?: number }
): Promise<string> {
  const width = options?.width ?? 512;
  const margin = options?.margin ?? 2;
  return QRCode.toDataURL(publicUrl, {
    width,
    margin,
    errorCorrectionLevel: "H",
    color: {
      dark: "#065f46", // emerald-800
      light: "#ffffff",
    },
  });
}

/**
 * Returns the base public URL for a lot.
 */
export function getLotPublicUrl(lotId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  // Use relative path so it works in any environment
  return `${base}/p/${lotId}`;
}

/**
 * Generates a unique lot number like: LOT-YYYYMMDD-XXXX
 */
export function generateLotNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `LOT-${yyyy}${mm}${dd}-${random}`;
}
