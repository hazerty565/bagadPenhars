# AGENTS.md : Site Bagad Penhars

Site de l'association Bagad Penhars (Quimper) : vitrine publique + espace adhérents sur invitation, installable en PWA.
Stack : SvelteKit 5 (runes), Tailwind, Motion, Better Auth, Neon PostgreSQL, Cloudflare Pages, Cloudflare R2, OneSignal.

**Lis ce fichier d'abord, puis `docs/`. En cas de doute, n'invente pas : écris la question dans `docs/questions.md`.**

## 1. Ordre de lecture

| Fichier                                 | Pourquoi                                                     |
| --------------------------------------- | ------------------------------------------------------------ |
| `docs/brief.md`                         | Besoin, rôles, décisions de visibilité                       |
| `docs/Spec.md`                          | Exigences fonctionnelles et techniques pour les développeurs |
| `docs/Spec_UI.md`                       | Spécifications des pages, composants et comportements UI     |
| `docs/Structure.md`                     | Structure du dépôt, routes, bibliothèques et services        |
| `docs/architecture.md`                  | Routes, flux d'auth, arborescence                            |
| `docs/database.md`                      | Neon, Better Auth, R2, migrations                            |
| `docs/bagad-penhars-schema.mmd`         | Diagramme du schéma de base de données                       |
| `docs/bagad-penhars-schema-drawsql.sql` | Schéma SQL source pour DrawSQL                               |
| `docs/drawSQL_BagadPenhars.webp`        | Illustration du schéma de base de données                    |
| `docs/pwa.md`                           | Manifest, service worker, notifications                      |
| `docs/agenda.md`                        | Interface et flux de l'agenda                                |
| `docs/event.md`                         | Règles métier des événements et réponses RSVP                |
| `docs/media.md`                         | Gestion des médias, stockage R2 et règles d'upload           |
| `docs/partenaire.md`                    | Organisation et ajout des partenaires                        |
| `docs/roadmap.md`                       | Jalons et « Focus actuel »                                   |
| `docs/backlog.md`                       | Tâches classées                                              |
| `docs/suivi.md`                         | Avancement du projet et priorités                            |
| `docs/questions.md`                     | Questions ouvertes et décisions à clarifier                  |
| `docs/journal.md`                       | Où la dernière session s'est arrêtée                         |

Ne lis que ce dont la tâche a besoin, mais toujours `brief.md` et `journal.md` en début de session.

## 2. Règles d'or

### Svelte 5

- Runes uniquement : `$state`, `$derived`, `$effect`, `$props`.
- Interdits : `export let`, `$:`, `on:click` (utiliser `onclick`), stores legacy pour l'état local.

### Neon, Better Auth et sécurité

- Les autorisations métier sont vérifiées côté serveur dans les loads/actions/endpoints.
- Les données et sessions sont gérées avec Better Auth et Neon PostgreSQL.
- Les tables sensibles utilisent les politiques RLS natives de Neon/PostgreSQL
  en défense en profondeur, en plus des guards applicatifs; ne pas réintroduire
  Supabase ni ses services.
- Après validation de la session Better Auth, chaque transaction applicative
  établit son contexte utilisateur avec `set_config(..., true)` avant les
  requêtes métier. Le contexte est local à la transaction; ne jamais conserver
  l'identité dans l'état d'une connexion Hyperdrive réutilisable.
- Les données protégées par RLS ne passent pas par un cache partagé de
  requêtes. Hyperdrive sert au pooling des connexions; n'activer le cache de
  requêtes que pour des lectures explicitement publiques et indépendantes de
  l'identité.
- Utiliser des migrations reproductibles pour toute modification de schéma.
- Les rôles se lisent dans `profiles.role`, **jamais** dans `user_metadata`.
  La colonne `profiles.role` utilise l'ENUM PostgreSQL `app_role`.
- Better Auth est la source de l'identité et des sessions, pas la source
  d'autorité des rôles métier.
- Données via `+page.server.ts` / `+layout.server.ts`, garde sur `event.locals`.
- Les identifiants Neon, les secrets Better Auth et les clés OneSignal restent côté serveur et ne sont jamais exposés au client.
- La branche Neon `test` est utilisée par les déploiements de preview et les validations locales; `production` est réservée au déploiement de production.
- Une migration appliquée n'est jamais modifiée : on en ajoute une nouvelle.

### OneSignal

- La clé REST reste côté serveur.
- L'envoi vérifie le rôle : secrétaire (plusieurs pupitres), chef de pupitre (son pupitre), admin.

### PWA

- La PWA sert à permettre l'activation des notifications push : son installation
  est requise sur Android et iOS selon le besoin produit.
- Aucun mode hors-ligne n'est prévu pour les membres : l'espace adhérents et
  ses données nécessitent une connexion réseau.
- Le service worker sert aux notifications push; ne pas ajouter de cache
  applicatif, ni mettre en cache des pages ou données membres.
- Tout changement du manifest ou du service worker est consigné dans `docs/pwa.md`.

### UI

- Tailwind uniquement, couleurs et espacements via les tokens du thème.
- Motion : respecter `prefers-reduced-motion`.
- Mobile first, accessibilité (labels, contrastes, focus visible).
- Site public traduit en français (`fr`), anglais (`en`) et breton (`br`) avec
  le paquet `svelte-i18n`; l'espace adhérents et l'authentification restent en
  français.
- Centraliser les textes traduits dans les dictionnaires de `src/lib/i18n/`;
  ne pas ajouter de chaînes d'interface localisées en dur dans les pages et
  composants.

### Général

- Aucun secret committé (`.env` ignoré, `.env.example` à jour).
- Pas de nouvelle dépendance sans la justifier dans `docs/journal.md`.
- Le trombinoscope est réservé aux membres actifs connectés et n'expose que les
  champs autorisés dans `docs/brief.md` ; les titres du bureau ne sont jamais
  publics.

## 3. Choisir le travail

1. `docs/roadmap.md` → « Focus actuel »
2. `docs/backlog.md`, dans l'ordre
3. Besoin flou ou contradictoire : poser la question dans `docs/questions.md`, passer à la tâche suivante.

Ne pas entamer de refonte ni de nettoyage qui n'est pas demandé.

## 4. Avant de terminer une tâche

```
npm run check && npm run lint && npm run build
```

- Schéma modifié : nouvelle migration Neon + mise à jour de `docs/database.md`
  (matrice des droits et politiques RLS comprises) + tests d'autorisation
  dans `tests/`, y compris absence de contexte et isolation entre utilisateurs.
- Route ou flux modifié : mise à jour de `docs/architecture.md`.
- Ajouter une entrée datée dans `docs/journal.md` : ce qui est fait, ce qui reste, les pièges rencontrés.

## 5. Demander avant d'agir

- Changer de stack ou ajouter un service tiers.
- Modifier les rôles, les autorisations existantes ou le flux d'invitation.
- Supprimer des données ou une migration.
- Toucher aux en-têtes de sécurité (CSP) ou à la configuration Netlify.
- Modifier la politique de cache du service worker.

## 6. Hors périmètre

Annuaire des membres, paiement en ligne, inscription libre.
