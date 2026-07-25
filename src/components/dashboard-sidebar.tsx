"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  Home,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { VerifScanLogo } from "@/components/verifscan-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fabricantLinks = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/produits", label: "Produits", icon: Package },
  { href: "/dashboard/lots", label: "Lots", icon: Layers },
  { href: "/dashboard/qr-codes", label: "QR Codes", icon: QrCode },
  { href: "/dashboard/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/admin/fabricants", label: "Fabricants", icon: Package },
  { href: "/admin/categories", label: "Catégories", icon: Layers },
];

export function DashboardSidebar({ role }: { role: "fabricant" | "superadmin" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const links = role === "superadmin" ? adminLinks : fabricantLinks;

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-emerald-100">
      <div className="flex-1 flex flex-col overflow-y-auto vs-scroll">
        <div className="px-4 py-4 border-b border-emerald-100">
          <VerifScanLogo size="sm" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {role === "superadmin" ? "Administration" : "Mon espace"}
          </div>
          {links.map((l) => {
            const isActive = l.exact
              ? pathname === l.href
              : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-700"
                )}
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-emerald-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50/50 hover:text-emerald-700"
          >
            <Home className="size-4" />
            Site public
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>

          <div className="px-3 pt-3 mt-2 border-t border-emerald-100">
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
            <p className="text-xs font-semibold text-emerald-700 truncate">
              {session?.user?.name}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileDashboardNav({ role }: { role: "fabricant" | "superadmin" }) {
  const pathname = usePathname();
  const links = role === "superadmin" ? adminLinks : fabricantLinks;

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white border-b border-emerald-100">
      <div className="px-4 py-3 flex items-center justify-between">
        <VerifScanLogo size="sm" />
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Site</Link>
        </Button>
      </div>
      <div className="px-2 pb-2 flex items-center gap-1 overflow-x-auto vs-scroll">
        {links.map((l) => {
          const isActive = l.exact
            ? pathname === l.href
            : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-600 hover:bg-emerald-50"
              )}
            >
              <l.icon className="size-3.5" />
              {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
