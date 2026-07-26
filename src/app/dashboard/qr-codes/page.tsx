import Link from "next/link";
import { QrCode, Eye, Layers, Stethoscope } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCodeDownloadButton } from "./qr-download-button";
import { RegenerateAllQrButton } from "../lots/delete-lot-button";
import { QrDiagnosticBanner } from "./qr-diagnostic-banner";

export default async function DashboardQrCodesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const qrCodes = await db.qRCode.findMany({
    where: { lot: { product: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      lot: {
        select: {
          id: true,
          lotNumber: true,
          status: true,
          expirationDate: true,
          product: { select: { id: true, name: true, brand: true } },
        },
      },
      _count: { select: { scans: true } },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">QR Codes</h1>
          <p className="mt-1 text-gray-600">
            Téléchargez et imprimez les QR codes de vos lots.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {qrCodes.length > 0 && <RegenerateAllQrButton />}
          <Button asChild variant="outline">
            <Link href="/api/debug/qr-check" target="_blank">
              <Stethoscope className="mr-2 size-4" />
              Diagnostiquer
            </Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard/lots/nouveau">
              <Layers className="mr-2 size-4" />
              Créer un nouveau lot
            </Link>
          </Button>
        </div>
      </div>

      {/* Diagnostic banner — shown when the user has lots but no QR codes,
          or when the QR codes might be pointing to the wrong URL. */}
      <QrDiagnosticBanner />

      {qrCodes.length === 0 ? (
        <Card className="vs-card-shadow border-emerald-100">
          <CardContent className="p-12 text-center">
            <QrCode className="mx-auto size-12 text-emerald-200" />
            <h3 className="mt-4 font-semibold text-lg">Aucun QR code pour le moment</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Les QR codes sont générés automatiquement à la création d&apos;un lot.
              Créez votre premier lot pour obtenir votre premier QR code.
            </p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/dashboard/lots/nouveau">
                <Layers className="mr-2 size-4" />
                Créer un lot
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map((qr) => {
            const isRecalled = qr.lot.status === "recalled";
            return (
              <Card key={qr.id} className="vs-card-shadow border-emerald-100 overflow-hidden">
                <div className="aspect-square bg-white p-4 flex items-center justify-center">
                  {qr.qrCodeImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qr.qrCodeImageUrl}
                      alt={`QR ${qr.lot.lotNumber}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="size-16 text-gray-300" />
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    {isRecalled ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                        Lot rappelé
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                        Actif
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {qr._count.scans} scan{qr._count.scans > 1 ? "s" : ""}
                    </span>
                  </div>
                  <h3 className="font-semibold truncate text-sm">{qr.lot.product.name}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    <code className="font-mono">{qr.lot.lotNumber}</code>
                  </p>
                  <p className="text-xs text-gray-500">
                    Exp. {qr.lot.expirationDate.toLocaleDateString("fr-FR")}
                  </p>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button asChild size="sm" variant="outline" className="flex-1 border-emerald-200">
                      <Link href={`/p/${qr.lot.id}`} target="_blank">
                        <Eye className="mr-1 size-3.5" />
                        Voir
                      </Link>
                    </Button>
                    <QrCodeDownloadButton qrCodeId={qr.id} lotNumber={qr.lot.lotNumber} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
