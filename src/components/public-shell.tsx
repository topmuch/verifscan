import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      {/* pt-20 = 80px header height (header is fixed) */}
      <main className="flex-1 pt-20">{children}</main>
      <PublicFooter />
    </div>
  );
}

export { PublicHeader, PublicFooter };
