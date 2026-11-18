# Journal des mises à jour — dépendances

> Rôle : **MAINTENEUR**. Ce fichier consigne les audits de versions, la compatibilité des paquets
> et l'état des verrouillages. Je ne modifie jamais le code métier, `equipe/PLAN.md` ni
> `equipe/CONTRAT_API.md` : je signale, le Chef renvoie l'arbitrage à l'architecte.

## Audit des dépendances du Plan - 2026-11-18

**Périmètre** : table des packages du `equipe/PLAN.md` du 2026-11-18 (§7.1 conservés, §7.2 déclarés
absents, §7.3 proposés, §7.4 écartés), confrontée à `package.json`, `pnpm-lock.yaml`,
`package-lock.json` et au registre npm (`npm view … dist-tags.latest`, `time.modified`,
`peerDependencies`) le 2026-11-18.

**Hors périmètre, conformément à mon rôle** : aucun audit de sécurité (CVE, `pnpm audit`) — c'est le
rôle de l'agent sécurité ; aucune installation, aucun `pnpm add`, aucun `pnpm install` (phase 3) ;
aucune modification de `package.json`, des lockfiles ou du code.

**Environnement constaté** : Node `22.16.0`, npm `10.9.2`, pnpm `12.18.0` (conforme au champ
`packageManager`), registre npm joignable. `node_modules/` est **absent** : aucun contrôle
`npm run check/build/test` n'était possible pendant cet audit, et le build ne pourra être vérifié
qu'après l'installation de la phase 3.

### Méthode de lecture des versions du plan

La colonne « Version » du §7.1 du plan reprend le **plancher de la plage** de `package.json`
(`^0.39.0` → « 0.39 »), pas la version réellement verrouillée dans `pnpm-lock.yaml` (0.39.3) ni la
dernière publiée (0.45.4). Deux conséquences : le plan paraît plus ancien qu'il ne l'est pour les
patchs, et plus récent qu'il ne l'est pour tout ce qui a dérivé entre la majeure et le plancher
(`better-auth`, `pg`, `resend` sont annoncés sans aucun numéro). Je donne ci-dessous les trois
valeurs à chaque fois.

---

### §7.1 — Packages conservés

