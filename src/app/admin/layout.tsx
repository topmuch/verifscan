import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/admin");

  const role = (session.user as any)?.role;
  if (role !== "superadmin") redirect("/dashboard");

  const user = {
    name: session.user?.name || "Super Admin",
    email: session.user?.email || "",
    role: "superadmin" as const,
  };

  return <AdminShell user={user}>{children}</AdminShell>;
}
