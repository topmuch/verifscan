"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Layers,
  BarChart3,
  Settings,
  ShieldCheck,
  Bell,
  LogOut,
  Home,
  Menu,
  X,
  Search,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { VerifScanLogo } from "@/components/verifscan-logo";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/fabricants", label: "Utilisateurs", icon: Users },
  { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/admin/categories", label: "Catégories", icon: Layers },
  { href: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  { href: "/admin/logs", label: "Logs & Audit", icon: ShieldCheck },
  { href: "/admin/support", label: "Support", icon: Bell },
];

type AdminUser = {
  name: string;
  email: string;
  role: "superadmin";
};

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar 280px */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="px-5 h-[70px] flex items-center border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <VerifScanLogo size="sm" />
            <span className="ml-1 px-2 py-0.5 rounded-md bg-[#0f4382] text-white text-[10px] font-bold uppercase tracking-wide">
              Admin
            </span>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 vs-scroll">
          <div className="px-3 mb-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
            Administration
          </div>
          <ul className="space-y-1">
            {adminLinks.map((l) => {
              const isActive = l.exact
                ? pathname === l.href
                : pathname.startsWith(l.href);
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#0f4382] text-white shadow-sm"
                        : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    )}
                  >
                    <Icon className="size-4" />
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 px-3 mb-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
            Liens rapides
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4B5563] hover:bg-[#F9FAFB]"
              >
                <Home className="size-4" />
                Site public
              </Link>
            </li>
            <li>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="size-4" />
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>

        {/* Profil admin */}
        <div className="px-3 py-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F9FAFB]">
            <div className="size-9 rounded-full bg-gradient-to-br from-[#0f4382] to-[#2ebd5a] flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#111827] truncate">
                {user.name}
              </p>
              <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DBEAFE] text-[#1E40AF] font-semibold uppercase">
              Admin
            </span>
          </div>
        </div>
      </aside>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header 70px */}
        <header className="sticky top-0 z-30 h-[70px] bg-white border-b border-[#E5E7EB] flex items-center px-4 sm:px-6 lg:px-8">
          <button
            className="lg:hidden mr-2 p-2 rounded-lg hover:bg-[#F9FAFB] text-[#374151]"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>

          {/* Search */}
          <div className="relative hidden sm:block flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Rechercher un fabricant, produit, lot..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4382] focus:border-transparent"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:bg-[#F9FAFB]"
            >
              <Home className="size-4" />
              Voir le site
            </Link>
            <button
              className="relative size-9 rounded-lg hover:bg-[#F9FAFB] flex items-center justify-center text-[#4B5563]"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
            </button>
            <div className="size-9 rounded-full bg-gradient-to-br from-[#0f4382] to-[#2ebd5a] flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
