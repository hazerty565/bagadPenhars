# Plan d'implémentation — Site Bagad Penhars

> Rôle : **ARCHITECTE**. Je n'écris que dans `equipe/PLAN.md`, `equipe/CONTRAT_API.md` et `docs/questions.md` ; je ne code pas et je ne lance aucune commande. Ce plan fait foi pour le développeur backend, le développeur frontend, le testeur et le mainteneur.
>
> **Version du 2026-11-17.** Établie après lecture de `AGENTS.md`, `docs/brief.md`, `docs/journal.md` (jusqu'au 2026-11-15), `docs/Spec.md`, `docs/architecture.md`, `docs/database.md`, `docs/pwa.md`, `docs/media.md`, `docs/event.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/questions.md`, de l'état réel des routes, des chargements publics et des commandes serveur de l'espace adhérents. Les sections 1 à 10 du plan du 2026-11-08 sont remplacées par le présent document ; **l'annexe A conserve les étapes 1 à 35 avec leur état au 2026-11-17**.
>
> **Conflit de priorité :** en cas de contradiction entre ce plan et `AGENTS.md`, `AGENTS.md` prévaut et l'écart est signalé dans `docs/questions.md`. Aucune règle métier n'est inventée : tout point non tranché est une question ouverte (§0 et §6).

## 0. Questions ouvertes (tête de plan)

Ces quatre questions bloquent une étape précise. Elles sont détaillées dans `docs/questions.md` (section 2026-11-17). Le reste du plan est exécutable sans elles.

| Question | Sujet | Bloque | Recommandation de l'architecte |
| --- | --- | --- | --- |
| **Q-2026-11-17-01** | Motion exigé par `AGENTS.md`, absent du dépôt et inutilisé | Étape 46 | **A** — acter l'absence, animations CSS respectant `prefers-reduced-motion`, mettre `AGENTS.md` à jour |
| **Q-2026-11-17-02** | Lien d'invitation : Spec §4.2 = 1 h, code = 7 jours | Étape 45 | **A** — appliquer la Spec (1 h) |
| **Q-2026-11-17-03** | Photo de profil réelle vs palette illustrée 1–12 | Étape 43 | **A** — photo réelle, palette en repli |
| **Q-2026-11-17-04** | `category`, `image`, `imageAlt` de l'article public absents de la table | Étape 38 | **A** — migration additive de colonnes nullables, interface inchangée |

**Q-2026-11-09-01 (i18n)** reste ouverte et **ne bloque rien** : les dictionnaires typés de `src/lib/i18n/` restent la référence tant qu'elle n'est pas tranchée. Aucune page publique nouvelle n'est créée dans cette session.

## 1. Besoin (2 phrases max)

Le client demande de reprendre le projet à son état réel et de le mener jusqu'en production : le design public (99 %) et l'espace adhérents (98 %) sont figés, il reste à brancher les données réelles, à verrouiller les autorisations, à tester et à déployer, sans refonte graphique. Les 1 % et 2 % restants sont réservés aux correctifs fonctionnels et d'accessibilité strictement nécessaires.

## 2. Décisions techniques

### 2.1 Périmètre exact de la session

**Dans le périmètre** (chaque ligne est couverte par une étape du §3) :

| Élément | Pourquoi il entre dans la session |
| --- | --- |
| Agenda, actualités et galerie publics branchés sur Neon | Les trois dernières sources publiques provisoires (`src/lib/data/agenda.ts`, `articles.ts`, `site.ts → homeGallery`) ; sans elles le site public affiche encore des données de démonstration. |
| `GET /api/files/[...key]` et téléversements réels (documents PDF, photos d'album, photo de profil) | Le fichier de route est vide et `document.create` n'écrit qu'une ligne de métadonnées (`size: 0`, aucun objet R2) : aucune pièce jointe n'est réellement stockée ni servie. |
| Quota 8 Go / alerte 7 Go / blocage 8 Go sur les téléversements | Le schéma est en `bigint` et les seuils existent, mais aucun upload ne les fait varier. |
| Durcissement serveur des règles de gestion d'événements | Écart réel : un chef peut créer ou modifier un événement avec une visibilité `public`/`interne` alors que la règle validée est « chef = un seul de ses pupitres, visibilité `pupitre` ». |
| Envoi OneSignal côté serveur et journal d'envoi | `notification.send` écrit en base mais n'envoie rien ; les préférences existent et ne sont pas appliquées. |
| Tests d'autorisation, de RLS et du parcours d'invitation | `tests/guards.test.ts`, `tests/i18n.test.ts` et `tests/invitation.test.ts` sont vides ; aucune preuve automatique des refus. |
| Suppression des routes historiques `src/routes/public/...`, sitemap réel, correctifs d'accessibilité et de mobile | Le site public actuel vit sous `(public)` ; l'ancienne arborescence répond encore. Sitemap vide. |
| Mise en production Cloudflare Pages (Hyperdrive `bagad-prod` → Neon `production`) | Dernière étape du roadmap, jamais exécutée. |
| Assainissement des dépendances signalées par Dependabot | 57 alertes dont 2 critiques, listées comme reste à faire au journal du 2026-11-15. |

**Hors périmètre de cette session** (et pourquoi) :

| Élément | Raison de l'exclusion |
| --- | --- |
| Refonte graphique publique ou privée | Design figé à 99 % / 98 % ; seuls les correctifs nécessaires sont admis. |
| Paiement, cotisation en ligne, inscription libre, annuaire public des membres | Hors périmètre absolu du `docs/brief.md`. |
| Éditeur d'articles Milkdown | Fonctionnel aujourd'hui avec un formulaire Markdown ; paquet non installé, mise à niveau différée (§7). |
| Champs `phone`/`address` dans le profil adhérent | Colonnes présentes, mais aucun champ correspondant dans l'interface livrée : les ajouter serait une modification d'écran non demandée. |
| Rappels planifiés J-3 (Scheduled Worker) | Décision Q-2026-11-08-07 déjà prise, mais elle dépend d'un envoi OneSignal stabilisé : planifiée après l'étape 44, hors de cette session. |
| Lecteur audio | Aucune piste fournie (Q-2026-11-09-03) ; l'état vide honnête est conservé. |
| Contenus éditoriaux à valider (accueil, Formation, Bagad, partenaires, mentions légales) | Dépendent de Q-2026-11-09-02, Q-2026-11-10-01 à -06, -08 et Q-2026-11-11-01 : validation du bureau, pas du code. |
| Montée de version majeure Tailwind 4, Zod 4, Svelte 6 | Risque de régression élevé sans valeur fonctionnelle ; traité comme risque (§8), pas comme étape. |

### 2.2 Table des décisions

| Choix | Raison |
| --- | --- |
| Langage : **TypeScript** (SvelteKit 5, runes uniquement) | Stack figée par `AGENTS.md` ; `$state`, `$derived`, `$effect`, `$props` ; interdits `export let`, `$:`, `on:click`, stores legacy pour l'état local. |
| Structure dossiers : routes SvelteKit par groupes (`(public)/[lang=lang]`, `dashboard`, `auth`, `api`) | Arborescence déjà en place et cohérente avec `docs/Structure.md` ; `(public)` porte les pages localisées, `dashboard` l'espace adhérents en français. |
| Base de données : **Neon PostgreSQL** + **Drizzle ORM** + `pg` / `drizzle-orm/node-postgres` via **Cloudflare Hyperdrive** | Décision Q-2026-11-08-01 ; `neon-serverless` est exclu au-dessus d'Hyperdrive. Les lectures privées ne passent jamais par un cache de requêtes partagé. |
| Framework : **SvelteKit 2 + adapter-cloudflare**, Better Auth pour l'identité, R2 pour les objets | Stack cible du brief ; Better Auth ne porte que l'identité et la session, jamais le rôle métier. |
| **Surface unique de mutation de l'espace adhérents : `POST /api/member/action`** (`{ action, payload }` → `{ snapshot, result }`) | Déjà implémentée et utilisée par tous les services client. Une commande = une transaction RLS + retour d'un instantané cohérent ; évite les actions de formulaire dispersées par page. |
| **Instantané serveur (`MemberSnapshot`) comme unique source de vérité côté client** | La lecture est faite sous RLS dans `buildMemberSnapshot` ; le client n'infère jamais un droit et ne reçoit jamais un identifiant de profil en entrée. |
| **Autorisations vérifiées deux fois** : fonctions pures `src/lib/member/permissions.ts` + politiques RLS | Défense en profondeur (`AGENTS.md` §2, `docs/database.md` §2). Masquer un bouton n'est jamais une protection. |
| **Rôles lus uniquement dans `profiles.role`** (ENUM `app_role`), statut dans `profiles.account_status` | Règle de sécurité ; testé par les guards. |
| Contexte RLS : `withUserContext(profileId, cb)` → transaction + `set_config('app.profile_id', ..., true)` | Le contexte est local à la transaction et ne fuit pas sur une connexion Hyperdrive réutilisée. |
| Stockage : buckets figés `R2_PUBLIC` / `R2_PRIVATE`, aucun objet privé servi par URL publique, **aucune URL signée** | Décision Q-2026-11-08-04 ; les objets privés passent par `GET /api/files/private/...` après guard. |
| Images : original stocké dans R2, variantes produites **à la diffusion** par Cloudflare Image Resizing (400×400, 2000×2000) | Décision Q-2026-11-08-03 ; `sharp` est un binaire natif, inutilisable sur Workers. Aucune conversion WebP côté serveur. |
| Validation de taille d'image : lecture d'en-tête (paquet pur JS, §7) plutôt qu'un décodeur natif | Les contrôles 15 Mo / 6000×6000 / PDF 20 Mo doivent être faits côté serveur, avant écriture R2. |
| i18n public : dictionnaires TypeScript typés dans `src/lib/i18n/` | État livré et Q-2026-11-09-01 ; aucune chaîne en dur dans les composants ; espace adhérents en français. |
| Notifications : OneSignal appelé **uniquement côté serveur** via `fetch`, audience résolue en base | Aucun paquet nécessaire ; la clé REST ne quitte jamais le serveur ; un `playerId` client n'est jamais accepté. |
| Tests : **Vitest** (`npm run test`), tests d'autorisation et de RLS en base de test | Chaîne déjà installée (`vitest`, Playwright) ; les fichiers vides existent et doivent être remplis. |
| Packages : **aucune installation par les développeurs** ; l'architecte propose, le mainteneur vérifie, le client valide (§7) | Gouvernance `AGENTS.md` §5 et « Gouvernance des packages ». |
| Migrations : **additives uniquement**, `drizzle/` + `drizzle/meta/`, jamais de modification d'une migration appliquée | Règle absolue ; les colonnes manquantes (Q-2026-11-17-04) suivent ce chemin. |
| Déploiement : Preview = Hyperdrive `bagad-dev` → Neon `test` ; Production = `bagad-prod` → Neon `production` | Décisions Q-2026-11-14-01 ; secrets séparés par environnement, `.env` local limité au développement. |

### 2.3 Lots backend / frontend et points de jonction

Le backend ne touche pas aux composants ; le frontend ne construit jamais une clé R2, un rôle ou une permission. Les points de jonction sont contractuels (voir `equipe/CONTRAT_API.md`).

| # | Jonction | Backend fournit | Frontend consomme | Interdit |
| --- | --- | --- | --- | --- |
| **J1** | Instantané adhérent | `GET /api/member` → `{ snapshot }` ; `POST /api/member/action` → `{ snapshot, result }` | Le store applique le snapshot reçu | Recalculer un droit, envoyer `profileId` comme acteur |
| **J2** | Chargements publics | Objets de page de forme figée (`PublicAgendaEvent`, `PublicArticle`, `PublicAlbum`, `PublicPhoto`) | Composants inchangés | Changer la forme sans modifier le contrat |
| **J3** | Fichiers | URLs `avatarUrl`, `downloadUrl` construites côté serveur | Affichage et téléchargement par ces URLs | Composer une clé R2 ou une URL `r2.dev` côté client |
| **J4** | Téléversements | `POST /api/member/upload` (multipart) → `{ snapshot, result }` | Envoi du `FormData`, application du snapshot | Envoyer un chemin de stockage ou une taille déclarée |
| **J5** | Erreurs | Codes stables (`forbidden`, `event_locked`, `quota_exceeded`, …) + statut HTTP | Traduction en messages d'interface | Afficher un message brut du serveur |
| **J6** | i18n | Aucun texte localisé renvoyé par le serveur (sauf e-mails) | Tous les libellés publics dans `src/lib/i18n/` | Chaîne française en dur dans un composant public |
| **J7** | SEO | Loads exposent les données nécessaires (slug, date, langues) | `sitemap.xml` et métadonnées générés depuis ces données | Sitemap listant une page privée ou un brouillon |

## 3. Étapes

Chaque étape est livrable et testable seule, avec un maître d'œuvre unique. La numérotation continue celle de l'historique (annexe A). Une étape dont la ligne « Dépend de » cite une question `Q-2026-11-17-*` **ne démarre pas** avant arbitrage.

### Étape 36 : Durcir les règles de gestion d'événements

- **Livrable** : dans `src/lib/server/member/commands.ts` et `src/lib/member/permissions.ts`, un chef ne peut créer ou modifier un événement qu'avec `visibility = 'pupitre'` et un seul pupitre qu'il dirige ; la secrétaire et l'admin conservent `public`/`interne`/`pupitre` et le multi-pupitres. `event.update` ne peut ni élargir la visibilité ni déplacer l'événement hors du périmètre du chef. Un test unitaire couvre les refus.
- **Testable** : `event.create` par un chef avec `visibility: 'public'` renvoie 403 ; `event.update` d'un événement de son pupitre vers `visibility: 'public'` renvoie 403 ; même appel par la secrétaire renvoie 200 ; `npm run test` passe.
- **Dépend de** : rien.
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/commands.ts`, `src/lib/member/permissions.ts`, `tests/guards.test.ts`.

### Étape 37 : Brancher l'agenda public sur Neon

- **Livrable** : les chargements `GET /[lang=lang]` (`nextPublicEvents`) et `GET /[lang=lang]/agenda` lisent la table `events` : `visibility = 'public'`, `cancelled_at IS NULL`, `event_date >= (now() AT TIME ZONE 'Europe/Paris')::date` pour l'agenda à venir, tri par date ; `location` provient de `events.location`. Les composants et les formes `PublicAgendaEvent` / `PublicEvent` ne changent pas. `src/lib/data/agenda.ts` n'est plus importé par une route.
- **Testable** : avec les données de test, un événement `interne`, un événement `pupitre` et un événement annulé n'apparaissent jamais ; un événement public passé va dans « passés » ; aucune occurrence de `$lib/data/agenda` sous `src/routes/` ; le HTML rendu ne contient aucune donnée privée.
- **Dépend de** : rien (étape 36 indépendante).
- **Responsable** : Backend (load) + Frontend (vérification d'affichage).
- **Fichiers** : `src/routes/(public)/[lang=lang]/+page.server.ts`, `src/routes/(public)/[lang=lang]/agenda/+page.server.ts`, `src/lib/server/public/events.ts` (nouveau).

### Étape 38 : Brancher les actualités publiques sur Neon

- **Livrable** : `GET /[lang=lang]/articles`, `GET /[lang=lang]/articles/[slug]` et `latestArticles` de l'accueil lisent `articles` filtré sur `is_published = true` et `published_at IS NOT NULL`, triés par `published_at` décroissant. Le Markdown (`content`) est converti en `ArticleSection[]` par une fonction pure partagée, sans nouvelle dépendance. Un brouillon renvoie 404. Les champs `category`, `image`, `imageAlt` suivent la décision Q-2026-11-17-04.
- **Testable** : publier un article le fait apparaître en liste et en détail ; le dépublier le fait disparaître et renvoie 404 en direct ; un brouillon n'est jamais listé ; aucune occurrence de `$lib/data/articles` sous `src/routes/`.
- **Dépend de** : **Q-2026-11-17-04** (colonnes éditoriales). Migration additive si l'option A est retenue.
- **Responsable** : Backend (requêtes + migration) + Frontend (rendu Markdown).
- **Fichiers** : `src/routes/(public)/[lang=lang]/articles/+page.server.ts`, `src/routes/(public)/[lang=lang]/articles/[slug]/+page.server.ts`, `src/routes/(public)/[lang=lang]/+page.server.ts`, `src/lib/server/public/articles.ts` (nouveau), `src/lib/markdown.ts` (nouveau, extraction de `MarkdownView.svelte`), migration `drizzle/`.

### Étape 39 : Brancher les albums et la galerie d'accueil sur Neon

- **Livrable** : `GET /[lang=lang]/media` renvoie les albums `is_published = true` avec leurs médias ordonnés par `position`, triés par `album_date` décroissante ; `caption`, `alt` et `position` viennent de `media`. L'accueil reçoit trois photos publiques distinctes issues des albums publiés (moins de trois si la base en contient moins), avec `thumbnailUrl` / `fullUrl` construits côté serveur. `homeGallery` n'est plus utilisé par une route.
- **Testable** : un album non publié est invisible et introuvable en direct ; l'ordre affiché suit `position` ; l'accueil n'affiche aucune photo d'album non publié et trois identifiants distincts ; aucune occurrence de `homeGallery` sous `src/routes/`.
- **Dépend de** : étape 40 pour les URLs d'objets privés si un album privé est exposé ; les albums publics peuvent utiliser `public_url` avant.
- **Responsable** : Backend + Frontend.
- **Fichiers** : `src/routes/(public)/[lang=lang]/media/+page.server.ts`, `src/routes/(public)/[lang=lang]/+page.server.ts`, `src/lib/server/public/albums.ts` (nouveau).

### Étape 40 : Servir les fichiers R2 (`GET /api/files/[...key]`)

- **Livrable** : implémentation du fichier aujourd'hui vide. Clé `public/...` → flux depuis `R2_PUBLIC` avec cache public ; clé `private/...` → session + compte actif + contrôle de visibilité (avatar : propriétaire ; document : tout membre actif ; média privé : secrétaire/admin), en-tête `Cache-Control: private, no-store`, aucun objet privé introuvable révélé (404). Aucune URL signée. `src/lib/server/blobs.ts` n'appelle plus `createSignedGetUrl`.
- **Testable** : anonyme sur `private/...` → 401 ; membre A sur l'avatar de B → 403 ; document actif → 200 `application/pdf` ; clé inconnue → 404 ; aucun `createSignedGetUrl` dans `src/` ; réponse publique sans cookie.
- **Dépend de** : bindings `R2_PUBLIC` / `R2_PRIVATE` configurés (Q-2026-11-08-04 tranchée).
- **Responsable** : Backend.
- **Fichiers** : `src/routes/api/files/[...key]/+server.ts`, `src/lib/server/blobs.ts`, `wrangler.toml` / configuration Cloudflare Pages.

### Étape 41 : Téléverser réellement les documents PDF (R2 + quota)

- **Livrable** : nouvelle route `POST /api/member/upload` en `multipart/form-data`, `kind = "document"` : garde `canDepositDocument`, PDF uniquement ≤ 20 Mo, réservation de quota, écriture R2 `private/documents/{documentId}/{uuid}.pdf`, puis ligne `documents` avec la taille réelle, confirmation de quota. En cas d'échec, libération de la réservation et aucune ligne orpheline. L'interface n'appelle plus `document.create` pour un dépôt réel.
- **Testable** : PDF 20 Mo accepté, 20,1 Mo → 413, `.docx` → 415, chef hors pupitre → 403 ; `storage_usage.private_bytes` augmente du taille réelle ; quota simulé au seuil → 507 et aucun objet écrit.
- **Dépend de** : étape 40.
- **Responsable** : Backend.
- **Fichiers** : `src/routes/api/member/upload/+server.ts` (nouveau), `src/lib/server/storage.ts` (réservation/confirmation/libération), `src/lib/server/member/commands.ts` (retrait de l'écriture métadonnées seules), `src/lib/member/services/documents.ts`.

### Étape 42 : Téléverser réellement les photos d'album

- **Livrable** : `kind = "albumPhoto"` dans `POST /api/member/upload` : images JPG/PNG/WebP ≤ 15 Mo et ≤ 6000×6000, écriture `public/albums/{albumId}/{uuid}.{ext}` dans `R2_PUBLIC`, ligne `media` avec `alt`, `caption`, `position = max + 1`, `size` réel et quota. La restriction `isAllowedPhoto` (visuels existants seulement) disparaît pour l'ajout ; `album.photo.move` et `album.photo.remove` restent inchangés. Un original n'est jamais converti côté serveur.
- **Testable** : dépôt par la secrétaire → photo visible dans l'album avec `position` correcte ; dépôt par un membre → 403 ; 15,1 Mo → 413 ; dimensions > 6000 → 415 ; quota mis à jour ; un fichier non image → 415.
- **Dépend de** : étapes 40 et 39.
- **Responsable** : Backend.
- **Fichiers** : `src/routes/api/member/upload/+server.ts`, `src/lib/server/member/commands.ts` (`album.photo.add` conservé pour les visuels existants), `src/lib/member/photos.ts`, `src/lib/member/services/albums.ts`.

### Étape 43 : Photo de profil réelle

- **Livrable** : `kind = "avatar"` dans `POST /api/member/upload` : seul le propriétaire peut déposer (`canChangeAvatar`), image ≤ 15 Mo et ≤ 6000×6000, clé `profiles/{profileId}/avatar.{ext}` en `R2_PRIVATE`, mise à jour de `profiles.avatar_url` avec l'URL servie par `/api/files/private/...`, quota. La palette `profiles.avatar` (1–12) reste le repli quand `avatar_url` est vide ; le trombinoscope et le profil affichent la photo si elle existe. Le bouton de dépôt est le seul ajout d'interface, conforme au 2 % restant.
- **Testable** : dépôt par le propriétaire → `avatarUrl` renseigné et image servie ; dépôt pour un autre profil → 403 ; compte suspendu → 403 ; suppression de la photo → retour au portrait illustré ; quota mis à jour.
- **Dépend de** : étapes 40 et **Q-2026-11-17-03**.
- **Responsable** : Backend + Frontend.
- **Fichiers** : `src/routes/api/member/upload/+server.ts`, `src/routes/dashboard/profil/+page.svelte`, `src/lib/member/components/…` (avatar), `src/lib/server/member/snapshot.ts` (`avatarUrl` exposé).

### Étape 44 : Envoi OneSignal réel et journal d'envoi

- **Livrable** : `notification.send` résout l'audience en base (`all`, `pupitre`, `profiles`), applique les préférences (`global`, `events`, `reminders`), appelle l'API OneSignal côté serveur avec la clé REST, écrit une ligne `notification_log` par envoi (`type`, `title`, `content`, `sent_at`, `status`), sans accepter de destinataire fourni par le navigateur. Un refus OneSignal ne fait pas échouer la notification en base mais la journalise en échec.
- **Testable** : envoi par la secrétaire → une requête OneSignal (mock) et une ligne de journal ; chef ciblant un pupitre non dirigé → 403 ; membre tentant `all` → 403 ; préférence `events = false` → destinataire exclu ; clé REST absente du bundle client (`grep` sur `.svelte-kit/output`).
- **Dépend de** : étape 12 (RLS) et étape 36 pour les règles de rôle déjà en place.
- **Responsable** : Backend.
- **Fichiers** : `src/lib/notifications/server.ts`, `src/lib/server/member/commands.ts` (`notification.send`), `src/lib/db/schema.ts` (`notification_log`), `tests/` (test d'audience).

### Étape 45 : Tests d'autorisation, RLS et parcours d'invitation

- **Livrable** : `tests/guards.test.ts`, `tests/invitation.test.ts` et un nouveau `tests/rls.test.ts` couvrent : absence de contexte → aucune donnée privée ; membre A puis membre B sur la même connexion poolée → isolation ; refus de chaque rôle sur une action hors périmètre ; parcours invitation (jeton invalide, expiré, déjà consommé, adresse non concordante, activation d'un e-mail non confirmé refusée) ; verrouillage RSVP à 00 h 00 `Europe/Paris`. La durée du jeton suit l'arbitrage Q-2026-11-17-02.
- **Testable** : `npm run test` passe ; chaque test nomme la règle et le statut attendu ; retirer une politique RLS fait échouer au moins un test (constat documenté dans la revue).
- **Dépend de** : étapes 12, 20 et **Q-2026-11-17-02**.
- **Responsable** : Partagé (backend pour la base, testeur pour les scénarios).
- **Fichiers** : `tests/guards.test.ts`, `tests/invitation.test.ts`, `tests/rls.test.ts` (nouveau), `vitest.config.ts` si environnement nécessaire.

### Étape 46 : Nettoyage des routes historiques, SEO et accessibilité

- **Livrable** : suppression de `src/routes/public/[lang=lang]/...` (doublon historique, Q-2026-11-10-07) avec redirection des anciennes URLs vers `/[lang=lang]/...` ; `sitemap.xml` réel (pages publiques + articles et albums publiés, variantes `fr`/`en`/`br`, `hreflang`) ; `robots.txt` excluant `/dashboard`, `/auth`, `/api` ; correctifs 1 % : focus visible, libellés, contrastes, aucun défilement horizontal à 320 px, `prefers-reduced-motion` respecté. Aucune refonte visuelle.
- **Testable** : aucune route ne répond sous `/public/` ; une ancienne URL redirige en 301/308 ; le sitemap ne contient ni brouillon ni page privée ; navigation clavier complète sur les pages publiques ; `npm run check && npm run lint && npm run build` passent.
- **Dépend de** : étapes 37 à 39, **Q-2026-11-17-01**.
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/public/**` (suppression), `src/routes/sitemap.xml/+server.ts`, `src/routes/robots.txt/+server.ts` ou `static/robots.txt`, composants publics concernés.

### Étape 47 : Mise en production Cloudflare Pages

- **Livrable** : Hyperdrive `bagad-dev` → branche Neon `test` pour Preview, `bagad-prod` → branche `production` pour Production ; secrets (`BETTER_AUTH_SECRET`, Resend, Turnstile, OneSignal) séparés par environnement ; bindings `R2_PUBLIC` / `R2_PRIVATE` configurés ; `.env.example` à jour sans secret ; migrations appliquées d'abord sur `test`, puis `production`. Smoke tests : connexion, agenda public, agenda privé, téléchargement d'un document, contact, invitation.
- **Testable** : déploiement Preview utilisant `test` ; déploiement Production utilisant `production` ; les six parcours de smoke test réussissent ; aucun secret dans le dépôt ; `wrangler pages deployment` sans erreur.
- **Dépend de** : étapes 36 à 46.
- **Responsable** : Backend + Partagé.
- **Fichiers** : `wrangler.toml`, `.env.example`, `docs/architecture.md`, `docs/database.md`, `docs/journal.md`.

### Étape 48 : Assainir les dépendances

- **Livrable** : traitement des 57 alertes Dependabot (2 critiques) par mises à jour compatibles ; `pnpm-lock.yaml` aligné sur `package.json` ; `pnpm audit` documenté. Aucune montée de version majeure n'est imposée aux développeurs sans validation du mainteneur et du client.
- **Testable** : `pnpm install --frozen-lockfile` sur un clone neuf ; `pnpm audit --prod` sans vulnérabilité critique ou haute non justifiée ; `npm run check`, `lint`, `build` et `test` passent.
- **Dépend de** : rien, peut courir en parallèle ; à terminer avant l'étape 47.
- **Responsable** : Mainteneur + Backend.
- **Fichiers** : `package.json`, `pnpm-lock.yaml`, `docs/journal.md`.

### 3.1 Ordre et parallélisme

| Vague | Étapes | Remarque |
| --- | --- | --- |
| 1 | 36, 37, 40, 48 | Indépendantes ; 40 débloque 41–43 |
| 2 | 38, 39, 44 | 38 dépend de Q-17-04 ; 39 profite de 40 |
| 3 | 41, 42, 43 | Même route d'upload, à livrer dans cet ordre (documents → album → avatar) |
| 4 | 45, 46 | 45 verrouille les règles ; 46 nettoie et finit l'interface |
| 5 | 47 | Après tout le reste |

## 4. Règles du projet

- N'écrire que dans les fichiers de son rôle ; l'architecte n'écrit que `equipe/PLAN.md`, `equipe/CONTRAT_API.md` et `docs/questions.md` ; les développeurs ne modifient jamais `equipe/`.
- Ne jamais inventer une règle métier absente des documents : si une information manque, écrire la question dans `docs/questions.md` et attendre.
- Lire `profiles.role` (ENUM `app_role`) et `profiles.account_status` ; jamais `user_metadata`, jamais un rôle ou un identifiant d'acteur envoyé par le navigateur.
- Chaque load, action et endpoint privé vérifie ses propres droits côté serveur ; le menu filtré et l'affichage conditionnel sont des aides d'interface.
- Toute opération protégée passe par `withUserContext` : transaction, `set_config('app.profile_id', ..., true)`, mêmes connexion et transaction pour toutes les requêtes.
- Aucun cache de requêtes Hyperdrive pour une lecture dépendante de l'identité ; le cache est réservé aux lectures publiques.
- Migrations additives uniquement sous `drizzle/` avec `drizzle/meta/` ; une migration appliquée n'est jamais modifiée ; vérification sur Neon `test` avant `production`.
- Aucun objet privé en bucket public, aucune URL signée, aucune clé R2 construite côté client ; tout objet privé passe par `/api/files/private/...` après guard.
- Quota global unique de 8 Go (alerte 7 Go, blocage 8 Go) : toute écriture R2 réserve, confirme ou libère le compteur ; aucune écriture sans réservation.
- Svelte 5 : runes uniquement ; interdits `export let`, `$:`, `on:click` (utiliser `onclick`), stores legacy pour l'état local ; Tailwind via les tokens du thème ; mobile first ; `prefers-reduced-motion` respecté.
- i18n : textes publics centralisés dans `src/lib/i18n/`, jamais de chaîne localisée en dur ; espace adhérents et authentification en français.
- Aucun secret committé ; `.env` ignoré, `.env.example` à jour ; clé REST OneSignal et clé Resend strictement serveur.
- Aucune nouvelle dépendance sans justification dans `docs/journal.md` et validation selon §7 ; aucun développeur n'installe un paquet de sa propre initiative.
- Hors périmètre absolu : paiement/cotisation en ligne, inscription libre, annuaire public, titres du bureau publics.
- Fin de tâche : `npm run check && npm run lint && npm run build && npm run test` ; schéma modifié ⇒ migration + `docs/database.md` (matrice RLS incluse) ; route ou flux modifié ⇒ `docs/architecture.md` ; entrée datée dans `docs/journal.md`.

## 5. Données provisoires à brancher sur Neon (contrat de remplacement)

Seules trois sources sont concernées. Les autres fichiers de `src/lib/data/` (`site.ts` hors `homeGallery`, `pupitres.ts`, `formation.ts`, `partenaires.ts`, `nav.ts`) sont du contenu éditorial et **restent statiques**.

| Fichier provisoire | Export utilisé aujourd'hui | Remplacé par | Forme de sortie à conserver | Règle de remplacement |
| --- | --- | --- | --- | --- |
| `src/lib/data/agenda.ts` | `agendaSections()` (`{ upcoming, past }`) | table `events` + `event_pupitres` | `PublicAgendaEvent` / `PublicEvent` : `id`, `title`, `description`, `eventDate`, `eventType`, `isPoll`, `state`, `location` | `visibility = 'public'` et `cancelled_at IS NULL` uniquement ; état calculé avec le jour `Europe/Paris` ; tri date croissante (à venir) / décroissante (passés). |
| `src/lib/data/articles.ts` | `publishedArticles(lang)`, `latestArticles(lang, limit)`, `articleBySlug(lang, slug)` | table `articles` + `profiles` (auteur) | `PublicArticle` : `slug`, `title`, `excerpt`, `category`, `date`, `image`, `imageAlt`, `content: ArticleSection[]` | `is_published = true` et `published_at` non nul ; brouillon → 404 ; Markdown converti en sections par une fonction pure ; `category`/`image` selon Q-2026-11-17-04. |
| `src/lib/data/site.ts` → `homeGallery` | `homeGallery` (photos statiques) | tables `albums` + `media` | `PublicPhoto` : `id`, `caption`, `sortOrder`, `thumbnailUrl`, `fullUrl` | Albums `is_published = true` seulement ; trois photos distinctes ; URLs construites côté serveur (`/api/files/public/...` ou `public_url`), jamais une clé R2 côté client. |

**Interdits après branchement** : un load public ne doit plus importer `$lib/data/agenda`, `$lib/data/articles` ni `homeGallery` ; aucun repli silencieux sur les données provisoires en cas d'erreur base (mieux vaut une page vide ou une 500 explicite qu'un contenu de démonstration en production).

## 6. Traitement des questions ouvertes existantes

| Question | État | Traitement dans ce plan |
| --- | --- | --- |
| Q-2026-11-05 (plateforme, identité, pupitres, contact, R2, organisation) | tranchées | Appliquées ; aucune réouverture. |
| Q-2026-11-06-01 (clôture RSVP) | tranchée | Appliquée (verrou à 00 h 00 `Europe/Paris`) ; testée à l'étape 45. |
| Q-2026-11-06-02 (images) | tranchée puis précisée par Q-2026-11-08-03 | Image Resizing à la diffusion ; aucune conversion serveur. |
| Q-2026-11-06-03 (conservation) | tranchée par Q-2026-11-08-08 | 24 mois `activity_log`, 12 mois contact, 30 jours invitations expirées, réponses anonymisées sans limite ; purge désactivée par défaut. Aucune purge planifiée dans cette session. |
| Q-2026-11-06-04 (service workers) | tranchée | Service worker notifications uniquement ; hors périmètre de cette session. |
| Q-2026-11-06-05 (contact) | tranchée | Action `send` déjà livrée, conforme ; documentée au contrat §6.5. |
| Q-2026-11-06-06, -07, -08 | tranchées | Schéma Drizzle, dates civiles, RLS/Hyperdrive : appliqués. |
| Q-2026-11-08-01 à -09 | tranchées | Appliquées (driver, quota, images, bindings, annulation, invitations, rappels, conservation, archives). |
| Q-2026-11-09-01 (i18n) | **ouverte** | Dictionnaires typés conservés ; ne bloque aucune étape ; aucune page publique nouvelle. |
| Q-2026-11-09-02 (contenus accueil) | **ouverte** | Validation bureau ; hors code. |
| Q-2026-11-09-03 (pistes audio) | **ouverte** | Lecteur laissé en état vide ; hors session. |
| Q-2026-11-10-01 à -06, -08 | **ouvertes** | Contenus éditoriaux (Formation, mascottes, photos, partenaires, coordonnées, expéditeur Resend) ; hors code, sauf l'expéditeur Resend qui doit être configuré à l'étape 47. |
| Q-2026-11-10-07 (route de contact historique) | **ouverte** | Traitée par l'étape 46 (suppression et redirection). |
| Q-2026-11-10-09 (agenda public provisoire) | **ouverte** | Résolue de fait par l'étape 37 : l'agenda public lit Neon ; le lieu vient de `events.location`. |
| Q-2026-11-10-10 (débordement navigation desktop) | **ouverte** | Correctif d'accessibilité 1 % inclus dans l'étape 46. |
| Q-2026-11-11-01 (mentions légales) | **ouverte** | Contenu à fournir par le bureau ; hors code. |
| Q-2026-11-11-02 (mode démonstration) | périmée | L'espace adhérents a été rebranché sur le backend réel le 2026-11-15 ; aucune donnée fictive ni `localStorage` ne subsiste. |
| Q-2026-11-14-01 (modèle backend) | tranchée | `profiles` + `pg`/`node-postgres` ; environnements séparés (étape 47). |
| **Q-2026-11-17-01 à -04** | **ouvertes** | Voir §0 ; chacune bloque une étape nommée. |

## 7. Packages

Aucun package n'est installé par les développeurs. Le mainteneur vérifie version, compatibilité, maintenance, licence, impact bundle et type de mise à jour ; le client valide tout ajout important.

### 7.1 Packages conservés (aucun changement)

| Package | Usage | Raison | Alternative | Statut |
| --- | --- | --- | --- | --- |
| `svelte` 5, `@sveltejs/kit` 2, `@sveltejs/vite-plugin-svelte`, `vite` 8 | Application SvelteKit | Stack imposée ; runes uniquement | — | Conservé |
| `@sveltejs/adapter-cloudflare` | Déploiement Cloudflare Pages | Cible d'hébergement du brief | adaptateur Node (incompatible Pages) | Conservé |
| `tailwindcss` 3.4 + `postcss` + `autoprefixer` | Styles par tokens | Thème existant ; Tailwind 4 serait une réécriture | Tailwind 4 | Conservé (majeure hors session) |
| `better-auth` + `@better-auth/infra` | Identité, sessions, invitations | Unique autorité d'identité | solution maison (risque sécurité) | Conservé |
| `drizzle-orm` 0.39 + `drizzle-kit` 0.30 | ORM et migrations | Migrations reproductibles déjà en place | SQL brut | Conservé |
| `pg` + `@types/pg` | Driver transactionnel | Exigé par `set_config(..., true)` sous Hyperdrive (Q-2026-11-08-01) | `@neondatabase/serverless` (exclu) | Conservé |
| `zod` 3.24 | Validation des formulaires (contact, connexion, réinitialisation) | Schémas existants | Yup, Valibot | Conservé (v4 = majeure hors session) |
| `resend` | E-mails (contact, invitations, réinitialisation) | Déjà intégré côté serveur | SMTP maison | Conservé |
| `@lucide/svelte` 1.71 | Icônes | Déjà utilisé partout | SVG maison | Conservé (version figée volontairement) |
| `leaflet` + `@types/leaflet` | Carte de la page Contact | Déjà livré | iframe OpenStreetMap | Conservé, à confirmer à l'étape 46 s'il reste utilisé |
| `vitest` 4, `@vitest/browser-playwright`, `playwright` | Tests unitaires et navigateur | Chaîne déjà installée ; étapes 45 et 47 | Jest + Playwright seul | Conservé |
| `wrangler`, `@cloudflare/workers-types` | Déploiement et types Workers | Cible Cloudflare | — | Conservé |
| `prettier`, `eslint` et plugins | Qualité | `npm run lint` déjà branché | Biome | Conservé |

### 7.2 Packages déclarés mais absents : ne pas installer sans arbitrage

| Package | Usage prévu | Raison de l'absence | Alternative | Statut |
| --- | --- | --- | --- | --- |
| `svelte-i18n` | i18n public `fr`/`en`/`br` (`AGENTS.md` §0) | Non installé ; dictionnaires typés maison livrés | Dictionnaires typés (état actuel) | **En attente de Q-2026-11-09-01** |
| `motion` | Animations (`AGENTS.md` §0) | Non installé, aucun composant ne l'importe | CSS/Tailwind + `prefers-reduced-motion` | **En attente de Q-2026-11-17-01** |

### 7.3 Packages proposés pour cette session

| Package | Usage | Raison | Alternative | Statut |
| --- | --- | --- | --- | --- |
| `image-size` | Lire les dimensions JPEG/PNG/WebP côté Worker (contrôle 6000×6000) | Pur JS, sans binaire natif, petite empreinte ; indispensable aux étapes 42–43 | accepter sans contrôle de dimensions (risque quota/abus) ; `sharp` (natif, incompatible Workers) | **À valider par le mainteneur** ; installation uniquement après validation |

### 7.4 Volontairement écartés

| Package | Usage tenté | Décision |
| --- | --- | --- |
| `sharp` | Conversion WebP serveur | **Refusé** : binaire natif, incompatible avec Cloudflare Workers ; les variantes sont produites par Image Resizing (Q-2026-11-08-03). |
| SDK serveur OneSignal | Envoi push | **Inutile** : l'API REST via `fetch` suffit et évite une dépendance supplémentaire. |
| `@neondatabase/serverless` | Accès Neon | **Interdit** au-dessus d'Hyperdrive (Q-2026-11-08-01). |
| Cloudflare Images (stockage) | Hébergement des images | **Écarté** : décision Q-2026-11-08-03 (R2 + Image Resizing). |
| `@milkdown/kit` (+ thème) | Éditeur d'articles prévu par la Spec | **Différé** : hors session (aucune refonte d'écran) ; à valider avant toute installation. |
| `marked` / `markdown-it` | Rendu Markdown public | **Non nécessaire** : `MarkdownView.svelte` contient déjà un analyseur minimal ; l'étape 38 l'extrait en fonction pure partagée. |

