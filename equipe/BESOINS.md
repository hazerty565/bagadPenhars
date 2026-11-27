# Besoins du projet — Site Bagad Penhars

> Rôle : CHEF DE PROJET. Synthèse établie le **2026-11-08** à partir de `AGENTS.md`
> et de l'intégralité de `docs/`. Ce document liste les besoins à faire réaliser
> par l'équipe ; il ne remplace ni `docs/brief.md` (référence fonctionnelle) ni
> `equipe/PLAN.md` (plan d'exécution). Aucun besoin n'est inventé : chaque ligne
> renvoie à un document source.

## 1. Sources lues

| Source                                                | Ce qui en est tiré                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `AGENTS.md`                                           | Stack imposée, règles d'or Svelte/Neon/Better Auth/RLS/PWA/UI, définition de « terminé » |
| `docs/brief.md`                                       | Besoin, rôles, statuts, visibilité, hors périmètre                                       |
| `docs/Spec.md`                                        | Exigences vérifiables, critères d'acceptation, plan recommandé A→F                       |
| `docs/Spec_UI.md`                                     | Pages, composants, responsive, lecteur audio, trombinoscope                              |
| `docs/Structure.md`, `docs/architecture.md`           | Routes, dossiers, flux attendus                                                          |
| `docs/database.md`                                    | Neon, branches, RLS, matrice de droits, R2, ENUM                                         |
| `docs/pwa.md`                                         | Manifest, service worker, notifications, installation                                    |
| `docs/agenda.md`, `docs/event.md`                     | Règles RSVP, clôture, états d'événement                                                  |
| `docs/media.md`                                       | Pipeline images, quota, transformations, synchronisation                                 |
| `docs/partenaire.md`                                  | Données et logos partenaires                                                             |
| `docs/roadmap.md`, `docs/backlog.md`, `docs/suivi.md` | Focus actuel et priorités                                                                |
| `docs/questions.md`, `docs/journal.md`                | Décisions déjà tranchées et état d'avancement                                            |
| `equipe/PLAN.md`, `equipe/SYNTHESE.md`                | Plan existant et relecture documentaire                                                  |

## 2. Besoins fonctionnels

### 2.1 Site public (sans compte)

| #   | Besoin                                                                                                                                        | Source             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| F1  | Accueil synthétique : hero, aperçu Bagad, 4 pupitres, 2 prochaines dates publiques, 3 photos publiques, liens vers les pages dédiées          | Spec §4.1, Spec_UI |
| F2  | Page **Bagad** (histoire, valeurs, effectif, photos, palmarès validés)                                                                        | Spec §4.1          |
| F3  | Page **Formation** : les 4 pupitres (bombarde, cornemuse, caisse claire, percussion) avec niveaux, cours, horaires, lieu, prêt d'instrument   | Spec §4.1          |
| F4  | **Agenda public** en lecture seule, événements `public` uniquement                                                                            | brief §4           |
| F5  | **Actualités** : articles titre/texte/date/auteur, prévisualisation avant publication, contenu Markdown                                       | Spec §4.1          |
| F6  | **Albums photo** publics (titre, description, date, légendes, ordre)                                                                          | Spec §4.1          |
| F7  | **Partenaires** : logos SVG/WebP, données dans `src/lib/data/partenaires.ts`                                                                  | partenaire.md      |
| F8  | **Contact** : formulaire Turnstile + Resend, accusé de réception, pas de pièce jointe, adresse et clé jamais exposées                         | Spec §4.7          |
| F9  | **SEO** : titre/description par page et par langue, URL canoniques, sitemap public uniquement, `robots.txt` cohérent, espace privé non indexé | Spec §4.1          |
| F10 | **i18n** `fr` / `en` / `br` avec `svelte-i18n`, textes centralisés dans `src/lib/i18n/`                                                       | AGENTS.md          |
| F11 | **Lecteur audio flottant** global, persistant entre les pages, bouton « Écouter » accessible                                                  | Spec_UI            |
| F12 | **Mobile first**, WCAG AA, focus visible, `prefers-reduced-motion`                                                                            | AGENTS.md          |

### 2.2 Espace adhérents (connexion requise, français uniquement)

| #   | Besoin                                                                                                                                                                                      | Source                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| F13 | Connexion / déconnexion / mot de passe oublié / réinitialisation                                                                                                                            | Spec §4.2-4.3         |
| F14 | Cycle d'invitation : e-mail à usage unique, expiration 1 h, jeton empreinté, compte `pending`, confirmation e-mail, **activation manuelle** par secrétaire/admin, renvoi si expiration      | brief §3, Spec §4.2   |
| F15 | Dashboard + profil personnel ; le membre modifie ses champs hors rôle et pupitres                                                                                                           | Spec §4.3             |
| F16 | Agenda privé : `public` + `interne` + `pupitre` selon les pupitres du membre                                                                                                                | Spec §4.4             |
| F17 | RSVP `present` / `absent`, modifiable pendant la date de l'événement, **verrouillé à 00 h 00 Europe/Paris le lendemain**, non retirable, conservé en lecture seule après annulation/clôture | Spec §4.4, event.md   |
| F18 | Sondage = événement `is_poll = true`, sans table `polls`                                                                                                                                    | Spec §4.4             |
| F19 | **Trombinoscope V1 obligatoire** : nom, prénom, photo, pupitres, niveau musical, fonction au bureau ; jamais téléphone/e-mail/adresse ; jamais de titre public                              | brief §2 bis, Spec_UI |
| F20 | Documents/partitions PDF privés, visibles par tous les membres actifs, déposés par chef (son pupitre), secrétaire, admin                                                                    | brief §2 bis          |
| F21 | Préférences de notifications (global, rappels, rappel sans réponse)                                                                                                                         | Spec §4.6             |
| F22 | Demande de suppression de compte : suspension immédiate, traitement admin, anonymisation des réponses, clôture + notification                                                               | Spec §4.3             |
| F23 | Page d'aide « Installer l'application » (iOS/Android)                                                                                                                                       | pwa.md §7             |
| F24 | PWA installable, notifications push OneSignal après action utilisateur                                                                                                                      | pwa.md                |

### 2.3 Administration et rôles

| #   | Besoin                                                                                                                                                                                                                                                              | Source                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| F25 | Rôles `member`, `chef_pupitre`, `secretaire`, `admin` lus dans `profiles.role` (ENUM `app_role`) ; statuts `pending`, `active`, `suspended`                                                                                                                         | AGENTS.md, database.md                  |
| F26 | Secrétaire/admin : inviter, activer, suspendre, gérer tous les événements, articles, albums, notifications multi-pupitres                                                                                                                                           | brief §2                                |
| F27 | Chef de pupitre : gérer les événements mono-pupitre de ses pupitres (quel que soit leur créateur), déposer les partitions et notifier ses pupitres ; à la création : exactement un pupitre dirigé et visibilité `interne` ; jamais de gestion multi-pupitres/global | Spec §4.4, Contrat API §12.1, Q-A1/Q-A2 |
| F28 | Membre : lire, répondre, trombinoscope, profil                                                                                                                                                                                                                      | brief §2                                |
| F29 | Événements : `event_type` (9 valeurs) indépendant de `visibility` (`public`/`interne`/`pupitre`)                                                                                                                                                                    | Spec §4.4                               |
| F30 | Notifications : OneSignal côté serveur, audiences par rôle/pupitre, clé REST jamais côté client                                                                                                                                                                     | Spec §4.6                               |
| F31 | Journalisation des actions d'administration sensibles, sans secrets                                                                                                                                                                                                 | Spec §5                                 |
| F32 | Matrice de droits appliquée **à la fois** par les guards serveur et par RLS                                                                                                                                                                                         | database.md §6                          |

## 3. Besoins techniques (focus actuel du roadmap)

| #   | Besoin                                                                                                                                                                                | Source                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| T1  | Neon PostgreSQL, branches `test` (dev/preview) et `production`, aucune chaîne committée                                                                                               | database.md            |
| T2  | Drizzle + `pg`/`drizzle-orm/node-postgres` + Cloudflare Hyperdrive, migrations reproductibles dans `drizzle/` + `drizzle/meta/`, migration appliquée jamais modifiée                  | AGENTS.md, database.md |
| T3  | Better Auth pour l'identité et les sessions ; `profiles.role` / `account_status` seules autorités métier ; `event.locals.profile/role/accountStatus`                                  | Spec §6                |
| T4  | Guards centralisés (`src/lib/auth/guards.ts`) appliqués dans **chaque** layout, action et endpoint ; le menu filtré n'est jamais un contrôle d'accès                                  | AGENTS.md              |
| T5  | RLS activée avec policies explicites sur toutes les tables sensibles ; `set_config(..., true)` au début de chaque transaction ; rôle runtime sans `BYPASSRLS` ni propriété des tables | Spec §5                |
| T6  | Lectures privées jamais servies par un cache partagé Hyperdrive                                                                                                                       | Spec §5                |
| T7  | R2 : buckets `bagad-public` / `bagad-private`, objets privés servis après contrôle serveur ou URL signée courte                                                                       | database.md §5         |
| T8  | Quota global 8 Go, alerte 7 Go, blocage à 8 Go, table `storage_usage`, réservation/confirmation/libération/réconciliation                                                             | brief §2 bis, media.md |
| T9  | Images : JPG/JPEG/PNG/WebP ≤ 15 Mo et ≤ 6000×6000, sortie WebP ≤ 2000×2000 q82, métadonnées supprimées ; OGG ≤ 30 Mo ; PDF ≤ 20 Mo ; vidéo refusée                                    | Spec §4.5              |
| T10 | Resend (invitations, réinitialisations, contact) et Turnstile côté serveur                                                                                                            | Spec §6                |
| T11 | OneSignal côté serveur, audiences vérifiées, jamais d'identifiant de destinataire soumis par le navigateur                                                                            | Spec §4.6              |
| T12 | Service worker : notifications uniquement, aucun cache de page/donnée membre, `Cache-Control: no-cache`                                                                               | AGENTS.md, pwa.md      |
| T13 | CI `check` / `lint` / `build` verte sur push et pull request                                                                                                                          | roadmap.md             |
| T14 | Tests : unitaires, autorisations serveur, RLS (absence de contexte, isolation de deux identités), parcours d'invitation                                                               | Spec §7, backlog       |
| T15 | Aucun secret committé ; `.env.example` à jour                                                                                                                                         | AGENTS.md              |
| T16 | Svelte 5 runes uniquement : pas de `export let`, `$:`, `on:click`, stores legacy pour l'état local                                                                                    | AGENTS.md              |

## 4. Écarts constatés dans le dépôt au 2026-11-08

> Constats vérifiés par lecture de fichiers et par commande. Ils ne sont pas des
> besoins nouveaux : ce sont des manquements aux besoins ci-dessus.

| #   | Constat                                                                                                                                                                                                                                                                                                            | Besoin non couvert | Preuve                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ----------------------------------- |
| E1  | `pnpm-lock.yaml` n'est pas synchronisé avec `package.json` (7 dépendances ajoutées, 3 retirées) ; `pnpm install --frozen-lockfile` échoue                                                                                                                                                                          | T13                | sortie `ERR_PNPM_OUTDATED_LOCKFILE` |
| E2  | `src/lib/server/auth.ts` importe `generateId` depuis `lucia`, paquet absent des dépendances ; il passe `db` directement à `betterAuth` au lieu de l'adaptateur Drizzle                                                                                                                                             | T3                 | `src/lib/server/auth.ts:3,16`       |
| E3  | Aucun fichier de migration dans `drizzle/` (seulement la configuration)                                                                                                                                                                                                                                            | T2                 | dossier `drizzle/` vide             |
| E4  | Aucune policy RLS ni activation RLS dans le schéma ; aucun helper de contexte transactionnel                                                                                                                                                                                                                       | T5, T6             | `src/lib/db/schema.ts`              |
| E5  | Le driver `drizzle-orm/neon-http` ne permet pas de transaction interactive ; or `set_config(..., true)` exige la même transaction que les requêtes                                                                                                                                                                 | T5                 | `src/lib/db/index.ts`               |
| E6  | `storage_usage` stocke les octets en `integer` (max 2 147 483 647) alors que le quota est de 8 Go (8 589 934 592)                                                                                                                                                                                                  | T8                 | `src/lib/db/schema.ts:439-441`      |
| E7  | `scripts/migrate.js` et `scripts/reset-agenda.js` sont vides                                                                                                                                                                                                                                                       | T2                 | taille 0 octet                      |
| E8  | Aucun état « annulé » sur `events`, alors que l'annulation et la lecture seule sont exigées                                                                                                                                                                                                                        | F17, event.md      | `src/lib/db/schema.ts:170-193`      |
| E9  | Les tables Better Auth (`user`, `session`, `account`, `verification`) ne sont pas déclarées dans le schéma Drizzle                                                                                                                                                                                                 | T3                 | `src/lib/db/schema.ts`              |
| E10 | `src/lib/server/blobs.ts` suppose `createSignedGetUrl()` sur le binding R2 (API Workers inexistante) ; les noms de bindings (`bagad_public`/`bagad_private`) ne correspondent ni à `R2_BUCKET` (Structure.md) ni à `R2_BUCKET_PUBLIC`/`R2_BUCKET_PRIVATE` (media.md)                                               | T7                 | `src/lib/server/blobs.ts:27,34`     |
| E11 | Les dossiers historiques `supabase/` et `netlify/` subsistent alors que la cible est Neon/Cloudflare Pages                                                                                                                                                                                                         | T1                 | arborescence                        |
| E12 | Deux composants Svelte utilisent encore `export let`                                                                                                                                                                                                                                                               | T16                | recherche `export let`              |
| E13 | Contradictions documentaires : `media.md` décrit un `storage_usage` par bucket alors que `database.md` le décrit global ; Cloudflare Images ne peut pas servir une clé R2 via `imagedelivery.net` ; `event.md` prévoit un cron de rappel à J-3 alors que `Spec.md` §4.6 prévoit un envoi automatique à la création | T8, F30            | docs                                |

## 5. Ordre de réalisation retenu

1. **Socle bloquant** : E1 → E5, E9, E7, puis E6, E8, E10.
2. **Fonctions métier** : invitation/activation, agenda/RSVP, trombinoscope, documents, articles/albums.
3. **Notifications et PWA** : OneSignal serveur, service worker, installation, tests mobiles.
4. **Qualité** : CI verte, tests d'autorisation et RLS, accessibilité, i18n.
5. **Mise en production** : environnements, secrets, déploiement Cloudflare Pages.

## 6. Décisions client et questions

Toutes les questions ouvertes ont été tranchées par le client le **2026-11-08**
(`docs/questions.md`). Aucun point listé ci-dessous ne reste bloquant.

| Question        | Décision                                                                                                                                                     | Impact principal |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| Q-2026-11-08-01 | `pg` + `drizzle-orm/node-postgres` sur Hyperdrive ; helper `withUserContext(profileId, callback)` transactionnel avec `set_config('app.user_id', ..., true)` | T2, T5, E5       |
| Q-2026-11-08-02 | `storage_usage` global unique, colonnes `bigint`, seuils et `last_sync_at` ; supprimer la variante par bucket de `media.md`                                  | T8, E6, E13      |
| Q-2026-11-08-03 | R2 + Cloudflare Image Resizing à la volée (400×400, 2000×2000) ; pas de stockage Cloudflare Images                                                           | T9, E13          |
| Q-2026-11-08-04 | Bindings `R2_PUBLIC` / `R2_PRIVATE` ; privé servi par `/api/files/[...key]`, sans URL signée                                                                 | T7, E10          |
| Q-2026-11-08-05 | `cancelled_at` (+ `cancelled_by`), états `annule` / `clos` / `actif`, réponses en lecture seule                                                              | F17, E8          |
| Q-2026-11-08-06 | Seuls secrétaire et admin invitent ; mécanisme plugin `admin` Better Auth retenu                                                                             | F14, F26, E2     |
| Q-2026-11-08-07 | Notification à la création + rappel J-3 par Scheduled Worker, selon les préférences                                                                          | F30, E13         |
| Q-2026-11-08-08 | Réponses anonymisées sans limite, `activity_log` 24 mois, contact 12 mois, invitations 30 jours ; purge désactivée par défaut                                | F22, F31         |
| Q-2026-11-08-09 | Conserver `supabase/` et `netlify/`, déplacer dans `docs/Archive/`, tracer dans `docs/journal.md`                                                            | T1, E11          |
| Q-2026-11-07-02 | Design de référence dans `src/autre` ; icône définitive fournie plus tard dans `src/routes/public`                                                           | F24              |
| Q-2026-11-07-03 | Installation de la PWA après connexion, page d'aide iOS/Android                                                                                              | F23, F24         |

**Réserve unique :** Q-2026-11-08-06 tranche _qui_ invite mais pas explicitement le mécanisme
de création du compte. Le plan retient la proposition (plugin `admin` Better Auth), seule
compatible avec le brief ; toute objection du client rouvre l'étape 20.

Toute nouvelle ambiguïté doit être consignée dans `docs/questions.md` au format
date / problème / pourquoi / proposition, et non implémentée par supposition.
