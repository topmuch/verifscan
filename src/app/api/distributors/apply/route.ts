import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/distributors/apply — demande de devenir distributeur vérifié
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  const body = await req.json();
  const { companyName, ninea, rccm, businessCategory, regionsServed, preferredCategories } = body;

  if (!companyName) {
    return NextResponse.json({ error: "companyName requis" }, { status: 400 });
  }

  // Vérifie qu'il n'est pas déjà distributeur
  const existing = await db.distributor.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Déjà distributeur", distributor: existing }, { status: 400 });
  }

  // Change le rôle utilisateur
  await db.user.update({
    where: { id: user.id },
    data: { role: "distributor", companyName },
  });

  const distributor = await db.distributor.create({
    data: {
      userId: user.id,
      companyName,
      ninea,
      rccm,
      businessCategory,
      regionsServed,
      preferredCategories,
      verified: false, // en attente de vérification admin
    },
  });

  return NextResponse.json({
    distributor,
    message: "Demande soumise. Un administrateur vérifiera votre profil sous 48h.",
  });
}