## 8. Risques

| Risque | Impact | Parade | Porteur |
| --- | --- | --- | --- |
| Cloudflare Image Resizing exige une zone Cloudflare avec la fonction activée ; un déploiement `*.pages.dev` seul ne suffit pas | Variantes 400/2000 indisponibles, images non conformes | Valider la zone avant l'étape 42 ; repli : servir l'original avec dimensions bornées | Mainteneur + Backend |
| Téléversement de fichiers via SvelteKit sur Workers : limites de taille et de mémoire | Échec des PDF 20 Mo / images 15 Mo | Tester les tailles réelles dès l'étape 41 ; streaming `request.formData()` → `R2.put`, pas de buffer global | Backend |
| Politiques RLS et commandes applicatives divergent (deux sources de vérité) | Faille d'autorisation silencieuse | Tests RLS (étape 45) + revue croisée `commands.ts` / policies à chaque migration | Backend + testeur |
| Deux conventions de pupitre coexistent (`caisse_claire` dans `roles.ts`, `caisse-claire` comme slug en base) | Comparaisons qui échouent silencieusement | Toujours résoudre le slug via `pupitres.slug` ; ne jamais comparer une constante en dur | Backend |
| Quota non atomique sous concurrence (deux uploads simultanés) | Dépassement des 8 Go | Réservation en base dans la même transaction que la ligne métier ; test de concurrence | Backend |
| `pnpm-lock.yaml` désynchronisé (antécédent E1) | CI et déploiement cassés | Étape 48 ; `--frozen-lockfile` en CI | Mainteneur |
| 57 alertes Dependabot dont 2 critiques | Vulnérabilité en production | Étape 48 avant l'étape 47 ; aucune majeure imposée sans validation | Mainteneur |
| OneSignal : clé REST ou audience mal résolue | Envoi massif non désiré ou fuite de clé | Audiences résolues en base, tests de rôle, clé uniquement serveur, journal d'envoi | Backend |
| Branchement Neon des pages publiques sans repli | Page publique en erreur 500 si la base est indisponible | Accepté explicitement (pas de données de démonstration en production) ; surveiller à l'étape 47 | Backend |
| Écarts de contenu non validés par le bureau (Q-09-02, Q-10-*) | Informations publiques erronées | Ne pas modifier les contenus ; validation avant mise en production | Chef de projet |
| Migrations appliquées par erreur sur `production` sans passer par `test` | Perte ou corruption de données | Ordre imposé : `test` puis `production`, journal daté, aucune migration modifiée | Backend |

