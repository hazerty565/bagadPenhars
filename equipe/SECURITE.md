# Audit de sécurité — Site Bagad Penhars

> **Archive de l'audit initial.** Ce document est conservé pour la traçabilité des constats. Le rapport de référence, qui sépare le périmètre démonstration (réserves levées) du périmètre production (constats ouverts), est **`equipe/AUDIT-DEMO.md`**.

**Auditeur :** auditeur de sécurité indépendant
**Date :** 12 novembre 2026
**Objet :** audit indépendant de sécurité avant toute préparation du déploiement en production
**Statut du document :** premier audit (aucun `equipe/SECURITE.md` antérieur)

---

## 1. Périmètre, méthode et état audité

### 1.1 Ce qui a été examiné

L'audit porte sur le code réellement présent dans le dépôt au moment de la mission :

- `src/hooks.server.ts`, `src/app.d.ts`, `src/routes/**` (layouts, pages, actions, endpoints) ;
- `src/lib/auth/*` (rôles, permissions, guards, configuration Better Auth) ;
- `src/lib/db/*`, `src/lib/server/data/*`, `src/lib/server/{auth,blobs,email,turnstile}.ts` ;
- `src/lib/notifications/server.ts` ;
- `src/lib/demo/**` et `src/lib/components/dashboard/*` (surface de démonstration) ;
- `scripts/*.js`, `drizzle/**`, `wrangler.jsonc`, `svelte.config.js`, `vite.config.ts` ;
- `package.json`, `pnpm-lock.yaml`, `.gitignore`, `.env.example` ;
- `static/*` (dont `robots.txt`, `OneSignalSDKWorker.js`, manifest) ;
- `.github/workflows/ci.yml`, `.github/dependabot.yml` ;
- `tests/**` et les fichiers `*.test.ts` colocés sous `src/` ;
- code de la dépendance Better Auth installée (`node_modules/better-auth/dist/**`) pour vérifier les comportements effectifs d'inscription, de connexion et de limitation de débit.

### 1.2 Méthode

Audit **statique par lecture de code et de configuration**, complété par la lecture des sources de la dépendance Better Auth installée. Aucun test dynamique, aucun scan automatisé, aucune requête vers un service réel, aucune connexion à une base de données.

### 1.3 État exact du dépôt examiné

Le dépôt n'a **pas** été audité à un commit identifié : l'accès au shell est refusé dans cet environnement (`Permission denied: shell`), donc `git status`, `git log` et `git ls-files` n'ont pas pu être exécutés. Le contenu lu est celui de l'arbre de travail courant.

Conséquence importante : **l'espace membre livré n'est pas encore branché sur les données réelles**. Les `+page.server.ts` du dashboard sont des stubs (`export const load = async () => ({})`, par exemple `src/routes/dashboard/admin/membres/+page.server.ts:3`, `src/routes/dashboard/profil/+page.server.ts`), et les pages rendent `DemoRoute`, qui n'affiche qu'un message générique hors développement (`src/lib/components/dashboard/DemoRoute.svelte:21-37`). Les constats ci-dessous sont donc majoritairement des **faiblesses de contrôle** dont l'exploitation est aujourd'hui limitée par l'absence de flux de données métier, mais qui deviendraient directement exploitables dès le branchement des écrans sur Neon.

### 1.4 Documents d'entrée

Consultés : `AGENTS.md`, `docs/brief.md`, `docs/Spec.md` (§5 notamment), `docs/database.md`, `docs/architecture.md`, `equipe/PLAN.md`, `equipe/CONTRAT_API.md`, `equipe/SYNTHESE.md`, `equipe/PLAN-DEMO.md`.

**Manquants au moment de l'audit** (mentionnés dans la mission comme entrées attendues) :

- `equipe/INTEGRATION.md` — absent ;
- `equipe/REVUE.md` — absent ;
- `equipe/TESTS.md` — absent ;
- `equipe/DEPLOIEMENT.md` — absent.

Je n'ai donc pas pu vérifier ce que la revue technique et les tests fonctionnels ont réellement couvert, ni les résultats de la recette client. Ces absences sont une limite de l'audit, pas un constat de vulnérabilité.

---

## 2. Synthèse

| Gravité     | Nombre |
| ----------- | ------ |
| Critique    | 0      |
| Majeure     | 4      |
| Modérée     | 4      |
| Mineure     | 5      |
| Information | 4      |

**Aucune vulnérabilité critique n'a été identifiée.** Quatre constats majeurs restent ouverts et portent sur des contrôles de sécurité exigés par le projet lui-même (`docs/Spec.md` §5, `docs/database.md` §2, `equipe/PLAN.md` lignes 26, 36-38 et critère de validation de l'étape 2) :

1. les guards d'autorisation existent mais ne sont **jamais appliqués** ; le statut du compte n'est contrôlé nulle part ;
2. la RLS PostgreSQL est **absente des migrations**, et le script de secours est inopérant et permissif ;
3. l'**inscription publique** Better Auth est ouverte, contrairement à la règle « les comptes ne se créent pas librement » ;
4. la **vérification d'adresse e-mail** est déclarée mais inopérante, et l'acceptation d'invitation peut consommer une invitation sans créer de compte utilisable ni de profil métier.

