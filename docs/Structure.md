# Structure du dépôt

Ce document décrit l'organisation réelle du dépôt et le rôle de ses principaux
répertoires. Il distingue les fichiers présents de la cible fonctionnelle :
la présence d'une route, d'un module ou d'une migration ne prouve pas que le
parcours correspondant est complet ou validé.

Pour les règles produit, se référer au [brief](./brief.md), à la
[spécification](./Spec.md) et aux décisions datées de
[questions.md](./questions.md). Pour les routes et les flux applicatifs, voir
[architecture.md](./architecture.md).

## 1. Vue d'ensemble

```text
bagadPenhars/
├── .github/                 # Automatisation du dépôt et CI
├── docs/                    # Produit, architecture, schéma et suivi
├── drizzle/                 # Migrations SQL générées par Drizzle
│   ├── meta/                # Métadonnées du journal Drizzle
│   └── 0000_initial.sql     # Première migration PostgreSQL Neon
├── scripts/                 # Scripts de maintenance et migration
├── src/
│   ├── autre/               # Prototype visuel autonome (Vite + Svelte)
│   │   ├── public/          # Images et ressources visuelles du prototype
│   │   └── src/
│   │       ├── App.svelte
│   │       ├── components/  # Sections de la maquette de page d'accueil
│   │       └── lib/         # Données de démonstration du prototype
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts     # Connexion Neon / Hyperdrive pour Drizzle
│   │   │   └── schema.ts    # Définition du schéma Drizzle
│   │   └── server/          # Auth, R2, e-mail et logique sensible côté serveur
│   ├── params/              # Matchers de routes SvelteKit
│   └── routes/              # Pages, actions et endpoints SvelteKit
├── static/                  # Fichiers servis tels quels
├── tests/                   # Tests Vitest du projet
├── drizzle.config.ts        # Configuration de Drizzle et des migrations
├── package.json             # Scripts et dépendances
├── svelte.config.js         # Configuration SvelteKit / Cloudflare Pages
└── vite.config.ts           # Configuration Vite
```

Le dépôt cible SvelteKit 5, TypeScript, Tailwind CSS, Better Auth, Neon
PostgreSQL, Cloudflare Pages et Cloudflare R2. Les dépendances exactes sont
définies dans `package.json`.

## 2. Routes SvelteKit

Les fichiers sous `src/routes/` déterminent les URL. Les groupes entre
parenthèses organisent le code sans apparaître dans l'URL.

```text
src/routes/
├── +layout.server.ts
├── +layout.svelte
├── +error.svelte
├── (public)/
│   ├── +page.server.ts          # Route racine / et redirection d'entrée
│   └── [lang=lang]/
│       ├── +layout.server.ts
│       ├── +layout.svelte
│       ├── +error.svelte
│       ├── +page.server.ts
│       ├── +page.svelte         # Accueil localisé
│       ├── agenda/
│       ├── articles/
│       │   └── [slug]/
│       ├── bagad/
│       ├── contact/
│       ├── formation/
│       ├── media/
│       └── partenaires/
├── auth/
│   ├── forgot-password/
│   ├── invitation/
│   ├── login/
│   ├── logout/
│   ├── pending/
│   └── reset-password/
├── api/
│   ├── auth/[...all]/
│   └── files/[...key]/
├── dashboard/
│   ├── +layout.server.ts
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── admin/
│   │   ├── agenda/              # Liste et création d'événements
│   │   ├── articles/            # Liste, création et édition
│   │   ├── invitations/
│   │   ├── media/
│   │   ├── membres/
│   │   ├── notifications/
│   │   ├── permissions/
│   │   └── settings/
│   ├── agenda/
│   ├── documents/
│   ├── notifications/
│   ├── profil/
│   ├── pupitre/
│   │   ├── documents/
│   │   ├── membres/
│   │   └── notifications/
│   └── securite/
├── public/                      # Ressources utilisées par certaines pages
└── sitemap.xml/
```

Les routes publiques localisées utilisent le matcher `src/params/lang.ts` et
les langues `fr`, `en` et `br`. L'espace adhérent et l'authentification sont
en français. Les URL du tableau de bord sont sous `/dashboard`; les groupes
`(public)` et `[lang=lang]` n'ajoutent pas de segment visible au chemin.

