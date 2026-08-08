import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import {
  ALL_WEBHOOK_EVENTS,
  WEBHOOK_EVENT_LABELS,
  generateWebhookSecret,
} from "@/lib/webhooks";

/* ============================================================
   WEBHOOKS API — gestion CRUD des webhooks par le fabricant
   ------------------------------------------------------------
   GET    /api/webhooks           — liste les webhooks du user
   POST   /api/webhooks           — crée un nouveau webhook
   DELETE /api/webhooks/[id]      — supprime un webhook
   PUT    /api/webhooks/[id]      — met à jour un webhook
   GET    /api/webhooks/events    — liste les événements disponibles
   GET    /api/webhooks/[id]/deliveries — historique des livraisons
   ============================================================ */

const VALID_EVENTS = ALL_WEBHOOK_EVENTS as readonly string[];

const createSchema = z.object({
  url: z
    .string()
    .url("URL invalide")
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
      message: "L'URL doit commencer par http:// ou https://",
    }),
  events: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un événement")
    .refine((arr) => arr.every((e) => VALID_EVENTS.includes(e) || e === "*"), {
      message: "Événement non reconnu",
    }),
  description: z.string().max(200).optional(),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/webhooks
 * Liste tous les webhooks du fabricant connecté + compte des livraisons récentes.
 */
export async function GET() {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const webhooks = await db.webhook.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Pour chaque webhook, on calcule les stats de livraison (7 derniers jours)
  const withStats = await Promise.all(
    webhooks.map(async (w) => {
      const stats = await db.webhookDelivery.groupBy({
        by: ["status"],
        where: {
          webhookId: w.id,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { _all: true },
      });
      const lastDelivery = await db.webhookDelivery.findFirst({
        where: { webhookId: w.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          statusCode: true,
          event: true,
          createdAt: true,
          deliveredAt: true,
          lastError: true,
        },
      });
      return {
        id: w.id,
        url: w.url,
        description: w.description,
        events: w.events.split(",").filter(Boolean),
        isActive: w.isActive,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        // Ne pas retourner le secret pour ne pas le fuiter
        secretHint: w.secret.slice(0, 10) + "...",
        stats: stats.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count._all }),
          {} as Record<string, number>
        ),
        lastDelivery,
      };
    })
  );

  return NextResponse.json({
    webhooks: withStats,
    availableEvents: ALL_WEBHOOK_EVENTS.map((e) => ({
      value: e,
      label: WEBHOOK_EVENT_LABELS[e],
    })),
  });
}

/**
 * POST /api/webhooks
 * Crée un nouveau webhook. Le secret est généré automatiquement et
 * retourné UNE SEULE FOIS dans la réponse (jamais stocké en clair).
 */
export async function POST(req: Request) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  // Limite de 10 webhooks par user
  const count = await db.webhook.count({ where: { userId: user.id } });
  if (count >= 10) {
    return NextResponse.json(
      { error: "Limite atteinte : 10 webhooks maximum par compte" },
      { status: 400 }
    );
  }

  const secret = generateWebhookSecret();

  const webhook = await db.webhook.create({
    data: {
      userId: user.id,
      url: parsed.data.url,
      secret,
      events: parsed.data.events.join(","),
      description: parsed.data.description?.trim() || null,
      isActive: parsed.data.isActive,
    },
  });

  return NextResponse.json(
    {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events.split(",").filter(Boolean),
      description: webhook.description,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      secret, // retourné UNE SEULE FOIS
      secretHint: webhook.secret.slice(0, 10) + "...",
      warning:
        "Conservez ce secret en lieu sûr. Il ne sera plus jamais affiché. Il vous servira à vérifier la signature HMAC des requêtes reçues.",
    },
    { status: 201 }
  );
}
