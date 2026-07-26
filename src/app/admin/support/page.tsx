"use client";

import { useState } from "react";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Send,
  Paperclip,
  User,
  Clock,
  Tag,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Ticket = {
  id: string;
  subject: string;
  requester: string;
  company: string;
  priority: "basse" | "normale" | "haute" | "urgente";
  status: "ouvert" | "en_cours" | "en_attente" | "resolu";
  assignedTo: string | null;
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
  en_attente: { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", label: "En attente" },
  resolu: { bg: "bg-[#DCFCE7]", text: "text-[#065F46]", label: "Résolu" },
};

const mockTickets: Ticket[] = [
  {
    id: "TKT-2026-0145",
    subject: "Problème avec la génération de QR codes",
    requester: "Marième Diop",
    company: "Jus de Bissap Sénégal",
    priority: "haute",
    status: "en_cours",
    assignedTo: "Admin",
    createdAt: "2026-07-25T10:30:00Z",
    lastReply: "2026-07-26T08:15:00Z",
    messages: [
      {
        id: "m1",
        author: "client",
        authorName: "Marième Diop",
        content: "Bonjour, je n'arrive plus à générer de QR codes depuis ce matin. J'obtiens une erreur 500.",
        timestamp: "2026-07-25T10:30:00Z",
      },
      {
        id: "m2",
        author: "admin",
        authorName: "Support VerifScan",
        content: "Bonjour Marième, nous avons identifié le problème. Une mise à jour est en cours. Nous revenons vers vous dans l'heure.",
        timestamp: "2026-07-25T11:00:00Z",
      },
      {
        id: "m3",
        author: "client",
        authorName: "Marième Diop",
        content: "Merci, j'attends votre retour. C'est bloquant pour ma production d'aujourd'hui.",
        timestamp: "2026-07-26T08:15:00Z",
      },
    ],
  },
  {
    id: "TKT-2026-0144",
    subject: "Demande de changement de plan vers Enterprise",
    requester: "Ibrahima Ndiaye",
    company: "Téranga Foods",
    priority: "normale",
    status: "ouvert",
    assignedTo: null,
    createdAt: "2026-07-26T14:00:00Z",
    lastReply: "2026-07-26T14:00:00Z",
    messages: [
      {
        id: "m1",
        author: "client",
        authorName: "Ibrahima Ndiaye",
        content: "Bonjour, nous souhaitons passer au plan Enterprise. Pouvez-vous me contacter ?",
        timestamp: "2026-07-26T14:00:00Z",
      },
    ],
  },
  {
    id: "TKT-2026-0143",
    subject: "Question sur l'export de données",
    requester: "Awa Sow",
    company: "BioAfrica Cosmetics",
    priority: "basse",
    status: "resolu",
    assignedTo: "Admin",
    createdAt: "2026-07-22T09:00:00Z",
    lastReply: "2026-07-23T16:00:00Z",
    messages: [
      {
        id: "m1",
        author: "client",
        authorName: "Awa Sow",
        content: "Comment puis-je exporter tous mes scans en CSV ?",
        timestamp: "2026-07-22T09:00:00Z",
      },
      {
        id: "m2",
        author: "admin",
        authorName: "Support VerifScan",
        content: "Bonjour Awa, vous pouvez exporter depuis le menu Statistiques > Export. Le format CSV est disponible.",
        timestamp: "2026-07-23T16:00:00Z",
      },
    ],
  },
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [activeTab, setActiveTab] = useState<"ouverts" | "en_cours" | "resolus" | "tous">("ouverts");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(mockTickets[0]?.id || null);
  const [reply, setReply] = useState("");

  const filtered = tickets.filter((t) => {
    if (activeTab === "ouverts" && t.status !== "ouvert" && t.status !== "en_cours") return false;
    if (activeTab === "en_cours" && t.status !== "en_cours") return false;
    if (activeTab === "resolus" && t.status !== "resolu") return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(s) ||
        t.requester.toLowerCase().includes(s) ||
        t.company.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const selected = tickets.find((t) => t.id === selectedId);

  function sendReply() {
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
                  author: "admin",
                  authorName: "Support VerifScan",
                  content: reply,
                  timestamp: new Date().toISOString(),
                },
              ],
              lastReply: new Date().toISOString(),
              status: "en_cours",
            }
          : t
      )
    );
    setReply("");
    toast.success("Réponse envoyée");
  }

  function changeStatus(status: Ticket["status"]) {
    if (!selected) return;
    setTickets((list) =>
      list.map((t) => (t.id === selected.id ? { ...t, status } : t))
    );
    toast.success(`Statut changé : ${STATUS_BADGE[status].label}`);
  }

  function changePriority(priority: Ticket["priority"]) {
    if (!selected) return;
    setTickets((list) =>
      list.map((t) => (t.id === selected.id ? { ...t, priority } : t))
    );
    toast.success(`Priorité changée : ${PRIORITY_BADGE[priority].label}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Support Client
          </h1>
          <p className="mt-1 text-[#6B7280]">
            {tickets.filter((t) => t.status === "ouvert").length} tickets ouverts
          </p>
        </div>
        <Button className="bg-[#0f4382] hover:bg-[#0a3060]">
          <Plus className="mr-2 size-4" />
          Créer un ticket interne
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "ouverts", label: "Ouverts", count: tickets.filter((t) => t.status === "ouvert").length },
          { key: "en_cours", label: "En cours", count: tickets.filter((t) => t.status === "en_cours").length },
          { key: "resolus", label: "Résolus", count: tickets.filter((t) => t.status === "resolu").length },
          { key: "tous", label: "Tous", count: tickets.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-[#0f4382] text-white"
                : "bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F9FAFB]"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
        {/* Liste */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
            <Input
              placeholder="Rechercher un ticket..."
              className="pl-10 border-[#E5E7EB]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto vs-scroll">
            {filtered.length === 0 ? (
              <Card className="border-[#E5E7EB]">
                <CardContent className="p-8 text-center">
                  <Ticket className="mx-auto size-10 text-[#D1D5DB]" />
                  <p className="mt-2 text-sm text-[#6B7280]">Aucun ticket</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((t) => {
                const prio = PRIORITY_BADGE[t.priority];
                const stat = STATUS_BADGE[t.status];
                return (
                  <Card
                    key={t.id}
                    className={`border cursor-pointer transition-all ${
                      selectedId === t.id
                        ? "border-[#0f4382] vs-card-shadow"
                        : "border-[#E5E7EB] hover:border-[#9CA3AF]"
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
                      <h3 className="font-semibold text-[#111827] text-sm leading-snug">
                        {t.subject}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7280]">
                        <User className="size-3" />
                        <span className="truncate">{t.requester} · {t.company}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${stat.bg} ${stat.text}`}>
                          {stat.label}
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          {new Date(t.lastReply).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Détail */}
        {selected ? (
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-0">
              {/* Header ticket */}
              <div className="p-5 border-b border-[#E5E7EB]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs font-mono text-[#9CA3AF]">#{selected.id}</div>
                    <h2 className="font-display text-lg font-bold text-[#111827] mt-0.5">
                      {selected.subject}
                    </h2>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1 text-xs text-[#9CA3AF] uppercase">Statut</div>
                      {(["ouvert", "en_cours", "en_attente", "resolu"] as const).map((s) => (
                        <DropdownMenuItem key={s} onClick={() => changeStatus(s)} className="cursor-pointer">
                          → {STATUS_BADGE[s].label}
                        </DropdownMenuItem>
                      ))}
                      <div className="px-2 py-1 text-xs text-[#9CA3AF] uppercase mt-1">Priorité</div>
                      {(["basse", "normale", "haute", "urgente"] as const).map((p) => (
                        <DropdownMenuItem key={p} onClick={() => changePriority(p)} className="cursor-pointer">
                          → {PRIORITY_BADGE[p].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-[#4B5563]">
                    <User className="size-4" />
                    {selected.requester} · {selected.company}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${PRIORITY_BADGE[selected.priority].bg} ${PRIORITY_BADGE[selected.priority].text}`}>
                    {PRIORITY_BADGE[selected.priority].label}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_BADGE[selected.status].bg} ${STATUS_BADGE[selected.status].text}`}>
                    {STATUS_BADGE[selected.status].label}
                  </span>
                </div>
              </div>

              {/* Conversation */}
              <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto vs-scroll bg-[#F9FAFB]">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.author === "admin" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`size-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                        m.author === "admin"
                          ? "bg-[#0f4382]"
                          : "bg-gradient-to-br from-[#2ebd5a] to-[#0f4382]"
                      }`}
                    >
                      {m.authorName.charAt(0)}
                    </div>
                    <div className={`max-w-[75%] ${m.author === "admin" ? "items-end" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#111827]">{m.authorName}</span>
                        <span className="text-xs text-[#9CA3AF]">
                          {new Date(m.timestamp).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        className={`rounded-2xl p-3 text-sm ${
                          m.author === "admin"
                            ? "bg-[#0f4382] text-white rounded-tr-sm"
                            : "bg-white border border-[#E5E7EB] text-[#111827] rounded-tl-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zone réponse */}
              <div className="p-5 border-t border-[#E5E7EB]">
                <Textarea
                  placeholder="Écrire une réponse..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  className="resize-none border-[#E5E7EB]"
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-[#6B7280]">
                      <Paperclip className="mr-1 size-4" />
                      Joindre
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#E5E7EB]"
                      onClick={() => {
                        sendReply();
                        changeStatus("resolu");
                      }}
                    >
                      Envoyer & fermer
                    </Button>
                    <Button
                      size="sm"
                      onClick={sendReply}
                      disabled={!reply.trim()}
                      className="bg-[#0f4382] hover:bg-[#0a3060]"
                    >
                      <Send className="mr-1 size-4" />
                      Envoyer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#E5E7EB]">
            <CardContent className="p-12 text-center">
              <Ticket className="mx-auto size-12 text-[#D1D5DB]" />
              <p className="mt-3 text-sm text-[#6B7280]">Sélectionnez un ticket pour voir la conversation</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