Les routes d'administration et de pupitre sont des surfaces distinctes de
l'agenda et des documents communs. Les gardes doivent être vérifiés côté
serveur pour chaque chargement, action et endpoint : masquer une action dans
l'interface ne constitue pas un contrôle d'accès.

Les dossiers contenant des fichiers de test ou des `schema.ts` regroupent les
tests et validations propres à la route. Leur présence ne signifie pas que tous
les scénarios métier ou les autorisations serveur sont couverts.

## 3. Bibliothèques partagées (`src/lib/`)

```text
src/lib/
├── assets/           # Ressources importées par le code
├── auth/             # Rôles, permissions, guards et helpers d'auth
├── components/       # Composants d'interface par domaine
├── data/             # Données éditoriales et de navigation
├── demo/             # Espace membre de démonstration (développement seulement)
├── i18n/             # Traductions fr, en, br et outils associés
├── notifications/    # Intégration cliente et envoi des notifications
├── schemas/          # Schémas Zod des formulaires et objets métier
├── server/           # Accès serveur et modules de données
├── stores/           # État partagé Svelte
├── types/            # Types métier et types de base
├── utils/            # Fonctions utilitaires
└── vitest-examples/  # Exemples liés aux tests
```

### Composants d'interface

`src/lib/components/` regroupe les composants selon leur usage :

- `articles/`, `events/`, `documents/`, `members/` et `notifications/` :
  composants métier ;
- `forms/` : formulaires de contact et de profil ;
- `media/` : galerie, téléversement d'images et éditeur ;
- `layout/` : navigation, pied de page, barre latérale et éléments de page ;
- `partners/` : composants de partenaires ;
- `polls/` : composants d'interface historiques ou de présentation des
  sondages. Le modèle métier courant représente un sondage comme un événement
  `events` avec `is_poll`, pas comme une table `polls` distincte ;
- `shared/` et `ui/` : composants génériques réutilisables.

La structure des composants décrit leur emplacement, pas leur état
d'implémentation ni leur conformité complète aux décisions en cours de revue.

### Espace membre de démonstration

`src/lib/demo/` porte tout l'espace adhérent en mode démonstration. Il n'est
jamais actif en production : le plugin `bagad-exclude-demo-from-build` de
`vite.config.ts` remplace `pages/` et `components/` par un module vide au
build, et les routes `/dashboard/**` n'en chargent rien statiquement.

```text
src/lib/demo/
├── types.ts              # Types miroirs du modèle PostgreSQL cible
├── clock.ts              # Date figée (2026-11-11, Europe/Paris) et formats
├── mode.ts               # Détection dev-only du mode démonstration
├── labels.ts             # Libellés des rôles, niveaux, types et statuts
├── fixtures/             # Profils, événements, réponses, articles, médias…
├── store.svelte.ts       # État réactif persisté (bagadpenhars.demo.v1)
├── session.svelte.ts     # Session et profil actif simulés
├── permissions.ts        # Source de vérité unique des droits
├── services/             # Mutations contrôlées (événements, RSVP, profils…)
├── components/           # Coquille et sélecteur de profil
└── pages/                # Écrans de l'espace membre
```

Les tests correspondants sont dans `tests/demo/` (fixtures, permissions,
événements, réponses, notifications, store, mode, isolation).

### Modules serveur, données et types

- `src/lib/server/` contient les accès serveur, notamment l'authentification,
  la base de données, les fichiers et les modules `server/data/` pour les
  événements, présences, documents, invitations et profils.
- `src/lib/auth/` centralise les rôles, permissions et gardes.
- `src/lib/schemas/` contient les schémas de validation ; `src/lib/types/`
  regroupe les types TypeScript, dont ceux associés au modèle PostgreSQL Neon.
- `src/lib/data/` contient notamment les données éditoriales de formation,
  navigation et partenaires.
- `src/lib/i18n/` contient les dictionnaires français, anglais et breton.
- `src/lib/notifications/` sépare l'intégration cliente de l'envoi serveur.

