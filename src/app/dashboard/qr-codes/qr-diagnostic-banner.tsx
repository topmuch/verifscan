"use client";

import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";

/**
 * Fetches /api/debug/qr-check and shows a yellow diagnostic banner if any
 * issue is detected (no lots, no QR codes, empty appUrl, etc.).
 * Helps the fabricant understand why their QR codes 404 when scanned.
 */
export function QrDiagnosticBanner() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/debug/qr-check")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || !data.ok) return null;

  const { totals, appUrl, diagnosis } = data;
  // Show banner only if there's a problem
  if (
    totals.lots > 0 &&
    totals.qrCodesActive > 0 &&
    appUrl &&
    appUrl !== ""
  ) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
      <div className="flex items-start gap-2">
        <Stethoscope className="size-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800">Diagnostic QR codes</p>
          <p className="text-amber-700 mt-1">{diagnosis}</p>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white rounded p-2 border border-amber-200">
              <div className="text-amber-600">Lots</div>
              <div className="font-semibold text-amber-900">{totals.lots}</div>
            </div>
            <div className="bg-white rounded p-2 border border-amber-200">
              <div className="text-amber-600">QR actifs</div>
              <div className="font-semibold text-amber-900">
                {totals.qrCodesActive}
              </div>
            </div>
            <div className="bg-white rounded p-2 border border-amber-200">
              <div className="text-amber-600">QR totaux</div>
              <div className="font-semibold text-amber-900">
                {totals.qrCodesTotal}
              </div>
            </div>
            <div className="bg-white rounded p-2 border border-amber-200">
              <div className="text-amber-600">URL courante</div>
              <div
                className="font-semibold text-amber-900 truncate"
                title={appUrl || "(vide)"}
              >
                {appUrl || "(vide)"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
