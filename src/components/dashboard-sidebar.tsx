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
  Code2,
  Webhook,
  Upload,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { VerifScanLogo } from "@/components/verifscan-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
};

type NavSection = {
  title: string;
  links: NavLink[];
};

/* ===================================================================
   Navigation fabricant — organisée en 4 sections thématiques
   (réorganisé pour mettre en avant les actions à haute valeur :
   Pilotage, Catalogue, Marché, Aide & Compte)
   =================================================================== */
const fabricantSections: NavSection[] = [
  {
    title: "Pilotage",
    links: [
      { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/statistiques", label: "Statistiques", icon: BarChart3 },
    ],
  },
  {
    title: "Catalogue & Traçabilité",
    links: [
      { href: "/dashboard/produits", label: "Produits", icon: Package },
      { href: "/dashboard/lots", label: "Lots", icon: Layers },
      { href: "/dashboard/qr-codes", label: "QR Codes", icon: QrCode },
      { href: "/dashboard/qr-codes/masse", label: "Génération en masse", icon: Layers3 },
      { href: "/dashboard/certifications", label: "Certifications", icon: ShieldCheck },
      { href: "/dashboard/nutrition", label: "Nutrition & Éco", icon: Leaf },
    ],
  },
  {
    title: "Marché & Intelligence",
    links: [
      { href: "/dashboard/ia", label: "Intelligence IA", icon: Brain },
      { href: "/dashboard/insights", label: "Insights marché", icon: TrendingUp },
      { href: "/dashboard/concurrents", label: "Concurrents", icon: Trophy },
      { href: "/dashboard/ab-tests", label: "A/B Testing", icon: FlaskConical },
      { href: "/dashboard/blockchain", label: "Blockchain", icon: Award },
      { href: "/dashboard/b2b", label: "Marketplace B2B", icon: Store },
    ],
  },
  {
    title: "Aide & Compte",
    links: [
      { href: "/dashboard/assistance", label: "Assistance", icon: LifeBuoy, badge: "NEW" },
      { href: "/dashboard/abonnement", label: "Abonnement", icon: CreditCard },
      { href: "/dashboard/export", label: "Exports", icon: Download },
      { href: "/dashboard/api-keys", label: "API & Intégrations", icon: Code2 },
      { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    title: "Administration",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/fabricants", label: "Utilisateurs", icon: Users },
      { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard },
      { href: "/admin/categories", label: "Catégories", icon: Layers },
    ],
  },
  {
    title: "Système",
    links: [
      { href: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
      { href: "/admin/api-keys", label: "API Keys", icon: Code2, badge: "NEW" },
      { href: "/admin/parametres", label: "Paramètres", icon: Settings },
      { href: "/admin/logs", label: "Logs & Audit", icon: ShieldCheck },
      { href: "/admin/support", label: "Support", icon: Bell },
    ],
  },
];

// Brand palette — green sidebar
const SIDEBAR_BG = "#2ebd5a"; // brand green
const SIDEBAR_BG_GRADIENT = "linear-gradient(180deg, #2ebd5a 0%, #1f8a42 100%)";
const SIDEBAR_ACTIVE_BG = "rgba(255,255,255,0.25)";
const SIDEBAR_HOVER_BG = "rgba(255,255,255,0.10)";
const SECTION_TITLE_COLOR = "rgba(255,255,255,0.70)";

export function DashboardSidebar({ role }: { role: "fabricant" | "superadmin" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sections = role === "superadmin" ? adminSections : fabricantSections;

  return (
    <aside
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-white/15"
      style={{ background: SIDEBAR_BG_GRADIENT }}
    >
      <div className="flex-1 flex flex-col overflow-y-auto vs-scroll">
        {/* Logo — version claire sur fond vert */}
        <div className="px-4 py-3 border-b border-white/15 bg-white/[0.06]">
          <VerifScanLogo size="lg" variant="light" />
        </div>

        {/* Navigation par sections */}
        <nav className="flex-1 px-3 py-3 space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <div
                className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: SECTION_TITLE_COLOR }}
              >
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.links.map((l) => {
                  const isActive = l.exact
                    ? pathname === l.href
                    : pathname.startsWith(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors text-white",
                        isActive
                          ? "shadow-sm"
                          : "text-white/80 hover:text-white"
                      )}
                      style={{
                        backgroundColor: isActive ? SIDEBAR_ACTIVE_BG : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = SIDEBAR_HOVER_BG;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "";
                      }}
                    >
                      <l.icon className="size-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{l.label}</span>
                      {l.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-400 text-emerald-950">
                          {l.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer : site public + déconnexion + user info */}
        <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium text-white/80 hover:text-white"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = SIDEBAR_HOVER_BG)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <Home className="size-4" />
            Site public
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium text-red-200 hover:text-white hover:bg-red-500/30"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>

          <div className="px-3 pt-2 mt-1 border-t border-white/10">
            <p className="text-[11px] text-white/60 truncate">
              {session?.user?.email}
            </p>
            <p className="text-xs font-semibold text-white truncate">
              {session?.user?.name || session?.user?.companyName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ===================================================================
   Mobile navigation — barre horizontale scrollable avec même
   regroupement que la sidebar desktop.
   =================================================================== */
export function MobileDashboardNav({ role }: { role: "fabricant" | "superadmin" }) {
  const pathname = usePathname();
  const sections = role === "superadmin" ? adminSections : fabricantSections;
  // Flatten sections for the horizontal mobile bar
  const links = sections.flatMap((s) => s.links);

  return (
    <div
      className="md:hidden sticky top-0 z-40 border-b border-white/15"
      style={{ background: SIDEBAR_BG_GRADIENT }}
    >
      <div className="px-4 py-2.5 flex items-center justify-between">
        <VerifScanLogo size="sm" variant="light" />
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

/* Re-export Upload icon for use elsewhere if needed */
export { Upload };
