import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe min. 6 caractères"),
  companyName: z.string().min(2, "Nom de l'entreprise requis"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  emailContact: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { email, password, companyName, phone, whatsapp, emailContact, address } = parsed.data;

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "fabricant",
        companyName: companyName.trim(),
        phone: phone?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        emailContact: emailContact?.trim() || null,
        address: address?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      message: "Compte fabricant créé avec succès. Vous pouvez vous connecter.",
    });
  } catch (err: any) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
