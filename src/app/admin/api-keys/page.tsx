import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminApiKeysPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "superadmin") return null;

  const keys = await db.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: { id: true, email: true, companyName: true, role: true },
      },
    },
  });

  const activeCount = keys.filter((k) => !k.revokedAt).length;
  const revokedCount = keys.length - activeCount;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Code2 className="size-7 text-[#0f4382]" />
          API Keys
        </h1>
        <p className="mt-1 text-gray-600">
          Toutes les clés API émises par les utilisateurs VerifScan.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Total clés</div>
            <div className="text-2xl font-bold text-[#0f4382]">{keys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Actives</div>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-gray-500">Révoquées</div>
            <div className="text-2xl font-bold text-red-600">{revokedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les clés</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune clé API émise pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-gray-700">Propriétaire</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Nom</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Préfixe</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Permissions</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Dernière utilisation</th>
                    <th className="px-3 py-2 font-semibold text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/fabricants/${k.user.id}`}
                          className="text-blue-700 hover:underline"
                        >
                          {k.user.companyName || k.user.email}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{k.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{k.prefix}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">{k.permissions}</Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {k.lastUsedAt
                          ? new Date(k.lastUsedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "Jamais"}
                      </td>
                      <td className="px-3 py-2">
                        {k.revokedAt ? (
                          <Badge variant="outline" className="text-red-600 border-red-300">Révoquée</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
