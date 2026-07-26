import nodemailer from "nodemailer";

/**
 * Email helper for VerifScan.
 *
 * SMTP is configured via env vars:
 *   SMTP_HOST       — e.g. smtp.gmail.com
 *   SMTP_PORT       — e.g. 587
 *   SMTP_USER       — SMTP username
 *   SMTP_PASS       — SMTP password
 *   SMTP_FROM       — From address (default: noreply@verifscan.sn)
 *   SMTP_FROM_NAME  — From display name (default: VerifScan)
 *
 * If SMTP_HOST is not set, `sendMail` falls back to a console.log + dev-mode
 * ethereal test account so the rest of the flow keeps working. This means:
 *   - In production: real email is sent.
 *   - In dev without SMTP: a preview URL is logged (no email sent).
 *   - In dev with SMTP_HOST set: real email is sent using configured SMTP.
 */

type SmtpEnv = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
};

function readSmtpEnv(): SmtpEnv | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return {
    host,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@verifscan.sn",
    fromName: process.env.SMTP_FROM_NAME || "VerifScan",
  };
}

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (cachedTransport) return cachedTransport;
  const cfg = readSmtpEnv();
  if (!cfg) return null;
  cachedTransport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  return cachedTransport;
}

export type SendMailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type SendMailResult =
  | { ok: true; messageId: string; previewUrl?: string; fallback: false }
  | { ok: true; messageId: string; previewUrl: string; fallback: true }
  | { ok: false; error: string };

/**
 * Send an email. Falls back to an ethereal test account (preview URL logged)
 * when SMTP is not configured, so the calling code can keep working.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const cfg = readSmtpEnv();
  const from = cfg
    ? `${cfg.fromName} <${cfg.from}>`
    : "VerifScan <noreply@verifscan.sn>";

  // Real SMTP path
  const transport = getTransport();
  if (transport && cfg) {
    try {
      const info = await transport.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { ok: true, messageId: info.messageId, fallback: false };
    } catch (err: any) {
      console.error("[email] sendMail error:", err?.message || err);
      return { ok: false, error: err?.message || "SMTP error" };
    }
  }

  // Fallback: ethereal test account (dev only — generates a preview URL)
  try {
    const testAccount = await nodemailer.createTestAccount();
    const devTransport = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await devTransport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info) || "";
    console.warn(
      `[email][dev-fallback] No SMTP configured — preview: ${previewUrl}\n` +
        `  to: ${input.to}\n  subject: ${input.subject}`
    );
    return { ok: true, messageId: info.messageId, previewUrl, fallback: true };
  } catch (err: any) {
    console.error("[email] dev-fallback error:", err?.message || err);
    return { ok: false, error: err?.message || "dev fallback error" };
  }
}

/* ---------- High-level helpers ---------- */

export type ReviewNotificationEmailData = {
  fabricantName: string;
  fabricantEmail: string;
  productName: string;
  brand: string;
  lotNumber: string;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  lotUrl: string;
};

/**
 * Sends a "new review received" email to the fabricant.
 * Always resolves — never throws — so the API route can keep working
 * even if SMTP is down.
 */
export async function sendReviewNotificationEmail(
  data: ReviewNotificationEmailData
): Promise<SendMailResult> {
  const stars = "★".repeat(Math.max(1, Math.min(5, data.rating))) +
    "☆".repeat(Math.max(0, 5 - data.rating));

  const subject = `Nouvel avis sur ${data.productName} — ${data.rating}/5`;

  const text = `Bonjour ${data.fabricantName},

Vous venez de recevoir un nouvel avis sur votre produit.

Produit : ${data.productName} (${data.brand})
Lot : ${data.lotNumber}
Note : ${data.rating}/5 ${stars}
De : ${data.reviewerName || "Consommateur anonyme"}

Commentaire :
${data.comment || "(aucun commentaire laissé)"}

Voir le produit : ${data.lotUrl}

— L'équipe VerifScan`;

  const html = `
<div style="font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #0a3060;">
  <div style="background: linear-gradient(135deg, #0f4382 0%, #2ebd5a 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">Nouvel avis reçu</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0; font-size: 14px;">Un consommateur a évalué votre produit</p>
  </div>
  <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Produit</td><td style="padding: 8px 0; font-weight: 600; color: #0a3060;">${escapeHtml(data.productName)} <span style="color:#6b7280; font-weight: 400;">(${escapeHtml(data.brand)})</span></td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Lot</td><td style="padding: 8px 0; font-family: monospace; color: #0a3060;">${escapeHtml(data.lotNumber)}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Note</td><td style="padding: 8px 0; font-size: 18px; color: #f59e0b;">${stars} <span style="color:#0a3060; font-size: 14px; font-weight: 600;">${data.rating}/5</span></td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">De</td><td style="padding: 8px 0; color: #0a3060;">${escapeHtml(data.reviewerName || "Consommateur anonyme")}</td></tr>
    </table>
    ${data.comment ? `
      <div style="margin: 16px 0; padding: 16px; background: #f9fafb; border-left: 4px solid #2ebd5a; border-radius: 6px;">
        <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Commentaire</p>
        <p style="margin: 0; color: #0a3060; font-style: italic;">&ldquo;${escapeHtml(data.comment)}&rdquo;</p>
      </div>` : ""}
    <a href="${escapeHtml(data.lotUrl)}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0f4382; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Voir le produit</a>
  </div>
  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">— L'équipe VerifScan —</p>
</div>`;

  return sendMail({
    to: data.fabricantEmail,
    subject,
    text,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
