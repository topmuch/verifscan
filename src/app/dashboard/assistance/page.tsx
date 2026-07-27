"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/* ===================================================================
   Client dashboard — Assistance
   --------------------------------------------------------------------
   This tab lets the fabricant:
     1. View their existing support tickets
     2. Reply to an open ticket
     3. Open a new ticket (which appears in /admin/support too)
     4. Reach the support team via email / phone (quick links)

   The tickets are stored locally in this prototype (the same mock
   dataset as /admin/support). In a future iteration we'll persist
   them via /api/support/tickets — the schema is already drafted.
   =================================================================== */

type Ticket = {
  id: string;
  subject: string;
  priority: "basse" | "normale" | "haute" | "urgente";
  status: "ouvert" | "en_cours" | "resolu";
  createdAt: string;
  lastReply: string;
  messages: Array<{
    id: string;
    author: "client" | "admin";
    authorName: string;
    content: string;
    timestamp: string;
  }>;
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  basse: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "Basse" },
  normale: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", label: "Normale" },
  haute: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "Haute" },
  urgente: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", label: "Urgente" },
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ouvert: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", label: "Ouvert" },
  en_cours: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", label: "En cours" },
  resolu: { bg: "bg-[#DCFCE7]", text: "text-[#065F46]", label: "Résolu" },
};

// Initial mock tickets — client-side view
const initialTickets: Ticket[] = [
  {
    id: "TKT-2026-0201",
    subject: "Comment générer des QR codes en masse ?",
    priority: "normale",
    status: "resolu",
    createdAt: "2026-07-15T09:00:00Z",
    lastReply: "2026-07-15T14:30:00Z",
    messages: [
      {
        id: "m1",
        author: "client",
        authorName: "Vous",
        content: "Bonjour, je dois générer 500 QR codes pour mes lots. Est-il possible de le faire en une seule opération ?",
        timestamp: "2026-07-15T09:00:00Z",
      },
      {
        id: "m2",
        author: "admin",
        authorName: "Support VerifScan",
        content: "Bonjour ! Oui, rendez-vous dans QR Codes → Génération en masse. Vous pourrez créer jusqu'à 1000 QR codes en une fois à partir d'un fichier CSV de vos lots.",
        timestamp: "2026-07-15T14:30:00Z",
      },
    ],
  },
  {
    id: "TKT-2026-0218",
    subject: "Problème d'upload de photo produit",
    priority: "haute",
    status: "en_cours",
    createdAt: "2026-07-22T16:45:00Z",
    lastReply: "2026-07-23T08:15:00Z",
    messages: [
      {
        id: "m1",
        author: "client",
        authorName: "Vous",
        content: "Lorsque j'upload une photo pour mon produit, j'obtiens une erreur 'Taille maximale dépassée'. La photo fait 3MB.",
        timestamp: "2026-07-22T16:45:00Z",
      },
      {
        id: "m2",
        author: "admin",
        authorName: "Support VerifScan",
        content: "Bonjour, la taille maximale est de 2MB. Vous pouvez compresser votre image via un outil comme tinypng.com. Nous travaillons à augmenter la limite à 5MB dans la prochaine version.",
        timestamp: "2026-07-23T08:15:00Z",
      },
    ],
  },
];

