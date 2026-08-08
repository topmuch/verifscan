import { NextResponse } from "next/server";
import { readUploadedFile, getMimeType } from "@/lib/uploads";
import path from "path";

/**
 * GET /api/files/[...path]
 *
 * Serves an uploaded file from the persistent uploads directory.
 *
 * Path structure: /api/files/<userId>/<filename>
 *
 * In production, this route replaces the previous direct static serving
 * from /public/uploads/ which broke because:
 *   1. The /app/public/ directory in the standalone Docker image is read-only at runtime
 *   2. The /app/public/uploads/ directory was not a persistent volume, so files were
 *      lost on every Coolify redeployment
 *
 * Publicly accessible (no auth) because the URL is shown on the product page
 * for consumers to download certification PDFs.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await ctx.params;

  if (!parts || parts.length < 2) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  const userId = parts[0];
  const filename = parts.slice(1).join("/");

  if (!userId || !filename) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  if (userId.includes("..") || filename.includes("..")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  try {
    const { buffer, size } = await readUploadedFile(userId, filename);
    const mime = getMimeType(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(size),
        "Content-Disposition": `inline; filename="${path.basename(filename)}"`,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    const code = err?.code || "";
    if (code === "ENOENT" || err?.message === "Invalid path") {
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }
    console.error("[api/files GET] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du fichier" },
      { status: 500 }
    );
  }
}
