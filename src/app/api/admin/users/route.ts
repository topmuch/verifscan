import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

/**
 * List all user accounts (superadmin + fabricant) with subscription + counts.
 * SuperAdmin only. Supports ?search=&status=&plan=&role=&page=&pageSize= filters.
 *
 * The `role` query parameter accepts: "all" (default) | "superadmin" | "fabricant".
 * This is what makes newly-created SuperAdmins visible in the admin user list —
 * previously the query was hardcoded to `role: "fabricant"` and silently hid every
 * superadmin account.
 */
export async function GET(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all"; // all|active|inactive
  const plan = url.searchParams.get("plan") || "all"; // all|starter|pro|enterprise|trial
  const role = url.searchParams.get("role") || "all"; // all|superadmin|fabricant
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

  const where: any = {};
  if (role === "superadmin" || role === "fabricant") {
    where.role = role;
  }
  if (search) {
    where.OR = [
      { companyName: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  // Plan filter only makes sense for fabricants (superadmins have no subscription).
  if (plan !== "all") {
    if (plan === "trial") {
      where.subscription = { status: "trial" };
    } else {
      where.subscription = { plan };
    }
  }

  const [total, fabricants] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        role: true,
        companyName: true,
        logoUrl: true,
        phone: true,
        whatsapp: true,
        emailContact: true,
        address: true,
        isActive: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            qrCodesUsed: true,
            qrCodesLimit: true,
            productsLimit: true,
          },
        },
        _count: {
          select: {
            products: true,
            scans: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    data: fabricants,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/**
 * POST /api/admin/users
 *
 * Creates a new user account from the admin UI.
 *
 * The superadmin can choose between two roles:
 *  - "superadmin" : a new platform administrator (full access to /admin/*)
 *  - "fabricant"  : a new manufacturer account (access to /dashboard/*)
 *
 * The endpoint validates input (zod), checks email uniqueness, hashes the
 * password with bcryptjs ($2b$10$), creates the User row, and — for fabricants
 * — also creates a default Subscription (plan starter, status trial) so the
 * account is immediately usable.
 *
 * Returns the public fields of the newly created user (no passwordHash).
 */
const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["superadmin", "fabricant"]),
  companyName: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  isActive: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, role, companyName, phone, isActive } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Email uniqueness
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte avec cet email existe déjà" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // For superadmin accounts, companyName is optional.
  // For fabricant accounts, default to email prefix if not provided.
  const finalCompanyName =
    companyName ||
    (role === "fabricant" ? normalizedEmail.split("@")[0] : null);

  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role,
      companyName: finalCompanyName,
      phone,
      isActive,
    },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      phone: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Bootstrap a default subscription for fabricants so they can use the dashboard
  if (role === "fabricant") {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db.subscription.create({
      data: {
        userId: user.id,
        plan: "starter",
        status: "trial",
        qrCodesLimit: 500,
        qrCodesUsed: 0,
        productsLimit: 5,
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });
  }

  return NextResponse.json(user, { status: 201 });
}
