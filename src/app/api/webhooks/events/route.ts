import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { ALL_WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS } from "@/lib/webhooks";

/**
 * GET /api/webhooks/events
 * Liste tous les événements webhook disponibles avec leur libellé.
 */
export async function GET() {
  return NextResponse.json({
    events: ALL_WEBHOOK_EVENTS.map((e) => ({
      value: e,
      label: WEBHOOK_EVENT_LABELS[e],
    })),
  });
}
