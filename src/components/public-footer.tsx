import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ShieldCheck } from "lucide-react";
import { VerifScanLogo } from "@/components/verifscan-logo";

const footerLinks = {
  produit: [
    { label: "Produits", href: "/produits" },
    { label: "Le concept", href: "/concept" },
    { label: "Fonctionnalités", href: "/#fonctionnalites" },
    { label: "Marketplace B2B", href: "/marketplace" },
  ],
  entreprise: [
    { label: "À propos", href: "/a-propos" },
    { label: "Devenir partenaire", href: "/devenir-partenaire" },
    { label: "Contact", href: "/contact" },
    { label: "Connexion", href: "/login" },
  ],
  legal: [
    { label: "Mentions légales", href: "/mentions-legales" },
    { label: "CGU", href: "/cgu" },
    { label: "Politique de confidentialité", href: "/mentions-legales#donnees" },
    { label: "Cookies", href: "/mentions-legales#cookies" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#0a3060] text-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4 space-y-5">
            <VerifScanLogo size="lg" variant="light" />
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              La vérité au bout du scan. VerifScan offre aux fabricants un passeport
              numérique pour leurs produits, garantissant traçabilité, authenticité
              et transparence pour les consommateurs sénégalais et ouest-africains.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
              <ShieldCheck className="size-3.5 text-[#2ebd5a]" />
              Sécurisé par blockchain
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="size-9 rounded-lg bg-white/5 hover:bg-[#0f4382] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-105"
                >
                  <s.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm text-white mb-4 font-display">Produit</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.produit.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-gray-400 hover:text-[#2ebd5a] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm text-white mb-4 font-display">Entreprise</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.entreprise.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-gray-400 hover:text-[#2ebd5a] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm text-white mb-4 font-display">Légal</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.legal.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-gray-400 hover:text-[#2ebd5a] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm text-white mb-4 font-display">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Mail className="size-4 mt-0.5 text-[#0f4382] flex-shrink-0" />
                <a href="mailto:contact@verifscan.sn" className="hover:text-white transition-colors">
                  contact@verifscan.sn
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="size-4 mt-0.5 text-[#0f4382] flex-shrink-0" />
                <span>+221 33 800 00 00</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="size-4 mt-0.5 text-[#0f4382] flex-shrink-0" />
                <span>Dakar, Sénégal</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1f3a5f] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} VerifScan. Tous droits réservés.</p>
          <p className="flex items-center gap-2 text-xs">
            Conçu au Sénégal
            <span className="inline-block size-1.5 rounded-full bg-[#2ebd5a]" />
            Pour l&apos;Afrique de l&apos;Ouest
          </p>
        </div>
      </div>
    </footer>
  );
}