---

## 3. Constats détaillés

### 3.1 Constats majeurs

---

#### SEC-M01 — Les guards serveur ne sont jamais appliqués ; le statut du compte n'est pas contrôlé

**Gravité :** Majeure
**Responsable pressenti :** backend
**Nature :** vulnérabilité de contrôle d'accès confirmée par lecture de code

**Fichiers et emplacements**

- `src/routes/dashboard/+layout.server.ts:10-17` — le seul contrôle est `if (!dev && !locals.user)`, puis `return { user: locals.user }`.
- `src/routes/dashboard/pupitre/+layout.server.ts:3` — aucun contrôle : `load = async ({ locals }) => ({ user: locals.user })`.
- `src/hooks.server.ts:36-47` — le profil est chargé puis `locals.user`, `locals.role`, `locals.accountStatus` sont peuplés **sans filtrer `account_status`**.
- `src/lib/auth/guards.ts:88-136` — `requireAuth`, `requireRole`, `requirePupitreChef`, `requireOwnProfile` sont définis et fonctionnels.
- Preuve d'absence d'usage : recherche de `requireAuth|requireRole|requirePupitreChef|requireOwnProfile` sur `src/` → aucune occurrence hors de `src/lib/auth/guards.ts` et des réexports de `src/lib/auth/index.ts:36-46`. Aucune route, aucun layout, aucune action, aucun endpoint ne les importe.

**Constat et preuve**

Le contrôle d'accès réel de l'espace membre se réduit à « une session Better Auth valide et un profil existant ». Aucun test de `account_status`, aucun test de rôle, aucun test de périmètre pupitre n'est exécuté côté serveur. Les guards, corrects sur le fond, sont du code mort.

`requireAuth` prévoit précisément les cas `pending`, `suspended` et `no_role` (`src/lib/auth/guards.ts:92-100`) : ces branches ne sont jamais atteintes. `docs/architecture.md:19-26` rappelle pourtant que le filtrage de menu n'est pas une barrière et que « les routes d'administration restent protégées par des guards serveur, même lorsqu'un utilisateur connaît directement leur URL ».

**Scénario de risque et impact**

- Un compte `pending` (créé par invitation, non activé) ou `suspended` obtient une session valide, puis atteint `/dashboard`, `/dashboard/profil`, `/dashboard/admin/**` sans être arrêté. Contraire à `docs/brief.md:63-68`, `docs/database.md:118-120` et `equipe/CONTRAT_API.md` §5.2.
- Un membre `member` peut atteindre les URL d'administration (`/dashboard/admin/membres`, `/dashboard/admin/permissions`, `/dashboard/admin/invitations`, etc.). Aujourd'hui ces pages ne renvoient aucune donnée, mais la protection d'URL est inexistante : dès qu'un `load` lira la base, l'accès sera effectif pour tout compte connecté.
- La suspension d'un compte ne révoque pas la session : l'utilisateur suspendu conserve un accès tant que le cookie est valide (30 jours, cf. SEC-D01).

**Correction attendue**

1. Appliquer `requireAuth` dans `src/routes/dashboard/+layout.server.ts` (et non un simple test de présence), avec redirection `pending` → `/auth/pending` et `suspended` → page de refus / déconnexion.
2. Appliquer `requireRole` dans chaque layout et chaque `+page.server.ts` d'administration, et `requirePupitreChef` dans le périmètre pupitre, avec `profile_pupitres` lu côté serveur.
3. Ajouter un test d'autorisation par parcours (anonyme, `pending`, `suspended`, `member`, `chef_pupitre`, `secretaire`, `admin`), conformément au critère de validation de l'étape 2 de `equipe/PLAN.md`.
4. Ne pas se contenter du filtrage de menu : `equipe/PLAN.md` ligne 50 le précise explicitement.

---

#### SEC-M02 — RLS PostgreSQL absente des migrations ; le script de secours est inopérant et permissif

