import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant } from "@/lib/session";
import { ALL_WEBHOOK_EVENTS } from "@/lib/webhooks";

const VALID_EVENTS = ALL_WEBHOOK_EVENTS as readonly string[];

const updateSchema = z.object({
  url: z
    .string()
    .url("URL invalide")
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
      message: "L'URL doit commencer par http:// ou https://",
    })
    .optional(),
  events: z
    .array(z.string())
    .min(1)
    .refine((arr) => arr.every((e) => VALID_EVENTS.includes(e) || e === "*"))
    .optional(),
  description: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/webhooks/[id]
 * Met à jour un webhook existant.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const webhook = await db.webhook.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!webhook) {
    return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });
  }
  if (webhook.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce webhook" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.url !== undefined) data.url = parsed.data.url;
  if (parsed.data.events !== undefined) data.events = parsed.data.events.join(",");
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const updated = await db.webhook.update({
    where: { id },
    data,
    select: {
      id: true,
      url: true,
      events: true,
      description: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ...updated,
    events: updated.events.split(",").filter(Boolean),
  });
}

/**
 * DELETE /api/webhooks/[id]
 * Supprime un webhook (cascade sur WebhookDelivery).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const webhook = await db.webhook.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!webhook) {
    return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });
  }
  if (webhook.userId !== user.id) {
    return NextResponse.json({ error: "Vous ne possédez pas ce webhook" }, { status: 403 });
  }

  await db.webhook.delete({ where: { id } });

  return NextResponse.json({ ok: true, deletedWebhookId: id });
}
