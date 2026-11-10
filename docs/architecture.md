# Architecture

> **Passages obsolètes :** les indications relatives à l'ancienne migration
> dans `migrations/` ont été remplacées. Consulter les arbitrages datés de
> [`questions.md`](./questions.md) et ne pas prendre en compte les passages qui
> y sont marqués **OBsolète — ne plus prendre en compte**.

## Stack et déploiement

L'application cible SvelteKit 5 (runes) et TypeScript. Better Auth gère les
identités et sessions; les rôles métier sont lus dans `profiles.role`.
Neon PostgreSQL fournit la base et ses politiques RLS, Drizzle le modèle et
les migrations, `@neondatabase/serverless` le driver et Cloudflare Hyperdrive
le pooling des connexions. Les données privées soumises à RLS ne sont pas
servies depuis un cache partagé de requêtes Hyperdrive. Cloudflare R2 stocke
les fichiers; Cloudflare Pages héberge l'application; Resend et Turnstile
gèrent les e-mails et l'antispam; OneSignal fournit les notifications push.

Le menu est construit côté serveur selon le profil et les permissions, puis
transmis à l'interface. Cela améliore l'UX, mais n'est pas une barrière de
sécurité : les routes d'administration restent protégées par des guards
serveur, même lorsqu'un utilisateur connaît directement leur URL.
On ne peut pas garantir qu'un chemin d'administration n'existe dans aucun
fichier JavaScript du build; l'exigence vérifiable est de ne pas transmettre
à l'utilisateur les liens et données de navigation non autorisés, et de
refuser tout accès direct côté serveur et RLS.

La base Neon porte le nom `bagadpenhars` et deux branches sont utilisées :
`production` et `test`. Voir [`database.md`](./database.md).

## Routes

Les routes ci-dessous correspondent à l'organisation présente sous
`src/routes/`. Leur présence dans l'arborescence ne garantit pas que chaque
fonction soit complète.

- `/(public)/[lang=lang]/...` : site public localisé. Les sections repérées
  incluent l'accueil, les articles, le bagad, la formation, l'agenda, les
  médias, les partenaires et le contact. La page d'accueil est composée de
  `src/lib/components/home/` (dont `Prestations.svelte`, les formats proposés
  aux organisateurs) et partage le header/footer de
  `src/lib/components/layout/`.
- `/(public)/[lang=lang]/bagad` : page de présentation de l'association. Contenu
  éditorial statique (histoire, mission, repères chiffrés, invitation à
  rejoindre) servi depuis les dictionnaires i18n ; aucune donnée en base. Les
  photographies sont des fichiers de `static/`.
- `/(public)/[lang=lang]/formation` : présentation des quatre pupitres, des
  informations pratiques et des mascottes ; contenu servi depuis les
  dictionnaires et `src/lib/data/`.
- `/(public)/[lang=lang]/agenda` : agenda public en lecture seule. Le `load`
  renvoie `agendaSections()` (`src/lib/data/agenda.ts`) : données **provisoires**
  reprises du site officiel, séparées en événements à venir (ordre croissant) et
  passés (ordre décroissant) sur la date de `Europe/Paris`. Aucune lecture de la
  table `events` pour l'instant ; aucune action RSVP sur la page publique
  (Q-2026-11-10-09). L'accueil consomme les deux prochaines dates du même
  module.
- `/(public)/[lang=lang]/contact` : page Contact. Le `load` ne transmet que la
  clé publique Turnstile (`turnstileSiteKey()`); l'action `send` valide les
  champs avec Zod (`schema.ts`), vérifie le jeton auprès de Cloudflare
  (`$lib/server/turnstile.ts`), envoie le message à l'association via Resend
  (`$lib/server/email.ts`) puis un accusé de réception à l'expéditeur — jamais
  l'inverse. La carte est le composant `$lib/components/shared/Map.svelte`
  (Leaflet chargé à la demande, tuiles OpenStreetMap) et n'entre pas dans le
  rendu serveur. La page est servie par Cloudflare Pages ; aucune donnée du
  formulaire n'est stockée en base.
- `/auth/...` : connexion, déconnexion, invitation, attente, mot de passe
  oublié et réinitialisation.
- `/auth/...` et `/api/auth/...` : pages et endpoint Better Auth pour la
  connexion, la déconnexion, les invitations et la réinitialisation.
- `/api/files/[...key]` : point d'entrée prévu pour le téléchargement des
  fichiers.
- `/dashboard/...` : espace adhérent et pages d'administration : agenda,
  documents, profil, pupitre, notifications, membres, articles, médias,
  invitations et réglages.
- `/` : redirection 307 vers `/fr` (`src/routes/(public)/+page.server.ts`) ;
  le sitemap est servi par `/sitemap.xml`.

Les pages publiques acceptent les langues `fr`, `en` et `br` selon le matcher
`src/params/lang.ts`. Le tableau de bord est sans préfixe de langue.
Les textes publics sont centralisés dans `src/lib/i18n/` (dictionnaires typés
`fr`, `en`, `br`).

## Flux applicatifs attendus

1. Le navigateur appelle une page ou une action SvelteKit.
2. Better Auth valide l'identité et la session côté serveur. Les guards
   SvelteKit chargent depuis Neon le profil, le statut et `profiles.role`
   (ENUM `app_role`); les droits ne viennent ni du client ni des rôles Better
   Auth.
3. Le menu est filtré par le serveur. Chaque `+page.server.ts`, action et
   endpoint protégé vérifie aussi ses propres permissions; le filtrage UI ne
   remplace jamais un guard.
4. Chaque transaction de base commence par l'établissement du contexte
   utilisateur avec `set_config(..., true)`, puis exécute ses requêtes dans la
   même transaction/connexion. Les politiques RLS Neon/PostgreSQL appliquent
   les droits au niveau des lignes. Sans contexte, l'accès privé échoue fermé.
5. Drizzle utilise `pg` (`drizzle-orm/node-postgres`) et se connecte via
   Cloudflare Hyperdrive (décision Q-2026-11-08-01). Le pooling est activé; le
   cache de requêtes est exclu des lectures privées dépendantes de l'identité.
6. Cloudflare R2 stocke les fichiers. Neon conserve leurs métadonnées, clés,
   visibilité et identifiants de propriétaire.
7. Les uploads passent par des routes SvelteKit exécutées sur Cloudflare Pages.
   Neon réserve l'espace de façon transactionnelle, puis SvelteKit charge le
   fichier final dans le bucket public ou privé. Une réservation est libérée en
   cas d'échec et les suppressions/remplacements mettent à jour les compteurs.
   Une synchronisation périodique réconcilie les compteurs avec les buckets.

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
- `drizzle/` : migrations SQL versionnées et métadonnées générées par Drizzle.
- `scripts/` : scripts de maintenance et d'administration.

## Sécurité des données

Les données privées sont protégées par des sessions Better Auth vérifiées,
des guards SvelteKit, des politiques RLS Neon/PostgreSQL et des URLs R2
privées. Les contextes RLS sont transactionnels et les lectures protégées
contournent tout cache partagé de requêtes.
