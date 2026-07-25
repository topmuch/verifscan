import { NextResponse } from "next/server";
import { getBehavioralStats } from "@/lib/ai";

// GET /api/ai/behavioral/[productId] — analytics comportementaux d'un produit
export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const stats = await getBehavioralStats(productId);
  return NextResponse.json({ stats });
}
