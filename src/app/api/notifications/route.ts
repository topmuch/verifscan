import { NextResponse } from "next/server";
import { requireFabricant } from "@/lib/session";
import { getUserNotifications, getUnreadCount, markAllAsRead } from "@/lib/notifications";

/**
 * Returns the notifications for the authenticated user.
 */
export async function GET(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user.id, limit),
      getUnreadCount(user.id),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (e) {
    console.error("[notifications list] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Marks all notifications as read.
 */
export async function PUT() {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    await markAllAsRead(user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[notifications markAll] error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