export default function AssistancePage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedId, setSelectedId] = useState<string | null>(initialTickets[0]?.id || null);
  const [reply, setReply] = useState("");

  // New ticket modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    priority: "normale" as Ticket["priority"],
    content: "",
  });

  const selected = tickets.find((t) => t.id === selectedId);

  const sendReply = useCallback(() => {
    if (!reply.trim() || !selected) return;
    setTickets((list) =>
      list.map((t) =>
        t.id === selected.id
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  id: `m${t.messages.length + 1}`,
                  author: "client" as const,
                  authorName: "Vous",
                  content: reply,
                  timestamp: new Date().toISOString(),
                },
              ],
              lastReply: new Date().toISOString(),
              status: "ouvert" as const,
            }
          : t
      )
    );
    setReply("");
    toast.success("Message envoyé au support");
  }, [reply, selected]);

  function submitNewTicket() {
    if (!newTicket.subject.trim() || !newTicket.content.trim()) {
      toast.error("Sujet et description sont obligatoires");
      return;
    }
    const id = `TKT-2026-${String(220 + tickets.length).padStart(4, "0")}`;
    const now = new Date().toISOString();
    const created: Ticket = {
      id,
      subject: newTicket.subject.trim(),
      priority: newTicket.priority,
      status: "ouvert",
      createdAt: now,
      lastReply: now,
      messages: [
        {
          id: "m1",
          author: "client",
          authorName: "Vous",
          content: newTicket.content.trim(),
          timestamp: now,
        },
      ],
    };
    setTickets((list) => [created, ...list]);
    setSelectedId(created.id);
    setShowCreateModal(false);
    setNewTicket({ subject: "", priority: "normale", content: "" });
    toast.success(`Ticket ${id} créé — le support vous répondra sous 24h`);
  }

  const openTickets = tickets.filter((t) => t.status !== "resolu").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display flex items-center gap-2">
            <LifeBuoy className="size-7 text-[#2ebd5a]" />
            Assistance
          </h1>
          <p className="mt-1 text-[#6B7280]">
            {openTickets} ticket{openTickets > 1 ? "s" : ""} en cours · Réponse moyenne sous 24h
          </p>
        </div>
        <Button
          className="bg-[#2ebd5a] hover:bg-[#1f8a42]"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="mr-2 size-4" />
          Nouveau ticket
        </Button>
      </div>

      {/* Quick contact cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#2ebd5a]">
              <Mail className="size-5" />
            </div>
            <div>
              <div className="text-xs text-[#6B7280]">Email support</div>
              <a
                href="mailto:support@verifscan.sn"
                className="text-sm font-semibold text-[#0f4382] hover:underline"
              >
                support@verifscan.sn
              </a>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-[#0f4382]">
              <Phone className="size-5" />
            </div>
            <div>
              <div className="text-xs text-[#6B7280]">Hotline (9h-18h)</div>
              <a
                href="tel:+221770000000"
                className="text-sm font-semibold text-[#0f4382] hover:underline"
              >
                +221 77 000 00 00
              </a>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#F59E0B]">
              <ExternalLink className="size-5" />
            </div>
            <div>
              <div className="text-xs text-[#6B7280]">Centre d&apos;aide</div>
              <a
                href="/contact"
                className="text-sm font-semibold text-[#0f4382] hover:underline"
              >
                FAQ & guides
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets layout */}
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        {/* Tickets list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">
            Mes tickets
          </h2>
          {tickets.length === 0 ? (
            <Card className="border-[#E5E7EB]">
              <CardContent className="p-8 text-center">
                <MessageSquare className="mx-auto size-10 text-[#D1D5DB]" />
                <p className="mt-2 text-sm text-[#6B7280]">Aucun ticket pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((t) => {
              const prio = PRIORITY_BADGE[t.priority];
              const stat = STATUS_BADGE[t.status];
              const isSelected = selectedId === t.id;
              return (
                <Card
                  key={t.id}
                  className={`border cursor-pointer transition-all ${
                    isSelected ? "border-[#2ebd5a] vs-card-shadow" : "border-[#E5E7EB] hover:border-[#9CA3AF]"
                  }`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-mono text-[#9CA3AF]">#{t.id}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${prio.bg} ${prio.text}`}>
                        {prio.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#111827] text-sm leading-snug">{t.subject}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${stat.bg} ${stat.text}`}>
                        {stat.label}
                      </span>
                      <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(t.lastReply).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Conversation panel */}
        {selected ? (
          <Card className="border-[#E5E7EB] flex flex-col">
            <CardHeader className="border-b border-[#E5E7EB]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono text-[#9CA3AF]">#{selected.id}</div>
                  <CardTitle className="text-base font-display mt-1">{selected.subject}</CardTitle>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={`${PRIORITY_BADGE[selected.priority].bg} ${PRIORITY_BADGE[selected.priority].text} hover:none`}>
                      {PRIORITY_BADGE[selected.priority].label}
                    </Badge>
                    <Badge className={`${STATUS_BADGE[selected.status].bg} ${STATUS_BADGE[selected.status].text} hover:none`}>
                      {STATUS_BADGE[selected.status].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto vs-scroll p-6 space-y-4 max-h-[400px]">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.author === "client" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 ${
                        m.author === "client"
                          ? "bg-[#2ebd5a] text-white rounded-br-md"
                          : "bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] rounded-bl-md"
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${m.author === "client" ? "text-white/80" : "text-[#6B7280]"}`}>
                        {m.authorName}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      <div className={`text-[10px] mt-1 ${m.author === "client" ? "text-white/70" : "text-[#9CA3AF]"}`}>
                        {new Date(m.timestamp).toLocaleString("fr-FR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selected.status !== "resolu" && (
                <div className="border-t border-[#E5E7EB] p-4 flex items-end gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Votre message au support..."
                    rows={2}
                    className="resize-none border-[#E5E7EB]"
                  />
                  <Button
                    onClick={sendReply}
                    disabled={!reply.trim()}
                    className="bg-[#2ebd5a] hover:bg-[#1f8a42]"
                  >
                    <Send className="mr-1 size-4" />
                    Envoyer
                  </Button>
                </div>
              )}
              {selected.status === "resolu" && (
                <div className="border-t border-[#E5E7EB] p-4 flex items-center justify-center gap-2 text-sm text-[#065F46] bg-[#DCFCE7]/30">
                  <CheckCircle2 className="size-4" />
                  Ce ticket est résolu. Vous pouvez en ouvrir un nouveau si nécessaire.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-12 text-center">
              <AlertCircle className="mx-auto size-12 text-[#D1D5DB]" />
              <p className="mt-3 text-sm text-[#6B7280]">Sélectionnez un ticket pour voir la conversation</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New ticket modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-semibold text-[#111827]">
                  Nouveau ticket de support
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Notre équipe vous répond sous 24h ouvrées.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B7280] hover:text-[#111827] p-1 rounded hover:bg-[#F9FAFB]"
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto vs-scroll">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#111827]">Sujet *</label>
                  <Input
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Ex : Problème de génération QR"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#111827]">Priorité</label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as Ticket["priority"] })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basse">Basse</SelectItem>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827]">Description *</label>
                <Textarea
                  value={newTicket.content}
                  onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
                  rows={6}
                  placeholder="Décrivez votre problème ou votre demande en détail..."
                  className="mt-1"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="border-[#E5E7EB]"
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </Button>
              <Button
                className="bg-[#2ebd5a] hover:bg-[#1f8a42]"
                onClick={submitNewTicket}
              >
                <Plus className="mr-1 size-4" />
                Créer le ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
