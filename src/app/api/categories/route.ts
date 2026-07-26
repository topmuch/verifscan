import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public list of categories.
 */
export async function GET() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
    },
  });
  return NextResponse.json(categories);
}
