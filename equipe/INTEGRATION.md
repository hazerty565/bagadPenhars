# Rapport d'Intégration

## 1. Résumé

- **Date/heure** : 2026-11-28 13:55
- **Statut global** : **INTÉGRABLE SOUS CONDITIONS** — la fusion est **bloquée** tant que les défauts marqués « bloquant » du §6 ne sont pas levés.
- **Responsable principal si blocage** : **DEV-FRONTEND** (mapping store ↔ DTO de page, guards manquants, routes mortes) et **CONFIG** (CI rouge, bindings R2/Hyperdrive, artefacts).
- **URL locale** : `http://localhost:4182` (build de production servi par `vite preview`, testé le 2026-11-28).
- **Branche / commit** : `dev` @ `0c5ac6d` (arbre de travail propre, hors `scripts/verify-component-usage.mjs` ajouté par l'Intégrateur).

> **Écart avec le rapport précédent.** Le rapport de phase 6 déclarait « VALIDÉ ». La vérification
> contradictoire de ce jour établit que **plusieurs pages de l'espace adhérents rendent des données
> vides** (DTO de page non mappés dans le store), que **4 routes d'administration n'ont aucun guard de
> rôle**, que la **CI est rouge** (`lint`) et que `pnpm test` échoue. Ce rapport remplace le précédent.

---

## 2. Documents lus

- [x] `AGENTS.md`
- [x] `equipe/PLAN.md` (§10, étapes 58–73 ; §11 gouvernance des packages)
- [x] `equipe/CONTRAT_API.md` (§2.2, §3.1, §4, §7.11, §7.12, §11.1)
- [x] `docs/architecture.md`, `docs/database.md`, `docs/journal.md` (entrées 2026-11-23 et suivantes)
- [x] Fichiers de configuration : `package.json`, `pnpm-lock.yaml` (présence), `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, `wrangler.jsonc`, `eslint.config.js`, `.gitignore`, `.github/workflows/ci.yml`
- [x] `equipe/HISTORIQUE.md`, `equipe/AUDIT-DEMO.md` (pour recouper les points déjà connus)

---

## 3. Points de Contrôle Clés

- [ ] **Concordance des types (Front ↔ DTO ↔ schéma Drizzle)** : **ÉCHEC**. Les DTO de page sont corrects
      côté serveur, mais le store `src/lib/member/store.svelte.ts` ne lit pas les bonnes clés. Cinq écrans
      rendent des listes vides ou des compteurs à 0 (détail I-003).
- [ ] **Sessions Better Auth** : **PARTIEL**. `locals.user` / `locals.profile` restent strictement côté
      serveur (aucun import de `$lib/db` ou `$lib/server/**` dans un `.svelte`), le rôle vient uniquement de
      `profiles.role` relu dans la transaction RLS, et `/dashboard/__data.json` renvoie bien
      `{"type":"redirect","location":"/auth/login?redirectTo=%2Fdashboard"}` sans session. **Mais** 4 routes
      `load` renvoient `{}` sans `requireRole` (I-004) : tout compte actif obtient un HTTP 200.
- [ ] **Migrations** : **NON VÉRIFIABLE**. Aucune migration n'est ajoutée par ce chantier (pas de changement
      de schéma). Les fichiers `drizzle/0000`–`0008` sont présents et `drizzle/meta/_journal.json` est à jour,
      mais la **preuve d'application de `0008`** n'existe que sous forme d'affirmation
      (`equipe/HISTORIQUE.md:413` : « 0000–0008 appliquées sur Neon `test` ») ; `docs/journal.md` ne mentionne
      que l'application de `0006`+`0007` et la **création** de `0008`. Aucun log `pnpm run db:migrate` n'est
      fourni. Preuve à produire par le backend avant tout déploiement (I-026).
- [x] **Isolation des couches** : **OK**. Aucun accès DB direct depuis le client (recherche `$lib/db`,
      `drizzle-orm`, `$lib/server` dans `src/**/*.svelte` et `src/lib/member/**` : 0 résultat). Toutes les
      écritures passent par `POST /api/member/action` → `runMemberCommand` dans `withUserContext`
      (`set_config('app.profile_id', …, true)`). Aucune écriture hors contrat détectée.

### Constat complémentaire — `ssr = false` sur l'espace adhérents

`src/routes/dashboard/+layout.ts` désactive le SSR pour tout `/dashboard`. Conséquence vérifiée : un
`GET /dashboard` **anonyme** renvoie `200 text/html` (coque SPA), et le refus n'arrive que sur la requête
de données (`/dashboard/__data.json` → redirection 303). Ce n'est **pas une fuite** (aucune donnée dans la
coque), mais le contrôle d'accès n'est plus observable au statut HTTP de la page. À documenter dans
`docs/architecture.md`.

---

## 4. Commandes exécutées

| Commande                                                   | Résultat       | Remarque                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`                           | **OK (0)**     | Lockfile à jour, politiques supply-chain OK. Un seul `pnpm-lock.yaml`, aucun `package-lock.json`.                                                                                                                                        |
| `pnpm run check`                                           | **OK (0)**     | `0 errors and 20 warnings in 5 files` : 19 × `state_referenced_locally` + 1 × `on:load` déprécié (`src/routes/+layout.svelte:24`).                                                                                                       |
| `pnpm run lint`                                            | **ERREUR (1)** | Prettier OK (« All matched files use Prettier code style! »). ESLint : **19 problèmes (12 erreurs, 7 avertissements)** — détail I-001/I-002.                                                                                             |
| `pnpm test` (`vitest run`)                                 | **ERREUR (1)** | `Test Files 2 failed                                                                                                                                                                                                                     | 21 passed (23)`, `Tests 174 passed`. Les 2 échecs sont des fichiers de test **vides** (`tests/i18n.test.ts`, `tests/invitation.test.ts`, 0 octet) : « No test suite found in file ». |
| `pnpm run build`                                           | **OK (0)**     | `adapter-cloudflare` : « ✔ done » (~24 s serveur + ~6,4 s client). Avertissements : `build.rollupOptions.output.*` écrasés par SvelteKit ; plugin `bagad-exclude-demo-from-build` à 51–54 % du temps (cible `$lib/demo/**` inexistante). |
| `pnpm exec vite preview --port 4182 --strictPort` + `curl` | **OK**         | Serveur de production local démarré. Voir smoke tests ci-dessous.                                                                                                                                                                        |
| `node scripts/verify-component-usage.mjs`                  | **OK**         | Script de vérification non destructif ajouté par l'Intégrateur (autorisé) : inventaire des composants orphelins.                                                                                                                         |

### Smoke tests (build de production, `http://localhost:4182`)

| URL                                                      | Statut    | Observation                                                                                                      |
| -------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `/fr`                                                    | `200`     | `<html lang="fr">` correct (hook `transformPageChunk`).                                                          |
| `/en`                                                    | `200`     | OK.                                                                                                              |
| `/fr/articles`, `/fr/contact`, `/fr/agenda`, `/fr/media` | `200`     | Pages publiques OK.                                                                                              |
| `/auth/login`                                            | `200`     | OK.                                                                                                              |
| `/dashboard`                                             | `200`     | Coque SPA (`ssr = false`) — pas de données.                                                                      |
| `/dashboard/__data.json`                                 | `200`     | `{"type":"redirect","location":"/auth/login?redirectTo=%2Fdashboard"}` → **guard serveur effectif**.             |
| `/api/files/public/x.webp`                               | `503`     | `storage_unavailable` : bindings R2 absents/nommés différemment (I-005).                                         |
| `/sitemap.xml`                                           | `200`     | Sert le **fichier statique** ; ses URL (`/articles`, `/contact`, `/bagad`, `/agenda`) renvoient `404`.           |
| `/articles`, `/contact`, `/bagad`, `/agenda`             | `404`     | Le sitemap statique pointe vers des URL inexistantes (les vraies URL sont `/fr/...`).                            |
| `/public/fr`                                             | `200`     | Coque de **192 octets**, sans navigation ni contenu → arbre public parallèle mort.                               |
| `/public/fr/contact`, `/public/en/contact`               | **`500`** | **Route publique qui plante** : `load` ne renvoie pas `lang`, le composant appelle `getDict(undefined)` (I-007). |

---

## 5. Cohérence API (Échantillon)

| Endpoint                                  | Front conforme | Backend conforme | Statut     | Remarque                                                                                                                            |
| ----------------------------------------- | -------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/member/action`                 | Oui            | Oui              | **OK**     | Réponse `{ success: true, data }` ; le store lit `body.data`. Erreurs `{ message, code }` sans `success`.                           |
| `GET /dashboard` (layout)                 | Oui            | Oui              | **OK**     | `{ memberShell }` → `member.applyShell`.                                                                                            |
| `GET /dashboard/membres` (annuaire)       | Oui            | Oui              | **OK**     | `DirectoryPageData { profiles }` → `member.profiles`.                                                                               |
| `GET /dashboard/admin/membres`            | **Non**        | Oui              | **ERREUR** | DTO `{ members, membersCount }` ; le store lit `data.profiles` → **liste vide** (I-003).                                            |
| `GET /dashboard/pupitre`                  | **Non**        | Oui              | **ERREUR** | DTO `{ pupitre, members? }` ; la page passe par `profilesOfPupitre()` → `member.profiles` → **0 membre / 0 chef** (I-003).          |
| `GET /dashboard/pupitre/membres`          | **Non**        | Oui              | **ERREUR** | Même cause : `PupitrePageData.members` jamais lu (I-003).                                                                           |
| `GET /dashboard/admin` (vue d'ensemble)   | **Non**        | Oui              | **ERREUR** | DTO `{ counts, storage }` ignoré ; la page lit `member.profiles` / `invitations` / `articles` → **tous les compteurs à 0** (I-003). |
| `GET /dashboard` (vue d'ensemble)         | **Non**        | Oui              | **ERREUR** | DTO `{ events, notifications, documentsCount }` ; la page lit `member.documents.length` → **0 document** (I-003).                   |
| `GET /dashboard/admin/articles`           | **Non**        | Oui              | **ERREUR** | DTO `{ articles, authors }` ; l'auteur est cherché dans `member.profiles` → **auteur inconnu** (I-003).                             |
| `GET /dashboard/agenda/[id]`              | Oui            | Oui              | **OK**     | `{ event, profiles, responses }` → getters correspondants.                                                                          |
| `GET /dashboard/admin/agenda`             | Non            | **Non**          | **ERREUR** | `load` renvoie `{}`, **aucun `requireRole`** ; doublon de `/dashboard/agenda` (I-004, I-010).                                       |
| `GET /dashboard/admin/notifications`      | Non            | **Non**          | **ERREUR** | `load` renvoie `{}`, **aucun `requireRole`** ; doublon de `/dashboard/notifications` (I-004).                                       |
| `GET /dashboard/admin/articles/new`       | Non            | **Non**          | **ERREUR** | `load` renvoie `{}`, **aucun `requireRole`** → formulaire sans données (I-004).                                                     |
| `GET /dashboard/admin/articles/[id]/edit` | Non            | **Non**          | **ERREUR** | Idem (I-004).                                                                                                                       |
| `GET /api/files/[...key]`                 | Oui            | Oui (code)       | **OK\***   | Guard session + visibilité + `no-store` conformes. \*Échoue au déploiement à cause des noms de bindings (I-005).                    |
| `GET /sitemap.xml`                        | —              | **Non**          | **ERREUR** | La route `+server.ts` (urlset vide) est masquée par `static/sitemap.xml` ; les URL publiées renvoient 404 (I-008).                  |
| `GET /public/[lang]/contact`              | **Non**        | **Non**          | **ERREUR** | **HTTP 500** en production (I-007).                                                                                                 |

---

## 6. Défauts à corriger

### 6.1 Bloquants (fusion interdite tant qu'ils sont ouverts)

| ID    | Responsable            | Bloquant | Fichier concerné                                                                                                                                | Description                                                                                                                                                                                                                                                                                                                                                | Correction demandée                                                                                                                                                                                                                |
| ----- | ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-001 | DEV-FRONTEND           | Oui      | `src/routes/(public)/[lang=lang]/{+page,agenda,bagad,contact,formation,informations-legales,partenaires}/+page.svelte`                          | `export const prerender = true;` déclaré **dans un `.svelte`** (invalide : l'option appartient à `+page.ts`), avec un `// eslint-disable-next-line` mal placé. 7 erreurs `svelte/valid-prop-names-in-kit-pages` + 7 avertissements « unused directive ». Le pré-rendu est donc **ineffectif**.                                                             | Déplacer `prerender` dans un `+page.ts` (ou le retirer), supprimer les `eslint-disable` inutiles.                                                                                                                                  |
| I-002 | DEV-BACKEND            | Oui      | `src/lib/server/member/queries/{agenda.ts:44,invitations.ts:59,pupitre.ts:54}` + `gen_tests.js:463`                                             | 3 variables/types déclarés et jamais utilisés ; `gen_tests.js` utilise `require()` (fichier de debug commité). 4 erreurs ESLint.                                                                                                                                                                                                                           | Supprimer les déclarations mortes ; **supprimer `gen_tests.js`** du dépôt (artefact de debug, voir I-014).                                                                                                                         |
| I-003 | DEV-FRONTEND           | Oui      | `src/lib/member/store.svelte.ts`, `src/lib/member/pages/{AdminMembersPage,PupitrePage,AdminOverviewPage,OverviewPage,AdminArticlesPage}.svelte` | Le store n'expose pas les clés des nouveaux DTO : `members` (admin/pupitre), `authors`, `counts`, `documentsCount`. Résultat vérifié : **annuaire admin vide, espace pupitre vide, compteurs admin à 0, 0 document, auteur inconnu**. Le §7.11 du contrat exigeait explicitement l'adaptation (`member.adminMembers`, `profiles` en `DirectoryProfile[]`). | Ajouter les getters manquants (`adminMembers`, `authors`, `counts`, `documentsCount`, `pupitreMembers`) **ou** faire lire `data.memberPage.data` directement par les pages ; ne plus caster `DirectoryProfile` en `MemberProfile`. |
| I-004 | DEV-FRONTEND           | Oui      | `src/routes/dashboard/admin/{agenda,notifications,articles/new,articles/[id]/edit}/+page.server.ts`                                             | `load` renvoie `{}` **sans `requireAuth` ni `requireRole`** : tout compte actif obtient un 200 (le layout ne vérifie que session/statut/rôle non nul). Pages **liées depuis l'UI** (`AdminOverviewPage`, `AgendaPage`) et **doublons** de routes déjà gardées.                                                                                             | Soit supprimer ces 4 routes (doublons), soit les garder avec `requireAuth` + `requireRole('secretaire')` et un `memberPage` réel. Décision CONTRAT requise (I-010).                                                                |
| I-005 | CONFIG                 | Oui      | `wrangler.jsonc:12,16` vs `src/lib/server/blobs.ts:47-48` et `src/lib/server/files.ts:75-76`                                                    | Les bindings R2 sont déclarés `PUBLIC_STORAGE` / `PRIVATE_FILES` alors que le code et le contrat (`Q-2026-11-08-04`) attendent `R2_PUBLIC` / `R2_PRIVATE`. Aucun binding `hyperdrive` n'est déclaré alors que `resolveDatabaseUrl()` lit `platform.env.HYPERDRIVE`. Vérifié localement : `/api/files/public/*` → **503**.                                  | Renommer les bindings en `R2_PUBLIC`/`R2_PRIVATE` et ajouter le binding `hyperdrive` (ou documenter l'alternative). **Accord du Chef requis** (config de déploiement).                                                             |
| I-006 | TESTEUR (hors matrice) | Oui      | `tests/i18n.test.ts`, `tests/invitation.test.ts`                                                                                                | Fichiers de **0 octet** : `pnpm test` échoue avec 2 suites en erreur.                                                                                                                                                                                                                                                                                      | Les remplir ou les supprimer ; le Chef désigne le responsable (`tests/**` hors matrice de l'Intégrateur).                                                                                                                          |
| I-007 | DEV-FRONTEND           | Oui      | `src/routes/public/[lang=lang]/**` (4 fichiers + 16 Mo d'images)                                                                                | Arbre public **parallèle** à `src/routes/(public)/[lang=lang]/`, accessible par URL. `/public/fr` = coque de 192 octets ; `/public/*/contact` = **HTTP 500** (`load` omet `lang` → `getDict(undefined)`). 16 Mo d'images (`hero-bg.webp`, `gallery*.webp`, `image*.png`, `vite.svg`) commitées dans `src/routes/public/`.                                  | Supprimer l'arbre `src/routes/public/` (doublon mort) et déplacer les images utiles sous `static/` ; **validation du Chef avant suppression**.                                                                                     |

### 6.2 Importants

| ID    | Responsable  | Bloquant | Fichier concerné                                                                    | Description                                                                                                                                                                                                                                                                                                          | Correction demandée                                                                       |
| ----- | ------------ | -------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| I-008 | CONFIG       | Non      | `src/routes/sitemap.xml/+server.ts`, `static/sitemap.xml`, `static/robots.txt`      | Deux sources de vérité ; la route (urlset vide) est **masquée** par le fichier statique. Le sitemap publié liste `/articles`, `/contact`, `/bagad`, `/agenda`, `/formation` → **404** (les vraies URL sont `/fr/...`).                                                                                               | Garder une seule source et générer les URL `/{lang}/...` ; mettre `robots.txt` à jour.    |
| I-009 | DEV-BACKEND  | Non      | `src/lib/server/member/queries/context.ts` et `events.ts`                           | **Deux exports homonymes `getPageContext`** avec des signatures/retours différents (`{role, accountStatus}` vs `EventPageContext`). Ambiguïté de contrat et piège d'import.                                                                                                                                          | Renommer l'un des deux (ex. `getEventPageContext`).                                       |
| I-010 | CONTRAT      | Non      | `equipe/CONTRAT_API.md`                                                             | Deux routes pour la même section `eventForm` : `/dashboard/agenda/nouveau` (`chef_pupitre`) et `/dashboard/admin/agenda/new` (`secretaire`). Le contrat ne tranche pas.                                                                                                                                              | Décider la route canonique et la garde associée ; l'Architecte consigne.                  |
| I-011 | CONFIG       | Non      | `.env.example`                                                                      | **Absent**, alors que `AGENTS.md` §2 l'exige à jour (sans secret).                                                                                                                                                                                                                                                   | Créer `.env.example` (noms de variables uniquement). **Accord du Chef requis.**           |
| I-012 | CONFIG       | Non      | `src/app.html`, `static/manifest.json`, `static/manifest.webmanifest`               | Aucun `<link rel="manifest">` : la PWA n'est pas installable. `manifest.webmanifest` = **0 octet**. Icônes en chemin relatif.                                                                                                                                                                                        | Lier le manifest dans `app.html`, supprimer le fichier vide, chemins `/logo_Penhars.png`. |
| I-013 | CONFIG       | Non      | `package.json`                                                                      | `@lhci/cli` en `dependencies` et `lighthouse` en `devDependencies` sans audit consigné dans `docs/mises-a-jour.md` ni validation client (gouvernance AGENTS §2). `svelte-i18n` installé mais inutilisé (accepté et documenté).                                                                                       | Justifier ou retirer ; consigner l'audit. **Accord du Chef requis.**                      |
| I-014 | CONFIG       | Non      | racine, `src/lib/member/`, `src/lib/server/member/queries/`, `docs/`                | ~9 Mo d'artefacts de debug commités : `check_before.log`, `check_out.txt`, `check_out2.txt`, `gen_tests.js`, `image.png`, `test.webp` (0 o), `Context.MD`, `fix.bat`, `fix.ps1`, `types_check.txt`, `tests/temp.txt`, `test_{dollar,node,py,py2}.txt`, `docs/lighthouse*.json`, `docs/lighthouse-summary.txt` (0 o). | Nettoyage + ajout au `.gitignore`. **Validation du Chef avant suppression.**              |
| I-015 | CONFIG       | Non      | `vite.config.ts`                                                                    | Plugin `bagad-exclude-demo-from-build` ciblant `$lib/demo/**` **inexistant** (51–54 % du temps de build) ; exclusions `src/autre/**` obsolètes.                                                                                                                                                                      | Supprimer le plugin et les exclusions mortes.                                             |
| I-016 | DEV-FRONTEND | Non      | `src/lib/components/**`                                                             | ~40 composants **orphelins** (0 import) : `articles/*`, `documents/*`, `events/*`, `forms/*`, `media/*`, `members/*`, `notifications/*`, `polls/*`, `layout/Sidebar.svelte`… (preuve : `scripts/verify-component-usage.mjs`).                                                                                        | Supprimer ou rattacher ; ne pas laisser de code mort dans le bundle.                      |
| I-017 | DEV-FRONTEND | Non      | `src/lib/member/store.svelte.ts` (`request`), `src/routes/dashboard/+layout.svelte` | `invalidateAll()` n'est pas attendu et `clearPage()` s'exécute dans un `$effect` du layout : course possible entre rechargement de page et vidage du store après mutation.                                                                                                                                           | `await invalidateAll()` ; déplacer `clearPage()` dans `afterNavigate` ou avant le load.   |
| I-018 | CONFIG       | Non      | `static/robots.txt`                                                                 | Interdictions obsolètes (`/article/`, `/members`, `/article/new`, `/agenda-form`, `/article-delete`) ; **aucune** interdiction de `/dashboard`, `/auth`, `/api`.                                                                                                                                                     | Réécrire `robots.txt` sur les routes réelles.                                             |

### 6.3 Mineurs

| ID    | Responsable  | Fichier concerné                                                            | Description                                                                                                                                        |
| ----- | ------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-019 | CONFIG       | `src/routes/+layout.svelte:24`                                              | `on:load` déprécié (avertissement `svelte-check`). Remplacer par une action/propriété moderne.                                                     |
| I-020 | DEV-FRONTEND | 5 fichiers (avertissements `check`)                                         | 19 × `state_referenced_locally` (préexistants, hors périmètre immédiat).                                                                           |
| I-021 | CONFIG       | `src/routes/dashboard/+layout.ts`                                           | Commentaire obsolète : « à partir de l'instantané serveur » (l'instantané n'existe plus).                                                          |
| I-022 | CONFIG       | `docs/`                                                                     | `lighthouse-summary.txt` = 0 octet ; 4,7 Mo de rapports JSON commités.                                                                             |
| I-023 | DEV-FRONTEND | `src/routes/public/[lang=lang]/contact/+page.svelte:6`                      | Propriété `turnstileSiteKey` déclarée mais **jamais utilisée** (erreur ESLint `svelte/no-unused-props`).                                           |
| I-024 | DEV-FRONTEND | `src/lib/member/pages/AdminSettingsPage.svelte`, `NotificationsPage.svelte` | Libellés « simulé / push non branché » encore affichés alors que le contrat prévoit OneSignal (chantier ultérieur) — à tracer, pas à corriger ici. |

### 6.4 Arbitrages demandés au Chef

1. **I-005 (bindings R2/Hyperdrive)** : la correction touche `wrangler.jsonc`, configuration de déploiement
   Cloudflare. L'Intégrateur ne peut pas la modifier sans accord explicite. Merci de statuer (et de confirmer
   si les bindings sont créés côté dashboard Cloudflare plutôt que dans `wrangler.jsonc`).
2. **I-007 / I-014 (suppressions)** : suppression de `src/routes/public/**`, de 16 Mo d'images et de ~9 Mo
   d'artefacts de debug. Aucune suppression ne sera faite sans validation.
3. **I-006 (`tests/**`)\*\* : les fichiers de test vides sortent de la matrice de responsabilité de l'Intégrateur
   (propriétaire : Testeur). Merci de désigner le responsable.
4. **I-010 (routes `eventForm` en double)** : arbitrage de contrat nécessaire entre `/dashboard/agenda/nouveau`
   et `/dashboard/admin/agenda/new` avant toute correction front.
5. **I-013 (dépendances `lighthouse` / `@lhci/cli`)** : validation client requise par `AGENTS.md` §2.

---

## 7. Conclusion de l'Intégrateur

L'architecture serveur est saine : guards `requireAuth`/`requireRole`, transaction RLS par lecture, DTO de page,
enveloppe `{ success, data }`, aucune fuite de données membres vers le public. Le build et le type-check passent.

En revanche, **l'assemblage front ↔ DTO n'est pas terminé** : cinq écrans de l'espace adhérents rendent des
données vides, quatre routes d'administration n'ont pas de guard de rôle, la CI est rouge (`lint`), `pnpm test`
échoue, une route publique répond 500 et les bindings de déploiement ne correspondent pas au code.

**Verdict : INTÉGRABLE SOUS CONDITIONS.** Les conditions sont les 7 bloquants du §6.1. Tant qu'ils ne sont pas
levés, la fusion sur `main` doit rester interdite.