## Annexe A — Historique du plan du 2026-11-08 (étapes 1 à 35) : état au 2026-11-17

État déduit du journal (jusqu'au 2026-11-15) et de la lecture des routes et commandes ; à confirmer par le chef de projet. « Partiel » signifie qu'une partie du livrable existe mais que le critère de fin n'est pas démontré.

| # | Intitulé | Maître d'œuvre | État | Couvert / repris par |
| --- | --- | --- | --- | --- |
| 1 | Socle Neon, Cloudflare, bindings, tests d'accès | Backend | Partiel | Étapes 40, 47 |
| 2 | Identité, sessions, guards, mots de passe | Backend | Fait | — |
| 3 | RLS, contexte transactionnel, tests d'isolation | Backend | Partiel (policies faites, tests absents) | Étape 45 |
| 4 | Invitations, activation, trombinoscope V1, journalisation | Backend | Partiel (photo réelle absente) | Étape 43 |
| 5 | Agenda, présences, sondages | Backend + Frontend | Partiel (privé fait, public provisoire) | Étapes 36, 37 |
| 6 | Articles, médias, documents, contact | Backend + Frontend | Partiel (contact fait ; uploads absents) | Étapes 38–43 |
| 7 | Notifications, PWA, livraison | Frontend + Backend | Non fait | Étape 44 |
| 8 | CI et validation globale | Partagé | Partiel | Étape 45 |
| 9 | Lockfile et installation CI | Partagé | À vérifier | Étape 48 |
| 10 | Better Auth et tables déclarées | Backend | Fait | — |
| 11 | Driver transactionnel et `withUserContext` | Backend | Fait | — |
| 12 | RLS, policies, tests d'isolation | Backend | Partiel | Étape 45 |
| 13 | Migration initiale et scripts | Backend | Fait | — |
| 14 | Quota `bigint` et fonctions atomiques | Backend | Partiel (schéma fait, uploads absents) | Étapes 41–43 |
| 15 | Annulation d'événement et lecture seule | Backend | Fait | — |
| 16 | Bindings R2 et service des fichiers privés | Backend | Non fait (route vide) | Étape 40 |
| 17 | Archivage Supabase/Netlify | Partagé | Fait (`docs/Archive/`) | — |
| 18 | Fin de migration Svelte 5 runes | Frontend | Fait | — |
| 19 | Harmonisation documentaire | Partagé | Partiel | Étape 47 |
| 20 | Invitations, activation, cycle de compte | Backend + Frontend | Fait (durée du jeton à arbitrer) | Q-2026-11-17-02 |
| 21 | Agenda privé, RSVP, sondages | Backend + Frontend | Fait | Étape 45 (tests) |
| 22 | Trombinoscope V1 | Backend + Frontend | Fait (palette) | Étape 43 |
| 23 | Profil, suppression de compte, journalisation | Backend + Frontend | Partiel (suppression de compte absente) | Hors session |
| 24 | Documents et partitions PDF | Backend + Frontend | Partiel (métadonnées seules) | Étape 41 |
| 25 | Articles et albums publics | Backend + Frontend | Non fait (données provisoires) | Étapes 38, 39 |
| 26 | Formulaire de contact | Backend | Fait | — |
| 27 | Pages publiques complètes | Frontend | Fait (design), données provisoires | Étapes 37–39 |
| 28 | Préférences et envoi OneSignal serveur | Backend + Frontend | Partiel (préférences faites, envoi absent) | Étape 44 |
| 29 | Rappels J-3 et rappel sans réponse | Backend | Non fait | Hors session (après 44) |
| 30 | PWA, service worker, installation | Frontend | À vérifier | Hors session |
| 31 | SEO et i18n publics | Frontend | Partiel (sitemap vide) | Étape 46 |
| 32 | Lecteur audio flottant | Frontend | État vide | Hors session (Q-2026-11-09-03) |
| 33 | Accessibilité et mobile first | Frontend | Partiel | Étape 46 |
| 34 | CI verte et couverture de tests | Partagé | Partiel (tests vides) | Étape 45 |
| 35 | Mise en production Cloudflare Pages | Backend + Partagé | Non fait | Étape 47 |

**Décisions client du 2026-11-08 rappelées** (toujours valides, détail dans `docs/questions.md`) : Q-01 `pg` + `node-postgres` ; Q-02 quota global en `bigint` ; Q-03 R2 + Image Resizing ; Q-04 bindings `R2_PUBLIC`/`R2_PRIVATE` ; Q-05 `cancelled_at` ; Q-06 secrétaire et admin invitent ; Q-07 notification à la création + rappel J-3 ; Q-08 conservation (24/12/30 mois, purge désactivée par défaut) ; Q-09 archives conservées dans `docs/Archive/`.
