import { NextResponse } from "next/server";
import { PLAN_LIST } from "@/lib/subscription";

/**
 * Returns the list of available subscription plans.
 * Public endpoint — no auth required.
 */
export async function GET() {
  return NextResponse.json({ plans: PLAN_LIST });
}
