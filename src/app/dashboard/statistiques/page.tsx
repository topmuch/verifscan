"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Package,
  Layers,
  QrCode,
  Eye,
  MapPin,
  BarChart3,
  Smartphone,
  Globe2,
  Clock,
  Calendar,
  Flame,
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
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d" | "1y" | "all";

type Stats = {
  overview: {
    totalScans: number;
    uniqueProductsCount: number;
    uniqueLotsCount: number;
    deviceBreakdown: { deviceType: string; count: number }[];
  };
  timeSeries: { date: string; label: string; count: number }[];
  topProducts: { product: { id: string; name: string; brand: string; photoUrl: string | null }; count: number }[];
  geo: {
    countries: { name: string; count: number }[];
    cities: { name: string; count: number }[];
  };
  hourly: { hour: number; count: number }[];
  peak: { peakHour: number | null; peakDay: string | null; todayCount: number };
};

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 jours",
  "30d": "30 jours",
  "90d": "90 jours",
  "1y": "1 an",
  all: "Tout",
};

const DEVICE_COLORS: Record<string, string> = {
  mobile: "#059669",
  tablet: "#d97706",
  desktop: "#3b82f6",
  unknown: "#9ca3af",
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Mobile",
  tablet: "Tablette",
  desktop: "Ordinateur",
  unknown: "Inconnu",
};

export default function StatistiquesPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchStats = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/scans?period=${p}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

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

  const { overview, timeSeries, topProducts, geo, hourly, peak } = stats;
  const hasData = overview.totalScans > 0;

  // Aggregate hourly data into 4-hour buckets for clearer display
  const hourlyBuckets = Array.from({ length: 6 }, (_, i) => {
    const start = i * 4;
    const end = start + 3;
    const total = hourly
      .filter((h) => h.hour >= start && h.hour <= end)
      .reduce((sum, h) => sum + h.count, 0);
    return {
      label: `${String(start).padStart(2, "0")}h-${String(end).padStart(2, "0")}h`,
      count: total,
    };
  });

  const cards = [
    {
      label: "Scans totaux",
      value: overview.totalScans,
      icon: Eye,
      color: "bg-emerald-600",
      sub: `${peak.todayCount} aujourd'hui`,
    },
    {
      label: "Produits scannés",
      value: overview.uniqueProductsCount,
      icon: Package,
      color: "bg-amber-500",
      sub: "Produits uniques",
    },
    {
      label: "Lots actifs",
      value: overview.uniqueLotsCount,
      icon: Layers,
      color: "bg-emerald-600",
      sub: "Lots scannés",
    },
    {
      label: peak.peakHour !== null ? `Pic à ${String(peak.peakHour).padStart(2, "0")}h` : "Pic d'activité",
      value: peak.peakDay || "—",
      icon: Flame,
      color: "bg-amber-500",
      sub: "Jour le plus actif",
      isText: true,
    },
  ];

  const barColors = ["#059669", "#d97706", "#2ebd5a", "#f59e0b", "#34d399"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Statistiques avancées</h1>
          <p className="mt-1 text-gray-600">
            Suivez l'activité de vos QR codes et le comportement des consommateurs.
          </p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 bg-white border border-emerald-100 rounded-lg">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className={cn(
                "h-8 text-xs",
                period === p && "bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="vs-card-shadow border-emerald-100">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center text-white mb-3`}>
                <c.icon className="size-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {c.isText ? c.value : c.value.toLocaleString("fr-FR")}
              </div>
              <div className="text-sm text-gray-500">{c.label}</div>
              {c.sub && <div className="text-xs text-emerald-700 mt-1">{c.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time series chart */}
      <Card className="vs-card-shadow border-emerald-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-600" />
            Évolution des scans
            <Badge variant="outline" className="ml-2 border-emerald-200 text-emerald-700">
              {PERIOD_LABELS[period]}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto size-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Aucun scan pour le moment. Partagez vos QR codes pour commencer à collecter des données.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={20}
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="size-5 text-amber-600" />
              Top 5 produits scannés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts.map((p) => ({ name: p.product.name, count: p.count }))} layout="vertical" margin={{ left: 0, right: 20 }}>
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
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Device breakdown */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="size-5 text-emerald-600" />
              Répartition par appareil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.deviceBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={overview.deviceBreakdown.map((d) => ({
                        name: DEVICE_LABELS[d.deviceType] || d.deviceType,
                        value: d.count,
                        color: DEVICE_COLORS[d.deviceType] || "#9ca3af",
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {overview.deviceBreakdown.map((d, i) => (
                        <Cell key={i} fill={DEVICE_COLORS[d.deviceType] || "#9ca3af"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex-1 space-y-2">
                  {overview.deviceBreakdown.map((d) => {
                    const total = overview.deviceBreakdown.reduce((s, x) => s + x.count, 0);
                    const pct = Math.round((d.count / total) * 100);
                    return (
                      <li key={d.deviceType} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm"
                            style={{ background: DEVICE_COLORS[d.deviceType] || "#9ca3af" }}
                          />
                          <span className="font-medium text-gray-700">
                            {DEVICE_LABELS[d.deviceType] || d.deviceType}
                          </span>
                        </span>
                        <span className="text-gray-600">
                          {d.count} <span className="text-gray-400">({pct}%)</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic stats */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe2 className="size-5 text-emerald-600" />
              Répartition géographique
            </CardTitle>
          </CardHeader>
          <CardContent>
            {geo.countries.length === 0 && geo.cities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée de localisation</p>
            ) : (
              <div className="space-y-4">
                {geo.countries.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pays</p>
                    <ul className="space-y-2">
                      {geo.countries.slice(0, 5).map((c) => {
                        const max = geo.countries[0]?.count || 1;
                        const pct = (c.count / max) * 100;
                        return (
                          <li key={c.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">{c.name}</span>
                              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                                {c.count}
                              </Badge>
                            </div>
                            <div className="h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {geo.cities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Villes</p>
                    <ul className="space-y-2">
                      {geo.cities.slice(0, 5).map((c) => {
                        const max = geo.cities[0]?.count || 1;
                        const pct = (c.count / max) * 100;
                        return (
                          <li key={c.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900 flex items-center gap-1.5">
                                <MapPin className="size-3 text-amber-500" />
                                {c.name}
                              </span>
                              <Badge variant="outline" className="border-amber-200 text-amber-700">
                                {c.count}
                              </Badge>
                            </div>
                            <div className="h-1.5 bg-amber-50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly distribution */}
        <Card className="vs-card-shadow border-emerald-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="size-5 text-amber-600" />
              Répartition par heure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.totalScans === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyBuckets} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
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
                  />
                  <Bar dataKey="count" name="Scans" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