| Package demandé | Version plan | Dernière version stable | Statut | Action requise |
| :--- | :--- | :--- | :--- | :--- |
| `svelte` | `5` | 5.58.0 (verrouillé 5.56.0 ; max de la majeure 5 = 5.58.0) | Obsolète (mineure dans la majeure) | Mettre à jour le verrou vers 5.58.0 à l'étape 48 ; livrer le plan en « 5.58 » |
| `@sveltejs/kit` | `2` | 3.3.1 → **majeure 3 installée nulle part** ; max de la majeure 2 = 2.70.4 (verrouillé 2.61.1) | Obsolète (mineure) **+ majeure 3 disponible** | Verrou vers 2.70.4 en session ; **ajouter SvelteKit 3 aux majeures différées du §2.1** (§2.1 ne cite que Tailwind 4, Zod 4, Svelte 6) |
| `@sveltejs/vite-plugin-svelte` | `non précisé` (`^7.0.0`) | 7.3.1 (verrouillé 7.1.2) | Obsolète (mineure) | Verrou vers 7.3.1 ; préciser « 7.3 » au plan |
| `vite` | `8` | 8.3.8 (verrouillé 8.0.14) | Obsolète (mineure) | Verrou vers 8.3.8 (compatible avec Kit 2.70.4 et plugin 7.3.1 : `vite ^8`) |
| `@sveltejs/adapter-cloudflare` | `non précisé` (`^7.0.0`) | 8.0.3 (impose `@sveltejs/kit ^3`) ; max de la majeure 7 = 7.2.10 = **verrouillé** | À jour dans sa majeure ; majeure 8 indisponible **en l'état** | Conserver 7.2.10 ; la 8 est interdite tant que Kit reste en 2 (peer `@sveltejs/kit ^3.0.0-next.0`) |
| `typescript` | `6` | 7.0.2 ; max de la majeure 6 = 6.0.3 = **verrouillé** | À jour dans sa majeure ; majeure 7 disponible | Conserver 6.0.3 en session ; noter TS 7 (portage natif) comme majeure hors session |
| `svelte-check` | `4.4` | 4.7.8 (verrouillé 4.4.8) | Obsolète (mineure) | Verrou vers 4.7.8 ; `npm run check` reste la garde |
| `@types/node` | `22` | 26.6.6 ; max de la majeure 22 = 22.20.5 (verrouillé 22.19.19) | Obsolète (patch) | Verrou vers 22.20.5. **Ne pas monter en 26** : la CI épingle Node 22 (`.github/workflows/ci.yml`) |
| `tailwindcss` | `3.4` | 4.3.5 ; max de la majeure 3 = 3.4.19 = **verrouillé** | À jour dans sa majeure ; majeure 4 déjà différée par le plan | Conserver ; aucun changement |
| `postcss` | `non précisé` (`^8.4.32`) | 8.5.33 (verrouillé 8.5.15) | Obsolète (patch) | Verrou vers 8.5.33 à l'étape 48 |
| `autoprefixer` | `non précisé` (`^10.4.16`) | 10.6.2 (verrouillé 10.5.0) | Obsolète (mineure) | Verrou vers 10.6.2 |
| `better-auth` | `non précisé` (`^1.0.0`) | 1.7.25 (verrouillé 1.7.18) | Obsolète (patch) **et plage beaucoup trop large** | 1. Verrou vers 1.7.25 ; 2. **resserrer la plage** (`^1.7.25`) : `^1.0.0` accepte n'importe quelle 1.x future, y compris une 1.8 qui relèverait encore ses peers ; 3. le plan doit citer « better-auth 1.7 » |
| `@better-auth/infra` | `non précisé` (`^0.4.27`) | 0.4.31 | Obsolète (patch) **+ paquet non utilisé + peer non satisfait** | **Arbitrage architecte requis** : le paquet n'est importé nulle part dans `src/` (voir détails). Soit le retirer (supprime le conflit `zod`), soit le monter en 0.4.31 et justifier son usage |
| `drizzle-orm` | `0.39` | 0.45.4 (verrouillé 0.39.3) | **Incompatible** | **Mettre à jour le plan en `0.45.x`** : `better-auth` 1.7 exige `drizzle-orm ^0.45.2` (voir détails). Ne pas lancer la phase 3 sur 0.39 |
| `drizzle-kit` | `0.30` | 0.31.11 (verrouillé 0.30.6) | **Incompatible** | **Mettre à jour le plan en `0.31.x`** : `better-auth` 1.7 exige `drizzle-kit >=0.31.4`. Générer une migration d'essai avant de toucher `drizzle/` |
| `pg` | `non précisé` (`^8.13.1`) | 8.23.1 = **verrouillé** | À jour | Conserver ; driver conservé côté serveur uniquement |
| `@types/pg` | `non précisé` (`^8.11.10`) | 8.23.1 = **verrouillé** | À jour | Conserver |
| `zod` | `3.24` | 4.6.7 ; max de la majeure 3 = 3.25.76 = **verrouillé** | À jour dans sa majeure ; majeure 4 déjà différée par le plan | **Ne pas monter en 4 pendant la session** (15 fichiers importent l'API Zod 3) et **ne pas ajouter d'`override`** pour forcer une seule version (voir détails) |
| `resend` | `non précisé` (`^4.0.0`) | 6.38.1 ; max de la majeure 4 = 4.8.0 = **verrouillé** | Obsolète (2 majeures de retard, publiées le 2025-08-06/07) | Proposer la montée en **6.38.1** à l'étape 48 : sans risque pour notre usage (`emails.send` html/text) et retire `@react-email/render` + React 19.3.1 du graphe. Décision architecte/client (majeure) |
| `@lucide/svelte` | `1.71` | 1.75.0 (verrouillé **1.71.0**, épinglé sans `^`) | Obsolète (mineure), **figé volontairement** | Conserver 1.71.0 pendant la session (épinglage documenté au journal + exception `minimumReleaseAgeExclude`). 1.75.0 est publié **le jour de l'audit** → aucune adoption immédiate ; si montée, revalider `ssr.noExternal` et redémarrer le serveur de dev |
| `leaflet` | `non précisé` (`^1.9.4`) | 1.9.4 = **verrouillé** (`latest` ; `2.0.0-beta.4` existe mais reste en beta) | À jour | Conserver ; ne pas toucher à la 2.0 beta. Toujours confirmé utilisé (`Map.svelte`, page Contact, import dynamique dans `onMount`) → §7.1 « à confirmer à l'étape 46 » est tranchable : **il reste utilisé** |
| `@types/leaflet` | `non précisé` (`^1.9.22`) | 1.9.22 = **verrouillé** | À jour | Conserver |
| `vitest` | `4` | 5.1.1 ; max de la majeure 4 = 4.1.12 (verrouillé 4.1.7) | Obsolète (patch) ; majeure 5 disponible | Verrou vers 4.1.12. **Garder la 4 en session** : `@vitest/browser-playwright` 4 et `vitest-browser-svelte` 2.2.1 partent avec elle, et l'étape 45 repose sur cette chaîne |
| `@vitest/browser-playwright` | `non précisé` (`^4.1.3`) | 5.1.1 ; max de la majeure 4 = 4.1.12 (verrouillé 4.1.7) | Obsolète (patch) ; majeure 5 disponible | Verrou vers 4.1.12, en lockstep avec `vitest` |
| `vitest-browser-svelte` | `2.1` | 3.1.0 ; max de la majeure 2 = **2.2.1** | Obsolète (mineure) ; majeure 3 disponible | Verrou vers 2.2.1 (peer `vitest ^4`, donc la majeure 3 est liée à Vitest 5) |
| `playwright` | `1.59` | 1.65.1 (verrouillé **1.60.0**) | Obsolète (mineure). Le plan annonce 1.59 alors que le verrou est déjà 1.60.0 | Verrou vers 1.65.1 **seulement** avec `@vitest/browser-playwright` compatible ; sinon conserver 1.60.0 et corriger le plan (« 1.60 ») |
| `wrangler` | `non précisé` (`^4.40.0`) | 4.164.0 (verrouillé 4.158.0) | Obsolète (mineure) | Verrou vers 4.164.0 ; `adapter-cloudflare` 7.2.10 exige `wrangler ^4.118.0` → OK |
| `@cloudflare/workers-types` | `non précisé` (`^4.20241205.0`) | 5.20261118.1 ; max de la majeure 4 = 4.20260702.1 = **verrouillé** | À jour dans sa majeure ; majeure 5 disponible | Conserver 4.x en session (la 5 est une rupture de typage Workers) ; à traiter avec la majeure adaptateur/Kit |
| `prettier` | `non précisé` (`^3.8.1`) | 3.10.1 (verrouillé 3.8.3) | Obsolète (mineure) | Verrou vers 3.10.1 |
| `prettier-plugin-svelte` | `non précisé` (`^3.5.1`) | 4.2.0 ; max de la majeure 3 = 3.5.2 = **verrouillé** | À jour dans sa majeure ; majeure 4 disponible | Conserver 3.5.2 (la 4.2.0 change le contrat de plugin) ; noter comme majeure hors session |
| `eslint` | `non précisé` (`^10.2.0`) | 10.15.0 (verrouillé 10.4.1) | Obsolète (mineure) | Verrou vers 10.15.0 ; vérifier `npm run lint` (Prettier + ESLint sur tout le dépôt) |
| `@eslint/js` | `non précisé` (`^10.0.1`) | 10.0.1 = **verrouillé** | À jour | Conserver |
| `@eslint/compat` | `non précisé` (`^2.0.4`) | 2.1.1 (verrouillé 2.1.0) | Obsolète (patch) | Verrou vers 2.1.1 |
| `typescript-eslint` | `non précisé` (`^8.58.1`) | 8.73.0 (verrouillé 8.60.0) | Obsolète (mineure) | Verrou vers 8.73.0 |
| `eslint-plugin-svelte` | `non précisé` (`^3.17.0`) | 3.24.1 (verrouillé 3.19.0) | Obsolète (mineure) | Verrou vers 3.24.1 |
| `eslint-config-prettier` | `non précisé` (`^10.1.8`) | 10.1.8 = **verrouillé** | À jour | Conserver |
| `globals` | `non précisé` (`^17.4.0`) | 17.14.0 (verrouillé 17.6.0) | Obsolète (mineure) | Verrou vers 17.14.0 |

### §7.2 — Déclarés mais absents

| Package demandé | Version plan | Dernière version stable | Statut | Action requise |
| :--- | :--- | :--- | :--- | :--- |
| `svelte-i18n` | `absent` | — (non interrogé : paquet non retenu) | Absent — conforme | Rien. Q-2026-11-09-01 reste ouverte ; `AGENTS.md` §0 le cite à tort. Aucun import sous `src/` (vérifié) |
| `motion` | `Écarté` (Q-2026-11-17-01 A) | — | **Écarté — conforme** | Rien. Vérifié : aucun `motion` dans `package.json`, aucun `import … from 'motion'` sous `src/`. La correction d'`AGENTS.md` §0 reste au client |

### §7.3 — Proposé pour cette session

| Package demandé | Version plan | Dernière version stable | Statut | Action requise |
| :--- | :--- | :--- | :--- | :--- |
| `image-size` | `non précisé` | **2.1.0** (publié le 2026-11-06 ; `legacy` = 1.2.1, à ne pas utiliser) | **À jour — validé techniquement** | **Installer `image-size@2.1.0` exactement** (§7.3 à préciser). Voir les conditions d'usage dans les détails |

### §7.4 — Volontairement écartés

| Package demandé | Version plan | Dernière version stable | Statut | Action requise |
| :--- | :--- | :--- | :--- | :--- |
| `sharp` | Écarté | — | Écarté — conforme | Aucun changement : binaire natif, incompatible Workers. Absent de `package.json` |
| SDK serveur OneSignal | Écarté | — | Écarté — conforme | Aucun changement : `fetch` suffit. Absent de `package.json` |
| `@neondatabase/serverless` | Interdit | — | Écarté — conforme | Aucun changement. Absent de `package.json` (et `pg` reste le driver) |
| Cloudflare Images | Écarté | — | Écarté — conforme | Aucun changement |
| `@milkdown/kit` | Différé | — | Écarté — conforme | Aucun changement pour la session |
| `marked` / `markdown-it` | Non nécessaire | — | Écarté — conforme | Aucun changement : l'extraction de `MarkdownView.svelte` (étape 38) ne crée pas de dépendance |

---

## Détails & Breaking Changes majeurs

### 1. `drizzle-orm` 0.39 / `drizzle-kit` 0.30 — INCOMPATIBLE avec `better-auth` 1.x (bloquant pour le plan)

C'est le seul point qui justifie à lui seul un `PLAN À ACTUALISER`.

Preuves relevées au registre le 2026-11-18 :

| Version de `better-auth` | peer `drizzle-orm` | peer `drizzle-kit` |
| :--- | :--- | :--- |
| 1.5.0 / 1.6.0 | `>=0.41.0` | `>=0.31.4` |
| **1.7.0 → 1.7.25** (dont 1.7.18 verrouillé) | **`^0.45.2 \|\| >=1.0.0-rc.1 <2.0.0`** | **`>=0.31.4 \|\| >=1.0.0-beta.1`** |

Le projet verrouille `drizzle-orm@0.39.3` et `drizzle-kit@0.30.6`. L'écart n'est donc pas nouveau
(il date de `better-auth` 1.5) et il est **silencieux** : les deux peers sont marqués `optional`, et
`pnpm-lock.yaml` montre que pnpm les a câblés quand même —
`better-auth@1.7.18(…)(drizzle-kit@0.30.6)(drizzle-orm@0.39.3(…))`. Aucune erreur d'installation,
donc aucun signal.

Pourquoi c'est sérieux malgré le silence : `src/lib/server/auth.ts` importe précisément
`drizzleAdapter` de `better-auth/adapters/drizzle`, c'est-à-dire l'intégration couverte par ce peer,
sur la surface la plus sensible du projet (identité, sessions, invitations).

**Action demandée à l'architecte** : porter le §7.1 à `drizzle-orm 0.45.4` + `drizzle-kit 0.31.11`
et le traiter comme la première tâche de l'étape 48 (avant tout autre travail backend), avec la
garde `npm run check && npm run build && npm run test`.

**Précautions de montée 0.39 → 0.45** (0.x : chaque mineure peut casser, la 0.40.0 n'apporte aucune
rupture côté `pg`, mais les 0.44/0.45 en listent plusieurs) :

- points de contact réels du dépôt : `drizzle-orm/node-postgres` (`drizzle`, `NodePgDatabase`),
  `drizzle-orm/pg-core`, opérateurs `and/asc/desc/eq/ne/inArray/sql`, `db.transaction(...)`
  (`src/lib/server/db/index.ts`, `src/lib/server/member/invitations.ts`) et un `db.execute(...)`
  dans `hooks.server.ts` ;
- la 0.45 **retravaille les types de `db.execute`** : c'est le point de rupture le plus probable ici
  (typage de retour, plus de `{ rows }` implicite selon l'appel) ;
- la 0.45 touche aussi les codecs `pg` (`timestamp`/`json`/`bytea`) : à vérifier sur les colonnes
  `timestamp` du schéma et sur les paramètres `json` passés en `sql` brut ;
- `drizzle-kit` 0.31 peut réécrire les snapshots de `drizzle/meta/`. **Ne pas lancer `db:generate`
  sur le dépôt tel quel** : d'abord une migration d'essai sur une copie, pour prouver qu'aucune
  migration appliquée n'est modifiée (règle absolue du projet). C'est la migration additive de
  l'étape 38 qui sera la première concernée ;
- ne pas sauter à la 1.0.0 (`1.0.0-rc.5` publiée le 2026-10-21) : hors périmètre, et `better-auth`
  l'accepte seulement en `>=1.0.0-rc.1 <2.0.0`.

### 2. `@better-auth/infra` — paquet déclaré, jamais importé, et à l'origine du conflit `zod`

- Déclaré `^0.4.27` (verrouillé 0.4.27, dernière 0.4.31), **aucun import dans tout le code** :
  recherche sur `src/`, `scripts/`, `tests/`, `.github/` → zéro occurrence hors `docs/journal.md`
  et `equipe/PLAN.md`.
- Ses peers : `zod >=4.1.12`, `better-auth >=1.4.0`, `@better-auth/core >=1.4.0` (les peers
  `expo-*` / `react-native-*` sont bien `optional`). Le `zod >=4.1.12` **n'est pas satisfait** : le
  verrou l'a câblé sur `zod@3.25.76`.
- C'est exactement le conflit 3/4 déjà documenté au `docs/journal.md` (2026-11-17) et qui explique
  que `package-lock.json` n'ait jamais été régénéré.

**Action demandée** : décision de l'architecte (je ne remplace ni ne retire un paquet choisi par
lui). Trois issues, par ordre de propreté :

1. **le retirer** (aucun import à corriger) : le peer non satisfait disparaît, le graphe maigrit ;
   `zod@4.6.7` reste présent malgré tout, car il vient de `better-call` (dépendance de
   `@better-auth/core`) — voir §3 ;
2. le monter en `0.4.31` et documenter l'usage prévu (alors `zod` 4 devient une vraie dette à
   planifier) ;
