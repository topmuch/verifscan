import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardSidebar, MobileDashboardNav } from "@/components/dashboard-sidebar";
import { NotificationBell } from "@/components/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  const role = (session.user as any)?.role;
  // V3: distributors also access dashboard with limited features
  if (role !== "fabricant" && role !== "distributor") redirect("/admin");

  return (
    <div className="min-h-screen bg-emerald-50/30">
      <DashboardSidebar role="fabricant" />
      <MobileDashboardNav role="fabricant" />
      <div className="md:pl-64">
        {/* Desktop top bar */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-emerald-100 px-6 py-3 items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">
              {role === "distributor" ? "Espace Distributeur" : "Espace Fabricant"}
            </span>
            <span className="text-gray-300">·</span>
            <span>La vérité au bout du scan</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