Les décisions actuelles sont les suivantes :

- les rôles applicatifs sont `member`, `chef_pupitre`, `secretaire` et `admin`,
  indépendamment du statut `pending`, `active` ou `suspended` ;
- seuls la secrétaire et l'admin peuvent inviter et activer les comptes ;
- il y a quatre pupitres indépendants: Bombarde, Caisse claire, Cornemuse et
  Percussion ; la responsabilité de chaque pupitre est portée séparément par
  `profile_pupitres.is_chef`;
- les types d'événement sont un ENUM de neuf valeurs ; la visibilité
  (`public`, `interne`, `pupitre`) est indépendante du type ;
- un événement ou sondage avertit les personnes concernées par OneSignal ;
- les réponses sont `present` ou `absent`. Le membre peut modifier sa réponse,
  pas la supprimer ; elles restent à la suspension et sont anonymisées lors
  d'une suppression de compte selon les décisions validées.

La migration historique Supabase 005 n'est pas réutilisée pour Neon. Les règles
ci-dessus décrivent la décision produit et ne garantissent pas que le modèle
Drizzle, les migrations Neon ou les modules serveur les implémentent déjà tous.

## 4. Services et données

### Neon, Better Auth et Cloudflare R2

```text
drizzle/                 # Migrations SQL générées par Drizzle
drizzle.config.ts        # Source, cible et chemin des migrations
src/lib/db/index.ts      # Drizzle via Neon et Cloudflare Hyperdrive
src/lib/db/schema.ts     # Tables, relations et types du modèle applicatif
src/lib/server/auth.ts   # Configuration Better Auth
src/lib/server/r2.ts     # Accès serveur aux buckets public/private
src/lib/server/email.ts  # Envoi Resend côté serveur
```

La base Neon s'appelle `bagadpenhars` et possède les branches `test` et
`production`.

Better Auth fournit l'identité et les sessions. Le rôle métier provient de
`profiles.role`. Les guards SvelteKit s'appliquent à chaque route protégée et
les politiques RLS Neon/PostgreSQL protègent les tables sensibles. Le contexte
utilisateur est transactionnel (`set_config(..., true)`); les lectures privées
ne sont pas servies depuis un cache partagé Hyperdrive. Le driver est `pg`
avec `drizzle-orm/node-postgres`, en local comme au-dessus d'Hyperdrive
(décision Q-2026-11-08-01).

Le schéma métier courant utilise notamment `profiles`, `profile_pupitres`,
`events`, `event_pupitres` et `event_responses`. Les sondages sont représentés
dans `events` par `is_poll` ; les tables historiques `polls` et
`poll_responses` ne font pas partie du modèle retenu.

Les objets sont séparés dans deux buckets R2 distincts: `bagad-public` et
`bagad-private`. Les objets privés sont servis après contrôle côté serveur,
jamais par URL publique permanente. Le quota global est limité à 8 Go avec
alerte à 7 Go et blocage de tout nouvel upload à 8 Go.

### Cloudflare Pages et notifications

Cloudflare Pages héberge le runtime SvelteKit et reçoit les bindings Neon via
variables d'environnement et R2 via les bindings `R2_PUBLIC` et `R2_PRIVATE`. OneSignal reste le
service de notification push côté serveur.

Le service worker OneSignal fourni dans `static/OneSignalSDKWorker.js` ne
signifie pas que la stratégie PWA/cache est finalisée. La compatibilité avec
un éventuel service worker applicatif reste soumise à la décision décrite dans
[`pwa.md`](./pwa.md).

## 5. Prototype visuel (`src/autre/`)

`src/autre/` est une petite application Svelte autonome, avec son propre
`package.json`, son point d'entrée `src/main.ts`, son `App.svelte` et ses
ressources dans `public/`. Elle sert de référence visuelle pour la page
d'accueil ; elle n'est pas le routeur de production et ses événements ou
images de démonstration ne sont pas la source de données du site.

Les composants principaux du prototype sont :

