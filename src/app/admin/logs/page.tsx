"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  MoreVertical,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type LogEntry = {
  id: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  type: string;
  user: string;
  action: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  payload?: string;
  responseStatus?: number;
};

// Generate mock logs based on actual DB activity
function generateMockLogs(): LogEntry[] {
  const now = new Date();
  const logs: LogEntry[] = [];

  const types = ["Auth", "API", "Admin", "Payment", "Scan", "User"];
  const actions = [
    "Connexion réussie",
    "Création de produit",
    "Génération QR code",
    "Scan de produit",
    "Paiement reçu",
    "Modification abonnement",
    "Tentative login échouée",
    "Rate limit atteint",
    "Création de lot",
    "Export de données",
    "Changement de plan",
    "Activation fabricant",
  ];
  const users = [
    "admin@verifscan.sn",
    "sarine@verifscan.sn",
    "teranga@verifscan.sn",
    "bissap@verifscan.sn",
    "systeme",
    "bioafrica@verifscan.sn",
    "inconnu",
  ];

  for (let i = 0; i < 50; i++) {
    const t = new Date(now);
    t.setMinutes(t.getMinutes() - i * 7 - Math.floor(Math.random() * 5));
    const type = types[Math.floor(Math.random() * types.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    let level: LogEntry["level"] = "INFO";
    if (action.includes("échouée") || action.includes("Rate limit")) level = "WARNING";
    if (action.includes("échouée") && Math.random() > 0.6) level = "ERROR";
    if (action.includes("Rate limit") && Math.random() > 0.8) level = "CRITICAL";

    logs.push({
      id: `log-${i}-${t.getTime()}`,
      timestamp: t.toISOString(),
      level,
      type,
      user: users[Math.floor(Math.random() * users.length)],
      action,
      ip: `${10 + Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      endpoint: Math.random() > 0.5 ? `/api/${type.toLowerCase()}/query` : undefined,
      responseStatus: level === "ERROR" ? 500 : level === "WARNING" ? 429 : 200,
    });
  }

  return logs;
}

const LEVEL_BADGE: Record<LogEntry["level"], { bg: string; text: string; icon: any }> = {
  INFO: { bg: "bg-[#DBEAFE]", text: "text-[#1E40AF]", icon: Info },
  WARNING: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]", icon: AlertTriangle },
  ERROR: { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", icon: AlertCircle },
  CRITICAL: { bg: "bg-[#991B1B]", text: "text-white", icon: AlertCircle },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    // In real impl: fetch /api/admin/logs
    setTimeout(() => {
      setLogs(generateMockLogs());
      setLoading(false);
    }, 400);
  }, []);

  const filtered = logs.filter((l) => {
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(s) ||
        l.user.toLowerCase().includes(s) ||
        l.type.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-display">
            Logs & Audit
          </h1>
          <p className="mt-1 text-[#6B7280]">
            Historique complet des actions — {filtered.length} entrées
          </p>
        </div>
        <Button variant="outline" className="border-[#E5E7EB]">
          <Download className="mr-2 size-4" />
          Exporter logs
        </Button>
      </div>

      {/* Filtres */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
              <Input
                placeholder="Rechercher dans les logs..."
                className="pl-10 border-[#E5E7EB]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="CRITICAL">CRITICAL</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-[#E5E7EB]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Auth">Auth</SelectItem>
                <SelectItem value="API">API</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Scan">Scan</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="border-[#E5E7EB]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheck className="mx-auto size-12 text-[#D1D5DB]" />
              <h3 className="mt-4 font-semibold text-[#111827]">Aucun log trouvé</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-[#F9FAFB]">
                    <th className="py-3 px-4 font-medium">Timestamp</th>
                    <th className="py-3 px-4 font-medium">Niveau</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Utilisateur</th>
                    <th className="py-3 px-4 font-medium">Action</th>
                    <th className="py-3 px-4 font-medium">IP</th>
                    <th className="py-3 px-4 font-medium text-right">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((l) => {
                    const badge = LEVEL_BADGE[l.level];
                    const Icon = badge.icon;
                    return (
                      <tr
                        key={l.id}
                        className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer"
                        onClick={() => setSelectedLog(l)}
                      >
                        <td className="py-3 px-4 text-xs font-mono text-[#6B7280] whitespace-nowrap">
                          {new Date(l.timestamp).toLocaleString("fr-FR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${badge.bg} ${badge.text}`}>
                            <Icon className="size-3" />
                            {l.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#374151]">{l.type}</td>
                        <td className="py-3 px-4 text-xs text-[#4B5563]">{l.user}</td>
                        <td className="py-3 px-4 text-[#111827]">{l.action}</td>
                        <td className="py-3 px-4 text-xs font-mono text-[#9CA3AF]">{l.ip}</td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" className="size-8 p-0" onClick={(e) => { e.stopPropagation(); setSelectedLog(l); }}>
                            <MoreVertical className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && paginated.length > 0 && (
            <div className="px-4 py-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <p className="text-xs text-[#6B7280]">
                Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} sur {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-[#E5E7EB]"
                >
                  Précédent
                </Button>
                <span className="text-sm text-[#6B7280] px-2">
                  Page {page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-[#E5E7EB]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal détail */}
      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-5 text-[#2563EB]" />
              Détails du log
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#6B7280]">Timestamp</div>
                  <div className="text-sm font-mono text-[#111827]">
                    {new Date(selectedLog.timestamp).toLocaleString("fr-FR")}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Niveau</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${LEVEL_BADGE[selectedLog.level].bg} ${LEVEL_BADGE[selectedLog.level].text}`}>
                    {selectedLog.level}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Type</div>
                  <div className="text-sm text-[#111827]">{selectedLog.type}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Utilisateur</div>
                  <div className="text-sm text-[#111827]">{selectedLog.user}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#6B7280]">Action</div>
                <div className="text-sm font-medium text-[#111827]">{selectedLog.action}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#6B7280]">Adresse IP</div>
                  <div className="text-sm font-mono text-[#111827]">{selectedLog.ip}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6B7280]">Endpoint API</div>
                  <div className="text-sm font-mono text-[#111827]">{selectedLog.endpoint || "—"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#6B7280]">User-Agent</div>
                <div className="text-xs font-mono text-[#374151] break-all">
                  {selectedLog.userAgent || "—"}
                </div>
              </div>

              {selectedLog.responseStatus && (
                <div>
                  <div className="text-xs text-[#6B7280]">Response Status</div>
                  <Badge
                    className={
                      selectedLog.responseStatus < 300
                        ? "bg-[#D1FAE5] text-[#065F46]"
                        : selectedLog.responseStatus < 500
                        ? "bg-[#FEF3C7] text-[#92400E]"
                        : "bg-[#FEE2E2] text-[#991B1B]"
                    }
                  >
                    {selectedLog.responseStatus}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
