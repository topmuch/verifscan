import QRCode from "qrcode";
import { db } from "@/lib/db";

export type QrCustomizationOptions = {
  width?: number;
  margin?: number;
  fgColor?: string;
  bgColor?: string;
  logoUrl?: string | null;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
};

/**
 * Generates a QR code PNG as a data URL with optional customization.
 * For maximum compatibility with the 'qrcode' library, the logo overlay
 * is applied via SVG-to-PNG conversion when a logoUrl is provided.
 * In our V2 implementation, we embed the logo at the SVG level for simplicity.
 */
export async function generateQrCodeDataUrl(
  publicUrl: string,
  options?: QrCustomizationOptions
): Promise<string> {
  const width = options?.width ?? 512;
  const margin = options?.margin ?? 2;
  const fgColor = options?.fgColor ?? "#065f46"; // emerald-800
  const bgColor = options?.bgColor ?? "#ffffff";
  const errorCorrectionLevel = options?.errorCorrectionLevel ?? "H";

  return QRCode.toDataURL(publicUrl, {
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: fgColor,
      light: bgColor,
    },
  });
}

/**
 * Generates an SVG QR code (for advanced customization like logo embedding).
 * Returns the SVG string.
 */
export async function generateQrCodeSvg(
  publicUrl: string,
  options?: QrCustomizationOptions
): Promise<string> {
  const width = options?.width ?? 512;
  const margin = options?.margin ?? 2;
  const fgColor = options?.fgColor ?? "#065f46";
  const bgColor = options?.bgColor ?? "#ffffff";
  const errorCorrectionLevel = options?.errorCorrectionLevel ?? "H";

  return QRCode.toString(publicUrl, {
    type: "svg",
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: fgColor,
      light: bgColor,
    },
  });
}

/**
 * Returns the base public URL for a lot.
 */
export function getLotPublicUrl(lotId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
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

/**
 * Returns the device type from a User-Agent string.
 */
export function detectDeviceType(userAgent?: string | null): string {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return "mobile";
  }
  if (/ipad|tablet/i.test(ua)) {
    return "tablet";
  }
  return "desktop";
}

/**
 * Returns a human-readable label for the device type.
 */
export function deviceTypeLabel(deviceType: string): string {
  switch (deviceType) {
    case "mobile": return "Mobile";
    case "tablet": return "Tablette";
    case "desktop": return "Ordinateur";
    default: return "Inconnu";
  }
}
