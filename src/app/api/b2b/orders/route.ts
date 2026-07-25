import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createNotification } from "@/lib/notifications";

// GET /api/b2b/orders — liste les commandes B2B de l'utilisateur
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let orders;
  if (user.role === "fabricant") {
    orders = await db.b2BOrder.findMany({
      where: { fabricantId: user.id },
      include: {
        distributor: { include: { user: { select: { companyName: true, email: true, phone: true } } } },
        items: { include: { b2bProduct: { include: { product: { select: { name: true, brand: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (user.role === "distributor") {
    const distributor = await db.distributor.findUnique({ where: { userId: user.id } });
    if (!distributor) return NextResponse.json({ orders: [] });
    orders = await db.b2BOrder.findMany({
      where: { distributorId: distributor.id },
      include: {
        fabricant: { select: { companyName: true, email: true, phone: true } },
        items: { include: { b2bProduct: { include: { product: { select: { name: true, brand: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    return NextResponse.json({ error: "Rôle non autorisé" }, { status: 403 });
  }

  return NextResponse.json({ orders });
}

// POST /api/b2b/orders — créer une nouvelle commande (distributor only)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "distributor") {
    return NextResponse.json({ error: "Réservé aux distributeurs" }, { status: 403 });
  }

  const body = await req.json();
  const { fabricantId, items, deliveryAddress, notes } = body;

  if (!fabricantId || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "fabricantId et items requis" }, { status: 400 });
  }

  const distributor = await db.distributor.findUnique({ where: { userId: user.id } });
  if (!distributor) {
    return NextResponse.json({ error: "Profil distributeur introuvable" }, { status: 404 });
  }

  // Calcule le total et valide les items
  let totalAmount = 0;
  const orderItems: { b2bProductId: string; quantity: number; unitPrice: number; total: number }[] = [];

  for (const item of items) {
    const b2bProduct = await db.b2BProduct.findUnique({
      where: { id: item.b2bProductId },
      include: { product: true },
    });
    if (!b2bProduct) continue;
    if (b2bProduct.product.userId !== fabricantId) continue;

    // Prix unitaire : utilise distributorPriceTiers ou fallback
    let unitPrice = item.unitPrice || 0;
    if (b2bProduct.distributorPriceTiers) {
      const tiers = JSON.parse(b2bProduct.distributorPriceTiers) as { minQty: number; price: number }[];
      const applicable = tiers
        .filter((t) => item.quantity >= t.minQty)
        .sort((a, b) => b.minQty - a.minQty)[0];
      if (applicable) unitPrice = applicable.price;
    }
    if (!unitPrice) unitPrice = item.unitPrice || 1000; // prix fallback

    // Vérifie MOQ
    if (item.quantity < b2bProduct.moq) {
      return NextResponse.json({
        error: `Quantité ${item.quantity} < MOQ ${b2bProduct.moq} pour ${b2bProduct.product.name}`,
      }, { status: 400 });
    }

    const total = unitPrice * item.quantity;
    totalAmount += total;
    orderItems.push({ b2bProductId: b2bProduct.id, quantity: item.quantity, unitPrice, total });
  }

  if (orderItems.length === 0) {
    return NextResponse.json({ error: "Aucun item valide" }, { status: 400 });
  }

  const orderNumber = `B2B-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Crée la conversation si elle n'existe pas
  let conversation = await db.conversation.findFirst({
    where: { distributorId: distributor.id, fabricantId },
  });
  if (!conversation) {
    conversation = await db.conversation.create({
      data: { distributorId: distributor.id, fabricantId },
    });
  }

  const order = await db.b2BOrder.create({
    data: {
      orderNumber,
      distributorId: distributor.id,
      fabricantId,
      conversationId: conversation.id,
      status: "quote_requested",
      totalAmount,
      deliveryAddress,
      notes,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  // Notifie le fabricant
  await createNotification({
    userId: fabricantId,
    type: "b2b_order",
    title: "Nouvelle demande de devis B2B",
    message: `${distributor.companyName} a demandé un devis pour la commande ${orderNumber} (${totalAmount.toLocaleString("fr-FR")} FCFA)`,
    link: "/dashboard/b2b",
    metadata: { orderId: order.id },
  });

  // Message automatique dans la conversation
  await db.b2BMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: distributor.id,
      receiverId: fabricantId,
      content: `Bonjour, je souhaite recevoir un devis pour la commande ${orderNumber}. Total estimé : ${totalAmount.toLocaleString("fr-FR")} FCFA.`,
    },
  });

  return NextResponse.json({ order });
}
