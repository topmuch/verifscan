---
Task ID: V2-full
Agent: Super Z (main)
Task: Implémenter les fonctionnalités V2 de VerifScan (statistiques avancées, QR codes en masse, abonnements, notifications, exports)

Work Log:
- Étendu le schéma Prisma avec les modèles Subscription, Invoice, Notification + champs V2 (fgColor, bgColor, size, logoUrl sur QRCode; recallReason/recalledAt sur Lot; country/city/ipAddress sur Scan)
- Poussé le schéma en base avec `bun run db:push`
- Créé 5 librairies V2 dans src/lib/:
  - subscription.ts (PLANS, getOrCreateSubscription, canGenerateQrCodes, upgradePlan, getQuotaUsagePercent)
  - notifications.ts (createNotification, triggerRecallAlert, checkQuotaWarning)
  - stats.ts (getFabricantScanStats, getDailyScansTimeSeries, getTopProducts, getGeographicStats, getHourlyStats, getPeakActivity, getGlobalStats)
  - export.ts (buildCsv, buildProductsExport, buildLotsExport, buildScansExport, buildComplianceReport)
  - labels.ts (LABEL_PRESETS, generateBatchQrCodes, buildLabelSheetHtml)
  - qr.ts étendu (generateQrCodeDataUrl avec customization, detectDeviceType, deviceTypeLabel)
- Créé 17 nouvelles routes API V2:
  - GET /api/stats/scans (fabricant)
  - GET /api/stats/global (admin)
  - POST /api/qrcodes/bulk-generate (jusqu'à 200 lots à la fois)
  - POST /api/qrcodes/custom (avec fgColor/bgColor/width/logoUrl)
  - POST /api/qrcodes/labels-pdf (génère HTML imprimable pour planche A4/A5)
  - GET /api/subscriptions/plans (public)
  - POST /api/subscriptions/subscribe
  - PUT /api/subscriptions/upgrade
  - GET /api/subscriptions/current
  - GET/PUT /api/notifications
  - PUT /api/notifications/[id]/read
  - GET /api/export/products (CSV)
  - GET /api/export/lots (CSV)
  - GET /api/export/scans (CSV avec filtres date)
  - GET /api/export/compliance (HTML imprimable PDF)
- Mis à jour /api/scans pour capturer automatiquement deviceType + ipAddress + extraction pays/ville
- Mis à jour /api/lots/[id]/status pour déclencher triggerRecallAlert automatiquement
- Corrigé bugs Prisma préexistants: `_count.scans` → `_count.qrCodes` sur Lot (4 fichiers)
- Corrigé bugs Prisma V2: `db.qrCode` → `db.qRCode` (3 fichiers)
- Corrigé bug layout dashboard: `next/auth` → `next-auth`
- Créé 5 nouvelles pages dashboard V2:
  - /dashboard/statistiques (avec Recharts: filtres période, top produits, breakdown appareil en pie chart, geo, hourly, peak activity)
  - /dashboard/qr-codes/masse (génération en masse avec personnalisation couleurs + onglet planche PDF)
  - /dashboard/abonnement (3 plans Starter/Pro/Enterprise + quota progress bar + factures)
  - /dashboard/notifications (liste filtrable + marquer comme lu)
  - /dashboard/export (4 cartes: produits CSV, lots CSV, scans CSV filtrable, compliance PDF)
- Créé composant NotificationBell (cloche en haut à droite avec dropdown, polling 30s, badge non-lues)
- Ajouté header sticky avec NotificationBell dans layout dashboard
- Mis à jour DashboardSidebar avec 5 nouveaux liens (Génération en masse, Abonnement, Exports, Notifications)
- Amélioré page publique /p/[lotId] avec badge "Vérifié par VerifScan" + boutons partage WhatsApp/Facebook
- Mis à jour API /api/scans pour détecter deviceType automatiquement et extraire country/city
- Mis à jour API /api/lots/[id]/status pour déclencher triggerRecallAlert
- Seed V2: créé catégories, fabricant démo, 4 produits, 8 lots, 8 QR codes, 500 scans répartis sur 30 jours, 4 notifications
- Comptes démo: admin@verifscan.sn/admin123, demo@verifscan.sn/demo123
- Vérification browser end-to-end complète:
  - Page d'accueil: 200 ✓
  - Login fabricant: 200 ✓
  - Dashboard: KPIs affichés (4 produits, 8 lots, 6 QR, 420 scans) ✓
  - NotificationBell: 2 non-lues affichées dans dropdown ✓
  - Page Statistiques V2: graphes Recharts rendus, 420 scans, pic 12h Vendredi ✓
  - Page Abonnement: 3 plans affichés, quota 1240/5000 = 25%, facture créée après upgrade ✓
  - Génération en masse: 2 QR codes générés avec succès ✓
  - Planche étiquettes PDF: HTML imprimable ouvert dans nouvel onglet ✓
  - Page Export: CSV produits/lots/scans générés correctement ✓
  - Rapport conformité: PDF officiel avec infos fabricant + stats ✓
  - Quota dépassé: message d'erreur "Quota insuffisant" affiché ✓
  - Notifications: 4 notifications affichées, marquer comme lu fonctionne ✓
  - Page publique active: badge Vérifié + partage WhatsApp/Facebook ✓
  - Page publique rappelée: alerte rouge "Produit rappelé" ✓
- Captures d'écran sauvegardées dans /home/z/my-project/download/:
  - dashboard-home.png, stats-v2.png, abonnement-v2.png, notifications-v2.png, export-v2.png, public-page-v2.png

Stage Summary:
- Toutes les fonctionnalités V2 du brief sont implémentées et vérifiées:
  1. ✅ Statistiques avancées (Recharts: time series, top produits, breakdown appareil pie, géo, hourly, peak activity, filtres période)
  2. ✅ Génération QR en masse (jusqu'à 200 lots, personnalisation couleur)
  3. ✅ Planche d'étiquettes PDF (4 layouts A4: 6, 10, 24, 40 étiquettes)
  4. ✅ Système d'abonnement (Starter/Pro/Enterprise, quotas, factures, essai 14j)
  5. ✅ Notifications in-app (cloche avec badge, dropdown, page dédiée, alertes rappel + quota)
  6. ✅ Export données (CSV produits/lots/scans + rapport conformité PDF imprimable)
  7. ✅ UI/UX V2 (badge "Vérifié par VerifScan", partage WhatsApp/Facebook, centre notifications)
- 5 nouveaux endpoints API stats/QR/subscription/notification/export
- 5 nouvelles pages dashboard + 1 nouveau composant cloche notifications
- 1 bug Prisma préexistant corrigé (4 fichiers)
- Code validé via Agent Browser: toutes les fonctionnalités testées et fonctionnelles
- Données de démo réalistes (500 scans répartis sur 30 jours avec géo + appareils variés)
