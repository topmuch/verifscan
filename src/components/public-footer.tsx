import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { VerifScanLogo } from "@/components/verifscan-logo";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-emerald-100 bg-emerald-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <VerifScanLogo />
            <p className="text-sm text-gray-600 max-w-sm">
              La vérité au bout du scan. VerifScan offre aux fabricants un passeport
              numérique pour leurs produits, garantissant traçabilité, authenticité
              et transparence pour les consommateurs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-600 hover:text-emerald-700">Accueil</Link></li>
              <li><Link href="/produits" className="text-gray-600 hover:text-emerald-700">Produits</Link></li>
              <li><Link href="/register" className="text-gray-600 hover:text-emerald-700">Devenir fabricant</Link></li>
              <li><Link href="/login" className="text-gray-600 hover:text-emerald-700">Connexion</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-emerald-600" /> contact@verifscan.sn
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-emerald-600" /> +221 33 800 00 00
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-600" /> Dakar, Sénégal
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} VerifScan. Tous droits réservés.</p>
          <p className="text-xs">
            Conçu au Sénégal <span className="text-emerald-600">●</span> Pour l'Afrique de l'Ouest
          </p>
        </div>
      </div>
    </footer>
  );
}
