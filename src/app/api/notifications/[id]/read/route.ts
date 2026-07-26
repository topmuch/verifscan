import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { markAsRead } from "@/lib/notifications";

/**
 * Marks a single notification as read.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  try {
    await markAsRead(id, user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[notifications/read] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
