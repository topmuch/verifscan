import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { buildComplianceReport } from "@/lib/export";

/**
 * Returns an HTML compliance report for printing to PDF.
 */
export async function GET() {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const report = await buildComplianceReport(user.id);
    const html = renderComplianceHtml(report);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[export/compliance] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function renderComplianceHtml(report: Awaited<ReturnType<typeof buildComplianceReport>>): string {
  const { company, stats, generatedAt } = report;
  const dateStr = generatedAt.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Rapport de conformité - ${escapeHtml(company?.companyName || "Fabricant")}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #1f2937;
    background: #fff;
    line-height: 1.5;
  }
  .header {
    border-bottom: 3px solid #065f46;
    padding-bottom: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .logo {
    font-size: 24px;
    font-weight: 800;
    color: #065f46;
  }
  .logo span { color: #f59e0b; }
  .meta {
    text-align: right;
    font-size: 12px;
    color: #6b7280;
  }
  h1 {
    font-size: 20px;
    color: #065f46;
    margin-bottom: 8px;
  }
  .subtitle {
    color: #6b7280;
    margin-bottom: 32px;
  }
  .section {
    margin-bottom: 32px;
  }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #065f46;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .info-item {
    background: #f9fafb;
    padding: 12px;
    border-radius: 6px;
  }
  .info-label {
    font-size: 11px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .info-value {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin-top: 4px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .stat-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 800;
    color: #065f46;
  }
  .stat-label {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
  }
  .alert {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 12px 16px;
    border-radius: 4px;
    margin: 16px 0;
    font-size: 13px;
  }
  .alert-recall {
    background: #fee2e2;
    border-left-color: #dc2626;
  }
  .footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    font-size: 11px;
    color: #6b7280;
    text-align: center;
  }
  .signature {
    margin-top: 48px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }
  .signature-block {
    text-align: center;
  }
  .signature-line {
    border-top: 1px solid #6b7280;
    margin-top: 40px;
    padding-top: 8px;
    font-size: 12px;
    color: #6b7280;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">Verif<span>Scan</span></div>
    <div class="meta">
      Rapport généré le ${dateStr}<br />
      Référence: RAP-${generatedAt.getTime()}
    </div>
  </div>

  <h1>Rapport de conformité et de traçabilité</h1>
  <p class="subtitle">
    Document officiel attestant de la traçabilité des produits enregistrés sur la plateforme VerifScan.
    Ce rapport peut être présenté aux autorités sanitaires et aux services de contrôle.
  </p>

  <div class="section">
    <div class="section-title">Informations du fabricant</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Raison sociale</div>
        <div class="info-value">${escapeHtml(company?.companyName || "—")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${escapeHtml(company?.email || "—")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Téléphone</div>
        <div class="info-value">${escapeHtml(company?.phone || "—")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Adresse</div>
        <div class="info-value">${escapeHtml(company?.address || "—")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Statistiques de traçabilité</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.products}</div>
        <div class="stat-label">Produits enregistrés</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.lots}</div>
        <div class="stat-label">Lots créés</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.qrCodes}</div>
        <div class="stat-label">QR codes générés</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.scans}</div>
        <div class="stat-label">Scans enregistrés</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.recalledLots}</div>
        <div class="stat-label">Lots rappelés</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.lots - stats.recalledLots}</div>
        <div class="stat-label">Lots actifs</div>
      </div>
    </div>
  </div>

  ${stats.recalledLots > 0 ? `
    <div class="alert alert-recall">
      <strong>⚠ Lots rappelés :</strong> ${stats.recalledLots} lot(s) sont actuellement marqués comme rappelés.
      Les consommateurs scannant ces lots sont alertés automatiquement sur la page publique.
    </div>
  ` : `
    <div class="alert">
      <strong>✓ Conformité :</strong> Aucun lot rappelé. Tous les produits sont conformes aux informations enregistrées.
    </div>
  `}

  <div class="section">
    <div class="section-title">Attestation</div>
    <p style="font-size: 13px; line-height: 1.7;">
      La présente atteste que <strong>${escapeHtml(company?.companyName || "le fabricant")}</strong>
      a enregistré l'ensemble de ses lots de production sur la plateforme VerifScan, permettant
      la traçabilité complète de ses produits via QR codes uniques. Chaque scan effectué par un
      consommateur est enregistré, garantissant la transparence de la chaîne de distribution.
    </p>
    <p style="font-size: 13px; line-height: 1.7; margin-top: 12px;">
      Ce rapport est généré automatiquement à partir des données enregistrées sur VerifScan
      et constitue une preuve de l'engagement du fabricant en matière de transparence et de
      traçabilité de ses produits.
    </p>
  </div>

  <div class="signature">
    <div class="signature-block">
      <div class="signature-line">Fabricant</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">VerifScan — Plateforme de traçabilité</div>
    </div>
  </div>

  <div class="footer">
    VerifScan — La vérité au bout du scan · verifscan.sn<br />
    Rapport généré automatiquement le ${dateStr} · Document valable 30 jours
  </div>

  <script>
    window.onload = () => { setTimeout(() => window.print(), 500); };
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
