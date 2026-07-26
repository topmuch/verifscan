"use client";

import { useState } from "react";
import {
  Settings,
  Mail,
  CreditCard,
  Shield,
  Code,
  Palette,
  Wrench,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const sections = [
  { key: "general", label: "Général", icon: Settings },
  { key: "email", label: "Email & Notifications", icon: Mail },
  { key: "payment", label: "Paiement", icon: CreditCard },
  { key: "security", label: "Sécurité", icon: Shield },
  { key: "api", label: "API & Intégrations", icon: Code },
  { key: "appearance", label: "Apparence", icon: Palette },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
          Paramètres Globaux
        </h1>
        <p className="mt-1 text-[#6B7280]">
          Configuration complète de la plateforme VerifScan
        </p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar menu */}
        <Card className="border-[#E5E7EB] h-fit sticky top-24">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === s.key
                        ? "bg-[#0f4382] text-white"
                        : "text-[#4B5563] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <Icon className="size-4" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div>
          {activeSection === "general" && <GeneralSection />}
          {activeSection === "email" && <EmailSection />}
          {activeSection === "payment" && <PaymentSection />}
          {activeSection === "security" && <SecuritySection />}
          {activeSection === "api" && <ApiSection />}
          {activeSection === "appearance" && <AppearanceSection />}
          {activeSection === "maintenance" && <MaintenanceSection />}
        </div>
      </div>
    </div>
  );
}

