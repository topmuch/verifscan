import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardSidebar, MobileDashboardNav } from "@/components/dashboard-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/admin");

  const role = (session.user as any)?.role;
  if (role !== "superadmin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-emerald-50/30">
      <DashboardSidebar role="superadmin" />
      <MobileDashboardNav role="superadmin" />
      <div className="md:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