3. le laisser tel quel : acceptable fonctionnellement, mais la dette reste invisible à chaque
   installation.

### 3. `zod` 3 vs 4 — deux versions coexistent volontairement, ne pas « corriger »

État réel du graphe : `zod@3.25.76` à la racine (15 fichiers `src/` importent l'API Zod 3) **et**
`zod@4.6.7` installé de façon transitive, exigé par `better-call@1.4.5` (via `@better-auth/core`),
qui utilise l'API `z.looseObject`.

La coexistence est déjà **neutralisée dans `vite.config.ts`** :
`ssr.noExternal: ['better-auth', '@better-auth/core', 'zod', '@lucide/svelte']`, avec un commentaire
qui explique que sans cela le bundle SSR laisse `import * as z from 'zod'` et que Node résout la 3 à
la racine → build cassé.

**Consignes de maintenance à conserver absolument** :

- ne **pas** monter `zod` en 4 pendant la session (majeure hors périmètre, 15 fichiers à migrer) ;
- ne **pas** ajouter de `pnpm.overrides` / `resolutions` forçant une seule version de `zod` : cela
  casserait l'un ou l'autre des deux consommateurs ;
- toute modification de `better-auth`, `@better-auth/core` ou `@better-auth/infra` doit être suivie
  d'une relecture de cette liste `ssr.noExternal`, puis d'un `npm run build` (c'est le seul contrôle
  qui attrape cette classe de régression).

### 4. `better-auth` — plage `^1.0.0` trop large

Le verrou est 1.7.18, la dernière 1.7.25, mais `package.json` déclare `^1.0.0` : la prochaine 1.8
serait adoptée automatiquement, avec un risque de nouveau relèvement de peers (comme celui de
`drizzle-orm`, apparu en 1.5 puis durci en 1.7) sans aucune revue. À resserrer sur `^1.7.25` et à
citer avec un numéro au plan.

### 5. `image-size@2.1.0` — validé pour les Workers, avec conditions d'usage

Vérifications faites le 2026-11-18 (métadonnées + contenu publié) :

- **0 dépendance runtime, 0 peer**, licence MIT, `sideEffects: false`, ~98 Ko décompressé (21
  décodeurs d'en-tête embarqués : jpg, png, webp mais aussi heif, jxl, psd, svg…) ;
- entrée racine (`dist/esm/index.js` → `lookup.js` → `types/index.js`) : **aucun import de module
  Node** (`node:fs`, `Buffer`, …), uniquement des parseurs sur `Uint8Array` → compatible Workers ;
  le seul sous-chemin Node-spécifique est `image-size/fromFile`, **à ne jamais importer** côté Worker ;
- double distribution CJS/ESM avec `exports`, donc bundlable par esbuild (l'adaptateur Cloudflare
  bundle le serveur ; aucun `node_modules` n'est nécessaire à l'exécution) ;
- API : `imageSize(input: Uint8Array)` renvoie `{ width, height, type }` et **lève une `TypeError`
  sur un format non reconnu** → correspondance naturelle avec le `415 unsupported_type` attendu aux
  étapes 42 et 49 ; elle ne lit que l'en-tête, donc le contrôle 6000×6000 se fait **avant** l'écriture R2
  (pas de buffer complet à garder en mémoire).

**Action** : installer `image-size@2.1.0` **en version exacte** (`--save-exact`) et l'écrire tel quel
au §7.3. La `legacy` 1.2.1 ne doit pas être retenue (API et distribution différentes).

### 6. `resend` 4 → 6 (majeure, proposée)

Changements réels entre 4.8.0 et 6.38.1 : la 5.0.0 rend `@react-email/render` **optionnel** (rupture
uniquement pour ceux qui envoient du JSX React) ; la 6.0.0 renomme `inlineContentId` en `contentId`
sur les pièces jointes. **Aucun impact sur notre usage** : `src/lib/server/email.ts` n'utilise que
`new Resend(apiKey)` et `emails.send({ from, to, subject, html, text, replyTo })`.

Bénéfice concret : la 4.x traîne `@react-email/render` et donc **React/React-DOM 19.3.1** dans le
verrou ; la 6.x ne dépend plus que de `postal-mime` et `standardwebhooks`. Gain de graphe et de
surface pour un paquet de build serveur.

**Action** : arbitrage (majeure). Recommandation : l'inclure à l'étape 48, avec un envoi de
vérification (contact + invitation) avant l'étape 47.

### 7. `@lucide/svelte` 1.71.0 — épinglage à conserver, mais à justifier au plan

`1.71.0` est épinglé **sans `^`** dans `package.json`, avec une exception
`minimumReleaseAgeExclude` dans `pnpm-workspace.yaml`. Deux remarques :

- la dernière est **1.75.0, publiée le 2026-11-18** (le jour de cet audit) : aucune adoption
  immédiate, conformément à la logique de quarantaine qui a motivé l'épinglage ;
- l'exception `minimumReleaseAgeExclude` est **inerte** en l'état : `minimumReleaseAge` n'est défini
  ni dans `.npmrc` (`engine-strict=true` seulement), ni dans `pnpm-workspace.yaml`, ni dans un
  `.npmrc` utilisateur (`pnpm config get minimumReleaseAge` → `undefined`). Elle ne protège donc de
  rien aujourd'hui ; à garder comme garde-fou si une quarantaine est activée un jour, mais à ne pas
  considérer comme une protection active.

Si la montée en 1.75.0 est décidée : garder `@lucide/svelte` dans `ssr.noExternal` (composants
`.svelte` publiés → sinon `Unknown file extension ".svelte"` au SSR) et redémarrer le serveur de dev.

### 8. `leaflet` 1.9.4 — à jour, SSR déjà correct, et toujours utilisé

`1.9.4` est bien la dernière **stable** (la 2.0 reste en `beta.4`). La carte est SSR-safe par
construction : `Map.svelte` importe la CSS en statique et **charge `leaflet` dynamiquement dans
`onMount`** (`await import('leaflet')`), donc jamais côté serveur. Conséquence pour le plan : la
mention « Conservé, **à confirmer** à l'étape 46 s'il reste utilisé » peut être tranchée —
`MapPanel` est importé par la page Contact (`+page.svelte`), le paquet reste nécessaire.

### 9. Majeures disponibles mais **hors session** — à ajouter au §2.1 du plan

Le §2.1 ne diffère explicitement que « Tailwind 4, Zod 4, Svelte 6 ». La veille au 2026-11-18 en
révèle d'autres, toutes à acter comme dette différée pour éviter qu'elles ne soient « découvertes »
en cours de session :

| Paquet | Verrouillé | Majeure disponible | Contrainte de compatibilité |
| :--- | :--- | :--- | :--- |
| `@sveltejs/kit` | 2.61.1 | **3.3.1** | peer `svelte ^5.57.1`, `vite ^8.0.12` → entraîne un lot Svelte/Kit/adaptateur |
| `@sveltejs/adapter-cloudflare` | 7.2.10 | **8.0.3** | exige `@sveltejs/kit ^3.0.0-next.0` → **interdit** tant que Kit reste en 2 |
| `typescript` | 6.0.3 | **7.0.2** | portage natif ; sortir de 6 en pleine session ferait bouger `svelte-check` et `typescript-eslint` |
| `vitest` (+ `@vitest/browser-playwright`, `vitest-browser-svelte`) | 4.1.7 / 4.1.7 / 2.1.1 | **5.1.1 / 5.1.1 / 3.1.0** | chaîne solidaire ; l'étape 45 repose dessus |
| `@cloudflare/workers-types` | 4.20260702.1 | **5.20261118.1** | rupture de typage Workers ; à coupler avec la majeure adaptateur |
| `prettier-plugin-svelte` | 3.5.2 | **4.2.0** | nouveau contrat de plugin (peer `prettier ^3` inchangé) |
| `resend` | 4.8.0 | **6.38.1** | sans risque pour notre usage (voir §6) |

### 10. Compatibilité SSR / SvelteKit des paquets sensibles présents

| Paquet | Vérification | Verdict |
| :--- | :--- | :--- |
| `better-auth` 1.7.18 | peers `svelte ^5`, `@sveltejs/kit ^2`, `drizzle-orm ^0.45.2` | Svelte/Kit : **OK**. `drizzle-orm` : **non satisfait** (§1). Nécessite `ssr.noExternal` (§3) |
| `@better-auth/infra` 0.4.27 | peer `zod >=4.1.12` | **Non satisfait** et paquet non importé (§2) |
| `@lucide/svelte` 1.71.0 | peer `svelte ^5` | OK ; **doit rester dans `ssr.noExternal`** (composants `.svelte`) |
| `leaflet` 1.9.4 | import dynamique dans `onMount` ; CSS statique | OK, aucun rendu serveur de Leaflet |
| `pg` 8.23.1 | aucun import hors `src/lib/server/**` (2 fichiers), `@types/pg` aligné | OK ; ne jamais importer côté client |
| `drizzle-orm` 0.39.3 | `node-postgres` + `@cloudflare/workers-types` en peer optionnel | OK techniquement, mais à monter (§1) |
| `resend` 4.8.0 | `engines: node >= 20` (Node 22 OK) ; import serveur uniquement (`src/lib/server/email.ts`) | OK |
| `zod` 3.25.76 | double résolution avec `zod@4.6.7` transitif | OK **grâce** à `ssr.noExternal` ; ne pas toucher (§3) |
| `image-size` 2.1.0 (à venir) | entrée racine sans module Node ; `engines: node >= 18` inopérant sous workerd | OK, sous réserve de n'importer que la racine |

---

## État des verrouillages (à traiter en phase 3 / étape 48)

1. **`node_modules/` absent.** Aucune vérification de build n'est possible en l'état. La phase 3 doit
   commencer par une hydratation **`pnpm install --frozen-lockfile`** (c'est ce que fait la CI) et non
   par un `pnpm install` libre.
2. **`pnpm-lock.yaml` est en retard sur ses propres plages** (verrouillé vs plage de `package.json`) :
   `@sveltejs/kit` 2.61.1 pour `^2.57.0` (max permis 2.70.4), `svelte` 5.56.0 pour `^5.55.2` (5.58.0),
   `vite` 8.0.14 pour `^8.0.7` (8.3.8), `eslint` 10.4.1 pour `^10.2.0` (10.15.0), entre autres. Un
   `pnpm install` **sans** `--frozen-lockfile` re-résoudrait tout cela d'un coup : c'est le scénario
   à éviter en phase 3, parce qu'on ne saurait plus si une casse vient de `image-size` ou de la
   trentaine de montées simultanées.
3. **`package-lock.json` est matériellement faux, pas seulement en retard** : son entrée racine
   déclare encore `lucide-svelte@^1.0.1` (paquet **déprécié**, remplacé par `@lucide/svelte`), et
   n'a jamais connu `@better-auth/infra`, `leaflet` ni `@types/leaflet`. Un `npm install` sur ce
   dépôt installerait le mauvais paquet d'icônes et casserait le build. **Non régénéré à ce stade**,
   comme demandé ; à supprimer (ou à laisser explicitement hors jeu) avant toute commande npm — la CI
   n'utilise que pnpm, donc aucun impact CI tant que personne ne lance npm.
4. **`.npmrc` : `engine-strict=true`.** Toute dépendance dont `engines` ne couvre pas Node 22 fait
   échouer l'installation. Vérifié pour les paquets concernés : `image-size` (`>=18`), `resend 6`
   (`>=20`), `pg` (`>=16`) → OK.

---

## ⚠️ Signalements à renvoyer à l'architecte (je ne modifie pas `equipe/PLAN.md`)

1. §7.1 : `drizzle-orm` **0.39 → 0.45.4** et `drizzle-kit` **0.30 → 0.31.11** — **obligatoire**
   (peers `better-auth` 1.7), à planifier avant tout travail backend.
2. §7.1 : citer des versions **réelles** et non le plancher de plage — `better-auth 1.7.25`,
   `pg 8.23.1`, `resend 4.8.0` (ou 6.38.1), `playwright 1.60.0` (le plan dit 1.59 alors que le verrou
   est déjà 1.60.0).
3. §7.1 : resserrer la plage `better-auth` de `^1.0.0` à `^1.7.25`.
4. §7.1 : statuer sur `@better-auth/infra` (retirer / monter en 0.4.31 / assumer) — paquet non
   importé, seul responsable du peer `zod` non satisfait.
5. §7.2 : `motion` « Écarté » — **confirmé conforme** (aucun import, non installé). `svelte-i18n`
   « en attente de Q-09-01 » — confirmé absent.
6. §7.3 : préciser `image-size` **2.1.0** (version exacte) et la règle « importer la racine, jamais
   `image-size/fromFile` ».
7. §7.1 : `leaflet` — retirer le « à confirmer à l'étape 46 » : il reste utilisé par la page Contact.
8. §2.1 : compléter la liste des majeures différées (SvelteKit 3 / adapter-cloudflare 8 /
   TypeScript 7 / Vitest 5 / workers-types 5 / prettier-plugin-svelte 4), aujourd'hui limitée à
   Tailwind 4, Zod 4, Svelte 6.
9. §8 : la ligne de risque « `pnpm-lock.yaml` désynchronisé (antécédent E1) » doit aussi mentionner
   que **`package-lock.json` est un artefact npm périmé** (référence `lucide-svelte`) qui ne doit
   jamais servir de base d'installation.
10. Décision `resend` : rester en 4.8.0 (majeure 6 reportée) ou monter à l'étape 48.

---

## Statut de l'audit

**STATUT : PLAN À ACTUALISER**

Motif unique et non négociable : le §7.1 conserve `drizzle-orm 0.39` + `drizzle-kit 0.30` alors que
`better-auth` 1.7 (déjà verrouillé en 1.7.18) déclare `drizzle-orm ^0.45.2` et `drizzle-kit >=0.31.4`.
Tant que le plan n'est pas aligné, la phase 3 installerait un environnement dont l'adaptateur
d'authentification est hors du périmètre de support de son propre fournisseur. Les autres points
(@better-auth/infra, plage `^1.0.0`, versions imprécises, majeures différées non listées) sont des
actualisations à faire dans la même passe, sans bloquer davantage.

### La phase d'installation (phase 3) peut-elle être lancée ?

**OUI pour `image-size@2.1.0` seul, NON pour la remise à niveau générale.**

- **Sans risque de casser le build, sous trois conditions** :
  1. hydrater d'abord à l'identique : `pnpm install --frozen-lockfile` (ne rien re-résoudre) ;
  2. installer ensuite **uniquement** `image-size` en version exacte ; le diff attendu du
     `pnpm-lock.yaml` est **une seule entrée** (le paquet n'a aucune dépendance), donc toute autre
     ligne modifiée dans le diff est un signal à examiner avant de continuer ;
  3. enchaîner `npm run check && npm run build && npm run test` (build obligatoire : c'est le seul
     contrôle qui attrape la régression `zod` 3/4 via `ssr.noExternal`).
- **À ne pas faire en phase 3** : `pnpm update` global, `npm install`, et tout `pnpm add` d'un paquet
  supplémentaire — le `node_modules` actuel n'existe pas, le verrou est en retard sur ses plages, et
  un `pnpm install` libre ferait bouger une trentaine de paquets en même temps.

### Conflits de `peerDependencies` connus (état exact)

| Conflit | Gravité | Effet aujourd'hui | Traitement |
| :--- | :--- | :--- | :--- |
| `zod` 3/4 : `@better-auth/infra` exige `zod >=4.1.12`, le projet utilise `zod 3.25.76` (et `better-call` exige `zod 4`) | Moyen | **Silencieux** : peers `optional`, double résolution dans le verrou, neutralisée par `ssr.noExternal` dans `vite.config.ts` | Ne pas forcer d'`override` ; trancher le sort de `@better-auth/infra` ; revalider `ssr.noExternal` à chaque montée de `better-auth` |
| `drizzle-orm` / `drizzle-kit` : `better-auth` 1.7 exige `^0.45.2` / `>=0.31.4`, le projet a 0.39.3 / 0.30.6 | **Élevé** | Silencieux aussi (`optional`), mais l'adaptateur Drizzle de Better Auth tourne hors support | Monter en 0.45.x / 0.31.x (plan à actualiser) |
| `@better-auth/infra` → `better-auth >=1.4.0`, `@better-auth/core >=1.4.0` | Faible | Satisfait (1.7.18) | Aucun |
| `@lucide/svelte` → `svelte ^5` ; `resend` → `@react-email/render` (optionnel en 4.x, absent en 6.x) | Aucun | Satisfait | Aucun |
| `adapter-cloudflare 8.0.3` → `@sveltejs/kit ^3` | Aucun (non installé) | Interdit la montée de l'adaptateur tant que Kit reste en 2 | Ne pas monter |

**Aucun audit de sécurité n'a été réalisé ici** (rôle de l'agent sécurité) : les alertes Dependabot
citées au §2.1/§8 du plan ne sont pas traitées dans ce document, et les montées proposées ci-dessus
ne valent pas correctif de vulnérabilité — elles sont motivées par la fraîcheur des versions, la
compatibilité des peers et le poids du graphe.

## Contre-vérification du 2026-11-18 (plan actualisé : étapes 50 et 51)

**Périmètre** : re-vérification **ciblée** des 6 points demandés sur `equipe/PLAN.md` tel qu'actualisé
par l'architecte (vague 0, §2.1.1, §2.2, §3.1, §7, annexe A). **Aucune installation, aucune commande
de résolution** : relevés `npm view` / `registry.npmjs.org` / `unpkg`, lecture du verrou, du code et
des notes de version. Seul ce fichier a été écrit.

### Synthèse des 6 points

| # | Point contrôlé | Verdict |
| :--- | :--- | :--- |
| 1 | `drizzle-orm` 0.45.4 / `drizzle-kit` 0.31.11 face aux peers de `better-auth` 1.7.18, et absence d'autre contrainte | **CONFORME** |
| 2 | `better-auth` resserré à `~1.7.18` au lieu de `^1.7.25` | **ACCEPTABLE** — aucune version ≥ 1.7.19 n'est requise |
| 3 | Séquence de l'étape 50 techniquement sûre | **SÛRE**, avec 2 critères à corriger et 1 fausse alerte du plan |
| 4 | Retrait de `@better-auth/infra`, `ssr.noExternal` à 4 entrées | **CONFIRMÉ** |
| 5 | `image-size` 2.1.0, `leaflet` 1.9.4, `@types/leaflet` 1.9.22 | **CONFIRMÉ** |
| 6 | Aucune version annoncée contredite, numérotation cohérente | **CONFORME** |

### 1. Peers Drizzle : conformes, et l'écart était bien silencieux

Peers mesurés de `better-auth@1.7.18` (tous deux `optional: true` dans `peerDependenciesMeta`, ce qui
explique l'absence de tout échec avec le verrou actuel) :

| Peer | Plage exigée | Version proposée par le plan | Verdict |
| :--- | :--- | :--- | :--- |
| `drizzle-orm` | `^0.45.2 \|\| >=1.0.0-rc.1 <2.0.0` | **0.45.4** | Satisfait (caret sur 0.x = `>=0.45.2 <0.46.0`) |
| `drizzle-kit` | `>=0.31.4 \|\| >=1.0.0-beta.1` | **0.31.11** | Satisfait |

Aucune autre dépendance du projet ne contraint Drizzle négativement :

- `drizzle-orm@0.45.4` : **ni `dependencies` ni `engines`** ; peers `pg >=8` (8.23.1 ✓), `@types/pg *` ✓,
  `@cloudflare/workers-types >=4` (4.20260702.1 ✓), `kysely` optionnel (0.29.8 dans l'arbre ✓).
- `drizzle-kit@0.31.11` : **ni `peerDependencies` ni `engines`** (`tsx ^4.21.0` et `esbuild ^0.25.4`
  exigent `node >=18` : compatible `.npmrc engine-strict=true` + Node 22.16.0, identique à la CI).
- `@better-auth/infra@0.4.27` ne déclare **pas** Drizzle en peer (ses peers sont `zod`, `better-auth`,
  `@better-auth/core`, `expo-*`, `react-native`) ; `drizzle-zod` est absent du verrou.
- `@better-auth/drizzle-adapter@1.7.18` est une dépendance interne de `better-auth`, donc soumise à la
  même contrainte : elle est satisfaite par la montée prévue.

Conséquence attendue sur le verrou : les longues lignes de résolution de peers (`better-auth@1.7.18(...)`)
sont réécrites avec `drizzle-orm@0.45.4` / `drizzle-kit@0.31.11`. C'est la même entrée, pas un paquet de
plus.

### 2. `~1.7.18` au lieu de `^1.7.25` : divergence acceptable

- Les notes de version **1.7.19 → 1.7.25** ont été relues : **aucune ne se présente comme une release de
  sécurité**. Les correctifs sont orientés OAuth-provider, `admin/create-user`, SCIM, MCP/DPoP, adaptateurs
  Prisma/Mongo, CORS (`Access-Control-Expose-Headers`) et divers.
- Deux correctifs concernent notre runtime sans être nécessaires au plan : 1.7.21 (« requests hanging on
  Cloudflare Workers when the request that started schema validation ended before validation finished »)
  et 1.7.22 (« module-scope auth instances on Cloudflare Workers logging a schema validation error on
  every cold start »). `createAuth` est instancié **par requête** (`src/hooks.server.ts`) : aucun des deux
  ne nous atteint aujourd'hui.
- Un seul changement de comportement notable (1.7.21) : « if you rely on `update` changing every row that
  matches a non-unique filter, use `updateMany` ». Le détail publié porte sur `@better-auth/prisma-adapter`,
  et notre code n'appelle jamais l'adaptateur interne avec un filtre non unique : sans effet.
- **`~1.7.18` = `>=1.7.18 <1.8.0` : la plage ne fige pas 1.7.18**, elle autorise 1.7.19 → 1.7.25 et n'exclut
  que 1.8.x. La formulation du §2.2 (« `^1.x` laisserait adopter une 1.8 ») est donc exacte. **Aucune
  version ≥ 1.7.19 n'est nécessaire.**

### 3. Étape 50 : séquence sûre — 1 fausse alerte et 2 critères à corriger

**(a) Fausse alerte : `db.execute` ne casse pas.** La signature relevée est **identique** en 0.39.3 et en
0.45.4 (`pg-core/db.d.ts`) :
`execute<TRow extends Record<string, unknown> = Record<string, unknown>>(query: SQLWrapper | string): PgRaw<…>`.
Le type par défaut reste `Record<string, unknown>`, `QueryResult.rows` reste accessible : `src/hooks.server.ts:27-31`
compile sans retouche. Le plan (l.133) présente cela comme « la rupture la plus probable de la 0.45 » — à
requalifier, sinon le backend cherchera une casse inexistante. Amélioration facultative, non bloquante :
`db.execute<{ profile_id: string | null }>(…)` pour supprimer le cast.

**(b) Critère inatteignable : le diff du verrou dépassera largement les deux paquets.** `drizzle-kit@0.30.6`
dépend de `gel ^2.0.0`, `esbuild ^0.19.7`, `esbuild-register ^3.5.0` ; `0.31.11` dépend de `esbuild ^0.25.4`
et `tsx ^4.21.0` et abandonne `gel`/`esbuild-register`. Le verrou contient aujourd'hui `gel@2.2.1`,
`esbuild-register@3.6.0(esbuild@0.19.12)` et trois `esbuild` (0.18.20 / **0.19.12** / 0.28.2). L'étape 50 va
donc **retirer** le sous-arbre `gel` + `esbuild-register`, **ajouter** `esbuild@0.25.x`, `tsx` et ses
dépendances, et **réécrire** toutes les lignes de résolution de peers qui mentionnent
`vite@8.0.14(…)(esbuild@0.19.12)` (le peer `esbuild` de `vite` est `^0.27.0 || ^0.28.0` : la disparition de
0.19.12 change le peer retenu). Le `git diff --stat` sera volumineux mais purement mécanique : **la formule
correcte est celle de la ligne 132** (« leur sous-arbre et leurs entrées de peer »), c'est la ligne 137 qui
est fausse.

**(c) `drizzle/meta` est déjà désynchronisé, indépendamment de 0.31.** `_journal.json` déclare **6** entrées
(idx 0 → 5, `0005_bureau_title`) alors que `drizzle/meta/` ne contient que **5** instantanés (`0000` → `0004`) :
`0005_bureau_title.sql` (fonction `app.set_profile_bureau_title` + `GRANT`/`REVOKE`) **n'a pas d'instantané**,
alors que la convention du dépôt était de dupliquer le précédent (0001/0002/0003 sont identiques à l'octet près).
La « génération d'essai sur copie » de la ligne 135 peut donc produire un diff **antérieur à la montée** :
nul = rien à faire ; non nul sur 0005 = préexistant, à documenter dans `docs/journal.md`, **pas** à corriger
dans l'étape 50. Second point du même ordre : `metaFolder`, `strict` et `breakOnError` de `drizzle.config.ts`
sont **absents du type `Config` en 0.30.6 comme en 0.31.11** (donc `satisfies Config` est déjà une erreur de
propriétés excédentaires, invisible car `drizzle.config.ts` est hors du périmètre de `svelte-check`) :
`npm run check` ne détectera **aucune** rupture de configuration, seule l'exécution de `db:generate` fait foi,
et **aucune régression n'est imputable à 0.31 sur ce point**.

Le reste de la séquence est sain :

- **Migration initiale déjà appliquée** : `migrate()` de `drizzle-orm/node-postgres/migrator` est toujours
  exporté en 0.45.4, s'appuie sur `drizzle.__drizzle_migrations` et sur un journal `version: "7"` — format
  inchangé en 0.31 (le changement de format d'instantanés est une nouveauté 1.0.0-beta). `scripts/db-migrate.mjs`
  n'utilise que `migrate()` et `client.query()` : rien à adapter (mais il n'est couvert ni par `check` ni par `build`).
- **API `node-postgres`** : `drizzle(client, { schema })`, `NodePgDatabase`, `db.transaction`, `withUserContext`
  → inchangés ; sous-chemins `.` et `./migrator` toujours exportés.
- **Précision d'exécution** : `drizzle-kit` est une **devDependency**. Écrire `pnpm add -E drizzle-orm@0.45.4`
  puis `pnpm add -E -D drizzle-kit@0.31.11` (sans `-D`, le paquet risque d'être enregistré en `dependencies`).

### 4. Étape 51 — retrait de `@better-auth/infra` : confirmé

- Le paquet n'est référencé que par lui-même : **3 occurrences** dans `pnpm-lock.yaml` (importateur l.169,
  entrée de paquet l.312, entrée de résolution de peers l.2943). `better-auth`, `@better-auth/core`,
  `better-call` et `@better-auth/utils` ne le déclarent pas.
- Ses dépendances **exclusives** — `@xmldom/xmldom@0.9.12` et `libphonenumber-js@1.13.15` — quitteront le
  verrou avec lui (les autres, `jose`, `@noble/hashes`, `@better-auth/utils`, `@better-fetch/fetch`,
  `better-call`, sont partagées avec `better-auth` et restent). Le critère « uniquement les entrées attendues »
  doit donc les inclure explicitement.
- `ssr.noExternal` à **4 entrées reste exact** : le `zod` 4 vient de `better-auth` lui-même
  (`dependencies: zod ^4.5.4`) et de `better-call` (`peer zod ^4.0.0`, optionnel) → 4.6.7 reste dans l'arbre,
  consommé par `@better-auth/core` 1.7.18 ; `@better-auth/utils` et `@lucide/svelte` inchangés. Aucune entrée à
  retirer, **aucun `override` à ajouter**.
- Le peer non satisfait `zod >=4.1.12` d'`@better-auth/infra` disparaît bien avec lui : c'en est la seule source.

### 5. `image-size` / `leaflet` : confirmés

- `image-size@2.1.0` = `latest`, MIT, **0 dépendance, 0 peer**, aucun `engines` ; le point d'entrée racine ne
  charge aucun module Node (`./fromFile` est le seul sous-chemin Node, interdit). L'épinglage exact reste justifié.
- `leaflet@1.9.4` = `latest` (2.0 toujours en beta) et `@types/leaflet@1.9.22` = `latest` : cohérents, déjà au verrou.

### 6. Versions et numérotation : conformes

- Contrôle ligne à ligne du §7.1 contre `package.json` + `pnpm-lock.yaml` : **aucune contradiction**. Les seules
  divergences sont les montées **prévues** (0.39.3 → 0.45.4, 0.30.6 → 0.31.11) et les mouvements des étapes 50/51.
  Les peers annoncés au §2.2 sont exactement ceux mesurés.
- Numérotation : 50/51 physiquement avant l'étape 36, expliqué l.124 (« vague 0 »), §3.1 avec la ligne « 0 »,
  étapes 42/48/49 qui dépendent de 50/51, annexe A qui précise que 36 → 49 ne bougent pas : cohérent, aucun
  renvoi orphelin.

### Corrections minimales à porter au plan

1. **l.137** (critère « Testable » de l'étape 50) : remplacer « `git diff --stat pnpm-lock.yaml` reste limité aux
   deux paquets » par « … aux deux paquets **et à leur sous-arbre** (retrait de `gel` et `esbuild-register`, ajout
   de `esbuild@0.25.x`, `tsx`, et réécriture des peers qui citent `esbuild@0.19.12`) ».
2. **l.133** (étape 50, point 3) : retirer `db.execute` de la liste des ruptures attendues de la 0.45 (signature
   identique en 0.39.3 et 0.45.4) et y substituer l'alerte réelle : `drizzle/meta` contient 6 entrées de journal
   pour 5 instantanés (0005 absent) — préexistant, non imputable à 0.31.
3. **l.148 + l.152** (étape 51, point 3 et critère) : « verrou inchangé, aucun paquet ne bouge » est faux — le
   `specifier` de l'importateur doit passer de `^1.0.0` à `~1.7.18`, sinon le prochain
   `pnpm install --frozen-lockfile` (CI comprise) échoue en `ERR_PNPM_OUTDATED_LOCKFILE`. Formulation attendue :
   « une ligne de verrou change (le `specifier` de l'importateur), aucun paquet ne bouge ».

Non bloquant, à titre d'exécution : `pnpm add -E -D drizzle-kit@0.31.11` (conserver la devDependency) ; prévoir que
le diff de l'étape 51 inclut `@xmldom/xmldom` et `libphonenumber-js`.

## Statut de la contre-vérification du 2026-11-18

`STATUT : PLAN À ACTUALISER`

Motif : les **dépendances** sont désormais conformes (points 1, 2, 4, 5 validés sans réserve), mais **deux
critères d'acceptation du plan sont factuellement inatteignables** et feraient échouer les étapes 50 et 51 à
tort — dont un qui casse la CI (`--frozen-lockfile`). Ce sont des corrections de formulation, pas des décisions
de packages : aucune réouverture du choix technique n'est nécessaire.

Liste exacte et minimale des points restants :

1. **l.137** — diff du verrou : inclure le sous-arbre (`gel`, `esbuild-register`, `esbuild`, `tsx`).
2. **l.148 + l.152** — « verrou inchangé » → une ligne de `specifier` change, rafraîchissement du verrou obligatoire.
3. **l.133** — requalifier `db.execute` (aucune rupture) et y substituer l'alerte `drizzle/meta` (instantané 0005 absent).

Ces trois lignes ajustées, la vague 0 peut être exécutée par le mainteneur sans autre réserve.
