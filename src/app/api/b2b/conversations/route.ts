import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createNotification } from "@/lib/notifications";

// GET /api/b2b/conversations — liste les conversations B2B
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let conversations;
  if (user.role === "fabricant") {
    conversations = await db.conversation.findMany({
      where: { fabricantId: user.id },
      include: {
        distributor: { include: { user: { select: { companyName: true, email: true } } } },
        product: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });
  } else if (user.role === "distributor") {
    const distributor = await db.distributor.findUnique({ where: { userId: user.id } });
    if (!distributor) return NextResponse.json({ conversations: [] });
    conversations = await db.conversation.findMany({
      where: { distributorId: distributor.id },
      include: {
        fabricant: { select: { companyName: true, email: true } },
        product: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });
  } else {
    return NextResponse.json({ error: "Rôle non autorisé" }, { status: 403 });
  }

  return NextResponse.json({ conversations });
}

// POST /api/b2b/conversations — créer une conversation ou envoyer un message
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { fabricantId, productId, content, conversationId } = body;

  if (!content) {
    return NextResponse.json({ error: "content requis" }, { status: 400 });
  }

  let conversation;
  let senderRole: string;
  let senderId: string;
  let receiverId: string;

  if (conversationId) {
    conversation = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  } else {
    // Création nouvelle conversation — seulement distributeur peut initier
    if (user.role !== "distributor") {
      return NextResponse.json({ error: "Seuls les distributeurs peuvent initier" }, { status: 403 });
    }
    if (!fabricantId) return NextResponse.json({ error: "fabricantId requis" }, { status: 400 });
    const distributor = await db.distributor.findUnique({ where: { userId: user.id } });
    if (!distributor) return NextResponse.json({ error: "Profil distributeur introuvable" }, { status: 404 });

    conversation = await db.conversation.create({
      data: {
        distributorId: distributor.id,
        fabricantId,
        productId: productId || null,
      },
    });
  }

  // Détermine sender et receiver selon le rôle
  if (user.role === "distributor") {
    const distributor = await db.distributor.findUnique({ where: { userId: user.id } });
    if (!distributor || conversation.distributorId !== distributor.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    senderRole = "distributor";
    senderId = user.id; // User ID du distributeur
    receiverId = conversation.fabricantId; // User ID du fabricant
  } else if (user.role === "fabricant") {
    if (conversation.fabricantId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    // Pour récupérer le User.id du distributeur, on charge via Distributor
    const distributor = await db.distributor.findUnique({
      where: { id: conversation.distributorId },
      select: { userId: true },
    });
    if (!distributor) return NextResponse.json({ error: "Distributeur introuvable" }, { status: 404 });
    senderRole = "fabricant";
    senderId = user.id;
    receiverId = distributor.userId;
  } else {
    return NextResponse.json({ error: "Rôle non autorisé" }, { status: 403 });
  }

  const message = await db.b2BMessage.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId,
      senderRole,
      content,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  // Notifie le receiver
  await createNotification({
    userId: receiverId,
    type: "b2b_message",
    title: "Nouveau message B2B",
    message: content.slice(0, 100),
    link: user.role === "distributor" ? "/dashboard/b2b" : "/dashboard/b2b",
  });

  return NextResponse.json({ message, conversation });
}
