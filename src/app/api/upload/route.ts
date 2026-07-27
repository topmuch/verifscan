import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/session";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload
 * Upload a single image (logo fabricant or product photo).
 * Multipart form-data with field "file".
 * Returns { url: "/uploads/<filename>" }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Type non supporté: ${file.type}. Formats acceptés: JPG, PNG, WebP, GIF, SVG.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Fichier trop volumineux (max 5 MB).` },
      { status: 400 }
    );
  }

  // Build safe filename: <userId>/<timestamp>-<sanitized-name>
  const ext = path.extname(file.name) || `.${file.type.split("/")[1] || "bin"}`;
  const safeBase = file.name
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
  const filename = `${Date.now()}-${safeBase}${ext}`;
  const userDir = path.join(process.cwd(), "public", "uploads", user.id);
  await mkdir(userDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fullPath = path.join(userDir, filename);
  await writeFile(fullPath, buffer);

  const publicUrl = `/uploads/${user.id}/${filename}`;
  return NextResponse.json({ url: publicUrl, size: file.size, type: file.type });
}
