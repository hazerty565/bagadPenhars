# Architecture

## Stack et déploiement

L'application cible SvelteKit 5, TypeScript et TailwindCSS. Supabase est
l'unique fournisseur de services de données : Auth, PostgreSQL avec RLS et
Storage. Netlify sert à héberger l'application; OneSignal est prévu pour les
notifications push.

Cette architecture est la cible, pas encore l'état complet du dépôt : les
fichiers d'authentification et le schéma historiques doivent être migrés vers
Supabase. Voir [`database.md`](./database.md).

## Routes

Les routes ci-dessous correspondent à l'organisation présente sous
`src/routes/`. Leur présence dans l'arborescence ne garantit pas que chaque
fonction soit complète.

- `/(public)/[lang=lang]/...` : site public localisé. Les sections repérées
  incluent l'accueil, les articles, le bagad, la formation, l'agenda, les
  médias, les partenaires et le contact.
- `/auth/...` : connexion, déconnexion, invitation, attente, mot de passe
  oublié et réinitialisation.
- `/auth/...` : pages d'authentification s'appuyant sur Supabase Auth et son
  intégration SSR; aucun serveur d'authentification distinct n'est prévu.
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
3. Supabase Auth gère l'identité; SvelteKit lit et renouvelle la session avec
   le client serveur SSR.
4. Les policies RLS protègent les lignes dans PostgreSQL et les objets de
   Storage. Les actions serveur appliquent aussi les règles métier et
   vérifient le rôle et les pupitres.
5. Les fichiers sont stockés dans Supabase Storage; PostgreSQL conserve leurs
   métadonnées et clés.

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

Les données privées doivent être protégées par des policies RLS Supabase et
des contrôles côté serveur. La migration historique dans `migrations/` ne
déclare pas ces policies et dépend de l'ancien système d'authentification;
elle doit être portée vers `supabase/migrations/` avant d'être utilisée avec
la cible.
