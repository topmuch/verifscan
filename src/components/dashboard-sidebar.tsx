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
  CreditCard,
  Bell,
  Download,
  Layers3,
  Brain,
  Store,
  ShieldCheck,
  Users,
  TrendingUp,
  Trophy,
  FlaskConical,
  Leaf,
  Award,
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
  { href: "/dashboard/qr-codes/masse", label: "Génération en masse", icon: Layers3 },
  { href: "/dashboard/ia", label: "Intelligence IA", icon: Brain },
  { href: "/dashboard/insights", label: "Insights marché", icon: TrendingUp },
  { href: "/dashboard/concurrents", label: "Concurrents", icon: Trophy },
  { href: "/dashboard/ab-tests", label: "A/B Testing", icon: FlaskConical },
  { href: "/dashboard/nutrition", label: "Nutrition & Éco", icon: Leaf },
  { href: "/dashboard/certifications", label: "Certifications", icon: ShieldCheck },
  { href: "/dashboard/b2b", label: "Marketplace B2B", icon: Store },
  { href: "/dashboard/blockchain", label: "Blockchain", icon: Award },
  { href: "/dashboard/statistiques", label: "Statistiques", icon: BarChart3 },
  { href: "/dashboard/abonnement", label: "Abonnement", icon: CreditCard },
  { href: "/dashboard/export", label: "Exports", icon: Download },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
];

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

// Brand palette
const SIDEBAR_BG = "#124685"; // brand blue
const SIDEBAR_ACTIVE_BG = "rgba(255,255,255,0.14)";
const SIDEBAR_HOVER_BG = "rgba(255,255,255,0.08)";

export function DashboardSidebar({ role }: { role: "fabricant" | "superadmin" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const links = role === "superadmin" ? adminLinks : fabricantLinks;

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-white/10"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <div className="flex-1 flex flex-col overflow-y-auto vs-scroll">
        <div className="px-4 py-4 border-b border-white/10">
          {/* Logo en version claire pour fond bleu */}
          <VerifScanLogo size="lg" variant="light" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-white",
                  isActive
                    ? "shadow-sm"
                    : "text-white/85 hover:text-white"
                )}
                style={{
                  backgroundColor: isActive
                    ? SIDEBAR_ACTIVE_BG
                    : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = SIDEBAR_HOVER_BG;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "";
                }}
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/85 hover:text-white"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = SIDEBAR_HOVER_BG)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <Home className="size-4" />
            Site public
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-200 hover:text-white hover:bg-red-500/30"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>

          <div className="px-3 pt-3 mt-2 border-t border-white/10">
            <p className="text-xs text-white/70 truncate">
              {session?.user?.email}
            </p>
            <p className="text-xs font-semibold text-white truncate">
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
    <div
      className="md:hidden sticky top-0 z-40 border-b border-white/10"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <VerifScanLogo size="md" variant="light" />
        <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
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
                  ? "text-white"
                  : "text-white/80 hover:text-white"
              )}
              style={{
                backgroundColor: isActive ? SIDEBAR_ACTIVE_BG : undefined,
              }}
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
