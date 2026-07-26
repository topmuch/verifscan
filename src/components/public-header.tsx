"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  { href: "/", label: "Accueil" },
  { href: "/produits", label: "Produits" },
  { href: "/marketplace", label: "Marketplace B2B" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <VerifScanLogo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserIcon className="size-4" />
                  <span className="max-w-[140px] truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      (session.user as any)?.role === "superadmin"
                        ? "/admin"
                        : "/dashboard"
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
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/register">Devenir fabricant</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-emerald-50"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-emerald-100 bg-white px-4 py-3 space-y-1">
          {publicLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-emerald-100 flex flex-col gap-2">
            {status === "authenticated" ? (
              <>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link
                    href={
                      (session.user as any)?.role === "superadmin"
                        ? "/admin"
                        : "/dashboard"
                    }
                  >
                    Tableau de bord
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-red-600"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/register">Devenir fabricant</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