function GeneralSection() {
  const [form, setForm] = useState({
    platformName: "VerifScan",
    slogan: "La vérité au bout du scan",
    siteUrl: "https://verifscan.sn",
    contactEmail: "contact@verifscan.sn",
    phone: "+221 77 123 45 67",
    address: "Dakar, Sénégal",
    timezone: "Africa/Dakar",
    language: "fr",
  });
  return (
    <Card className="border-[#E5E7EB]">
      <CardHeader>
        <CardTitle className="text-base font-display">Général</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Nom de la plateforme</Label>
            <Input value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} />
          </div>
          <div>
            <Label>Slogan</Label>
            <Input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Logo</Label>
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-4 text-center hover:border-[#0f4382] cursor-pointer">
              <p className="text-xs text-[#6B7280]">PNG/SVG, max 2MB</p>
              <Button variant="outline" size="sm" className="mt-2 border-[#E5E7EB]">Choisir un fichier</Button>
            </div>
          </div>
          <div>
            <Label>Favicon</Label>
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-4 text-center hover:border-[#0f4382] cursor-pointer">
              <p className="text-xs text-[#6B7280]">ICO/PNG, 32x32</p>
              <Button variant="outline" size="sm" className="mt-2 border-[#E5E7EB]">Choisir un fichier</Button>
            </div>
          </div>
        </div>
        <div>
          <Label>URL du site</Label>
          <Input value={form.siteUrl} onChange={(e) => setForm({ ...form, siteUrl: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Email de contact</Label>
            <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Adresse</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Fuseau horaire</Label>
            <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Dakar">Africa/Dakar (GMT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Langue par défaut</Label>
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="wo">Wolof</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SaveButton onClick={() => toast.success("Paramètres généraux enregistrés")} />
      </CardContent>
    </Card>
  );
}

function EmailSection() {
  const [smtp, setSmtp] = useState({
    server: "smtp.gmail.com",
    port: "587",
    user: "noreply@verifscan.sn",
    password: "",
    encryption: "tls",
  });
  const [notifs, setNotifs] = useState({
    newInscription: true,
    newPayment: true,
    supportTicket: true,
    securityAlert: true,
    adminEmail: "admin@verifscan.sn",
  });

  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Configuration SMTP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Serveur SMTP</Label>
              <Input value={smtp.server} onChange={(e) => setSmtp({ ...smtp, server: e.target.value })} />
            </div>
            <div>
              <Label>Port</Label>
              <Input value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} className="font-mono" />
            </div>
            <div>
              <Label>Utilisateur</Label>
              <Input value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input type="password" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} placeholder="********" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-[#E5E7EB]">Tester la connexion</Button>
            <SaveButton onClick={() => toast.success("Configuration SMTP enregistrée")} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Notifications admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "newInscription", label: "Nouvelle inscription" },
            { key: "newPayment", label: "Nouveau paiement" },
            { key: "supportTicket", label: "Ticket support créé" },
            { key: "securityAlert", label: "Alerte sécurité" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0">
              <Label className="text-sm font-normal">{n.label}</Label>
              <Switch
                checked={(notifs as any)[n.key]}
                onCheckedChange={(v) => setNotifs({ ...notifs, [n.key]: v })}
              />
            </div>
          ))}
          <div>
            <Label>Email destinataire</Label>
            <Input value={notifs.adminEmail} onChange={(e) => setNotifs({ ...notifs, adminEmail: e.target.value })} />
          </div>
          <SaveButton onClick={() => toast.success("Notifications enregistrées")} />
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Templates d&apos;emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {["Inscription", "Bienvenue", "Réinitialisation mot de passe", "Notification paiement", "Rapport hebdomadaire"].map((t) => (
            <div key={t} className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB]">
              <span className="text-sm font-medium text-[#111827]">{t}</span>
              <Button variant="outline" size="sm" className="border-[#E5E7EB]">Éditer</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentSection() {
  const [mode, setMode] = useState("test");
  return (
    <div className="space-y-6">
      {[
    { name: "CinetPay", key: "cinetpay", apiKey: "CP-XXXXX" },
    { name: "Stripe", key: "stripe", apiKey: "sk_live_XXXXX" },
    { name: "Orange Money", key: "orange", apiKey: "OM-XXXXX" },
    { name: "Wave", key: "wave", apiKey: "WV-XXXXX" },
  ].map((p) => (
    <Card key={p.key} className="border-[#E5E7EB]">
      <CardHeader>
        <CardTitle className="text-base font-display flex items-center justify-between">
          <span>{p.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7280]">Mode :</span>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="prod">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>API Key</Label>
          <Input type="password" defaultValue={p.apiKey} />
        </div>
        <div>
          <Label>Webhook URL</Label>
          <Input
            readOnly
            value={`https://api.verifscan.sn/webhook/${p.key}`}
            className="font-mono text-xs bg-[#F9FAFB]"
          />
        </div>
      </CardContent>
    </Card>
  ))}
      <SaveButton onClick={() => toast.success("Configuration paiement enregistrée")} />
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Authentification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Durée session (heures)</Label>
              <Input type="number" defaultValue={24} className="font-mono" />
            </div>
            <div>
              <Label>Refresh token (jours)</Label>
              <Input type="number" defaultValue={7} className="font-mono" />
            </div>
            <div>
              <Label>Tentatives login max</Label>
              <Input type="number" defaultValue={5} className="font-mono" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#F3F4F6]">
            <Label className="text-sm font-normal">2FA obligatoire pour les admins</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Mots de passe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Longueur minimum</Label>
              <Input type="number" defaultValue={8} className="font-mono" />
            </div>
            <div>
              <Label>Expiration (jours, 0 = jamais)</Label>
              <Input type="number" defaultValue={90} className="font-mono" />
            </div>
            <div>
              <Label>Historique (empêcher réutilisation)</Label>
              <Input type="number" defaultValue={5} className="font-mono" />
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-[#F3F4F6]">
            <Label className="text-sm font-normal">Complexité : Majuscule + Minuscule + Chiffre</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Rate limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>API (req/min/IP)</Label>
              <Input type="number" defaultValue={1000} className="font-mono" />
            </div>
            <div>
              <Label>Login (tentatives/15min/IP)</Label>
              <Input type="number" defaultValue={5} className="font-mono" />
            </div>
            <div>
              <Label>Upload (fichiers/min/user)</Label>
              <Input type="number" defaultValue={10} className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">CORS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Origines autorisées (séparées par virgule)</Label>
            <Textarea
              defaultValue="https://verifscan.sn, https://admin.verifscan.sn"
              className="font-mono text-xs"
              rows={2}
            />
          </div>
          <div>
            <Label>Méthodes autorisées</Label>
            <Input defaultValue="GET, POST, PUT, DELETE" className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <SaveButton onClick={() => toast.success("Paramètres sécurité enregistrés")} />
    </div>
  );
}

function ApiSection() {
  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">API publique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
            <div>
              <Label className="text-sm font-medium">Activer l&apos;API publique</Label>
              <p className="text-xs text-[#6B7280]">Permet aux clients Enterprise d&apos;accéder à l&apos;API</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div>
            <Label>Documentation API</Label>
            <Input readOnly value="https://docs.verifscan.sn" className="font-mono text-xs bg-[#F9FAFB]" />
          </div>
          <div>
            <Label>Rate limit (req/min/clé)</Label>
            <Input type="number" defaultValue={100} className="font-mono" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center justify-between">
            <span>Clés API générées</span>
            <Button size="sm" className="bg-[#0f4382] hover:bg-[#0a3060]">+ Générer nouvelle clé</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: "Production - Mobile App", created: "2026-01-15", lastUsed: "Il y a 2h" },
              { name: "Development - Tests", created: "2026-03-22", lastUsed: "Il y a 3j" },
            ].map((k) => (
              <div key={k.name} className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB]">
                <div>
                  <div className="font-medium text-sm text-[#111827]">{k.name}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    Créée le {k.created} · Dernière utilisation : {k.lastUsed}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-[#F3F4F6] px-2 py-1 rounded">vs_••••••••</code>
                  <Button variant="outline" size="sm" className="border-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]">
                    Révoquer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Intégrations tierces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Google Analytics ID</Label>
              <Input placeholder="UA-XXXXX" className="font-mono text-xs" />
            </div>
            <div>
              <Label>Plausible Domain</Label>
              <Input placeholder="verifscan.sn" className="font-mono text-xs" />
            </div>
            <div>
              <Label>Intercom App ID</Label>
              <Input placeholder="XXXXX" className="font-mono text-xs" />
            </div>
          </div>
          <SaveButton onClick={() => toast.success("Intégrations enregistrées")} />
        </CardContent>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  return (
    <Card className="border-[#E5E7EB]">
      <CardHeader>
        <CardTitle className="text-base font-display">Apparence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Thème</Label>
          <div className="mt-2 flex items-center gap-3">
            <Badge className="bg-[#DBEAFE] text-[#1E40AF]">Mode Clair (fixe)</Badge>
            <span className="text-xs text-[#6B7280]">Pas de dark mode pour le moment</span>
          </div>
        </div>
        <div>
          <Label>Couleur primaire</Label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              defaultValue="#0f4382"
              className="size-12 rounded-lg border border-[#E5E7EB] cursor-pointer"
            />
            <Input defaultValue="#0f4382" className="font-mono w-32" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Police titres</Label>
            <Input defaultValue="Poppins" readOnly className="bg-[#F9FAFB]" />
          </div>
          <div>
            <Label>Police corps</Label>
            <Input defaultValue="Inter" readOnly className="bg-[#F9FAFB]" />
          </div>
        </div>
        <div>
          <Label>Texte footer</Label>
          <Input defaultValue="© 2026 VerifScan. Tous droits réservés." />
        </div>
        <SaveButton onClick={() => toast.success("Apparence enregistrée")} />
      </CardContent>
    </Card>
  );
}

function MaintenanceSection() {
  return (
    <div className="space-y-6">
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Mode maintenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
            <div>
              <Label className="text-sm font-medium">Activer le mode maintenance</Label>
              <p className="text-xs text-[#6B7280]">Bloque l&apos;accès au site public (sauf admin)</p>
            </div>
            <Switch />
          </div>
          <div>
            <Label>Message affiché</Label>
            <Textarea defaultValue="Nous effectuons une maintenance. Retour bientôt !" rows={2} />
          </div>
          <div>
            <Label>IP autorisées (accès admin)</Label>
            <Input defaultValue="192.168.1.1, 10.0.0.1" className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Sauvegardes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Fréquence</Label>
              <Select defaultValue="daily">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidienne (2h)</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rétention (jours)</Label>
              <Input type="number" defaultValue={30} className="font-mono" />
            </div>
          </div>
          <div className="rounded-lg bg-[#F9FAFB] p-3 border border-[#E5E7EB]">
            <div className="text-xs text-[#6B7280]">Dernière sauvegarde</div>
            <div className="font-medium text-[#111827] mt-0.5">26 juillet 2026 à 02:00</div>
            <div className="text-xs text-[#6B7280] mt-1">Taille : 2.3 GB</div>
          </div>
          <Button variant="outline" className="border-[#E5E7EB]">Sauvegarder maintenant</Button>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle className="text-base font-display">Cache & Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB]">
            <div>
              <div className="text-sm font-medium text-[#111827]">Vider le cache</div>
              <div className="text-xs text-[#6B7280]">Libère la mémoire cache de l&apos;application</div>
            </div>
            <Button variant="outline" className="border-[#E5E7EB]">Vider</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB]">
            <div>
              <div className="text-sm font-medium text-[#111827]">Régénérer les QR codes</div>
              <div className="text-xs text-[#6B7280]">Recrée toutes les images QR en cache</div>
            </div>
            <Button variant="outline" className="border-[#E5E7EB]">Régénérer</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5E7EB]">
            <div>
              <div className="text-sm font-medium text-[#111827]">Télécharger les logs système</div>
              <div className="text-xs text-[#6B7280]">Export des logs (90 derniers jours)</div>
            </div>
            <Button variant="outline" className="border-[#E5E7EB]">Télécharger</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SaveButton({ onClick }: { onClick?: () => void }) {
  return (
    <div className="pt-2 border-t border-[#F3F4F6]">
      <Button onClick={onClick} className="bg-[#0f4382] hover:bg-[#0a3060]">
        <Save className="mr-2 size-4" />
        Enregistrer
      </Button>
    </div>
  );
}
