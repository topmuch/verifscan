"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

/**
 * Renders a barcode (EAN-13, EAN-8, UPC-A, CODE128, etc.) next to the QR code
 * on the public product page.
 *
 * Uses jsbarcode (client-side only) to draw the barcode onto a <canvas>.
 * Auto-detects the best format if `format` is not specified.
 *
 * The barcode is wrapped in a white card with a subtle border to ensure
 * readability on dark/colored backgrounds.
 */
export function Barcode({
  value,
  format = "auto",
  width = 2,
  height = 60,
  displayValue = true,
  className,
}: {
  value: string;
  format?: "auto" | "EAN13" | "EAN8" | "UPC" | "CODE128" | "CODE39";
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !value) return;

    // Auto-detect format based on length and content
    let resolvedFormat = format;
    if (format === "auto") {
      const digits = value.replace(/\D/g, "");
      if (digits.length === 13) resolvedFormat = "EAN13";
      else if (digits.length === 8) resolvedFormat = "EAN8";
      else if (digits.length === 12) resolvedFormat = "UPC";
      else if (/^[A-Z0-9\-.$/+% ]+$/.test(value) && value.length <= 80) resolvedFormat = "CODE39";
      else resolvedFormat = "CODE128";
    }

    try {
      JsBarcode(ref.current, value, {
        format: resolvedFormat as any,
        width,
        height,
        displayValue,
        fontSize: 12,
        margin: 6,
        background: "#ffffff",
        lineColor: "#0f4382",
        font: "monospace",
        textMargin: 2,
      });
    } catch (err) {
      // If the value is invalid for the chosen format (e.g. EAN-13 with bad checksum),
      // fall back to CODE128 which accepts any string.
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize: 12,
          margin: 6,
          background: "#ffffff",
          lineColor: "#0f4382",
          font: "monospace",
        });
      } catch (err2) {
        console.warn("[Barcode] could not render:", err2);
      }
    }
  }, [value, format, width, height, displayValue]);

  if (!value) return null;

  return (
    <div className={className}>
      <svg ref={ref} role="img" aria-label={`Code-barres ${value}`} />
    </div>
  );
}
