import { db } from "@/lib/db";

export type StatsPeriod = "7d" | "30d" | "90d" | "1y" | "all";

/**
 * Returns the start date for a given period.
 */
export function getStartDate(period: StatsPeriod): Date | null {
  if (period === "all") return null;
  const now = new Date();
  switch (period) {
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    case "90d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      return d;
    }
    case "1y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
  }
}

/**
 * Returns the scans statistics for a fabricant.
 */
export async function getFabricantScanStats(userId: string, period: StatsPeriod = "30d") {
  const startDate = getStartDate(period);
  const where = {
    qrCode: { lot: { product: { userId } } },
    ...(startDate ? { scannedAt: { gte: startDate } } : {}),
  };

  const [totalScans, uniqueProducts, uniqueLots, deviceBreakdown] = await Promise.all([
    db.scan.count({ where }),
    db.scan.findMany({
      where,
      select: { qrCode: { select: { lot: { select: { productId: true } } } } },
      distinct: ["qrCodeId"],
    }),
    db.scan.findMany({
      where,
      select: { qrCode: { select: { lotId: true } } },
    }),
    db.scan.groupBy({
      by: ["deviceType"],
      where,
      _count: { _all: true },
    }),
  ]);

  return {
    totalScans,
    uniqueProductsCount: new Set(
      uniqueProducts.map((s) => s.qrCode.lot.productId)
    ).size,
    uniqueLotsCount: new Set(uniqueLots.map((s) => s.qrCode.lotId)).size,
    deviceBreakdown: deviceBreakdown.map((d) => ({
      deviceType: d.deviceType || "unknown",
      count: d._count._all,
    })),
  };
}

/**
 * Returns the daily scans time series for a fabricant.
 */
export async function getDailyScansTimeSeries(userId: string, period: StatsPeriod = "30d") {
  const startDate = getStartDate(period);
  const scans = await db.scan.findMany({
    where: {
      qrCode: { lot: { product: { userId } } },
      ...(startDate ? { scannedAt: { gte: startDate } } : {}),
    },
    select: { scannedAt: true },
    orderBy: { scannedAt: "asc" },
  });

  // Group by day
  const byDay = new Map<string, number>();
  for (const scan of scans) {
    const d = scan.scannedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }

  // Fill gaps and format
  const result: { date: string; label: string; count: number }[] = [];
  const endDate = new Date();
  const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      date: key,
      label,
      count: byDay.get(key) || 0,
    });
  }

  return result;
}

/**
 * Returns the top products by scan count for a fabricant.
 */
export async function getTopProducts(userId: string, period: StatsPeriod = "30d", limit: number = 5) {
  const startDate = getStartDate(period);
  const scans = await db.scan.findMany({
    where: {
      qrCode: { lot: { product: { userId } } },
      ...(startDate ? { scannedAt: { gte: startDate } } : {}),
    },
    select: {
      qrCode: {
        select: {
          lot: {
            select: {
              product: {
                select: { id: true, name: true, brand: true, photoUrl: true },
              },
            },
          },
        },
      },
    },
  });

  const byProduct = new Map<string, { product: any; count: number }>();
  for (const scan of scans) {
    const p = scan.qrCode.lot.product;
    const existing = byProduct.get(p.id);
    if (existing) {
      existing.count++;
    } else {
      byProduct.set(p.id, { product: p, count: 1 });
    }
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Returns the geographic distribution of scans for a fabricant.
 */
export async function getGeographicStats(userId: string, period: StatsPeriod = "30d") {
  const startDate = getStartDate(period);
  const scans = await db.scan.findMany({
    where: {
      qrCode: { lot: { product: { userId } } },
      ...(startDate ? { scannedAt: { gte: startDate } } : {}),
    },
    select: { country: true, city: true },
  });

  const byCountry = new Map<string, number>();
  const byCity = new Map<string, number>();
  for (const scan of scans) {
    if (scan.country) {
      byCountry.set(scan.country, (byCountry.get(scan.country) || 0) + 1);
    }
    if (scan.city) {
      byCity.set(scan.city, (byCity.get(scan.city) || 0) + 1);
    }
  }

  return {
    countries: Array.from(byCountry.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    cities: Array.from(byCity.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

/**
 * Returns the scans grouped by hour of day (helps identify peak activity).
 */
export async function getHourlyStats(userId: string, period: StatsPeriod = "30d") {
  const startDate = getStartDate(period);
  const scans = await db.scan.findMany({
    where: {
      qrCode: { lot: { product: { userId } } },
      ...(startDate ? { scannedAt: { gte: startDate } } : {}),
    },
    select: { scannedAt: true },
  });

  const byHour = new Array(24).fill(0);
  for (const scan of scans) {
    byHour[scan.scannedAt.getHours()]++;
  }

  return byHour.map((count, hour) => ({ hour, count }));
}

/**
 * Returns the peak activity (hour, day) for a fabricant.
 */
export async function getPeakActivity(userId: string, period: StatsPeriod = "30d") {
  const startDate = getStartDate(period);
  const scans = await db.scan.findMany({
    where: {
      qrCode: { lot: { product: { userId } } },
      ...(startDate ? { scannedAt: { gte: startDate } } : {}),
    },
    select: { scannedAt: true },
  });

  if (scans.length === 0) {
    return { peakHour: null, peakDay: null, todayCount: 0 };
  }

  const byHour = new Array(24).fill(0);
  const byDay = new Map<string, number>(); // 0 = Sunday, 6 = Saturday
  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let todayCount = 0;

  for (const scan of scans) {
    byHour[scan.scannedAt.getHours()]++;
    const day = String(scan.scannedAt.getDay());
    byDay.set(day, (byDay.get(day) || 0) + 1);
    const scanDay = new Date(scan.scannedAt);
    scanDay.setHours(0, 0, 0, 0);
    if (scanDay.getTime() === today.getTime()) todayCount++;
  }

  const peakHour = byHour.indexOf(Math.max(...byHour));
  const peakDayNum = Number(
    Array.from(byDay.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 0
  );

  return {
    peakHour,
    peakDay: dayNames[peakDayNum],
    todayCount,
  };
}

// === Stats SuperAdmin ===

/**
 * Returns global platform statistics for the SuperAdmin.
 */
export async function getGlobalStats(period: StatsPeriod = "30d") {
  const startDate = getStartDate(period);

  const [totalUsers, totalFabricants, totalProducts, totalLots, totalQrCodes, totalScans] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "fabricant", isActive: true } }),
    db.product.count(),
    db.lot.count(),
    db.qRCode.count(),
    db.scan.count({
      ...(startDate ? { where: { scannedAt: { gte: startDate } } } : {}),
    }),
  ]);

  // Top fabricants by scan count
  const scansByUser = await db.scan.groupBy({
    by: ["userId"],
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const topFabricants = await Promise.all(
    scansByUser
      .filter((s) => s.userId !== null)
      .map(async (s) => {
        const user = await db.user.findUnique({
          where: { id: s.userId! },
          select: { companyName: true, email: true },
        });
        return {
          userId: s.userId!,
          companyName: user?.companyName || "N/A",
          email: user?.email || "",
          scanCount: s._count._all,
        };
      })
  );

  return {
    totalUsers,
    totalFabricants,
    totalProducts,
    totalLots,
    totalQrCodes,
    totalScans,
    topFabricants,
  };
}
