import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireFabricant, getCurrentUser } from "@/lib/session";

const schema = z.object({
  companyName: z.string().min(2).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  emailContact: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  logoUrl: z.string().optional().or(z.literal("")),
  socialFacebook: z.string().optional().or(z.literal("")),
  socialTwitter: z.string().optional().or(z.literal("")),
  socialLinkedin: z.string().optional().or(z.literal("")),
  socialInstagram: z.string().optional().or(z.literal("")),
});

/** Get own profile. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      companyName: true,
      phone: true,
      whatsapp: true,
      emailContact: true,
      address: true,
      logoUrl: true,
      socialFacebook: true,
      socialTwitter: true,
      socialLinkedin: true,
      socialInstagram: true,
      role: true,
    },
  });
  if (!profile) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(profile);
}

/** Update own fabricant profile. */
export async function PUT(req: Request) {
  const user = await requireFabricant();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(data.companyName !== undefined && { companyName: data.companyName.trim() }),
      ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
      ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp?.trim() || null }),
      ...(data.emailContact !== undefined && { emailContact: data.emailContact?.trim() || null }),
      ...(data.address !== undefined && { address: data.address?.trim() || null }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      ...(data.socialFacebook !== undefined && { socialFacebook: data.socialFacebook?.trim() || null }),
      ...(data.socialTwitter !== undefined && { socialTwitter: data.socialTwitter?.trim() || null }),
      ...(data.socialLinkedin !== undefined && { socialLinkedin: data.socialLinkedin?.trim() || null }),
      ...(data.socialInstagram !== undefined && { socialInstagram: data.socialInstagram?.trim() || null }),
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      phone: true,
      whatsapp: true,
      emailContact: true,
      address: true,
      logoUrl: true,
      socialFacebook: true,
      socialTwitter: true,
      socialLinkedin: true,
      socialInstagram: true,
    },
  });

  return NextResponse.json(updated);
}
