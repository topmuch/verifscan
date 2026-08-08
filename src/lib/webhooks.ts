import { createHmac } from "crypto";
import { db } from "@/lib/db";

/* ============================================================
   WEBHOOK DISPATCHER
   ------------------------------------------------------------
   Quand un événement se produit (scan, recall, review, etc.),
   on appelle dispatchWebhookEvent(userId, event, payload).
   Cette fonction:
     1. Liste tous les webhooks actifs du user qui écoutent cet event
     2. Pour chaque webhook, crée un WebhookDelivery en BDD
     3. Envoie la requête HTTP POST avec signature HMAC SHA-256
     4. Met à jour le delivery (status, statusCode, response, attempts)

   Le tout est fire-and-forget (non bloquant) pour l'appelant.
   Si l'envoi échoue, on programme un retry (exponentiel: 1min, 5min, 15min).
   ============================================================ */

export type WebhookEvent =
  | "scan"
  | "recall"
  | "review"
  | "lot_created"
  | "lot_updated"
  | "product_created"
  | "product_updated";

export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = [
  "scan",
  "recall",
  "review",
  "lot_created",
  "lot_updated",
  "product_created",
  "product_updated",
];

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  scan: "Scan QR code",
  recall: "Rappel de lot",
  review: "Nouvel avis consommateur",
  lot_created: "Lot créé",
  lot_updated: "Lot modifié",
  product_created: "Produit créé",
  product_updated: "Produit modifié",
};

/**
 * Signe un payload avec le secret du webhook en HMAC SHA-256.
 * Le destinataire peut vérifier en comparant avec le header
 * X-VerifScan-Signature.
 */
export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Génère un secret aléatoire pour un nouveau webhook.
 * Format: whsec_<32 hex chars>
 */
export function generateWebhookSecret(): string {
  const rand = Math.random().toString(16).padStart(2, "0") + Date.now().toString(16);
  const random = (rand + Math.random().toString(16).repeat(2)).slice(0, 32);
  return `whsec_${random}`;
}

/**
 * Définit si un webhook écoute un événement donné.
 */
export function webhookMatchesEvent(webhookEvents: string, event: WebhookEvent): boolean {
  const events = webhookEvents.split(",").map((e) => e.trim()).filter(Boolean);
  return events.includes(event) || events.includes("*");
}

/**
 * Définit le délai avant le prochain retry (en ms), basé sur le numéro
 * de tentative. Exponentiel avec plafond à 1h.
 *   attempt 1 → 1 min
 *   attempt 2 → 5 min
 *   attempt 3 → 15 min
 *   attempt 4+ → 60 min
 */
export function getRetryDelayMs(attempt: number): number {
  const delays = [60_000, 300_000, 900_000, 3_600_000];
  return delays[Math.min(attempt - 1, delays.length - 1)] || 3_600_000;
}

/**
 * Tente de livrer un webhook delivery spécifique.
 * Met à jour le delivery en BDD avec le résultat.
 */
async function attemptDelivery(deliveryId: string): Promise<void> {
  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  });
  if (!delivery || !delivery.webhook || !delivery.webhook.isActive) {
    return;
  }

  const attempt = delivery.attempts + 1;
  const startedAt = Date.now();

  try {
    const controller = new AbortController();
    const timeoutMs = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(delivery.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VerifScan-Signature": signPayload(delivery.payload, delivery.webhook.secret),
        "X-VerifScan-Event": delivery.event,
        "X-VerifScan-Delivery": delivery.id,
        "User-Agent": "VerifScan-Webhook/1.0",
      },
      body: delivery.payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutMs);
    const durationMs = Date.now() - startedAt;
    const responseText = await response.text().catch(() => "");
    const truncatedResponse = responseText.slice(0, 2048);

    const isSuccess = response.status >= 200 && response.status < 300;

    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: attempt,
        status: isSuccess ? "success" : attempt >= delivery.maxAttempts ? "failed" : "retry",
        statusCode: response.status,
        response: truncatedResponse || null,
        lastError: isSuccess ? null : `HTTP ${response.status} (${durationMs}ms)`,
        deliveredAt: isSuccess ? new Date() : null,
        nextRetryAt: isSuccess ? null : new Date(Date.now() + getRetryDelayMs(attempt)),
      },
    });
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    const errorMsg = err?.name === "AbortError"
      ? `Timeout après ${durationMs}ms`
      : (err?.message || "Erreur réseau");

    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: attempt,
        status: attempt >= delivery.maxAttempts ? "failed" : "retry",
        statusCode: null,
        response: null,
        lastError: errorMsg,
        deliveredAt: null,
        nextRetryAt: new Date(Date.now() + getRetryDelayMs(attempt)),
      },
    });
  }
}

/**
 * Point d'entrée principal : appeler cette fonction quand un événement
 * se produit. Elle est non-bloquante (fire-and-forget) pour ne pas
 * ralentir l'appelant (ex: la route /api/scans).
 *
 * @param userId  ID du fabricant propriétaire des webhooks
 * @param event   Type d'événement (scan, recall, review, lot_created, ...)
 * @param payload Objet à envoyer en JSON au destinataire
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  try {
    // 1. Récupérer tous les webhooks actifs du user qui écoutent cet event
    const webhooks = await db.webhook.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: { id: true, events: true, url: true, secret: true },
    });

    const matching = webhooks.filter((w) => webhookMatchesEvent(w.events, event));
    if (matching.length === 0) return;

    const payloadStr = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    // 2. Créer un delivery pour chaque webhook + lancer l'envoi en parallèle
    const deliveries = await Promise.all(
      matching.map((w) =>
        db.webhookDelivery.create({
          data: {
            webhookId: w.id,
            event,
            payload: payloadStr,
            status: "pending",
            maxAttempts: 3,
          },
        })
      )
    );

    // 3. Tenter l'envoi immédiatement (fire-and-forget, non bloquant)
    for (const d of deliveries) {
      attemptDelivery(d.id).catch(() => {
        // Erreurs silencieuses — on ne veut pas planter l'appelant
      });
    }
  } catch (err) {
    // Erreurs silencieuses — les webhooks ne doivent jamais planter l'appelant
    console.error(`[webhooks] dispatch error for event=${event}:`, err);
  }
}

/**
 * Traite les retries en attente (à appeler via cron job ou endpoint admin).
 * Récupère tous les deliveries en statut 'retry' dont nextRetryAt <= now
 * et tente de les renvoyer.
 */
export async function processPendingRetries(maxToProcess = 50): Promise<number> {
  const pending = await db.webhookDelivery.findMany({
    where: {
      status: "retry",
      nextRetryAt: { lte: new Date() },
    },
    orderBy: { nextRetryAt: "asc" },
    take: maxToProcess,
    select: { id: true },
  });

  for (const d of pending) {
    attemptDelivery(d.id).catch(() => {});
  }

  return pending.length;
}
