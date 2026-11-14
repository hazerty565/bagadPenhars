# Architecture

> **Passages obsolètes :** les indications relatives à l'ancienne migration
> dans `migrations/` ont été remplacées. Consulter les arbitrages datés de
> [`questions.md`](./questions.md) et ne pas prendre en compte les passages qui
> y sont marqués **OBsolète — ne plus prendre en compte**.

## Stack et déploiement

L'application cible SvelteKit 5 (runes) et TypeScript. Better Auth gère les
identités et sessions; les rôles métier sont lus dans `profiles.role`.
Neon PostgreSQL fournit la base et ses politiques RLS, Drizzle le modèle et
les migrations, `pg` avec `drizzle-orm/node-postgres` le driver et Cloudflare
Hyperdrive le pooling des connexions (décision Q-2026-11-08-01). En local,
`pg` se connecte directement à la branche Neon `test`; sur Cloudflare, la
connexion passe par Hyperdrive. Les données privées soumises à RLS ne sont
pas servies depuis un cache partagé de requêtes Hyperdrive. Cloudflare R2
stocke les fichiers; Cloudflare Pages héberge l'application; Resend et
Turnstile gèrent les e-mails et l'antispam; OneSignal fournit les notifications
push.

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

### Environnements et secrets

- **Développement local** : le fichier `.env` (ignoré par Git, créé à partir
  de `.env.example`) contient les valeurs locales; `DATABASE_URL` pointe
  directement vers Neon `test`.
- **Cloudflare Preview** : Hyperdrive `bagad-dev` cible Neon `test`. Les
  secrets Preview sont configurés dans l'environnement Cloudflare correspondant.
- **Cloudflare Production** : Hyperdrive `bagad-prod` cible Neon `production`.
  Les secrets de production sont configurés séparément dans Cloudflare
  Production.
- Cette matrice décrit la cible : les configurations Hyperdrive et les secrets
  doivent être créés dans les environnements Cloudflare correspondants; leurs
  identifiants et valeurs ne sont pas stockés dans le dépôt.
- `.env` et un éventuel `.env.production` sont des fichiers locaux seulement;
  ils ne sont ni committés ni utilisés comme configuration du déploiement
  Cloudflare. Les migrations de production sont appliquées séparément, après
  validation sur `test`.

## Routes

Les routes ci-dessous correspondent à l'organisation présente sous
`src/routes/`. Leur présence dans l'arborescence ne garantit pas que chaque
fonction soit complète.

- `/(public)/[lang=lang]/...` : site public localisé. Les sections repérées
  incluent l'accueil, les articles, le bagad, la formation, l'agenda, les
  médias, les partenaires, le contact et les informations légales. La page
  d'accueil est composée de `src/lib/components/home/` (dont
  `Prestations.svelte`, les formats proposés aux organisateurs) et partage le
  header/footer de `src/lib/components/layout/`.
- `/(public)/[lang=lang]/informations-legales` : mentions légales (éditeur,
  direction de la publication, hébergement, propriété intellectuelle, données
  personnelles, cookies, liens externes, droit applicable), servies depuis le
  bloc `legal` des dictionnaires i18n. Aucune donnée en base. La page est
  reliée depuis la barre inférieure du `Footer`, à côté du copyright dont les
  années viennent de `copyrightYears()` (`src/lib/data/site.ts`).
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
- `/(public)/[lang=lang]/articles` : Actualités publiques. La liste et le
  détail (`articles/[slug]`) lisent `publishedArticles()` et `articleBySlug()`
  (`src/lib/data/articles.ts`) : contenus **provisoires** de démonstration,
  localisés en `fr`, `en` et `br`, sans lecture de la table `articles`. Le
  slug est stable et indépendant de la langue. L'accueil affiche les trois
  derniers articles publiés via le même module ; un slug inconnu renvoie 404.
