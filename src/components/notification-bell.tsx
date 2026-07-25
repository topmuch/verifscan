"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, AlertCircle, TrendingUp, Info, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className="relative p-2 rounded-full hover:bg-emerald-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-emerald-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-100 bg-emerald-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700 text-[10px]">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={fetchNotifications}
                disabled={loading}
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleMarkAllRead}
                >
                  <Check className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto vs-scroll">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Bell className="size-8 mx-auto mb-2 text-gray-300" />
                Aucune notification
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = ICONS[n.type] || Info;
                const color = COLORS[n.type] || "bg-gray-100 text-gray-700";
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b border-gray-50 hover:bg-emerald-50/30 transition-colors cursor-pointer",
                      !n.isRead && "bg-emerald-50/20"
                    )}
                    onClick={() => {
                      if (!n.isRead) handleMarkAsRead(n.id);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", color)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10px] text-gray-400">
                            {formatTime(n.createdAt)}
                          </p>
                          {n.link && (
                            <Link
                              href={n.link}
                              className="text-[11px] text-emerald-700 hover:underline font-medium"
                              onClick={() => setOpen(false)}
                            >
                              Voir →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-emerald-100 p-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-xs"
            >
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
                Voir toutes les notifications
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
