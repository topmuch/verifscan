import QRCode from "qrcode";

export type LabelLayout = {
  cols: number;
  rows: number;
  labelWidth: number; // mm
  labelHeight: number; // mm
  marginX: number; // mm horizontal gap
  marginY: number; // mm vertical gap
  pageMargin: number; // mm page margin
};

export const LABEL_PRESETS: Record<string, LabelLayout> = {
  a4_10: { cols: 2, rows: 5, labelWidth: 90, labelHeight: 50, marginX: 10, marginY: 10, pageMargin: 10 },
  a4_24: { cols: 3, rows: 8, labelWidth: 60, labelHeight: 30, marginX: 8, marginY: 8, pageMargin: 10 },
  a4_40: { cols: 4, rows: 10, labelWidth: 45, labelHeight: 25, marginX: 5, marginY: 5, pageMargin: 8 },
  a4_6: { cols: 2, rows: 3, labelWidth: 90, labelHeight: 80, marginX: 10, marginY: 10, pageMargin: 10 },
};

export type LabelData = {
  lotNumber: string;
  productName: string;
  brand?: string;
  publicUrl: string;
  qrCodeDataUrl: string;
};

export type LabelSheetOptions = {
  layout: LabelLayout;
  paperSize: "a4" | "a5";
  cutLines: boolean;
  includeLotNumber: boolean;
  includeProductName: boolean;
  includeBrand: boolean;
};

const MM_TO_PT = 2.834645669; // 1mm = 2.83pt
const A4_WIDTH = 210; // mm
const A4_HEIGHT = 297; // mm
const A5_WIDTH = 148;
const A5_HEIGHT = 210;

/**
 * Generates QR codes as data URLs for a list of URLs.
 */
export async function generateBatchQrCodes(
  urls: string[],
  options?: { fgColor?: string; width?: number; margin?: number }
): Promise<string[]> {
  const fgColor = options?.fgColor || "#065f46";
  const width = options?.width || 300;
  const margin = options?.margin || 1;
  return Promise.all(
    urls.map((url) =>
      QRCode.toDataURL(url, {
        width,
        margin,
        errorCorrectionLevel: "H",
        color: { dark: fgColor, light: "#ffffff" },
      })
    )
  );
}

/**
 * Builds an HTML page that renders a printable sheet of labels.
 * The page uses CSS @page for proper A4/A5 sizing, and the user can print
 * to PDF via the browser's print dialog.
 */
export function buildLabelSheetHtml(
  labels: LabelData[],
  options: LabelSheetOptions
): string {
  const paperW = options.paperSize === "a4" ? A4_WIDTH : A5_WIDTH;
  const paperH = options.paperSize === "a4" ? A4_HEIGHT : A5_HEIGHT;
  const layout = options.layout;

  const labelsPerPage = layout.cols * layout.rows;
  const pages: LabelData[][] = [];
  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage));
  }

  const cells: string[] = [];
  for (const page of pages) {
    const rows: string[] = [];
    for (let r = 0; r < layout.rows; r++) {
      const rowCells: string[] = [];
      for (let c = 0; c < layout.cols; c++) {
        const idx = r * layout.cols + c;
        const label = page[idx];
        if (!label) {
          rowCells.push(`<div class="cell empty"></div>`);
          continue;
        }
        rowCells.push(`
          <div class="cell ${options.cutLines ? "cut" : ""}">
            <div class="qr-wrap">
              <img src="${label.qrCodeDataUrl}" alt="QR" />
            </div>
            <div class="label-info">
              ${options.includeProductName ? `<div class="label-name">${escapeHtml(label.productName)}</div>` : ""}
              ${options.includeBrand && label.brand ? `<div class="label-brand">${escapeHtml(label.brand)}</div>` : ""}
              ${options.includeLotNumber ? `<div class="label-lot">${escapeHtml(label.lotNumber)}</div>` : ""}
            </div>
          </div>
        `);
      }
      rows.push(`<div class="row">${rowCells.join("")}</div>`);
    }
    cells.push(`<div class="page">${rows.join("")}</div>`);
  }

  const cellWidthMm = layout.labelWidth;
  const cellHeightMm = layout.labelHeight;
  const gapXMm = layout.marginX;
  const gapYMm = layout.marginY;
  const pageMarginMm = layout.pageMargin;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Planche d'étiquettes - VerifScan</title>
<style>
  @page { size: ${options.paperSize === "a4" ? "A4" : "A5"}; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; }
  .page {
    width: ${paperW}mm;
    height: ${paperH}mm;
    padding: ${pageMarginMm}mm;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    gap: ${gapYMm}mm;
  }
  .page:last-child { page-break-after: auto; }
  .row {
    display: flex;
    gap: ${gapXMm}mm;
    flex-shrink: 0;
  }
  .cell {
    width: ${cellWidthMm}mm;
    height: ${cellHeightMm}mm;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4mm;
    padding: 3mm;
    overflow: hidden;
    flex-shrink: 0;
  }
  .cell.cut {
    border: 1px dashed #9ca3af;
  }
  .cell.empty {
    border: 1px solid transparent;
  }
  .qr-wrap {
    flex-shrink: 0;
    height: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .qr-wrap img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .label-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 1mm;
  }
  .label-name {
    font-size: 9pt;
    font-weight: 700;
    color: #065f46;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .label-brand {
    font-size: 8pt;
    color: #6b7280;
  }
  .label-lot {
    font-size: 7pt;
    color: #374151;
    font-family: "Courier New", monospace;
    background: #f3f4f6;
    padding: 1mm 2mm;
    border-radius: 2px;
    align-self: flex-start;
  }
  @media print {
    .page { box-shadow: none; }
  }
</style>
</head>
<body>
${cells.join("\n")}
<script>
  window.onload = () => { setTimeout(() => window.print(), 300); };
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
