"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { VerifScanLogo } from "@/components/verifscan-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Accueil", anchor: "" },
  { href: "/produits", label: "Produits", anchor: "" },
  { href: "/#fonctionnalites", label: "Fonctionnalités", anchor: "fonctionnalites" },
  { href: "/contact", label: "Contact", anchor: "" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide header on dashboard/admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
        scrolled ? "vs-header-blur shadow-sm" : "bg-white"
      )}
      style={{ height: 80 }}
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <VerifScanLogo size="md" />

        {/* Desktop nav (centered) */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {publicLinks.map((l) => {
            const isActive =
              l.href === "/" ? pathname === "/" : pathname === l.href || (l.anchor && pathname === "/");
            return (
              <Link
                key={l.href + l.label}
                href={l.href}
                className={cn(
                  "vs-nav-link text-[15px] font-medium transition-colors",
                  isActive ? "text-[#0f4382] vs-active" : "text-[#374151] hover:text-[#0f4382]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] hover:text-[#0f4382] rounded-lg"
                >
                  <div className="size-7 rounded-full bg-gradient-to-br from-[#0f4382] to-[#2ebd5a] flex items-center justify-center text-white text-xs font-semibold">
                    {(session.user?.name || session.user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      (session.user as any)?.role === "superadmin" ? "/admin" : "/dashboard"
                    }
                    className="cursor-pointer"
                  >
                    <LayoutDashboard className="mr-2 size-4" />
                    Tableau de bord
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="cursor-pointer text-red-600 focus:text-red-700"
                >
                  <LogOut className="mr-2 size-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-[#0f4382] hover:bg-[#DBEAFE]/50 hover:text-[#0a3060] font-semibold text-base px-4"
              >
                <Link href="/login">Connexion</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[#0f4382] hover:bg-[#0a3060] text-white font-semibold text-base px-5 py-2.5 rounded-lg shadow-md shadow-blue-200 transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                <Link href="/register">Essayer gratuitement</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-[#F9FAFB] text-[#374151]"
          onClick={() => setOpen(!open)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="lg:hidden border-t border-[#E5E7EB] bg-white px-4 py-4 space-y-1 shadow-lg">
          {publicLinks.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-base font-medium text-[#374151] hover:bg-[#F9FAFB] hover:text-[#0f4382] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
            {status === "authenticated" ? (
              <>
                <Button asChild variant="outline" size="sm" className="w-full h-12 border-[#E5E7EB]">
                  <Link
                    href={
                      (session.user as any)?.role === "superadmin" ? "/admin" : "/dashboard"
                    }
                  >
                    <LayoutDashboard className="mr-2 size-4" />
                    Tableau de bord
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-12 text-red-600"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 size-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full h-12 border-[#0f4382] text-[#0f4382] font-semibold"
                >
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="w-full h-12 bg-[#0f4382] hover:bg-[#0a3060] text-white font-semibold"
                >
                  <Link href="/register">Essayer gratuitement</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
