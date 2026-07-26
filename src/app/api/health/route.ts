// Health endpoint for Coolify / Docker healthcheck
// Returns 200 if the app process is alive. Does NOT hit the DB to avoid
// marking the container unhealthy during migrations.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      ts: new Date().toISOString(),
    },
    { status: 200 }
  );
}
