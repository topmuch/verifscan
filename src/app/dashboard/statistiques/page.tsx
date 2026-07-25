"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Layers,
  QrCode,
  Eye,
  MapPin,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Stats = {
  totals: {
    totalScans: number;
    totalProducts: number;
    totalLots: number;
    totalQrCodes: number;
  };
  timeseries: { date: string; count: number }[];
  topProducts: { id: string; name: string; count: number }[];
  topLocations: { location: string; count: number }[];
};

export default function StatistiquesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scans/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const timeseries = stats.timeseries.map((t) => ({
    ...t,
    label: new Date(t.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  const cards = [
    { label: "Scans totaux", value: stats.totals.totalScans, icon: Eye, color: "bg-emerald-600" },
    { label: "Produits", value: stats.totals.totalProducts, icon: Package, color: "bg-amber-500" },
    { label: "Lots", value: stats.totals.totalLots, icon: Layers, color: "bg-emerald-600" },
    { label: "QR Codes", value: stats.totals.totalQrCodes, icon: QrCode, color: "bg-amber-500" },
  ];

  const barColors = ["#059669", "#d97706", "#10b981", "#f59e0b", "#34d399"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="mt-1 text-gray-600">
          Suivez l'activité de vos QR codes et le comportement des consommateurs.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="vs-card-shadow border-emerald-100">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white mb-3`}>
                <c.icon className="size-5" />
              </div>
              <div className="text-3xl font-bold">{c.value}</div>
              <div className="text-sm text-gray-500">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeseries chart */}
      <Card className="vs-card-shadow border-emerald-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-600" />
            Scans des 14 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totals.totalScans === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto size-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Aucun scan pour le moment. Partagez vos QR codes pour commencer à collecter des données.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeseries} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  labelStyle={{ color: "#6b7280" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#scanGradient)"
                  name="Scans"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top products + locations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="size-5 text-amber-600" />
              Top produits scannés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#374151" }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Bar dataKey="count" name="Scans" radius={[0, 4, 4, 0]}>
                    {stats.topProducts.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="size-5 text-emerald-600" />
              Top lieux de scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topLocations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée de localisation</p>
            ) : (
              <ul className="space-y-3">
                {stats.topLocations.map((l, i) => {
                  const max = stats.topLocations[0]?.count || 1;
                  const pct = (l.count / max) * 100;
                  return (
                    <li key={l.location} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                          <span className="text-xs text-gray-400">#{i + 1}</span>
                          {l.location}
                        </span>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                          {l.count} scan{l.count > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="h-2 bg-emerald-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
