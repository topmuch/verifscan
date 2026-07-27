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

---
Task ID: qr-diagnostic-fix
Agent: main (Super Z)
Task: User reports "même après régénérer les QR code, affiche QR code introuvable" — diagnostic + fixes

Work Log:
- Investigation: lu /api/qrcodes/generate, /api/qrcodes/refresh-all, /api/lots/[id], /p/[lotId], /api/scans, src/lib/qr.ts.
- Identifié 3 causes possibles:
  1. QR codes legacy pourraient encoder le lotNumber (LOT-YYYYMMDD-XXXX) au lieu du lot ID (cuid). L'API ne cherchait que par ID.
  2. /api/qrcodes/refresh-all SKIPPAIT les lots sans QR code actif (counter 'skipped'). Après un wipe DB, le bouton 'Régénérer tous les QR' ne faisait rien.
  3. Aucun moyen de diagnostiquer pourquoi les QR 404 (l'utilisateur ne sait pas si l'URL est mauvaise ou si le lot n'existe pas en DB).

- Créé GET /api/debug/qr-check (endpoint public, /home/z/my-project/src/app/api/debug/qr-check/route.ts):
  * Retourne appUrl (résultat de resolveAppUrl(req))
  * Retourne les variables d'env (NEXT_PUBLIC_APP_URL, NEXTAUTH_URL)
  * Retourne les headers (x-forwarded-proto, x-forwarded-host, host)
  * Retourne les totaux DB (lots, qrCodesActive, qrCodesTotal, scans)
  * Retourne les 20 derniers lots avec ID, lotNumber, status, QR code actif ID, publicUrl, fullEncodedUrl, testUrl
  * Retourne un champ 'diagnosis' qui explique automatiquement la cause probable

- Ajouté fallback par lotNumber dans GET /api/lots/[id] (src/app/api/lots/[id]/route.ts):
  * Si findUnique({where:{id}}) retourne null, essaie findFirst({where:{lotNumber:id}})
  * Permet aux anciens QR codes imprimés avec le lotNumber de continuer à fonctionner

- Modifié /api/qrcodes/refresh-all (src/app/api/qrcodes/refresh-all/route.ts):
  * Au lieu de SKIP les lots sans QR code actif, CRÉE un nouveau QR code pour eux
  * Update in-place les lots qui ont déjà un QR code actif (préserve l'ID + historique scans)
  * Nouvelle shape de réponse: {refreshed, created, processed, lotIds, appUrl, note}
  * Expose appUrl pour debug

- Amélioré page not-found /p/[lotId] (src/app/p/[lotId]/page.tsx):
  * Affiche l'URL scannée dans une boîte grise discrète
  * Affiche le lotId tenté
  * Bouton 'Copier l'URL' pour faciliter le support
  * Explication pour le fabricant

- Amélioré RegenerateQrButton + RegenerateAllQrButton (src/app/dashboard/lots/delete-lot-button.tsx):
  * Toast affiche maintenant l'appUrl utilisé pour la régénération
  * L'utilisateur peut immédiatement vérifier si l'URL est correcte

- Créé src/app/dashboard/qr-codes/qr-diagnostic-banner.tsx (client component):
  * Fetch /api/debug/qr-check au montage
  * Affiche une bannière jaune si problème détecté (0 lots, 0 QR actifs, appUrl vide)
  * Affiche les totaux + l'URL courante + le diagnostic

- Ajouté bouton 'Diagnostiquer' sur /dashboard/qr-codes qui ouvre /api/debug/qr-check dans un nouvel onglet.

- Build vérifié: npx next build → 20.1s, 70 pages, 0 errors.
- Commit 72c6161 poussé sur origin/main.

Stage Summary:
- 3 problèmes adressés en un seul commit:
  1. Fallback lotNumber dans l'API publique — les anciens QR codes avec lotNumber au lieu de lot ID continuent de fonctionner
  2. refresh-all crée maintenant des QR codes pour les lots qui n'en ont pas — après un wipe DB, cliquer sur 'Régénérer tous les QR' reconstruit tout
  3. Endpoint de diagnostic /api/debug/qr-check + bannière dashboard permettent de comprendre immédiatement pourquoi les QR 404
- L'utilisateur peut maintenant:
  a. Aller sur /dashboard/qr-codes → voir la bannière jaune avec le diagnostic
  b. Cliquer sur 'Diagnostiquer' pour voir le détail (appUrl, env, headers, lots)
  c. Cliquer sur 'Régénérer tous les QR' — l'URL encodée s'affiche dans le toast
  d. Scanner le QR — si 404, la page affiche l'URL scannée + le lotId pour debug
- Prochaine étape: redéployer sur Coolify (le build va recompiler avec ces changements).

---
Task ID: fix-b2BReview-casing
Agent: main (Super Z)
Task: User reports "les produits affiche sur le qrcode et la page produit Produit introuvable" avec URL scannée https://verifscan.roomscan.pro/p/cms24ba7q0003rn01uq808ihk

Work Log:
- Diagnostic production via GET /api/debug/qr-check (déployé au commit précédent):
  * appUrl: https://verifscan.roomscan.pro ✓
  * env: NEXT_PUBLIC_APP_URL + NEXTAUTH_URL tous deux définis ✓
  * DB: 1 lot (cms24gf7j0009rn018u8skmo0 — Confiture Bonne Maman), 1 QR actif, 0 scans
  * Le lot scanné par l'utilisateur (cms24ba7q0003rn01uq808ihk) N'EXISTE PAS en DB

- Testé /api/lots/cms24gf7j0009rn018u8skmo0 (le lot qui EXISTE) → HTTP 500!
- Testé /api/lots/cms24ba7q0003rn01uq808ihk (lot utilisateur) → HTTP 404 (normal, n'existe pas)

- Bug 500 identifié: dans src/app/api/lots/[id]/route.ts, les requêtes d'enrichissement
  utilisaient db.b2bReview (lowercase b) au lieu de db.b2BReview (capital B après '2').
  Prisma génère les accessors en camelCase selon la règle PascalCase → camelCase:
    B2BReview → b2BReview (PAS b2bReview)
  Du coup Promise.all rejetait avec 'Cannot read properties of undefined (reading findMany)',
  l'API retournait 500, et la page /p/[lotId] catchait l'erreur et affichait 'Produit introuvable'.

- Repro local: créé scripts/test-enrichment.cjs qui exécute le même Promise.all sur un lot local.
  Avant fix: ✗ ERROR 'Cannot read properties of undefined'.
  Après fix: ✓ All enrichment queries succeeded (certifications: 0, scanAgg: 98 scans,
  similarProducts: 3, reviews: 0, anomalies: 0).

- Vérifié que tous les autres fichiers du codebase utilisent déjà la bonne casse:
  db.b2BProduct, db.b2BOrder, db.b2BReview, db.b2BMessage — partout ailleurs c'est correct.
  Seul /api/lots/[id]/route.ts avait le bug.

- Fix appliqué: 2 occurrences db.b2bReview → db.b2BReview dans src/app/api/lots/[id]/route.ts.

- Build vérifié: npx next build → 21.9s, 70 pages, 0 errors.
- Commit d249f90 poussé sur origin/main.

Stage Summary:
- Bug critique résolu: la page produit publique /p/[lotId] marchait pour AUCUN lot parce que
  l'API /api/lots/[id] crashait en 500 à cause de la mauvaise casse Prisma.
- Après redéploiement Coolify, le lot existant (cms24gf7j0009rn018u8skmo0) sera consultable.
- L'URL scannée par l'utilisateur (cms24ba7q0003rn01uq808ihk) pointe vers un lot qui n'existe
  plus en DB — probablement un lot créé avant un wipe DB. Solutions:
  1. Si l'utilisateur a le lotNumber (01022), l'API le trouvera via le fallback lotNumber
     ajouté au commit précédent.
  2. Sinon, l'utilisateur doit recréer le lot et reimprimer le QR code.
- Prochaine étape: attendre le redéploiement Coolify puis tester à nouveau.

---
Task ID: landing-v5-redesign
Agent: main (Super Z)
Task: Redesign complet de la page d'accueil selon spec détaillée (7 sections, gradients, animations)

Work Log:
- Lu l'état actuel des 7 composants landing + globals.css.
- Ajouté à globals.css (200+ lignes de nouveaux tokens + animations):
  * --gradient-primary, --gradient-secondary, --gradient-hero, --shadow-card, --shadow-card-hover, --shadow-popular
  * vs-hero-bg: gradient subtil bleu→vert→blanc
  * vs-particles: particules animées (CSS pur, 2 couches drift infini)
  * vs-phone-3d: tilt perspective 1200px rotateY(-8deg) rotateX(4deg), hover réduit l'angle
  * vs-qr-pulse: scale 1→1.05 + box-shadow 0→12px toutes les 3s
  * vs-badge-new: rotation -6deg + translateY -4px (badge 'Nouveau' flottant)
  * vs-card-lift: translateY(-6px) + shadow-card-hover au hover
  * vs-icon-circle-blue/green/orange: cercles dégradés 64x64 avec ombre
  * vs-link-arrow: gap 0.4rem→0.7rem + translateX(2px) au hover (slide arrow)
  * vs-timeline-h: ligne horizontale qui scale de 0→1 sur 1.2s (desktop only)
  * vs-step-circle: cercle 64x64 dégradé bleu→vert + anneau extérieur
  * vs-popular-card: bordure dégradée (pseudo-element ::before)
  * vs-quote-mark: guillemet décoratif Georgia 5rem
  * vs-carousel: scroll smooth + scrollbar cachée
  * vs-stat-number: tabular-nums pour alignement des chiffres
  * vs-cta-pulse: box-shadow animée toutes les 2.5s
  * vs-section-soft: gradient blanc→gris-50

- Hero section (hero-section.tsx):
  * Badge 'Sécurisé par blockchain' (au lieu de 'Passeport numérique')
  * H1 plus court: 'La traçabilité alimentaire qui inspire confiance'
  * Sous-titre: 'Le passeport numérique qui protège votre marque...'
  * 2 CTAs: 'Essai gratuit 14 jours →' + 'Voir une démo'
  * Ligne de réassurance: Sans CB, Annulation libre, Config 5 min
  * Smartphone mockup 3D (vs-phone-3d) avec rotation perspective
  * QR code pulse toutes les 3s (vs-qr-pulse)
  * Badge 'Nouveau' flottant sur le produit (vs-badge-new)
  * Particules animées en arrière-plan (vs-particles)
  * Logos clients avec emojis (Sarine Bio 🌿, Téranga Foods 🍽️, etc.)

- Features section (features-section.tsx):
  * 3 cards avec icônes en cercles dégradés (vs-icon-circle-blue/green/orange)
  * Liste à puces concrète par feature (3 bullets chacune)
  * Bouton 'En savoir plus →' avec slide (vs-link-arrow)
  * Card hover lift (vs-card-lift)
  * Illustration dashboard en dessous: 2 KPI cards + bar chart 14 jours
  * Fond section vs-section-soft

- How It Works (how-it-works-section.tsx):
  * Badge 'Simple & rapide' avec icône Zap
  * H2 'Commencez en moins de 5 minutes'
  * Timeline horizontale animée (vs-timeline-h) qui se déploie au scroll
  * Cercles numérotés 1, 2, 3 avec dégradé + anneau (vs-step-circle)
  * Card sous chaque étape avec icône + description courte
  * Illustration processus: Produit → QR Code → Scan → Authentifié
    avec flèches + ligne géo en bas
  * CTA 'Démarrer maintenant' en bas

- Testimonials (testimonials-section.tsx):
  * 6 témoignages (au lieu de 3) avec carousel
  * Photos emoji avatars (👩🏾‍🦱, 👨🏾, etc.) dans cercles colorés
  * Étoiles avec animation pop échelonnée (vs-star-pop)
  * Badge métrique par témoignage (ex: '+35% de ventes en 3 mois')
  * Carousel avec flèches prev/next + indicateurs points
  * Scroll horizontal smooth (vs-carousel)
  * Bordure gauche colorée par témoignage
  * Guillemet décoratif (vs-quote-mark)
  * Bandeau trust badges en bas (250+, 4.9/5, 12 458, 4 pays)

- Stats section (stats-section.tsx):
  * 4 stat cards sur fond bleu gradient
  * Icône au-dessus dans carré dégradé (vs-icon-circle style)
  * Count-up animé (useRevealCounter) préservé
  * Chiffres plus grands (text-5xl sm:text-6xl) avec tabular-nums
  * Badge '14 jours d'essai gratuit' avec pulse en bas

- Pricing section (pricing-section.tsx):
  * Toggle Mensuel / Annuel (-30%) en haut
  * 3 plans: Starter, Pro (populaire), Business
  * Badge 'Le plus populaire' sur Pro avec dégradé
  * Card Pro avec bordure dégradée (vs-popular-card)
  * Prix qui se met à jour live quand on toggle mensuel/annuel
  * Affiche l'économie annuelle en vert quand annuel sélectionné
  * CTA du plan populaire avec vs-cta-pulse
  * Liste features avec checkmarks dans cercles colorés

- Final CTA (final-cta-section.tsx):
  * Card avec bordure dégradée (vs-popular-card)
  * Badge 'Démarrez aujourd'hui' avec icône Rocket
  * H2 'Prêt à renforcer la confiance de vos clients ?'
  * 2 CTAs: 'Créer votre compte gratuit →' (pulse) + 'Voir une démo'
  * 4 cards avantages avec icônes (14 jours, Aucun engagement, Support, Config 5min)
  * Social proof: stack d'avatars + 'Rejoint par 12 nouveaux fabricants cette semaine'

- Build vérifié: npx next build → 21.3s, 70 pages, 0 errors.
- Commit 56485ad poussé sur origin/main.

Stage Summary:
- Page d'accueil entièrement redessinée selon spec:
  * Hero plus engageant avec mockup 3D + QR pulse + badge Nouveau
  * Features avec icônes dégradées + bullets + illustration dashboard
  * How It Works avec timeline animée + illustration processus
  * Testimonials avec carousel + 6 témoignages + métriques
  * Stats avec icônes au-dessus + count-up + badge essai
  * Pricing avec toggle mensuel/annuel + card populaire dégradée
  * Final CTA avec cards avantages + social proof
- 200+ lignes de CSS ajoutées (tokens gradients/shadows + 15+ animations)
- Toutes les animations respectent prefers-reduced-motion
- Build passe sans erreur, 70 pages statiques
- Prochaine étape: redéployer sur Coolify pour voir le résultat en production

---
Task ID: landing-v6-wider-hero-image
Agent: Super Z (main)
Task: Changer l'image du hero et mettre le site en version large

Work Log:
- Généré une nouvelle illustration hero 3D via z-ai-web-dev-sdk (1344x768, ~94 KB) → public/hero/hero-main.png
  - Prompt: smartphone scannant un QR code sur une bouteille de jus, UI cards flottantes (checkmark authentique, shield blockchain, map pin Dakar, calendrier), gradient bleu→vert, style 3D premium moderne
  - Script persisté: scripts/gen-hero-image.ts (re-exécutable pour régénérer l'image)
- Remplacé la maquette smartphone CSS dans hero-section.tsx par:
  - Composant <Image> Next.js (prioritaire, srcset responsive 384w→3840w via /_next/image)
  - Cadre arrondi 2rem avec bordure blanche + ombre douce
  - Conservation des cartes flottantes (ShieldCheck blockchain, Smartphone 0.3s, ScanLine orange, badge "Authentique")
  - Suppression des icônes Calendar/ListChecks/MapPin/QrCode/Sparkles (n'était plus utilisées après suppression du mockup)
- Élargi le conteneur du site de max-w-7xl (1280px) → max-w-[1440px] sur:
  - public-header.tsx
  - public-footer.tsx
  - hero-section.tsx, features-section.tsx, how-it-works-section.tsx, testimonials-section.tsx, stats-section.tsx, pricing-section.tsx
  - Padding desktop passé de lg:px-8 → lg:px-10
- Section final-cta conservée à max-w-5xl (intentionnel — CTA focalisé fonctionne mieux avec largeur contenue)
- Vérifié:
  - tsc --noEmit: aucune nouvelle erreur (erreurs pré-existantes dans admin/examples/scripts uniquement)
  - next dev: HTTP 200 sur / en 3.3s compile
  - Image servie: HTTP 200, 94452 bytes sur /hero/hero-main.png
  - Homepage référence bien l'image via /_next/image (responsive srcset)

Stage Summary:
- Hero visuel: maquette smartphone CSS remplacée par illustration 3D générée par IA
- Layout: site élargi à 1440px (gain ~160px de largeur utile vs 1280px précédent)
- Artéfacts: public/hero/hero-main.png (image), scripts/gen-hero-image.ts (script de regénération)
- Tous les fichiers modifiés: 6 sections landing + header + footer

---
Task ID: landing-v7-color-harmony-product-redesign
Agent: Super Z (main)
Task: Régénérer l'image hero (scan sur produit), fonds colorés bleu/vert pour les 3 cards Features, harmoniser les couleurs du site en #0f4382 / #2ebd5a, supprimer la section tarifs, redessiner la page produit avec 10 sections style QRTags

Work Log:
- Régénéré l'image hero (1344x768, ~90 KB) → public/hero/hero-main.png
  - Nouveau prompt: photo réaliste d'une main africaine scannant un QR code sur un pot de confiture avec smartphone, écran affichant un checkmark vert, palette #0f4382 + #2ebd5a, style commercial premium
  - Script scripts/gen-hero-image.ts mis à jour avec le nouveau prompt
- Harmonisé les couleurs du site dans globals.css:
  - --vs-blue: #2563EB → #0f4382 (deep navy)
  - --vs-blue-dark: #1D4ED8 → #0a3060
  - --vs-green: #10B981 → #2ebd5a (fresh green)
  - --vs-green-dark: #047857 → #1f8a42
  - --vs-footer: #111827 → #0a3060 (cohérent avec le nouveau bleu)
  - Tous les oklch() primary/ring/chart/sidebar mis à jour
  - Gradients CSS (.vs-gradient-hero, .vs-gradient-text, .vs-gradient-blue, .vs-gradient-green) mis à jour
  - Shadows et keyframes pulse mis à jour avec nouvelles teintes rgba
- Appliqué la couleur harmonisée sur TOUS les fichiers source via sed:
  - 25 fichiers modifiés (landing + admin + lib + components)
  - Vérifié: plus aucun #2563EB/#10B981/#1D4ED8/#047857 dans src/
- Refait la section Features (features-section.tsx):
  - Card 1: fond solide bleu #0f4382, texte blanc
  - Card 2: fond solide vert #2ebd5a, texte blanc
  - Card 3: fond solide bleu #0f4382, texte blanc (alternance)
  - Cercle d'icône en blanc translucide (rgba 0.15-0.18)
  - Glow décoratif dans le coin supérieur droit (couleur alternée)
  - Barre d'accent au survol (couleur alternée)
  - Cartes supprimées de l'ancien fond blanc avec bordure grise
- Supprimé la section Pricing du site:
  - src/app/page.tsx: import et composant <PricingSection /> retirés
  - src/components/public-header.tsx: lien "Prix" /#pricing retiré de la nav
  - Le fichier pricing-section.tsx est conservé (au cas où on voudrait le réactiver)
- Redessiné complètement la page produit /p/[lotId]/page.tsx (1255 → ~1100 lignes):
  - Section 1 — Header authentification: bandeau gradient vert→blanc avec bordure 2px verte, icône ronde verte, animation pulse douce, message "PRODUIT AUTHENTIQUE ET VÉRIFIÉ" en majuscules
  - Section 2 — Stats rapides (4 cards colorées style QRTags): alternance bleu/vert, icône ronde en fond solide, valeur en gras, libellé en majuscules
  - Section 3 — Carte produit principale: layout 300px photo + info, photo dans gradient bleu→vert, badge "Nouveau" flottant, badges catégorie/poids/nouveau
  - Section 4 — Informations de traçabilité (grille colorée):
    * Numéro de lot: bloc jaune clair (ORANGE_LIGHT)
    * Date fabrication: bloc vert (GREEN_LIGHT + GREEN_DARK)
    * Date péremption: bloc orange (ORANGE_LIGHT + #92400E)
    * Lieu fabrication: bloc bleu (BLUE_LIGHT + BLUE)
    * Lieu transformation: bloc vert
    * Pays de vente: bloc jaune, pleine largeur
    * Chaque bloc a icône ronde colorée + label majuscule + valeur en gras
  - Section 5 — Timeline historique: ligne verticale gradient vert→bleu→orange, cercles colorés 8px (vert/violet/bleu/orange/rouge selon étape), chaque étape dans une card pastel avec fond coloré léger
  - Section 6 — Certifications: grille 3 colonnes, badges colorés avec icône 5xl, border-2 ton sur ton, hover -translate-y-1 + shadow
  - Section 7 — Allergènes: bandeau jaune clair avec bordure 2px orange, badges allergènes colorés selon tone, avertissement sanitaire dans sous-bloc blanc/60
  - Section 8 — QR + Contact: 2 colonnes, QR dans cadre blanc border-2, contact avec boutons WhatsApp vert (#25D366), Phone vert, Email bleu
  - Section 9 — Avis & Notes: note moyenne 5xl, étoiles animées en cascade, barres de rating avec gradient bleu→vert (au lieu d'amber), avis dans cards gray-50
  - Section 10 — Badge final "Vérifié par VerifScan": grand bloc gradient vert, icône shield blanche en cercle translucide, boutons Partager/WhatsApp/Facebook
  - Constantes couleur en haut de fichier: BLUE, BLUE_DARK, BLUE_LIGHT, GREEN, GREEN_DARK, GREEN_LIGHT, ORANGE, ORANGE_LIGHT
  - Composants internes: Reveal, QuickStat, ColorBlock, Timeline, RatingBar (tous utilisent les constantes couleur au lieu de classes Tailwind blue/emerald)
  - Supprimé les imports Card/CardContent (plus utilisés) et Truck/FileText (plus utilisés)
- Footer: bg #111827 → #0a3060, border #374151 → #1f3a5f (cohérent avec nouvelle palette)
- Vérifié:
  - tsc --noEmit: aucune erreur sur les fichiers modifiés
  - next dev (Turbopack): HTTP 200 sur / et /p/test
  - Hero image servie: HTTP 200, 89782 bytes
  - Section pricing absente du HTML rendu (grep "id=\"pricing\"" → 0 occurrence)
  - Couleurs harmonisées: plus aucun #2563EB/#10B981 dans src/

Stage Summary:
- Image hero: photo réaliste main+smartphone+QR (remplace l'illustration 3D précédente)
- Couleurs harmonisées: #0f4382 (blue) + #2ebd5a (green) partout sur le site (25 fichiers)
- Features: 3 cards fond solide alternées bleu/vert/bleu avec texte blanc
- Pricing: section supprimée de la home + lien nav supprimé
- Page produit: 10 sections QRTags-style avec blocs colorés (bleu/vert/jaune/orange), timeline avec cercles colorés, certifications en grille 3 col, allergènes en bandeau jaune, badge final gradient vert
- Footer: palette alignée sur le bleu deep #0a3060
- Artéfacts: public/hero/hero-main.png (régénérée), scripts/gen-hero-image.ts (prompt mis à jour)

---
Task ID: logo-integration
Agent: Super Z (main)
Task: Intégrer le logo fourni (upload 7abff173...) sur le site

Work Log:
- Analysé le PNG uploadé (275x70, RGBA, fond blanc opaque, contenu 256x50 centré)
  - Couleurs dominantes du contenu: #003070 (deep blue) + #009050 (vivid green) — déjà alignées sur la palette brand #0f4382 + #2ebd5a
- Préparé le logo via scripts/prepare-logo.py:
  - Seuil blanc (R,G,B ≥ 230) → alpha=0 (transparence)
  - Auto-crop sur bounding box du contenu + padding 8px
  - Sortie: public/logo.png (272x66, 82% pixels transparents, ~16 KB)
- Réécrit src/components/verifscan-logo.tsx:
  - Remplacé l'icône CSS (gradient bleu→vert + ScanLine lucide) + texte "VerifScan" par <Image src="/logo.png">
  - Le wordmark étant déjà dans l'image, showText est gardé pour backward-compat mais sans effet visuel
  - Sizes sm/md/lg/xl mappés sur hauteurs 28/36/48/64px, largeur auto via aspect ratio 272/66
  - variant="light" ajoute drop-shadow pour les fonds sombres (footer)
  - priority + alt="VerifScan" pour LCP et accessibilité
- Mis à jour src/app/layout.tsx:
  - metadata.icons: icon + apple → /logo.png (favicon)
  - metadata.openGraph.images: [{ url: "/logo.png", width: 272, height: 66, alt: "VerifScan" }]
- Vérifié sur dev server (Next 16.1.3 Turbopack):
  - GET /logo.png → 200, 15937 bytes
  - GET / → 200 en 5.4s (compile)
  - HTML rendu contient 2 <img alt="VerifScan"> : header (148x36, md) + footer (198x48, lg avec drop-shadow)
  - Les deux référencent /_next/image?url=%2Flogo.png (pipeline image optimization)
- Commit + push origin/main: 9e0f311

Stage Summary:
- Nouveau logo brand intégré partout: header (md), footer (lg + drop-shadow sur fond navy), favicon, OpenGraph
- Logo PNG transparent (272x66, ~16 KB) — fonctionne sur fond blanc (header/sidebar) ET fond sombre (footer #0a3060)
- API VerifScanLogo conservée (size/variant/showText) — aucun changement requis dans les 4 fichiers consommateurs
- Artéfacts: public/logo.png, scripts/prepare-logo.py (re-exécutable)

---
Task ID: product-page-ux-reviews
Agent: Super Z (main)
Task: Page produit — fix flash orange, supprimer 4 stats cards, déplacer ingrédients sous description, alerte péremption rouge (10j/5j/périmé), notification avis à 15s avec publication auto + email au fabricant

Work Log:
- Bug "flash orange cards": remplacé le Skeleton (barres grises) par un spinner minimal centré avec libellé "Vérification du produit…". Plus aucun placeholder en forme de card pendant le chargement.
- Supprimé la section "2. STATS RAPIDES — 4 cards colorées" (Scans / Vérifié / Dernier scan / Fabricant inscrit). Composant QuickStat supprimé. Imports inutilisés nettoyés (Eye, Skeleton).
- Déplacé les ingrédients de la card de traçabilité (section 3) vers la card produit principale (section 2), juste sous la description. Icône Leaf verte + label "Ingrédients" en majuscules.
- Ajouté une bannière rouge dédiée "1.bis ALERTE DE PÉREMPTION" qui s'affiche quand remainingDays ≤ 10 (non rappelé):
  * 6-10 jours: rouge léger "À consommer rapidement — X jours restants"
  * 1-5 jours: rouge plus fort "Bientôt périmé — plus que X jour(s) !"
  * Périmé: rouge foncé "Produit périmé" + message "ne doit plus être consommé"
  * 3 gradients + 3 couleurs de bordure différentes selon le niveau
  * Icône AlertTriangle pulsante (ou XCircle si périmé)
- Modifié la section 1 (auth banner): supprimé la branche "expired" orange (redondante avec la nouvelle alerte rouge). Affiche toujours "Authentic" (vert) sauf si rappelé — l'authenticité et la péremption sont 2 sujets séparés.
- Ajouté un timer 15s après le chargement du lot → toast Sonner "Donnez votre avis sur ce produit" avec bouton action "Laisser un avis". Garde reviewNotified pour ne pas renotifier. Skipped pour les lots rappelés.
- Ajouté un composant ReviewModal:
  * Picker 1-5 étoiles avec hover state + label contextuel (Très déçu → Excellent)
  * Commentaire optionnel (max 2000 chars, compteur)
  * Nom optionnel (max 100), téléphone optionnel (max 30)
  * Submit POST /api/lots/[id]/reviews
  * État succès avec CheckCircle2 + auto-close après 1.8s
  * Esc to close, backdrop click to close, scroll lock pendant l'ouverture
  * Mise à jour optimiste : onSubmitted ajoute le nouvel avis en tête de liste + recalcule la moyenne
- Section 8 (Avis & Notes) réécrite:
  * Bouton "Laisser un avis" dans l'en-tête (ouvre le modal)
  * Badge total (productReviews + b2bReviews)
  * Sous-section 8.a "Avis consommateurs" : moyenne + compteur + 5 derniers avis
  * Sous-section 8.b "Avis B2B" (distributeurs) : moyenne + 3 RatingBars + 3 derniers avis
  * Si 0 avis partout : empty state avec bouton "Laisser un avis"
- Backend:
  * Nouveau modèle Prisma ProductReview (lotId, productId, fabricantId, rating 1-5, comment, reviewerName, reviewerPhone) + relations Lot.productReviews, Product.productReviews, User.productReviewsReceived
  * prisma db push → schéma synchronisé sur SQLite
  * Nouveau fichier src/lib/email.ts: nodemailer + readSmtpEnv (SMTP_HOST/PORT/USER/PASS/FROM/FROM_NAME). Fallback ethereal test account si SMTP non configuré (preview URL loggé). sendReviewNotificationEmail() avec template HTML branded (gradient blue→green, table product/lot/rating, bloc commentaire).
  * Nouveau endpoint POST /api/lots/[id]/reviews (public, sans auth):
    - Valide rating 1-5, comment ≤ 2000, name ≤ 100, phone ≤ 30
    - Crée le ProductReview
    - createNotification() au fabricant (type b2b_message — le plus proche existant)
    - sendReviewNotificationEmail() au fabricant (best-effort, non-bloquant)
    - Retourne 201 avec le review créé
  * Nouveau endpoint GET /api/lots/[id]/reviews (public): 20 derniers avis + aggregates
  * Mis à jour GET /api/lots/[id]: ajoute productReviews (10 derniers) + productReviewAggregates {average, count}
- Testé sur dev server:
  * GET /p/cms0synuq000hmq618cuiiriz → 200, HTML montre le spinner "Vérification du produit" (page client-side)
  * GET /api/lots/[id] → 200, productReviews:[] + aggregates {average:0, count:0}
  * POST /api/lots/[id]/reviews {rating:5, comment:"Produit excellent…", reviewerName:"Awa D."} → 201, review créé avec id
  * GET /api/lots/[id]/reviews → 200, aggregates {average:5, count:1}, top review = Awa D. 5/5
  * GET /api/lots/[id] (après POST) → productReviews contient le nouvel avis, aggregates {average:5, count:1}
  * Notification INSERT visible dans dev.log (in-app notif créée pour le fabricant)
- Dépendance: bun add nodemailer@9.0.3 → bun.lock créé
- tsc --noEmit: 0 erreur dans les fichiers modifiés
- Commit + push origin/main: 807991a

Stage Summary:
- Page produit: 5 changements UX (flash orange corrigé, 4 stats cards supprimées, ingrédients déplacés, alerte péremption rouge 3 niveaux, notification + modal avis)
- Nouveau flow d'avis consommateurs: notification auto à 15s → modal → POST → publication immédiate + email au fabricant + notif in-app
- Backend: nouveau modèle ProductReview, nouveau lib/email.ts (nodemailer + fallback ethereal), 2 nouveaux endpoints API, GET lots étendu
- Pour activer les emails réels en prod: set SMTP_HOST/PORT/USER/PASS/FROM env vars (sinon fallback ethereal qui logge un preview URL)
- Artéfacts: src/lib/email.ts, src/app/api/lots/[id]/reviews/route.ts, scripts/prepare-logo.py (re-exécutable)

---
Task ID: phase3-pdf-certs-and-export-edit
Agent: Super Z (main)
Task: Phase 3 — Upload certificats PDF + champs export dans édition produit

Work Log:
- Créé endpoint DELETE /api/certifications/[id] (suppression d'une cert manuelle, refus si vérifiée)
- Créé endpoint PUT /api/certifications/[id] (édition issuer, n°, dates, documentUrl; refus si vérifiée)
- Étendu les types de cert valides dans POST /api/certifications: ajout de phytosanitaire, globalgap, origine
- Refonte complète de /dashboard/certifications:
  * Section "Mes certificats PDF" avec upload PDF (max 10 MB, application/pdf)
  * Formulaire: type (10 options), issuer, n° cert, dates émission/expiration, PDF file OU URL externe
  * Liste des certs manuels avec badge type, statut (vérifié / en attente), dates, lien téléchargement PDF
  * Bouton supprimer (désactivé pour certs vérifiés)
  * Conservation de la section sync auto (SONAC, Halal, Bio, ISO)
  * Note d'info: les certificats vérifiés ne peuvent pas être supprimés
- Ajout endpoint GET + PUT /api/products/[id]:
  * GET récupère produit avec catégorie (pageTemplate) pour détecter export_produce
  * PUT met à jour tous les champs y compris export (variety, regionOfProduction, producerStory, producerPhotoUrl, gpsLat, gpsLng)
  * Validation Zod, vérification ownership, nettoyage des champs vides → null
  * Vérifie que la catégorie existe si elle change
- Refonte /dashboard/produits/[id]/modifier:
  * Chargement initial des champs export existants (variety, region, producerStory, photos, GPS)
  * Upload photo produit + photo producteur (deux boutons séparés)
  * Champs conditionnels affichés si catégorie = export_produce (badge bleu)
  * Coordonnées GPS lat/lng avec astuce Google Maps
  * Bouton "Retirer" pour les photos
  * Correction bug critique: la page faisait un PUT sur /api/products/[id] qui n'existait pas !
- Vérifications:
  * tsc --noEmit: aucune nouvelle erreur sur les fichiers modifiés (erreurs pré-existantes dans sync/route.ts non touchées)
  * next build: ✓ Compiled successfully in 23.5s, 70 pages générées
  * next dev: routes accessibles
    - GET /dashboard/certifications → 307 (redirect login, OK)
    - GET /api/certifications → 401 (auth requise, OK)
    - DELETE /api/certifications/test-id → 401 (auth requise, OK)
- Commit + push origin/main: 0d06992

Stage Summary:
- Phase 3 complète: fabricants peuvent maintenant téléverser leurs certificats PDF (phytosanitaire, GlobalG.A.P., origine, bio, HACCP, ISO 22000, etc.) qui apparaîtront automatiquement sur la page produit publique avec lien de téléchargement direct
- Bug critique corrigé: l'édition de produit était cassée (endpoint PUT manquant)
- Champs export (variety, region, producerStory, photo, GPS) désormais éditables dans /dashboard/produits/[id]/modifier
- 5 fichiers modifiés, 1 nouveau fichier, +1240 lignes / -76 lignes
- Artéfacts: src/app/api/certifications/[id]/route.ts (nouveau), src/app/api/products/[id]/route.ts (GET+PUT ajoutés), /dashboard/certifications/page.tsx (refonte), /dashboard/produits/[id]/modifier/page.tsx (refonte)