- `/(public)/[lang=lang]/contact` : page Contact. Le `load` ne transmet que la
  clé publique Turnstile (`turnstileSiteKey()`); l'action `send` valide les
  champs avec Zod (`schema.ts`), vérifie le jeton auprès de Cloudflare
  (`$lib/server/turnstile.ts`), envoie le message à l'association via Resend
  (`$lib/server/email.ts`) puis un accusé de réception à l'expéditeur — jamais
  l'inverse. La carte est le composant `$lib/components/shared/Map.svelte`
  (Leaflet chargé à la demande, tuiles OpenStreetMap) et n'entre pas dans le
  rendu serveur. La page est servie par Cloudflare Pages ; aucune donnée du
  formulaire n'est stockée en base.
- `/auth/login` : page de connexion autonome, en français et en `noindex`. Le
  `load` renvoie un utilisateur actif vers `/dashboard`; l'action `login`
  normalise l'e-mail, répond par un message unique en cas d'échec et redirige
  vers `/dashboard` (303) une fois la session Better Auth établie.
- `/auth/...` : déconnexion, invitation, attente, mot de passe oublié et
  réinitialisation. Ces pages sont encore à construire ; seule la connexion est
  livrée.
- `/api/auth/[...all]` : endpoint Better Auth (sessions, invitations,
  réinitialisation) appelé par les pages `/auth/...`.
- `/api/files/[...key]` : point d'entrée prévu pour le téléchargement des
  fichiers.
- `/dashboard/...` : espace adhérent et pages d'administration : agenda,
  documents, profil, pupitre, notifications, membres, articles, médias,
  invitations et réglages. En production, `+layout.server.ts` redirige vers
  `/auth/login` sans session Better Auth vérifiée.
- `/` : redirection 307 vers `/fr` (`src/routes/(public)/+page.server.ts`) ;
  le sitemap est servi par `/sitemap.xml`.

Les pages publiques acceptent les langues `fr`, `en` et `br` selon le matcher
`src/params/lang.ts`. Le tableau de bord est sans préfixe de langue.
Les textes publics sont centralisés dans `src/lib/i18n/` (dictionnaires typés
`fr`, `en`, `br`).

## Espace membre et démonstration locale

L'espace membre est livré en deux couches strictement séparées.

**Couche de démonstration (`src/lib/demo/`)**, active uniquement en
développement local (`dev` de `$app/environment`) :

- `types.ts` reprend les noms de champs du modèle cible (`docs/database.md`) ;
- `fixtures/` contient 24 profils, les événements, réponses, notifications,
  documents, articles, albums et invitations fictifs ;
- `store.svelte.ts` expose un état réactif persisté dans `localStorage`
  (clé `bagadpenhars.demo.v1`, versionnée et validée par `fixtures/index.ts`) ;
- `session.svelte.ts` simule la session et le profil actif ;
- `permissions.ts` est la source de vérité unique des droits, utilisée à la
  fois par l'interface et par les services ;
- `services/` porte les mutations et refuse toute action non autorisée ;
- `pages/` contient les écrans, `components/` la coquille et le sélecteur de
  profil.

**Couche de production** : les routes `/dashboard/**` ne contiennent aucune
donnée. Chaque `+page.svelte` monte `DemoRoute`
(`src/lib/components/dashboard/DemoRoute.svelte`) qui, en développement,
charge la page de démonstration par `import()` dynamique ; en production, il
affiche un écran « Espace adhérents » avec un lien vers `/auth/login`.

`vite.config.ts` enregistre le plugin `bagad-exclude-demo-from-build`, qui
résout `$lib/demo/pages/*` et `$lib/demo/components/*` vers un module vide
pendant le build. Vérifié : `MODE DÉMONSTRATION`, `DEMO_STORAGE_KEY` et les
données fictives sont absents de `.svelte-kit/output` en production.

Règles de la démonstration :

- aucun import statique de `$lib/demo` dans `src/routes/` (test
  `tests/demo/isolation.test.ts`) ;
- la démonstration n'importe ni `$lib/server`, ni `$lib/db`, ni `$env/` ;
- les rôles, statuts et noms restent fictifs ; toutes les adresses utilisent
  `example.com` ;
- les guards serveur de production ne sont ni contournés ni dupliqués : la
  démonstration ne crée aucune fausse API sécurisée.

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
