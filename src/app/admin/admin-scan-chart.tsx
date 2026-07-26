"use client";

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
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const CHART_COLORS = {
  blue: "#2563EB",
  blueLight: "#3B82F6",
  green: "#10B981",
  orange: "#F59E0B",
  red: "#EF4444",
  gray: "#9CA3AF",
};

export function AdminScanChart({
  data,
}: {
  data: { date: string; label: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="adminScanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
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
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          fill="url(#adminScanGradient)"
          name="Scans"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AdminInscriptionsChart({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="month"
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
        />
        <Bar
          dataKey="count"
          fill={CHART_COLORS.blue}
          radius={[6, 6, 0, 0]}
          name="Inscriptions"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AdminPlanDonut({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
          formatter={(v: number) => [`${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, ""]}
        />
        <Legend
          iconType="circle"
          formatter={(value, entry) => (
            <span style={{ color: "#374151", fontSize: 12, marginLeft: 4 }}>
              {value} ({entry?.payload?.value || 0})
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AdminTopFabricantsChart({
  data,
}: {
  data: { companyName: string; scanCount: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
      >
        <defs>
          <linearGradient id="topFabGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={CHART_COLORS.green} />
            <stop offset="100%" stopColor={CHART_COLORS.blue} />
          </linearGradient>
        </defs>
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
          dataKey="companyName"
          tick={{ fontSize: 11, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
        />
        <Bar
          dataKey="scanCount"
          fill="url(#topFabGradient)"
          radius={[0, 6, 6, 0]}
          name="Scans"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AdminRevenueChart({
  data,
}: {
  data: { month: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
          formatter={(v: number) => [`${v.toLocaleString("fr-FR")} FCFA`, "Revenu"]}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS.green}
          strokeWidth={3}
          dot={{ fill: CHART_COLORS.green, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