| Composant                 | Idée visuelle réutilisable                                                |
| ------------------------- | ------------------------------------------------------------------------- |
| `HeroSection.svelte`      | Hero d'accueil avec image, titre, présentation courte et appel à l'action |
| `AboutSection.svelte`     | Présentation du Bagad, repères et aperçu des pupitres                     |
| `FormationSection.svelte` | Cartes de présentation des quatre pupitres                                |
| `EventsSection.svelte`    | Aperçu des prochaines dates et lien vers l'agenda                         |
| `GallerySection.svelte`   | Grille de photos et aperçu de la galerie                                  |
| `FloatingPlayer.svelte`   | Lecteur flottant ; conserve le morceau pendant la navigation              |
| `NavBar.svelte`           | Navigation et bouton « Écouter » avec icône de notes de musique           |
| `ContactSection.svelte`   | Repères de contact                                                        |

L'objectif est de reprendre et adapter les idées utiles, pas de recopier
l'application autonome telle quelle. La page d'accueil de production reste
dans `src/routes/(public)/[lang=lang]/` et doit résumer le contenu des pages
publiques dédiées :

- le hero introduit l'association ;
- le Bagad est présenté brièvement, avec un lien vers sa page complète ;
- la formation est présentée en aperçu pour les quatre pupitres, avec un lien
  vers la présentation détaillée ;
- les deux prochaines représentations publiques sont affichées en lecture
  seule, avec un lien vers toutes les dates de l'agenda public ;
- trois photos publiques sont choisies dans la galerie pour l'aperçu, avec un
  lien vers la galerie complète.

Les pages Bagad, Formation, Agenda et Médias restent les références détaillées
de leur domaine. La page d'accueil n'en duplique que des extraits et oriente
vers ces pages. Les règles de sélection et les détails d'interface sont
précisés dans [`Spec_UI.md`](./Spec_UI.md).

## 6. Tests, scripts et ressources statiques

- `tests/` contient les tests du dépôt exécutés par Vitest.
- Les fichiers `*.test.ts` présents sous les routes vérifient des parcours ou
  schémas spécifiques.
- Les tests de permissions doivent couvrir les accès serveur et les objets R2.
- `scripts/` contient les scripts de migration et de maintenance.
- `static/` contient les fichiers servis directement, notamment le manifest
  PWA, `robots.txt` et le worker OneSignal.
- `src/routes/public/` contient des ressources images rattachées à l'arbre de
  routes ; ce n'est pas le répertoire global `static/`.
- `src/autre/public/` contient les ressources propres au prototype visuel ;
  elles ne sont pas automatiquement les ressources publiques de SvelteKit.

## 7. Documentation du projet

| Fichier                                                                  | Responsabilité                                              |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `README.md`                                                              | Présentation du dépôt, démarrage et liens documentaires     |
| `AGENTS.md`                                                              | Conventions et consignes de contribution                    |
| `Context.MD`                                                             | Contexte historique et concepts du projet                   |
| `docs/brief.md`                                                          | Besoin et périmètre produit                                 |
| `docs/Spec.md`                                                           | Exigences fonctionnelles et critères d'acceptation          |
| `docs/Spec_UI.md`                                                        | Spécification de l'interface                                |
| `docs/architecture.md`                                                   | Routes, flux applicatifs et architecture                    |
| `docs/database.md`                                                       | Neon, Better Auth, R2 et droits applicatifs                 |
| `docs/pwa.md`                                                            | Manifest, cache et notifications                            |
| `docs/questions.md`                                                      | Décisions validées et points ouverts, avec arbitrages datés |
| `docs/roadmap.md`, `docs/backlog.md`, `docs/suivi.md`                    | Priorités et avancement                                     |
| `docs/journal.md`                                                        | Historique des changements et validations                   |
| `docs/bagad-penhars-schema-drawsql.sql`, `docs/bagad-penhars-schema.mmd` | Représentations documentaires du schéma                     |

Une divergence entre un fichier ancien et une décision plus récente ne crée pas
automatiquement un nouveau besoin. Se reporter aux arbitrages de
`docs/questions.md` : un passage marqué **OBsolète — ne plus prendre en
compte** est historique ; une décision client nouvelle y est datée et
explicitement distinguée.
