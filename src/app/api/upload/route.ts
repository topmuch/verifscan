import { NextResponse } from "next/server";
import path from "path";
import { getCurrentUser } from "@/lib/session";
import { storeFile } from "@/lib/uploads";

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

const ALLOWED_DOC_MIME = new Set(["application/pdf"]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/upload
 * Upload a single file (image / video / PDF).
 * Multipart form-data with field "file".
 * Optional field "kind" = 'image' | 'video' | 'pdf' to bypass auto-detection.
 *
 * Returns { url, size, type, kind }
 *
 * Files are stored in a persistent directory:
 *   - Production (Docker/Coolify): /app/data/uploads/<userId>/<filename>
 *     Served via /api/files/<userId>/<filename>
 *   - Dev: ./public/uploads/<userId>/<filename>
 *     Served directly by Next dev server at /uploads/<userId>/<filename>
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

  const kind = (formData.get("kind") as string) || null;

  let detectedKind: "image" | "video" | "pdf";
  let maxSize: number;

  if (kind === "image" || ALLOWED_IMAGE_MIME.has(file.type)) {
    detectedKind = "image";
    maxSize = MAX_IMAGE_SIZE;
    if (!ALLOWED_IMAGE_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Type image non supporté: ${file.type}. Formats: JPG, PNG, WebP, GIF, SVG.` },
        { status: 400 }
      );
    }
  } else if (kind === "video" || ALLOWED_VIDEO_MIME.has(file.type)) {
    detectedKind = "video";
    maxSize = MAX_VIDEO_SIZE;
    if (!ALLOWED_VIDEO_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Type vidéo non supporté: ${file.type}. Formats: MP4, WebM, OGG.` },
        { status: 400 }
      );
    }
  } else if (kind === "pdf" || ALLOWED_DOC_MIME.has(file.type)) {
    detectedKind = "pdf";
    maxSize = MAX_DOC_SIZE;
    if (!ALLOWED_DOC_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Type document non supporté: ${file.type}. Format accepté: PDF.` },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      {
        error: `Type non supporté: ${file.type}. Formats acceptés: JPG, PNG, WebP, GIF, SVG, MP4, WebM, OGG, PDF.`,
      },
      { status: 400 }
    );
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return NextResponse.json(
      { error: `Fichier trop volumineux (max ${maxMB} MB pour ce type).` },
      { status: 400 }
    );
  }

  // Build safe filename: <timestamp>-<sanitized-name>
  const ext = path.extname(file.name) || `.${file.type.split("/")[1] || "bin"}`;
  const safeBase = file.name
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
  const filename = `${Date.now()}-${safeBase}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { publicUrl } = await storeFile(user.id, filename, buffer);
    return NextResponse.json({
      url: publicUrl,
      size: file.size,
      type: file.type,
      kind: detectedKind,
    });
  } catch (err: any) {
    console.error("[api/upload POST] error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du fichier. Réessayez." },
      { status: 500 }
    );
  }
}
