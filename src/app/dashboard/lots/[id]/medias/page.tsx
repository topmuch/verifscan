"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Loader2,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Trash2,
  Plus,
  AlertCircle,
  Film,
  X,
  ExternalLink,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Media = {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  createdAt: string;
};

type Lot = {
  id: string;
  lotNumber: string;
  product: { name: string; brand: string; category: { pageTemplate?: string } };
};

/**
 * Convertit une URL YouTube/Vimeo en URL embeddable.
 * Identique à la logique du ExportProduceView pour rester cohérent.
 */
function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname === "youtu.be" || u.hostname === "www.youtu.be") {
      const v = u.pathname.replace("/", "");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const v = u.pathname.split("/").filter(Boolean)[0];
      if (v) return `https://player.vimeo.com/video/${v}`;
    }
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return url;
    // URL locale (uploads)
    if (url.startsWith("/uploads/")) return url;
    return null;
  } catch {
    return null;
  }
}

export default function LotMediasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [lotId, setLotId] = useState<string>("");
  const [lot, setLot] = useState<Lot | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Formulaire d'ajout (URL externe)
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    type: "video" as "photo" | "video",
    url: "",
    caption: "",
  });

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Init params + fetch lot + media
  const init = useCallback(async () => {
    const { id } = await params;
    setLotId(id);
    try {
      // Récupère le lot via l'API publique (renvoie aussi les infos produit/catégorie)
      const lotRes = await fetch(`/api/lots/${id}`);
      if (!lotRes.ok) {
        toast.error("Lot introuvable");
        router.push("/dashboard/lots");
        return;
      }
      const lotData = await lotRes.json();
      setLot({
        id: lotData.id,
        lotNumber: lotData.lotNumber,
        product: {
          name: lotData.product.name,
          brand: lotData.product.brand,
          category: lotData.product.category,
        },
      });

      // Récupère les médias
      const medRes = await fetch(`/api/lots/${id}/media`);
      if (medRes.ok) {
        const medData = await medRes.json();
        setMedia(medData.items || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [params, router]);

  useEffect(() => {
    init();
  }, [init]);

  async function uploadPhoto(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 5 MB)");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");

      // Ajoute directement comme média photo
      const addRes = await fetch(`/api/lots/${lotId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "photo",
          url: data.url,
          caption: file.name.replace(/\.[^.]+$/, "").slice(0, 80),
        }),
      });
      if (!addRes.ok) throw new Error("Erreur lors de l'ajout du média");
      const newMedia = await addRes.json();
      setMedia((m) => [...m, newMedia]);
      toast.success("Photo ajoutée !");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function uploadVideo(file: File) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Vidéo trop volumineuse (max 50 MB)");
      return;
    }
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "video");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");

      // Ajoute directement comme média vidéo
      const addRes = await fetch(`/api/lots/${lotId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "video",
          url: data.url,
          caption: file.name.replace(/\.[^.]+$/, "").slice(0, 80),
        }),
      });
      if (!addRes.ok) throw new Error("Erreur lors de l'ajout du média");
      const newMedia = await addRes.json();
      setMedia((m) => [...m, newMedia]);
      toast.success("Vidéo ajoutée !");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setUploadingVideo(false);
    }
  }

  async function addFromUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url.trim()) {
      toast.error("URL requise");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lots/${lotId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          url: form.url.trim(),
          caption: form.caption.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMedia((m) => [...m, data]);
      toast.success(`${form.type === "video" ? "Vidéo" : "Photo"} ajoutée !`);
      setForm({ type: "video", url: "", caption: "" });
      setShowAddForm(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMedia(id: string) {
    if (!confirm("Supprimer ce média ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lots/${lotId}/media?mediaId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      setMedia((m) => m.filter((x) => x.id !== id));
      toast.success("Média supprimé");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isExportProduce = lot?.product.category?.pageTemplate === "export_produce";

  const photos = media.filter((m) => m.type === "photo");
  const videos = media.filter((m) => m.type === "video");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 text-gray-500">
        <Link href="/dashboard/lots">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux lots
        </Link>
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
        Médias du lot
      </h1>
      <p className="mt-1 text-gray-600">
        {lot ? (
          <>
            Lot <span className="font-mono font-semibold">{lot.lotNumber}</span> —{" "}
            {lot.product.name} ({lot.product.brand})
          </>
        ) : null}
      </p>

      {!isExportProduce && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm text-amber-800">
          <AlertCircle className="size-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Catégorie non-export</p>
            <p className="text-xs mt-0.5">
              Les médias ajoutés ici ne seront pas visibles sur la page produit publique
                car cette catégorie utilise le template standard.
              Ajoutez des médias principalement pour les produits d&apos;export
                (mangues, crevettes, fonio…).
            </p>
          </div>
        </div>
      )}

      {/* === Uploaders rapides === */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Card className="vs-card-shadow border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ImageIcon className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Téléverser une photo</p>
                <p className="text-xs text-gray-500">JPG, PNG, WebP — max 5 MB</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Photos du verger, de l&apos;atelier, de la récolte… Affichées en galerie sur la page produit.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={uploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {uploadingPhoto ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Téléversement...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Choisir une photo
                </>
              )}
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(uploadPhoto);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>

        <Card className="vs-card-shadow border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Video className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Téléverser une vidéo</p>
                <p className="text-xs text-gray-500">MP4, WebM — max 50 MB</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Vidéo de la récolte, du conditionnement, présentation du producteur…
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={uploadingVideo}
              onClick={() => videoInputRef.current?.click()}
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {uploadingVideo ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Téléversement...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Choisir une vidéo
                </>
              )}
            </Button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadVideo(f);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* === Ajout par URL externe (YouTube, Vimeo, etc.) === */}
      <Card className="mt-4 vs-card-shadow border-emerald-100">
        <CardContent className="p-6">
          <button
            type="button"
            onClick={() => setShowAddForm((s) => !s)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <LinkIcon className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">Ajouter par URL externe</p>
                <p className="text-xs text-gray-500">
                  YouTube, Vimeo, ou URL d&apos;une image déjà hébergée
                </p>
              </div>
            </div>
            <Plus
              className={`size-5 text-gray-400 transition-transform ${showAddForm ? "rotate-45" : ""}`}
            />
          </button>

          {showAddForm && (
            <form onSubmit={addFromUrl} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as "photo" | "video" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="photo">Photo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="caption">Légende (optionnel)</Label>
                  <Input
                    id="caption"
                    placeholder="Vidéo de la récolte - Juillet 2026"
                    value={form.caption}
                    onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder={form.type === "video"
                    ? "https://www.youtube.com/watch?v=..."
                    : "https://exemple.com/photo.jpg"
                  }
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 size-4" />
                      Ajouter
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setForm({ type: "video", url: "", caption: "" });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* === Liste des médias existants === */}
      <h2 className="mt-8 mb-3 text-lg font-semibold">
        Médias ajoutés ({media.length})
      </h2>

      {media.length === 0 ? (
        <Card className="vs-card-shadow">
          <CardContent className="p-8 text-center">
            <Film className="size-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Aucun média pour ce lot. Téléversez une photo ou vidéo ci-dessus,
              ou ajoutez par URL externe.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Vidéos */}
          {videos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Video className="size-4 text-purple-600" />
                Vidéos ({videos.length})
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {videos.map((v) => {
                  const embed = toEmbedUrl(v.url);
                  const isExternal = v.url.startsWith("http") && !v.url.startsWith("/uploads/");
                  return (
                    <Card key={v.id} className="overflow-hidden">
                      <div className="aspect-video bg-black flex items-center justify-center">
                        {embed ? (
                          isExternal && !embed.startsWith("/uploads/") ? (
                            <iframe
                              src={embed}
                              title={v.caption || "Vidéo"}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <video src={embed} controls className="w-full h-full" />
                          )
                        ) : (
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/70 hover:text-white"
                          >
                            <Play className="size-12" />
                          </a>
                        )}
                      </div>
                      <div className="p-3 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {v.caption ? (
                            <p className="text-sm font-medium truncate">{v.caption}</p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Sans légende</p>
                          )}
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline truncate block flex items-center gap-1"
                          >
                            <ExternalLink className="size-3" />
                            {v.url.length > 50 ? v.url.slice(0, 50) + "..." : v.url}
                          </a>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === v.id}
                          onClick={() => deleteMedia(v.id)}
                          className="text-red-600 hover:bg-red-50 flex-shrink-0"
                        >
                          {deletingId === v.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <ImageIcon className="size-4 text-blue-600" />
                Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((p) => (
                  <Card key={p.id} className="overflow-hidden group">
                    <div className="aspect-square bg-gray-100 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.caption || ""}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => deleteMedia(p.id)}
                        disabled={deletingId === p.id}
                        className="absolute top-2 right-2 size-8 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        title="Supprimer"
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <X className="size-4" />
                        )}
                      </button>
                    </div>
                    {p.caption && (
                      <p className="p-2 text-xs truncate">{p.caption}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Aperçu page publique === */}
      {lot && (
        <div className="mt-8 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2">
          <ExternalLink className="size-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Aperçu de la page publique</p>
            <p className="text-xs">
              Voir comment les médias apparaissent sur la page scannée par QR code :{" "}
              <Link
                href={`/p/${lot.id}`}
                target="_blank"
                className="underline font-semibold"
              >
                /p/{lot.lotNumber}
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
