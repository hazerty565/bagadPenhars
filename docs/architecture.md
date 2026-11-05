# Architecture

> **Passages obsolètes :** les indications relatives à l'ancienne migration
> dans `migrations/` ont été remplacées. Consulter les arbitrages datés de
> [`questions.md`](./questions.md) et ne pas prendre en compte les passages qui
> y sont marqués **OBsolète — ne plus prendre en compte**.

## Stack et déploiement

L'application cible SvelteKit 5, TypeScript et Tailwind CSS. Les services sont
Better Auth pour l'identité, Neon PostgreSQL avec Drizzle et Cloudflare
Hyperdrive pour les données, Cloudflare R2 pour les fichiers, Cloudflare Pages
pour l'hébergement, Resend pour les e-mails et Cloudflare Turnstile pour
l'antispam, et OneSignal pour les notifications push.

La base Neon porte le nom `bagadpenhars` et deux branches sont utilisées :
`production` et `test`. Voir [`database.md`](./database.md).

## Routes

Les routes ci-dessous correspondent à l'organisation présente sous
`src/routes/`. Leur présence dans l'arborescence ne garantit pas que chaque
fonction soit complète.

- `/(public)/[lang=lang]/...` : site public localisé. Les sections repérées
  incluent l'accueil, les articles, le bagad, la formation, l'agenda, les
  médias, les partenaires et le contact.
- `/auth/...` : connexion, déconnexion, invitation, attente, mot de passe
  oublié et réinitialisation.
- `/auth/...` et `/api/auth/...` : pages et endpoint Better Auth pour la
  connexion, la déconnexion, les invitations et la réinitialisation.
- `/api/files/[...key]` : point d'entrée prévu pour le téléchargement des
  fichiers.
- `/dashboard/...` : espace adhérent et pages d'administration : agenda,
  documents, profil, pupitre, notifications, membres, articles, médias,
  invitations et réglages.
- `/` : route d'entrée et sitemap.

Les pages publiques acceptent les langues `fr`, `en` et `br` selon le matcher
`src/params/lang.ts`. Le tableau de bord est sans préfixe de langue.

## Flux applicatifs attendus

1. Le navigateur appelle une page ou une action SvelteKit.
2. Les lectures et écritures de données sont réalisées côté serveur via les
   routes, les actions et les modules de `src/lib/server/`. Drizzle accède à
   Neon via Cloudflare Hyperdrive.
3. Better Auth gère l'identité et les sessions. SvelteKit vérifie la session
   dans les layouts, actions et endpoints serveur.
4. Les actions serveur lisent le rôle et le statut dans les profils Neon; elles
   vérifient explicitement les rôles et les pupitres sur chaque opération.
5. Cloudflare R2 stocke les fichiers. Neon conserve leurs métadonnées, clés,
   visibilité et identifiants de propriétaire.

Ce flux est la cible. Les modules historiques du dépôt ne sont pas encore
migrés; ne pas supposer que ces contrôles sont déjà effectifs.

## Organisation des dossiers

- `src/routes/` : routes, layouts, chargements et actions SvelteKit.
- `src/lib/components/` : composants d'interface regroupés par domaine.
- `src/lib/auth/` : authentification, rôles et guards.
- `src/lib/server/` : accès serveur à la base, aux fichiers, aux emails et aux
  données.
- `src/lib/schemas/` : schémas de validation.
- `src/lib/types/` : types métier et types de données.
- `src/lib/i18n/` : traductions françaises, anglaises et bretonnes.
- `migrations/` : schéma SQL versionné.
- `scripts/` : scripts de maintenance et d'administration.

## Sécurité des données

Les données privées sont protégées par des validations côté serveur, des
sessions vérifiées et des URLs R2 privées. Aucune policy Supabase n'est reprise
dans la cible.
