"use client";

import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="vs-gradient-hero border-b border-emerald-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            Contact
          </Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Parlons de votre projet
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            Une question sur VerifScan, une démo, ou besoin d'accompagnement pour déployer
            la traçabilité dans votre entreprise ? Notre équipe est à votre écoute.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className="vs-card-shadow border-emerald-100">
              <CardContent className="p-6">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  Coordonnées
                </h2>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <a href="mailto:contact@verifscan.sn" className="font-semibold text-gray-900 hover:text-emerald-700">
                        contact@verifscan.sn
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <p className="text-gray-500">Téléphone</p>
                      <a href="tel:+221338000000" className="font-semibold text-gray-900 hover:text-emerald-700">
                        +221 33 800 00 00
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="size-5" />
                    </div>
                    <div>
                      <p className="text-gray-500">WhatsApp</p>
                      <a
                        href="https://wa.me/221338000000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-900 hover:text-emerald-700"
                      >
                        +221 33 800 00 00
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <p className="text-gray-500">Adresse</p>
                      <p className="font-semibold text-gray-900">
                        Dakar, Sénégal
                      </p>
                      <p className="text-xs text-gray-500">Lun - Ven : 9h - 18h</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="vs-card-shadow border-emerald-100">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Pour les fabricants</h3>
                <p className="text-sm text-gray-600">
                  Vous souhaitez tester VerifScan sur vos produits ? Créez un compte
                  fabricant gratuitement et générez votre premier QR code en moins de
                  5 minutes.
                </p>
                <a
                  href="/register"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Créer mon compte fabricant →
                </a>
              </CardContent>
            </Card>
          </div>

          <Card className="vs-card-shadow border-emerald-100">
            <CardContent className="p-6">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <Send className="size-5 text-emerald-600" />
                Envoyez-nous un message
              </h2>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const subject = encodeURIComponent(
                    `[VerifScan Contact] ${fd.get("subject") || "Demande"}`
                  );
                  const body = encodeURIComponent(
                    `Nom: ${fd.get("name")}\nEmail: ${fd.get("email")}\nEntreprise: ${fd.get("company")}\n\n${fd.get("message")}`
                  );
                  window.location.href = `mailto:contact@verifscan.sn?subject=${subject}&body=${body}`;
                }}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nom complet *</label>
                    <input
                      name="name"
                      required
                      className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Awa Diop"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="awa@entreprise.sn"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Entreprise</label>
                  <input
                    name="company"
                    className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Sarine Bio"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Sujet</label>
                  <select
                    name="subject"
                    className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option>Demande de démo</option>
                    <option>Question produit</option>
                    <option>Partenariat</option>
                    <option>Support technique</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Votre message..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 text-sm transition-colors"
                >
                  <Send className="size-4" />
                  Envoyer le message
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
