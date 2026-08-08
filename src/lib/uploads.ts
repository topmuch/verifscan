import { mkdir, writeFile, readFile, stat } from "fs/promises";
import path from "path";

/**
 * Persistent uploads directory.
 *
 * In production (Docker/Coolify), we write to /app/data/uploads which is mounted
 * as a persistent volume — so files survive redeployments.
 *
 * In dev, we fall back to ./public/uploads so files are still directly served
 * by the Next.js dev server for convenience.
 */
const UPLOADS_ROOT =
  process.env.UPLOADS_DIR ||
  (process.env.NODE_ENV === "production" ? "/app/data/uploads" : path.join(process.cwd(), "public", "uploads"));

/**
 * Returns the absolute filesystem path where uploaded files live.
 */
export function getUploadsRoot(): string {
  return UPLOADS_ROOT;
}

/**
 * Returns true if we're in production (files served via /api/files/...)
 * vs dev (files served directly from /public/uploads/...).
 */
export function useApiFileRoute(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Builds the public URL used to access an uploaded file.
 *
 * - Production: /api/files/<userId>/<filename>  (served by /api/files/[...path]/route.ts)
 * - Dev:        /uploads/<userId>/<filename>    (served directly by Next dev server)
 */
export function buildPublicFileUrl(userId: string, filename: string): string {
  if (useApiFileRoute()) {
    return `/api/files/${userId}/${filename}`;
  }
  return `/uploads/${userId}/${filename}`;
}

/**
 * Stores a file on disk under <uploadsRoot>/<userId>/<filename>.
 * Creates the directory tree if needed.
 */
export async function storeFile(
  userId: string,
  filename: string,
  data: Buffer | Uint8Array
): Promise<{ absolutePath: string; publicUrl: string }> {
  const userDir = path.join(UPLOADS_ROOT, userId);
  await mkdir(userDir, { recursive: true });

  const absolutePath = path.join(userDir, filename);
  await writeFile(absolutePath, data);

  const publicUrl = buildPublicFileUrl(userId, filename);
  return { absolutePath, publicUrl };
}

/**
 * Reads a file from disk and returns its Buffer + size.
 * Throws if the file does not exist.
 */
export async function readUploadedFile(
  userId: string,
  filename: string
): Promise<{ buffer: Buffer; size: number; absolutePath: string }> {
  const absolutePath = path.join(UPLOADS_ROOT, userId, filename);
  // Guard against path traversal: ensure the resolved path is still under UPLOADS_ROOT
  const resolved = path.resolve(absolutePath);
  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) {
    throw new Error("Invalid path");
  }
  const stats = await stat(resolved);
  const buffer = await readFile(resolved);
  return { buffer, size: stats.size, absolutePath: resolved };
}

/**
 * Returns the MIME type based on file extension.
 * Used when serving files via the /api/files/[...path] route.
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".ogg":
      return "video/ogg";
    default:
      return "application/octet-stream";
  }
}
