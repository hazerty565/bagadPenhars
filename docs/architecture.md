# Architecture

## Stack et déploiement

L'application est un projet SvelteKit avec Svelte, TypeScript et TailwindCSS.
Le dépôt prévoit Netlify pour l'hébergement et les Blobs, PostgreSQL pour les
données et Better Auth pour les comptes. Les choix d'hébergement de base de
données et d'authentification restent à confirmer; voir
[`questions.md`](./questions.md).

## Routes

Les routes ci-dessous correspondent à l'organisation présente sous
`src/routes/`. Leur présence dans l'arborescence ne garantit pas que chaque
fonction soit complète.

- `/(public)/[lang=lang]/...` : site public localisé. Les sections repérées
  incluent l'accueil, les articles, le bagad, la formation, l'agenda, les
  médias, les partenaires et le contact.
- `/auth/...` : connexion, déconnexion, invitation, attente, mot de passe
  oublié et réinitialisation.
- `/api/auth/[...all]` : point d'entrée prévu pour Better Auth.
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
   routes, les actions et les modules de `src/lib/server/`.
3. Better Auth doit gérer les sessions via les routes API d'authentification.
4. Les règles d'accès doivent vérifier l'identité, le rôle et, pour les
   documents de pupitre, l'appartenance au pupitre avant toute opération.
5. Les fichiers sont stockés séparément des métadonnées PostgreSQL; la base
   conserve leurs clés de stockage.

Ce flux est la cible décrite par le README. Les hooks et guards repérés dans le
dépôt sont actuellement vides; ne pas supposer que ces contrôles sont déjà
effectifs.

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

Les données privées doivent être lues et modifiées depuis le serveur, après
vérification des droits. La migration initiale ne déclare pas de politiques
RLS PostgreSQL. La stratégie entre contrôles applicatifs et RLS doit être
tranchée avant d'exposer les accès en production; voir
[`database.md`](./database.md) et [`questions.md`](./questions.md).
