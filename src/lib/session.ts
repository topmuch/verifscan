import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  role: "superadmin" | "fabricant";
  companyName?: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id,
    email: session.user.email!,
    role: (session.user as any).role,
    companyName: (session.user as any).companyName,
  };
}

export async function requireFabricant(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "fabricant") return null;
  // Check the account is still active in DB
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.isActive) return null;
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") return null;
  return user;
}