**Gravité :** Majeure
**Responsable pressenti :** backend (avec décision d'architecture sur le rôle runtime)
**Nature :** contrôle de sécurité essentiel absent, non vérifiable en l'état

**Fichiers et emplacements**

- `drizzle/0000_handy_alex_wilder.sql` — aucune occurrence de `CREATE POLICY`, `ENABLE ROW LEVEL SECURITY` (recherche sur le fichier : 0 résultat).
- `drizzle/meta/0000_snapshot.json` — `isRLSEnabled: false` sur les tables.
- `scripts/apply-rls-policies.js` — seule tentative de RLS du dépôt.
- `src/lib/db/index.ts:40-51` — `withUserContext` pose uniquement `app.user_id`.
- `src/lib/server/data/*.ts` — couche de données écrite (`profiles.ts`, `events.ts`, `documents.ts`, `attendance.ts`, `invitations.ts`), mais **jamais appelée** par une route (recherche `server/data` : seuls `contact.ts` et `invitations.ts` sont importés, et uniquement pour Turnstile et l'invitation).

**Constat et preuve**

`docs/Spec.md:319-330`, `docs/database.md:50-71` et `equipe/PLAN.md:26,38` exigent des politiques RLS explicites, un contexte transactionnel `set_config(..., true)`, un rôle runtime sans `BYPASSRLS` et des tests d'isolation. Aucune de ces politiques n'existe dans les migrations.

Le script de secours ne peut pas corriger ce manque :

1. Il utilise `require('pg')` (`scripts/apply-rls-policies.js:5`) dans un paquet `"type": "module"` (`package.json:5`) → `ReferenceError: require is not defined`, le script ne s'exécute pas.
2. Il crée des politiques `TO admin`, `TO secretaire`, `TO member`, `TO chef_pupitre` (`:22-23`, `:48`, `:50-51`, `:60-62`, `:70-72`, `:81-83`, `:114-115`, `:132`) : ce sont des **rôles PostgreSQL qui n'existent pas**. L'énumération métier est `app_role`, pas un rôle de connexion.
3. Il compare `auth_user_id = current_setting('app.user_id')::text` (`:21`) alors que `withUserContext` place `profiles.id` dans `app.user_id` (`src/lib/db/index.ts:49`) : même si les rôles existaient, la politique ne correspondrait jamais.
4. Il n'est pas idempotent (`CREATE POLICY` sans `DROP POLICY IF EXISTS`) : une seconde exécution échoue et laisse un état partiel.
5. Il contient des politiques explicitement permissives : `media_select_public ... USING (true)` (`:79`), `activity_log_select ... USING (true)` (`:105`), `notification_log_insert ... WITH CHECK (true)` (`:98`), `documents_select_member TO member USING (true)` (`:48`).
6. Il utilise `app.user_role` (`:97`) que `withUserContext` ne pose jamais.

Par ailleurs `src/hooks.server.ts:36-40` interroge `profiles` **hors de tout contexte RLS**. Si la RLS était activée sans ajustement, le hook cesserait de résoudre les profils : la mise en œuvre demande donc une décision explicite (rôle runtime, fonction `SECURITY DEFINER` ou politique adaptée).

**Scénario de risque et impact**

Défense en profondeur nulle : la seule barrière entre un utilisateur et les données d'un autre membre est le guard applicatif — lui-même absent (SEC-M01). Une seule requête oubliée dans un futur `load` expose l'ensemble des profils (téléphone, adresse, rôle, statut), des documents et des réponses d'événements. C'est exactement le scénario IDOR/BOLA que `docs/Spec.md:338-342` demande de prévenir.

**Correction attendue**

1. Nouvelle migration **additive** (ne pas modifier `0000_...`) activant RLS et définissant des politiques `SELECT/INSERT/UPDATE/DELETE` explicites, sans politique générale permissive.
2. Aligner la clé de contexte : soit `app.user_id` contient `profiles.id` et les politiques comparent à `profiles.id`, soit on pose les deux valeurs et on documente.
3. Poser `app.user_role` si des politiques en dépendent, ou résoudre le rôle par sous-requête sur `profiles`.
4. Corriger `withUserContext` pour rester dans la même transaction (déjà le cas) et vérifier que **toutes** les requêtes protégées passent par lui.
5. Supprimer ou réécrire `scripts/apply-rls-policies.js` (ESM, idempotence, rôles corrects) ou le retirer au profit des migrations.
6. Vérifier sur la branche Neon `test` avec le rôle runtime réel : accès anonyme, absence de contexte, isolation de deux utilisateurs successifs sur une connexion réutilisée.

---

#### SEC-M03 — Inscription publique autonome ouverte via `/api/auth/sign-up/email`

**Gravité :** Majeure
**Responsable pressenti :** backend
**Nature :** contournement d'une règle d'accès explicite, confirmé par le code et la dépendance

**Fichiers et emplacements**

- `src/lib/server/auth.ts:34-41` — `emailAndPassword: { enabled: true, requireEmailVerification: true, ... }`, **sans `disableSignUp`**.
- `src/routes/api/auth/[...all]/+server.ts:15-24` — expose `GET/POST/PUT/DELETE/PATCH` vers `auth.handler(request)`.
- `node_modules/better-auth/dist/api/routes/sign-up.mjs:145` — Better Auth n'accepte l'inscription que si `emailAndPassword.enabled` **et** `disableSignUp` faux ; l'un est vrai, l'autre non défini.

**Constat et preuve**

`docs/brief.md:61-69` et `equipe/PLAN.md:37` imposent que les comptes ne se créent **que** par invitation, avec création simultanée du profil `pending`. Or `POST /api/auth/sign-up/email` est joignable sans authentification et crée une ligne `user` + `account` (mot de passe) avec un e-mail arbitraire.

**Scénario de risque et impact**

- Création illimitée de comptes Better Auth par un tiers non authentifié (croissance de la base, pollution des tables d'identité, épuisement de ressources).
- **Préemption d'identité** : un attaquant crée `prenom.nom@…` avant l'invitation. Lors de l'acceptation, `signUpEmail` renvoie une réponse générique de succès (`requireEmailVerification` fait basculer Better Auth en réponse anti-énumération, `sign-up.mjs:155,195-203`) : l'action ne voit aucune erreur, marque l'invitation acceptée (`src/routes/auth/invitation/+page.server.ts:71`) et le membre ne peut jamais définir son mot de passe. L'invitation est consommée sans compte utilisable.
- Le compte créé n'obtient pas de `profiles` : `createProfile` (`src/lib/server/data/profiles.ts:93-107`) n'est appelé nulle part. L'utilisateur n'a donc ni rôle ni statut métier, et `locals.user` reste `null` à la connexion.

**Correction attendue**

1. `emailAndPassword.disableSignUp: true` dans `src/lib/server/auth.ts`.
2. Créer les comptes invités exclusivement côté serveur (adaptateur interne Better Auth ou plugin d'administration), en transaction avec la ligne `profiles` (`account_status = 'pending'`, `role = 'member'`) et les `profile_pupitres`.
3. Traiter explicitement le cas « e-mail déjà existant » dans l'action d'invitation : ne pas marquer l'invitation acceptée, renvoyer une erreur métier et alerter l'administrateur.

---

#### SEC-M04 — Vérification d'adresse e-mail inopérante et acceptation d'invitation non fiable

**Gravité :** Majeure
**Responsable pressenti :** backend
**Nature :** contrôle de sécurité déclaré mais non fonctionnel

**Fichiers et emplacements**

- `src/lib/server/auth.ts:50-54` — `emailVerification.sendVerificationEmail` est une fonction **vide**.
- `src/lib/server/auth.ts:34-41` — `requireEmailVerification: true`.
- `src/routes/auth/invitation/+page.server.ts:7-12` — `load({ params })` lit `params.token` et `params.email`, qui n'existent pas : ce sont des paramètres de requête (`?token=…&email=…`), pas des segments de route.
- `src/routes/auth/invitation/+page.server.ts:11,17` — `fail()` est utilisé dans un `load`, ce qui n'est pas une API de chargement valide.
- `src/routes/auth/invitation/+page.server.ts:47-49` — mot de passe minimum 6 caractères, sans maximum, alors que Better Auth applique `minPasswordLength` 8 par défaut (`node_modules/better-auth/dist/context/create-context.mjs:186`).
- `src/routes/auth/invitation/+page.server.ts:61-68` — `signUpEmail({ headers: {} })`, sans en-têtes de la requête réelle.
- `src/routes/auth/invitation/+page.server.ts:71` — `markInvitationAccepted` appelé sans vérifier qu'un compte a réellement été créé.
- `node_modules/better-auth/dist/api/routes/sign-up.mjs:241-249` — Better Auth appelle bien `sendVerificationEmail` à l'inscription lorsque `requireEmailVerification` est vrai ; ici cette fonction ne fait rien.
- `node_modules/better-auth/dist/api/routes/sign-in.mjs:338-351` — la connexion refuse tout compte dont `emailVerified` est faux.

**Constat et preuve**

Aucun e-mail de vérification n'est jamais envoyé : le jeton est créé puis jeté. Aucun compte créé par ce code ne peut donc atteindre `emailVerified = true`, et **aucune connexion ne peut aboutir**, y compris pour un membre invité. Le contrôle « l'adresse e-mail est confirmée » exigé par `docs/brief.md:66-68` est décoratif.

Le chargement de la page d'invitation ne peut pas fonctionner : `params` ne contient jamais `token`/`email`, donc la branche `fail(400)` est systématiquement prise. Le transtypage `as { token?: string; email?: string }` masque l'erreur au compilateur.

**Scénario de risque et impact**

- Parcours d'invitation impossible à terminer (l'invitation est consommée, mais le compte reste inutilisable) → déni de service sur la création de comptes.
- `markInvitationAccepted` s'exécute même quand `signUpEmail` n'a rien créé (doublon, échec silencieux), ce qui détruit la garantie « invitation à usage unique liée à une création réelle » (`docs/database.md:84`, `equipe/PLAN.md:37`).
- Aucune preuve de possession de l'adresse : la règle d'activation manuelle « uniquement si l'e-mail est confirmé » ne peut pas être appliquée puisque `profiles.email_confirmed` n'est jamais alimenté.
- `sendResetPassword` (`src/lib/server/auth.ts:37-40`) est également vide : la réinitialisation de mot de passe annoncée par `/auth/forgot-password` et `/auth/reset-password` n'envoie rien.

**Correction attendue**

1. Implémenter réellement `sendVerificationEmail` et `sendResetPassword` avec Resend (`src/lib/server/email.ts` existe déjà).
2. Créer la route canonique `/auth/invitation/accept` avec lecture de `url.searchParams` dans le `load`, et une action séparée.
3. Rendre l'acceptation transactionnelle et idempotente : valider le jeton → créer ou mettre à jour le compte → créer `profiles` (`pending`, `member`) → copier les pupitres → **puis** marquer l'invitation acceptée. En cas d'échec, ne rien marquer.
4. Aligner la politique de mot de passe (8 caractères minimum et maximum explicite) avec Better Auth.
5. Vérifier `email_confirmed` avant toute activation manuelle.

---

### 3.2 Constats modérés

---

#### SEC-D01 — Pas de déconnexion et pas de révocation de session à la suspension

**Gravité :** Modérée
**Responsable pressenti :** backend + frontend
**Fichiers :** `src/routes/auth/logout/+page.svelte` (**fichier vide, 0 octet**) ; aucun `+page.server.ts` de déconnexion ; aucune occurrence de `signOut`/`sign-out` dans `src/` hors commentaire de `src/routes/api/auth/[...all]/+server.ts:6` ; `src/lib/server/auth.ts:42-49` (`expiresIn` 30 jours).

**Constat :** Il n'existe aucun moyen de mettre fin à une session depuis l'interface, et aucun code ne révoque les sessions d'un compte suspendu. La page `/auth/logout` est une route vide.

**Impact :** sur un appareil partagé (salle du bagad, ordinateur familial), la session reste active jusqu'à 30 jours. Une suspension prononcée par la secrétaire n'a aucun effet sur les sessions ouvertes (`docs/database.md:120` exige l'inverse). `cookieCache` (1 h, `src/lib/server/auth.ts:45-48`) retarde en plus la prise en compte d'une révocation.

**Correction :** action serveur `logout` appelant `auth.api.signOut`, lien de déconnexion dans l'interface, suppression des sessions dans le flux de suspension, et politique de révocation documentée.

---

#### SEC-D02 — Aucun en-tête de sécurité, aucune CSP ; `robots.txt` inadapté

**Gravité :** Modérée
**Responsable pressenti :** intégrateur (avec validation du chef/architecte, `AGENTS.md` §5)
**Fichiers :** absence de `static/_headers` ; absence de `Content-Security-Policy` / `X-Frame-Options` / `Strict-Transport-Security` dans `src/` (recherche : 0 occurrence, y compris `setHeaders` dans `src/hooks.server.ts`) ; `static/robots.txt:9-13`.

**Constat :** Aucun en-tête de durcissement n'est défini. `robots.txt` liste des chemins obsolètes (`/article/new`, `/agenda-form`, `/article-delete`, `/members`, `/article/`) et **ne bloque ni `/dashboard`, ni `/auth`, ni `/api`**, contrairement à `equipe/CONTRAT_API.md:459`.

**Impact :** pas de protection anti-clickjacking, pas de réduction de surface XSS en profondeur, aucune garantie HSTS côté application ; l'espace privé et les routes d'authentification sont déclarés indexables. Risque réel mais non exploitable seul aujourd'hui (aucune donnée membre servie).

**Correction :** fichier `_headers` Cloudflare avec `Content-Security-Policy`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security` ; corriger `robots.txt`. La CSP est une modification sensible : validation explicite requise (`AGENTS.md` §5).

---

#### SEC-D03 — Pas de limitation des tentatives sur l'action de connexion

**Gravité :** Modérée
**Responsable pressenti :** backend
**Fichiers :** `src/routes/auth/login/+page.server.ts:46-84` ; `node_modules/better-auth/dist/context/create-context.mjs:170-176` ; `node_modules/better-auth/dist/api/rate-limiter/index.mjs:305-318`.

**Constat :** Better Auth active une limitation par défaut en production (3 tentatives / 10 s sur `/sign-in` et `/sign-up`), mais **uniquement dans son handler HTTP**. L'action SvelteKit appelle directement `auth.api.signInEmail(...)` (`:59-65`), ce qui contourne ce mécanisme. Aucun compteur applicatif, aucun délai progressif, aucun verrouillage de compte n'est implémenté. Le formulaire `login` est donc un point d'attaque non limité.

**Impact :** force brute / bourrage d'identifiants sur les comptes membres, sans frein. Le risque est réel bien que modéré (base d'utilisateurs restreinte, mots de passe choisis par les membres).

**Correction :** limitation côté action (par IP et par compte, stockage KV ou D1, ou appel du endpoint HTTP Better Auth), réponse `rate_limited` 429 conforme à `equipe/CONTRAT_API.md:120`, journalisation des échecs.

---

#### SEC-D04 — Configuration Cloudflare incomplète et repli silencieux de la connexion base

**Gravité :** Modérée
**Responsable pressenti :** intégrateur + backend
**Fichiers :** `wrangler.jsonc:1-10` (seul binding `ASSETS`) ; `src/app.d.ts:17` (`Platform` vide) ; `src/lib/db/index.ts:19-22` ; `src/lib/server/blobs.ts:42-45` ; `.env.example:25-34` ; `src/lib/server/auth.ts:57`.

**Constat :**

- Aucun binding `r2_buckets`, aucun `hyperdrive`, aucun `vars` n'est déclaré, alors que `blobs.ts` attend `R2_PUBLIC`/`R2_PRIVATE` et que `docs/database.md:10-21` impose Hyperdrive.
- `src/lib/db/index.ts:19-22` retombe **silencieusement** sur `postgres://user:pass@localhost:5432/placeholder` si `DATABASE_URL` manque : une erreur de configuration produit une application qui démarre et échoue à l'exécution, au lieu d'un échec net.
- `secure: process.env.NODE_ENV === 'production'` (`src/lib/server/auth.ts:57`) : au runtime Workers, la valeur de `NODE_ENV` n'est pas garantie. Si elle est absente, le cookie de session est émis **sans attribut `Secure`**, alors que l'application est servie en HTTPS.

**Impact :** risque de déploiement non fonctionnel ou dégradé, et risque de cookie de session sans `Secure`. Ce sont des risques de configuration, pas des vulnérabilités démontrées.

**Correction :** déclarer les bindings R2/Hyperdrive/vars dans `wrangler.jsonc` ; typer `Platform` ; faire échouer le démarrage si `DATABASE_URL` est absente ; forcer `secure: true` en production (ou utiliser `$app/environment`).

---

### 3.3 Constats mineurs

---

#### SEC-m01 — Le profil complet est renvoyé au client

**Gravité :** Mineure — **Responsable :** backend
**Fichier :** `src/routes/dashboard/+layout.server.ts:16`.
**Constat :** `return { user: locals.user }` sérialise la ligne `profiles` entière : `phone`, `address`, `auth_user_id`, `email`, `role`, `account_status`, `bureau_position_id`, `email_confirmed`, `created_at`, `updated_at`. `equipe/CONTRAT_API.md:509,827` interdit d'exposer `phone`, `email`, `address`, `role`, `accountStatus`, `authUserId` dans les charges destinées au trombinoscope.
**Impact :** il s'agit des données de l'utilisateur lui-même, donc pas d'accès indu aujourd'hui ; mais toute réutilisation du `data.user` dans un composant partagé diffusera des champs internes et du PII. Principe de minimisation non respecté.
**Correction :** projeter explicitement les seuls champs utiles au client.

---

#### SEC-m02 — Politique de mot de passe incohérente à l'invitation

**Gravité :** Mineure — **Responsable :** backend
**Fichier :** `src/routes/auth/invitation/+page.server.ts:43-49`.
**Constat :** contrôle local `password.length < 6`, alors que Better Auth impose 8 caractères minimum par défaut et un maximum de 128. Un mot de passe de 6 ou 7 caractères passe la validation applicative puis est rejeté par la bibliothèque, avec un message générique 500.
**Impact :** mauvaise expérience et message d'erreur trompeur ; aucune faiblesse d'authentification supplémentaire.
**Correction :** dériver la validation des paramètres Better Auth (`minPasswordLength`/`maxPasswordLength`), sans duplication divergente.

---

#### SEC-m03 — Scripts de migration non conformes

**Gravité :** Mineure — **Responsable :** backend
**Fichier :** `scripts/migrate.js:4,13`.
**Constat :** `require('child_process')` dans un paquet ESM (échec d'exécution), faute de frappe `npx drizzle-kid push`, et usage de `drizzle-kit push` qui applique un différentiel **hors historique de migrations**, contrairement à `docs/database.md:33-39` (« une migration versionnée, jamais modifiée »).
**Impact :** risque de dérive de schéma entre branches `test` et `production`, et de perte de traçabilité. Pas d'impact direct sur la confidentialité.
**Correction :** script ESM (`import`), `drizzle-kit migrate`, contrôle de la branche cible.

---

#### SEC-m04 — Tests de sécurité vides et CI sans audit de dépendances

**Gravité :** Mineure — **Responsable :** backend + testeur
**Fichiers :** `tests/guards.test.ts` (**0 octet**), `tests/invitation.test.ts` (**0 octet**) ; `.github/workflows/ci.yml:35-46` (check, lint, build uniquement).
**Constat :** les deux tests qui devraient démontrer les refus d'accès et la logique d'invitation sont vides. La CI ne comporte ni `pnpm audit`, ni analyse statique de sécurité, ni test d'autorisation. Les constats M01 et M04 ne sont donc couverts par aucun test.
**Impact :** fausse assurance : la CI passe alors que les contrôles d'accès ne sont pas testés.
**Correction :** écrire les tests d'autorisation (critère de validation de `equipe/PLAN.md`, étape 2), ajouter `pnpm audit --prod` en CI, et un test d'isolation RLS sur la branche `test`.

---

#### SEC-m05 — Envoi de notifications : identifiants d'appareils fournis par l'appelant

**Gravité :** Mineure — **Responsable :** backend
**Fichier :** `src/lib/notifications/server.ts:38-90`.
**Constat :** `sendPushNotification({ playerIds, … })` envoie à des identifiants fournis par l'appelant, sans résolution serveur ; `resolveAudience` retourne `userPupitreIds` en **placeholder** pour l'admin (`:79`). Le module n'est branché sur aucune route aujourd'hui.
**Impact :** aucun impact actuel. Dès le branchement, une erreur d'appel permettrait d'envoyer des notifications à des appareils hors audience (hameçonnage interne, fuite d'information par le titre du push).
**Correction :** ne jamais accepter de `playerIds` du client ; résoudre l'audience côté serveur depuis `profile_pupitres` et les préférences, puis sélectionner les appareils en base.

---

### 3.4 Informations

---

#### SEC-I01 — Périmètre réel : l'espace membre n'est pas branché sur les données

**Gravité :** Information
Tous les `+page.server.ts` du dashboard renvoient `{}` et les pages rendent `DemoRoute`, qui affiche un message générique hors développement (`src/lib/components/dashboard/DemoRoute.svelte:21-37`). Les couches `src/lib/server/data/**` existent mais ne sont appelées par aucune route. **Aucune donnée membre réelle n'est donc exposée aujourd'hui.** C'est ce qui limite l'impact des constats M01, M02 et m01 : ils sont latents mais deviendront directs au branchement. À traiter avant, pas après.

#### SEC-I02 — Aucun fichier privé servi ; `src/routes/api/files/[...key]/+server.ts` est vide

**Gravité :** Information
L'endpoint de service des objets R2 est **un fichier de 0 octet** : aucun objet privé n'est accessible. `src/lib/server/blobs.ts` ne contrôle ni le type réel, ni la taille, ni le nom des objets ; ces contrôles restent à écrire (voir `docs/brief.md:50-59`). Aucun formulaire d'upload n'est branché.

#### SEC-I03 — Mode démonstration limité au développement (analyse statique)

**Gravité :** Information
`src/lib/demo/mode.ts:14-16` conditionne la démo à `dev`, constante de compilation ; `src/routes/dashboard/+layout.svelte:17-30` et `DemoRoute.svelte:21` gardent les imports par `dev` ; le plugin `excludeDemoFromBuild` de `vite.config.ts:16-31` remplace les modules `$lib/demo/{pages,components}` par `export default {}` à la construction. L'isolation paraît correcte **par lecture de code**, mais aucun artefact de build n'est présent dans l'arbre audité (`.svelte-kit/` absent) : je n'ai donc pas pu vérifier le bundle produit, contrairement à un audit sur artefact. Cette vérification reste à faire au déploiement.

#### SEC-I04 — `cookieCache` et Turnstile

**Gravité :** Information
`cookieCache` (1 h) réduit les lectures de session mais diffère d'autant une révocation (cf. SEC-D01). Le formulaire de contact valide Turnstile **en échec fermé** (`src/lib/server/turnstile.ts:33-41,53-66`) et échappe correctement le HTML des e-mails (`src/routes/(public)/[lang=lang]/contact/+page.server.ts:20-30,94-101`). Aucune limitation de débit propre au contact n'existe, Turnstile en tient lieu.

---

## 4. Contrôles vérifiés conformes

Ces points ont été contrôlés et n'appellent pas de correction dans le périmètre audité :

| Contrôle                                                                | Preuve                                                                                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Aucun rendu HTML brut de donnée utilisateur                             | Recherche `@html`, `innerHTML`, `eval(`, `new Function` dans `src/` : 0 usage ; `MarkdownView.svelte` rend des éléments Svelte |
| Échappement HTML des e-mails de contact                                 | `contact/+page.server.ts:20-30` et usage systématique `escapeHtml(...)`                                                        |
| Turnstile validé côté serveur, échec fermé                              | `src/lib/server/turnstile.ts:33-41,53-66` ; clé secrète lue dans `process.env`, jamais renvoyée au client                      |
| Aucune pièce jointe ni traitement de fichier côté contact               | `contact/+page.server.ts` ne lit que des champs texte                                                                          |
| Secrets absents du code versionné                                       | Recherche de motifs de clés (`re_…`, `sk_…`, JWT, clés privées) sur les fichiers versionnés : 0 résultat                       |
| `.env` ignoré, `.env.example` sans secret                               | `.gitignore:16-19` ; `.env.example` ne contient qu'une URL locale non secrète, toutes les clés sont vides                      |
| Aucun secret côté client                                                | Seule la clé **publique** Turnstile est chargée (`contact/+page.server.ts:14-16`)                                              |
| Pas de réintroduction de Supabase                                       | Aucune dépendance ni référence Supabase dans `package.json` et `src/`                                                          |
| Échec fermé en cas d'erreur base dans le hook                           | `src/hooks.server.ts:48-52` : `locals` reste vide, donc accès refusé                                                           |
| CSRF SvelteKit actif                                                    | `svelte.config.js` ne désactive pas `csrf.checkOrigin` ; formulaires en `POST` same-origin                                     |
| Validation serveur des entrées publiques                                | `contact/schema.ts` (Zod, longueurs et énumération) ; `login/schema.ts` ; `reset-password/schema.ts`                           |
| Cookie de session `httpOnly` + `sameSite: 'lax'`                        | `src/lib/server/auth.ts:55-62`                                                                                                 |
| Aucune donnée réelle dans la démonstration                              | Fixtures fictives `src/lib/demo/fixtures/**`, adresses en `example.com`                                                        |
| Guards eux-mêmes corrects (logique)                                     | `src/lib/auth/guards.ts:88-136`, hiérarchie `roles.ts:20-33`                                                                   |
| Invitations : jeton empreinté, expiration 1 h, usage unique             | `src/lib/server/data/invitations.ts:34-37,66-83`                                                                               |
| Rôles lus dans `profiles.role`, jamais dans les métadonnées Better Auth | `src/hooks.server.ts:36-47` ; `src/lib/auth/roles.ts:1-7`                                                                      |
| Dépendances suivies                                                     | `.github/dependabot.yml` (npm + GitHub Actions, hebdomadaire)                                                                  |
| Aucune commande destructive ni accès production durant l'audit          | Aucun shell, aucun réseau, aucune base contactée                                                                               |

---

## 5. Contrôles non réalisés et limites de l'audit

| Contrôle                                                             | Raison                                                                                                                                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm audit` / recherche de CVE sur les dépendances                  | Shell indisponible (`Permission denied: shell`) ; aucun outil d'audit exécutable ici. **Aucun scan n'a été lancé.**                                                           |
| `pnpm run check`, `pnpm run lint`, `pnpm run build`                  | Idem : build non reproduit sur l'arbre courant.                                                                                                                               |
| `pnpm test` / Vitest                                                 | Idem : les tests n'ont pas été exécutés ; j'ai seulement constaté que deux fichiers de test sont vides.                                                                       |
| Vérification des artefacts de build (isolation démo)                 | `.svelte-kit/` absent de l'arbre audité ; vérification uniquement statique (cf. SEC-I03).                                                                                     |
| `git status` / `git log` / suivi de `.env`                           | Shell indisponible. Un fichier `.env` existe dans l'arbre de travail ; je ne l'ai **pas ouvert** et je ne peux pas affirmer s'il est suivi par git. `.gitignore:16` l'exclut. |
| Test RLS sur une base réelle (anonyme, sans contexte, isolation A/B) | Interdit par la mission (aucune base contactée) et impossible sans shell.                                                                                                     |
| Test dynamique d'authentification, de session, d'IDOR                | Aucun test d'intrusion, aucune requête réelle.                                                                                                                                |
| Vérification des bindings Cloudflare effectifs et du WAF             | Aucun accès au compte Cloudflare ; `wrangler.jsonc` est la seule source, et il est incomplet.                                                                                 |
| Vérification de HSTS / TLS au niveau de la zone Cloudflare           | Hors du dépôt, non observable ici.                                                                                                                                            |
| Vérification du contenu réel de `.env`                               | Volontairement non lu pour ne pas manipuler de secrets.                                                                                                                       |
| Revue de la PWA (service worker applicatif)                          | Aucun `src/service-worker.ts` ; seul `static/OneSignalSDKWorker.js` (import du SDK OneSignal) existe. Aucun cache applicatif à auditer.                                       |
| Recette fonctionnelle et revue technique                             | `equipe/REVUE.md`, `equipe/TESTS.md`, `equipe/INTEGRATION.md` absents : je ne peux pas confirmer leur contenu ni leurs résultats.                                             |

**Limite générale :** l'absence de faille détectée dans un périmètre donné ne signifie pas que l'application est invulnérable. Cet audit est statique, sans exécution, et porte sur un espace membre dont les flux de données ne sont pas encore branchés.

---

## 6. Recommandations avant déploiement

### Bloquantes (à corriger avant toute mise en production)

1. **SEC-M01** — Appliquer les guards dans les layouts, pages, actions et endpoints ; refuser `pending`, `suspended`, `no_role` ; tester chaque rôle.
2. **SEC-M02** — Écrire une migration additive RLS, aligner la clé de contexte, corriger ou retirer le script de secours, vérifier sur la branche `test`.
3. **SEC-M03** — Fermer l'inscription publique (`disableSignUp`) et créer les comptes uniquement par le flux d'invitation serveur.
4. **SEC-M04** — Rendre la vérification d'e-mail et la réinitialisation opérationnelles ; rendre l'acceptation d'invitation transactionnelle et fiable ; créer le profil métier.

### À planifier avant l'ouverture de l'espace membre

5. **SEC-D01** — Déconnexion effective et révocation des sessions à la suspension.
6. **SEC-D02** — En-têtes de sécurité, CSP et `robots.txt` (validation requise, `AGENTS.md` §5).
7. **SEC-D03** — Limitation des tentatives de connexion côté action.
8. **SEC-D04** — Bindings Cloudflare, `Platform` typée, échec net si `DATABASE_URL` manque, cookie `Secure` garanti.
9. **SEC-m05** — Résolution serveur de l'audience des notifications avant tout branchement.

### Durcissement

10. **SEC-m01** à **SEC-m04** — minimisation des données, politique de mot de passe, scripts de migration, tests de sécurité et audit de dépendances en CI.
11. Refaire un audit sur artefact de build (isolation démo) et exécuter `pnpm audit` dès que l'environnement le permet.

---

## 7. Traçabilité

| Constat | Gravité     | État   |
| ------- | ----------- | ------ |
| SEC-M01 | Majeure     | Ouvert |
| SEC-M02 | Majeure     | Ouvert |
| SEC-M03 | Majeure     | Ouvert |
| SEC-M04 | Majeure     | Ouvert |
| SEC-D01 | Modérée     | Ouvert |
| SEC-D02 | Modérée     | Ouvert |
| SEC-D03 | Modérée     | Ouvert |
| SEC-D04 | Modérée     | Ouvert |
| SEC-m01 | Mineure     | Ouvert |
| SEC-m02 | Mineure     | Ouvert |
| SEC-m03 | Mineure     | Ouvert |
| SEC-m04 | Mineure     | Ouvert |
| SEC-m05 | Mineure     | Ouvert |
| SEC-I01 | Information | —      |
| SEC-I02 | Information | —      |
| SEC-I03 | Information | —      |
| SEC-I04 | Information | —      |

Aucun constat corrigé lors d'un audit antérieur : ce document est le premier audit de sécurité du projet.

**Rappel de procédure :** le déploiement est bloqué tant que ce verdict n'est pas `VALIDÉ`. Le chef de projet organise les corrections avec les développeurs concernés. Après correction, cet audit doit être repris : vérification de chaque constat, contrôle de non-régression, mise à jour de ce document et nouveau verdict.

VERDICT : À CORRIGER
