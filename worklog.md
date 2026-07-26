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

---
Task ID: V3-full
Agent: Super Z (main)
Task: Implémenter les fonctionnalités V3 de VerifScan (IA, Marketplace B2B, Blockchain, Certifications)

Work Log:
- Étendu le schéma Prisma avec 11 nouveaux modèles V3:
  - AIAnomaly, AIPrediction, AIRecommendation (Module IA)
  - Distributor, B2BProduct, Conversation, B2BMessage, B2BOrder, B2BOrderItem, B2BReview, Contract (Marketplace B2B)
  - BlockchainCertificate, Certification, ExportDocument (Blockchain & Conformité)
  - Ajouté relations V3 sur User, Product, Lot (back-relations complètes)
  - Ajouté role 'distributor' au type User
- Poussé le schéma en base avec `bun run db:push` (3 itérations pour fixer les relations manquantes)
- Créé la librairie IA complète (src/lib/ai.ts, ~600 lignes):
  - analyzeIngredients() — détection allergènes + additifs suspects
  - getDlcAlertLevel() — calcul péremption (ratio + daysLeft)
  - detectCounterfeitScans() — scans hors zone déclarée
  - scanAndPersistDlcAnomalies() — scan auto + persistance
  - predictProductDemand() — tendance + facteurs saisonniers (Ramadan, fin d'année)
  - generateSeoDescription() — descriptions optimisées SEO marché ouest-africain
  - translateText() — dictionnaires FR/EN/Wolof
  - generateRecommendations() — recommandations actionnables (trust, SEO, publish_time, competitive)
  - answerConsumerQuestion() — chatbot anti-hallucination basé sur données produit
  - getHeatmapData() + getBehavioralStats() — analytics géo + comportementaux
  - computeLotDataHash() + simulateBlockchainWrite() — hash SHA-256 + tx simulé sur Polygon
- Créé 13 nouvelles routes API V3:
  - GET/POST /api/ai/anomalies (liste + scan manuel)
  - PUT /api/ai/anomalies/[id]/resolve
  - GET /api/ai/predictions/[productId]
  - POST /api/ai/generate-description
  - GET/PUT /api/ai/recommendations
  - POST /api/ai/chatbot (endpoint public)
  - GET /api/ai/heatmap
  - GET /api/ai/behavioral/[productId]
  - POST /api/blockchain/certify-lot/[lotId]
  - GET /api/blockchain/certificates/[lotId]
  - GET/POST /api/certifications
  - GET/POST /api/b2b/products
  - GET/POST /api/b2b/orders
  - GET/POST /api/b2b/conversations
  - POST /api/b2b/reviews
  - POST /api/distributors/apply
- Étendu NotificationType avec 5 nouveaux types V3 (ai_anomaly, ai_prediction, cert_expiring, b2b_message, b2b_order)
- Étendu SessionUser avec role 'distributor' + ajouté requireDistributor()
- Créé 4 nouvelles pages dashboard V3:
  - /dashboard/ia — Intelligence Artificielle (6 sections: anomalies, prédictions, recommandations, SEO, heatmap, certifications)
  - /dashboard/blockchain — Certification Polygon (liste lots, bouton certifier, hashs vérifiables)
  - /dashboard/b2b — Marketplace B2B (vue fabricant + vue distributeur)
  - /marketplace — Catalogue B2B public (filtres avancés: catégorie, certification, région)
- Créé 7 composants client V3:
  - ChatbotWidget — bulle flottante + panel chat + questions suggérées
  - BlockchainBadge — affiche hash + tx + lien Polygonscan
  - AIAnomalyList — liste avec bouton scan + résoudre
  - AIRecommendationsList — appliquer/ignorer
  - AIPredictions — sélecteur produit + affichage prédiction
  - AISeoGenerator — génération + traduction FR/EN/Wolof
  - HeatmapView — carte Leaflet + leaflet.heat + filtres
  - CertificationsManager — dialog d'ajout + liste avec statut vérification
- Mis à jour DashboardSidebar avec 3 nouveaux liens V3 (IA, B2B, Blockchain)
- Mis à jour DashboardLayout pour accepter le rôle 'distributor'
- Mis à jour PublicHeader avec lien Marketplace B2B
- Enrichi page publique /p/[lotId] avec BlockchainBadge + ChatbotWidget
- Installé leaflet + leaflet.heat + @types/leaflet
- Seed V3 (scripts/seed-v3.js):
  - Compte distributeur: distrib@verifscan.sn / dist123 (DistribPlus Sénégal, vérifié)
  - 4 certifications (Halal, HACCP, ISO 22000 — vérifiées; CEDEAO — en attente)
  - 2 produits B2B activés (Jus Bissap + Jus Gingembre) avec price tiers
  - 1 commande B2B démo (325 000 FCFA, DistribPlus → demo fabricant)
  - 1 lot certifié sur blockchain (LOT-202510-1000)
  - Prédictions IA pour produits avec scans
  - Anomalies IA (DLC proche + contrefaçon France)
  - 3 recommandations IA (publish_time, competitive, trust)
- Vérification browser end-to-end complète:
  - Marketplace public: 200 ✓ (2 produits B2B affichés, filtres fonctionnels)
  - Login fabricant: 200 ✓
  - Dashboard IA: KPIs + 6 sections rendus ✓
    - Prédictions: clic produit → tendance +15% + confiance 95% + Ramadan ✓
    - SEO generator: clic produit → description + meta + slug + tags générés ✓
    - Bouton traduction FR/EN/Wolof visible ✓
    - Recommandations: 3 affichées (publish_time mardi 10h, competitive 75% photos, trust) ✓
    - Heatmap: carte Leaflet rendue + filtres produit/période ✓
    - Certifications: 4 affichées (Halal, HACCP, ISO 22000 — vérifiées; CEDEAO — en attente) ✓
    - Bouton scan IA: génère anomalies DLC + contrefaçon ✓
  - Dashboard Blockchain: 200 ✓
    - 8 lots affichés, 1 certifié (du seed), 7 avec bouton "Certifier" ✓
    - Clic "Certifier" → lot certifié, hash + tx + bloc + lien Polygonscan affichés ✓
  - Dashboard B2B fabricant: 200 ✓
    - 2 produits B2B actifs (B2B actif badge) ✓
    - 1 commande reçue (B2B-xxx-001, 325 000 FCFA, DistribPlus) ✓
  - Dashboard B2B distributeur: 200 ✓
    - Vue dédiée avec bouton "Catalogue B2B" ✓
    - Statut "Vérifié" affiché ✓
  - Marketplace en tant que distributeur: clic "Devis" → dialog → envoi → redirection dashboard ✓
  - Page publique /p/[lotId]: 200 ✓
    - Badge "Certifié sur Polygon Blockchain" avec hash + tx + lien Polygonscan ✓
    - Chatbot IA flottant en bas à droite ✓
    - Clic chatbot → panel avec questions suggérées ✓
    - Clic "Quelle est la date de péremption ?" → réponse IA "reste 335 jour(s)" ✓
  - Captures d'écran sauvegardées dans /home/z/my-project/download/:
    - v3-marketplace.png, v3-marketplace-logged.png
    - v3-dashboard-ia.png, v3-ia-scan.png, v3-ia-prediction.png, v3-ia-seo.png, v3-ia-seo-generated.png, v3-ia-certifications.png
    - v3-blockchain.png, v3-blockchain-certified.png
    - v3-b2b-dashboard.png, v3-b2b-distributor.png
    - v3-public-lot.png, v3-chatbot-open.png, v3-chatbot-answer.png
    - v3-quote-dialog.png, v3-quote-sent.png
    - v3-homepage.png

Stage Summary:
- Toutes les fonctionnalités V3 du brief sont implémentées et vérifiées:
  1. ✅ Module IA (4 sous-systèmes):
     - Détection anomalies (ingrédients, DLC, contrefaçon géographique)
     - Assistant IA (SEO + traduction FR/EN/Wolof + suggestions confiance)
     - Chatbot consommateur intégré aux pages publiques
     - Analyse avancée (heatmap géographique + analytics comportementaux)
     - Prédictions de demande avec facteurs saisonniers
  2. ✅ Marketplace B2B:
     - Catalogue B2B public avec filtres avancés (catégorie, certification, région)
     - Demande de devis en un clic + messagerie intégrée
     - Configuration produits B2B (MOQ, prix dégressifs, délais, capacité)
     - Vue distributeur dédiée (commandes, conversations, statut vérification)
     - Vue fabricant (produits B2B, commandes reçues, avis)
  3. ✅ Blockchain & Traçabilité immutable:
     - Certification lots sur Polygon (simulé avec hash SHA-256 réel)
     - Affichage hash + tx + bloc + lien Polygonscan
     - Bouton "Certifier" sur chaque lot non certifié
     - Badge blockchain visible sur page publique produit
  4. ✅ Certifications & Conformité:
     - Upload certifications (Bio, Halal, ISO 22000, FDA, HACCP, NSF, CEDEAO)
     - OCR simulé (extraction métadonnées automatique)
     - Statut vérification (vérifié / en attente)
     - Alertes expiration (< 90 jours)
- 11 nouveaux modèles Prisma + 16 nouvelles routes API + 4 nouvelles pages + 8 nouveaux composants
- Compte distributeur démo créé (distrib@verifscan.sn / dist123)
- Code validé via Agent Browser: toutes les fonctionnalités testées et fonctionnelles
- Architecture V3 modulaire, prête pour brancher un vrai LLM (GLM-4) ou une vraie blockchain (Polygon RPC)

---
Task ID: rbac-detach-dashboard
Agent: main
Task: Détacher le tableau de bord du site public et le rendre pro/autonome (fini le look "bizarre" avec cosmic-bg violet/fuchsia).

Work Log:
- Restructuré les routes via Route Groups Next.js :
  * root layout (src/app/layout.tsx) ne contient plus que <html><body>
  * pages publiques (/, /auth, /products, /scan) déplacées dans (public)/ avec leur propre layout qui wrap Header+Footer
  * dashboard/ et admin/ restent en racine → plus de Header/Footer public qui "bleed" dans l'admin
- Redessiné dashboard/layout.tsx en shell admin pro :
  * sidebar sombre slate-900 (260px) avec icônes Lucide (LayoutDashboard, Package, Tags, QrCode, BarChart3, CreditCard, Settings)
  * top bar sticky avec breadcrumb, lien site public, cloche notif, menu user collapsible
  * drawer mobile avec backdrop
  * indicateur actif indigo + point
  * état loading : dot indigo pulsé sur slate-50
- Redessiné admin/layout.tsx avec le même shell pro pour cohérence (badge "Super Admin", nav Users/Categories/Plans)
- Nettoyé toutes les pages internes du dashboard :
  * supprimé tous les emojis (📦🏷️🔳🔍⚡➕✅⚠️💡 etc.) → remplacés par icônes Lucide
  * supprimé classes cosmic-bg / glass-card / font-display / brand-* → palette slate + indigo
  * empty states avec tuiles icône Lucide au lieu de gros emojis
  * tableaux et cartes avec border-slate-200 + shadow-sm
- Étendu le type AuthUser avec phone/country/preferredLang optionnels (compilation Parametres)
- Ajouté export const dynamic = 'force-dynamic' sur (public)/layout.tsx

Stage Summary:
- Build vérifié : 36 routes compilent, `next build` passe sans erreur.
- Commit f98dfd0 poussé sur origin/main.
- Le dashboard est maintenant un shell admin autonome détaché du site public, avec look pro (sidebar sombre, top bar, icônes Lucide) au lieu du cosmic-bg violet.
- RBAC préservé : SUPER_ADMIN → /admin, FABRICANT → /dashboard.
- Rappel sécurité : le token GitHub PAT ([REDACTED]) est toujours exposé dans l'historique git, il faut le révoquer.
- Prochaine étape : redéployer sur Coolify (le build repassera).

---
Task ID: landing-redesign
Agent: main
Task: Reconstruction complète de la page d'accueil VerifScan selon spec détaillée (palette bleu/vert/orange, Poppins/Inter/Roboto Mono, 9 sections pro)

Work Log:
- Mis à jour src/app/layout.tsx : remplacement Geist par Poppins (titres) + Inter (corps) + Roboto Mono (chiffres) via next/font/google
- Réécrit src/app/globals.css : nouveaux tokens --vs-blue/green/orange, classes utilitaires (.vs-gradient-hero, .vs-card-shadow, .vs-step-line, .vs-qr-pattern), keyframes animations (vs-float, vs-pulse-soft, vs-fade-in-up, vs-shimmer), support prefers-reduced-motion
- Mis à jour VerifScanLogo : gradient bleu (#2563EB) → vert (#10B981), variants color/light, hover scale + rotation
- Reconstruit public-header.tsx : fixed 80px, blanc avec backdrop-blur au scroll, menu centré, CTAs "Connexion" + "Essayer gratuitement", mobile menu
- Reconstruit public-footer.tsx : fond #111827, 4 colonnes (Produit/Entreprise/Légal/Contact), réseaux sociaux Facebook/Twitter/LinkedIn/Instagram, badge blockchain
- Créé src/lib/use-animations.ts : hooks useReveal (IntersectionObserver), useCounter ( RAF easing), useRevealCounter
- Créé 7 composants landing dans src/components/landing/ :
  * hero-section.tsx : H1 + slogan + CTA + 2 stats inline + mockup smartphone avec cards flottantes (Bissap, blockchain, 0.3s scan)
  * features-section.tsx : 3 cards (Traçabilité/Export/Stats) avec icônes colorées et hover translate
  * how-it-works-section.tsx : 3 étapes numérotées avec ligne de connexion dégradée
  * testimonials-section.tsx : 3 témoignages avec étoiles + photos initiales + trust badges row
  * stats-section.tsx : fond bleu gradient, 4 compteurs animés (12458/250+/98%/35%)
  * pricing-section.tsx : 3 plans (Starter/Pro populaire/Business) avec features list et économies annuelles
  * final-cta-section.tsx : centré, 2 boutons, 4 avantages avec checks
- Mis à jour src/app/page.tsx : assemblage des 7 sections dans PublicShell (suppression des anciennes sections DB-driven)
- Mis à jour public-shell.tsx : ajout pt-20 pour compenser header fixed
- Corrections build pré-existantes :
  * contact/page.tsx : ajout "use client" (formulaire onSubmit)
  * login/page.tsx : wrapping useSearchParams dans Suspense boundary
  * produits/page.tsx : même wrapping Suspense

Stage Summary:
- Build vérifié : `bun run build` passe, 63 pages statiques générées avec succès
- Page d'accueil entièrement reconstruite selon spec : palette bleu #2563EB / vert #10B981 / orange #F59E0B, polices Poppins/Inter/Roboto Mono, 9 sections (Header fixe, Hero, Features, How It Works, Testimonials, Stats animées, Pricing, CTA finale, Footer dark)
- Animations : reveal au scroll (IntersectionObserver), compteurs animés (RAF + ease-out cubic), floating cards, pulse CTA
- Responsive : mobile-first avec breakpoints sm/md/lg, menu mobile, grilles adaptatives
- Accessibilité : aria-labels, focus visible via Tailwind, prefers-reduced-motion respecté
- Prochaine étape : commit + push pour redéployer sur Coolify

---
Task ID: superadmin-panel
Agent: main
Task: Construction du panel SuperAdmin complet selon spec (Dashboard, Utilisateurs, Abonnements, Catégories, Statistiques, Paramètres, Logs, Support)

Work Log:
- Étendu les liens admin dans dashboard-sidebar.tsx : 8 entrées (Dashboard, Utilisateurs, Abonnements, Catégories, Statistiques, Paramètres, Logs, Support)
- Reconstruit admin/layout.tsx : utilise nouveau AdminShell avec sidebar 280px + header 70px
- Créé src/components/admin/admin-shell.tsx : sidebar fixe 280px avec logo + badge Admin, nav 8 entrées, profil admin en bas + boutons Site public/Déconnexion, header 70px avec search + notif bell + avatar, mobile drawer
- Créé src/components/admin/kpi-card.tsx : carte KPI avec count-up animation (IntersectionObserver + RAF easing), icône colorée, trend badge, subtext
- Étendu admin-scan-chart.tsx : 5 graphiques (AreaChart scans, BarChart inscriptions, PieChart donut plans, BarChart horizontal top fabricants, LineChart revenus)
- Dashboard SuperAdmin (admin/page.tsx) :
  * 4 KPIs principaux (Total Fabricants, MRR, Scans Totaux, Lots Rappelés) avec trends + subtexts
  * 4 graphiques en grille 2x2 : Inscriptions 12 mois (barres), Répartition plans (donut), Top 10 fabricants (barres horizontales), Scans 14 jours (area)
  * Tableau Activité récente (inscriptions + paiements) avec badges colorés par type
- API admin/users/route.ts : étendu avec filtres search/status/plan + pagination server-side + jointure subscription + counts produits/scans
- API admin/users/[id]/route.ts (nouveau) : GET détail complet utilisateur (infos, abonnement, factures, produits récents, scans 30j groupés par jour)
- API admin/subscriptions/route.ts (nouveau) : liste avec filtres status/plan + pagination + calcul MRR/ARR + groupBy plan/status
- API admin/subscriptions/[id]/route.ts (nouveau) : PATCH pour changement plan/status/quotas (auto-update quotas selon plan)
- API admin/categories/[id]/route.ts (nouveau) : PATCH (name/icon/isActive) + DELETE (vérifie 0 produits)
- API admin/stats/route.ts : étendu avec MRR, planDistribution, inscriptions 12 mois, top 10 fabricants, recent activity
- Page admin/fabricants/page.tsx : tableau complet avec colonnes Entreprise/Contact/Plan/Statut/Produits/Scans/Inscription/Actions + filtres (search, statut, plan, page size) + pagination + dropdown actions (Voir détails, Voir abonnement, Désactiver/Réactiver avec AlertDialog)
- Page admin/fabricants/[id]/page.tsx (nouveau) : layout 2 colonnes 70/30, gauche = infos entreprise + abonnement avec quotas progress bars + produits récents (tableau) + historique scans 30j (area chart), droite = actions rapides (WhatsApp/Email/Ticket) + stats + factures récentes
- Page admin/abonnements/page.tsx (nouveau) : tabs statut (Tous/Actifs/Essai/En retard/Annulés) + 4 cards MRR/ARR/Pro/Starter+Enterprise + tableau abonnements (Entreprise/Plan/Statut/Quota/Début/Facturation/Actions) + dropdown changement plan/status
- Page admin/abonnements/plans/page.tsx (nouveau) : 3 cards plan (Starter/Pro populaire/Enterprise) avec édition prix mensuel/annuel, quotas produits/QR, stats, support, features toggle (Check/X) + paramètres globaux (essai jours, relance, suspension, carte requise)
- Page admin/categories/page.tsx : refonte totale en grille de cards avec icône emoji + nom + nb produits + statut + actions (Modifier/Activer-Désactiver/Supprimer si 0 produits) + modal création/édition avec picker emoji 30 choix
- Page admin/statistiques/page.tsx (nouveau) : 6 KPIs vue ensemble (fabricants/actifs/produits/lots/QR/scans) + section Croissance (inscriptions + scans) + Top 20 fabricants (barres horizontales) + Top 20 produits (tableau) + Performance système (latence/erreur/uptime)
- Page admin/parametres/page.tsx (nouveau) : layout sidebar 7 sections (Général/Email/Paiement/Sécurité/API/Apparence/Maintenance) avec formulaires complets (SMTP, CinetPay/Stripe/Orange/Wave, 2FA, rate limiting, CORS, clés API, mode maintenance, sauvegardes, cache)
- Page admin/logs/page.tsx (nouveau) : filtres (search/niveau/type) + tableau logs (timestamp/niveau badge/type/user/action/IP) + modal détails complets (User-Agent, endpoint, response status) — données mockées en attendant DB log table
- Page admin/support/page.tsx (nouveau) : layout 2 colonnes (liste tickets + conversation), tabs statut (Ouverts/En cours/Résolus/Tous), conversation client/admin avec bulles colorées, zone réponse avec textarea + boutons Envoyer/Envoyer & fermer, dropdown changement statut/priorité

Stage Summary:
- Build vérifié : `bun run build` passe, 70 pages statiques générées (vs 63 avant) — les 7 nouvelles routes admin
- Routes admin opérationnelles : /admin (dashboard), /admin/fabricants, /admin/fabricants/[id], /admin/abonnements, /admin/abonnements/plans, /admin/categories, /admin/statistiques, /admin/parametres, /admin/logs, /admin/support
- API admin étendues : users (liste filtrée + détail), subscriptions (liste + update), categories (CRUD complet), stats (vue dashboard enrichie)
- Panel SuperAdmin complet avec design system bleu/vert/orange cohérent, sidebar 280px, header 70px, KPIs animés, graphiques recharts, tableaux avec filtres et pagination, dropdowns d'actions, modals et alertes
- Toutes les actions RBAC sont protégées par requireSuperAdmin()
- Prochaine étape : commit + push pour redéployer sur Coolify

---
Task ID: fix-qr-delete-recall
Agent: main (Super Z)
Task: 3 corrections — QR codes cassés, boutons suppression produit/lot, anomalies visibles sur rappel

Work Log:
- Diagnostic QR cassés : les anciens QR codes ont été générés avec `process.env.NEXT_PUBLIC_APP_URL || "https://verifscan.sn"` — or NEXT_PUBLIC_APP_URL n'est pas défini dans Coolify, donc le QR encode https://verifscan.sn/p/{lotId} qui n'héberge pas le lot. Le fix resolveAppUrl existe mais ne s'applique qu'aux NOUVEAUX QR.
- Solution : bouton "Régénérer tous les QR" qui appelle POST /api/qrcodes/refresh-all (déjà existant) — régénère tous les QR actifs avec l'URL courante (NEXTAUTH_URL ou x-forwarded-host).
- Créé DELETE /api/products/[id] — supprime un produit + cascade lots → QR → scans + nettoyage B2BProduct, AIPrediction, AIAnomaly. Gestion FK constraint P2003/P2014 (409 conflict).
- Ajouté DELETE à /api/lots/[id] — supprime un lot + cascade QRCode → Scan + BlockchainCertificate + nettoyage AIAnomaly, ExportDocument.
- Créé src/app/dashboard/lots/delete-lot-button.tsx avec 3 composants : DeleteLotButton (dialog confirmation), RegenerateQrButton (par lot), RegenerateAllQrButton (tous les QR).
- Ajouté boutons delete + regenerate par lot sur dashboard/lots, bouton "Régénérer tous les QR" en header.
- Ajouté bouton "Régénérer tous les QR" sur dashboard/qr-codes.
- Amélioré LotStatusToggle : textarea pour saisir le motif de rappel (affiché publiquement).
- Ajouté champ `anomalies` à GET /api/lots/[id] (AIAnomaly du lot, open d'abord, max 10).
- Ajouté type Anomaly + section "Anomalies détectées" (carte rouge, badges sévérité, statut, timestamps relatifs) sur page publique /p/[lotId].
- Build vérifié : npx next build → 19s, 0 errors.
- Commit 3072885 poussé sur main.

Stage Summary:
- 3 problèmes résolus en un seul commit
- QR : boutons de régénération ajoutés (1 par lot + global) — l'utilisateur doit cliquer dessus après déploiement pour corriger les QR existants
- Suppression : DELETE endpoints créés pour produits ET lots, boutons UI fonctionnels avec confirmation
- Rappel : le lot n'est PLUS désactivé, il reste visible avec bannière rouge + motif + section anomalies IA + reste de la page (traçabilité, certifications, etc.)
