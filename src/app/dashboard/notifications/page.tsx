"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  AlertCircle,
  TrendingUp,
  Info,
  CreditCard,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

const ICONS: Record<string, any> = {
  recall_alert: AlertCircle,
  quota_warning: TrendingUp,
  new_scan: Bell,
  weekly_report: Info,
  payment: CreditCard,
  system: Info,
};

const COLORS: Record<string, string> = {
  recall_alert: "bg-red-100 text-red-700",
  quota_warning: "bg-amber-100 text-amber-700",
  new_scan: "bg-emerald-100 text-emerald-700",
  weekly_report: "bg-blue-100 text-blue-700",
  payment: "bg-emerald-100 text-emerald-700",
  system: "bg-gray-100 text-gray-700",
};

const TYPE_LABELS: Record<string, string> = {
  recall_alert: "Rappel de lot",
  quota_warning: "Quota",
  new_scan: "Nouveau scan",
  weekly_report: "Rapport hebdomadaire",
  payment: "Paiement",
  system: "Système",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Toutes les notifications marquées comme lues");
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="size-7 text-emerald-600" />
            Notifications
          </h1>
          <p className="mt-1 text-gray-600">
            Toutes vos alertes et notifications en un coup d'œil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={handleMarkAllRead} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCheck className="size-4 mr-2" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-100">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            filter === "all"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            filter === "unread"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      <Card className="vs-card-shadow border-emerald-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="size-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {filter === "unread"
                  ? "Aucune notification non lue. Vous êtes à jour !"
                  : "Aucune notification pour le moment."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((n) => {
                const Icon = ICONS[n.type] || Info;
                const color = COLORS[n.type] || "bg-gray-100 text-gray-700";
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 hover:bg-emerald-50/30 transition-colors",
                      !n.isRead && "bg-emerald-50/20"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", color)}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{n.title}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {TYPE_LABELS[n.type] || n.type}
                            </Badge>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTime(n.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {n.link && (
                            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                              <Link href={n.link}>Voir les détails →</Link>
                            </Button>
                          )}
                          {!n.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleMarkAsRead(n.id)}
                            >
                              <Check className="size-3 mr-1" />
                              Marquer comme lu
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
