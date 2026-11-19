# Historique des phases — Session 2026-11-18

## Phase : Prérequis

- **Action** : Vérification de `docs/` et des agents `.opencode/agents/`
- **Résultat** : Conforme — `docs/brief.md` présent et complet ; 10 agents requis
  configurés (`chef`, `architecte`, `mainteneur`, `dev-backend`, `dev-frontend`,
  `integrateur`, `tech-lead`, `testeur`, `securite`, `deployer`)
- **Itérations** : 0
- **Fichiers modifiés** : aucun

## Phase : Reprise d'état (Phase 0)

- **Action** : Lecture de `equipe/HISTORIQUE.md`, `equipe/PLAN.md`,
  `equipe/CONTRAT_API.md`, `docs/journal.md`, `docs/questions.md`, `docs/suivi.md`
- **Résultat** : Projet en cours. Aucune phase n'est encore validée :
  l'architecture a produit ses livrables le 2026-11-17 mais s'est arrêtée sur
  **quatre questions ouvertes** (`Q-2026-11-17-01` à `-04`). `docs/mises-a-jour.md`
  est absent, l'audit du mainteneur n'a donc pas eu lieu.
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`
- **Prochaine étape** : transmission des questions ouvertes au client (ARRÊT),
  puis audit des packages par le `mainteneur`.

## Phase : Architecture — reprise

- **Action** : Lecture des livrables existants de l'`architecte`
  (`equipe/PLAN.md` et `equipe/CONTRAT_API.md`, version du 2026-11-17)
- **Résultat** : Livrables présents et exploitables. Plan en 3 sections
  (périmètre de session, décisions techniques, étapes 36 à 46) + annexe des
  étapes 1 à 35. Quatre questions bloquent chacune une étape précise
  (38, 43, 45, 46) ; le reste du plan est exécutable.
- **Itérations** : 0 (pas de nouvelle passe d'architecture : les livrables sont à
  jour et la précision client « design public figé à 98 % » est déjà prise en
  compte — aucune refonte graphique dans le périmètre)
- **Fichiers modifiés** : aucun
- **Prochaine étape** : **ARRÊT — arbitrage client des 4 questions**, puis
  `mainteneur` (audit des versions) et point de contrôle n°1.

## Phase : Arbitrage client des questions ouvertes

- **Action** : Le Chef a présenté les 4 questions bloquantes au client
- **Résultat** : 4 décisions obtenues — Motion : absence entérinée (A) ;
  invitation : 1 heure conforme à la Spec (A) ; photo de profil : palette d'abord,
  photo réelle après branchement R2 en fin de session ; champs d'article :
  migration additive de 3 colonnes nullables (A)
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`
- **Prochaine étape** : `architecte` pour consigner les décisions et aligner le plan

## Phase : Architecture — alignement sur les arbitrages

- **Action** : Appel à `architecte` (intégration des décisions du 2026-11-18)
- **Résultat** : Livré — `PLAN.md` compte 14 étapes (36 → 49) dont la nouvelle
  étape 49 (photo de profil réelle après R2, sans migration) ; `CONTRAT_API.md`
  compte 39 sections d'endpoints (§7.7 réécrit, §7.10 ajouté). Aucune question
  bloquante restante ; Q-2026-11-09-01 et les validations éditoriales restent
  ouvertes mais non bloquantes. La correction de `AGENTS.md` §0 est renvoyée au
  client, aucune étape n'en dépend.
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/PLAN.md`, `equipe/CONTRAT_API.md`,
  `docs/questions.md`
- **Prochaine étape** : `mainteneur` (audit des versions), puis point de
  contrôle n°1

## Incident d'orchestration : trois agents non enregistrés

- **Action** : Appel à `mainteneur` refusé par le harness (`Unknown agent: mainteneur`)
- **Cause identifiée** : `mainteneur.md`, `integrateur.md` et `tech-lead.md`
  portaient `color: warn` dans leur frontmatter ; `warn` n'est pas une valeur
  acceptée par le schéma (la valeur valide est `warning`), ce qui empêchait leur
  enregistrement alors que les autres agents se chargeaient normalement.
- **Correctif** : `color: warn` → `color: warning` dans les trois fichiers.
  Aucune autre modification (permissions, description, mode inchangés).
- **Résultat** : `mainteneur` chargé et appelé avec succès.
- **Itérations** : 0
- **Fichiers modifiés** : `.opencode/agents/mainteneur.md`,
  `.opencode/agents/integrateur.md`, `.opencode/agents/tech-lead.md`
- **Prochaine étape** : audit des packages, puis point de contrôle n°1

## Phase : Audit des packages et versions (itérations 1)

- **Action** : Appel à `mainteneur` sur la table des packages de `equipe/PLAN.md`
- **Résultat** : **STATUT : PLAN À ACTUALISER**. Bloquant : `drizzle-orm`
  0.39.3 / `drizzle-kit` 0.30.6 alors que `better-auth` 1.7.18 (verrouillé,
  utilisé avec `drizzleAdapter`) exige `^0.45.2` / `>=0.31.4` — écart silencieux
  préexistant. `@better-auth/infra` n'est importé nulle part et porte le conflit
  `zod` 3/4 (déjà neutralisé par `ssr.noExternal`). `image-size@2.1.0` validé
  techniquement. `node_modules/` absent ; `pnpm-lock.yaml` en retard sur ses
  propres plages ; `package-lock.json` obsolète (déclare encore `lucide-svelte`).
  Feu vert partiel : `image-size` seul, pas de remise à niveau générale.
- **Itérations** : 1
- **Fichiers modifiés** : `docs/mises-a-jour.md` (créé)
- **Prochaine étape** : retour à l'`architecte` pour actualiser `PLAN.md` /
  `CONTRAT_API.md`, puis re-vérification par le `mainteneur`

## Phase : Architecture — actualisation après audit (itération 2)

- **Action** : Appel à `architecte` sur le rapport du `mainteneur`
- **Résultat** : Livré — §7.1 aligné sur `drizzle-orm` 0.45.4 et `drizzle-kit`
  0.31.11 ; **vague 0** ajoutée : étape 50 (mise à niveau des dépendances et
  adaptation backend, installation par le mainteneur seul) et étape 51 (retrait
  de `@better-auth/infra`) ; `image-size` 2.1.0 exact rattaché aux étapes 42/49 ;
  `better-auth` resserré à `~1.7.18` ; `leaflet` confirmé ; `resend` 4.8.0
  conservé ; §2.1.1 et §8 complétés (7 majeures différées) ; défauts de
  verrouillage consignés ; annexe A renvoyée sur 50/51.
  `CONTRAT_API.md` inchangé (aucun endpoint concerné). 6 décisions techniques
  consignées (D-2026-11-18-01 à -06).
- **Itérations** : 2
- **Fichiers modifiés** : `equipe/PLAN.md`, `docs/questions.md`
- **Prochaine étape** : re-vérification du `mainteneur`, puis point de contrôle n°1

## Phase : Contre-vérification des packages (itérations 3)

- **Action** : Re-vérification ciblée du `mainteneur` sur le plan actualisé
- **Résultat** : Dépendances **validées** (peers Drizzle conformes, `~1.7.18`
  acceptable — aucune release de sécurité entre 1.7.19 et 1.7.25, retrait de
  `@better-auth/infra` confirmé, `image-size` et `leaflet` confirmés, versions et
  numérotation conformes). Mais **STATUT : PLAN À ACTUALISER** pour 3 corrections
  factuelles : (1) `db.execute` a une signature identique en 0.39.3 et 0.45.4 —
  fausse alerte ; (2) le diff du verrou dépassera les deux paquets (`drizzle-kit`
  0.31.11 abandonne `gel`/`esbuild-register`, ajoute `esbuild ^0.25.4` + `tsx`,
  ce qui réécrit les lignes de peers de `vite`) ; (3) le `specifier` de
  l'importateur `better-auth` doit passer de `^1.0.0` à `~1.7.18`, sinon
  `pnpm install --frozen-lockfile` échoue en `ERR_PNPM_OUTDATED_LOCKFILE`.
  Piège supplémentaire : `drizzle/meta/` compte 6 entrées de journal pour
  5 instantanés (`0005_bureau_title.sql` sans snapshot) → diff préexistant
  possible lors de la génération d'essai.
- **Itérations** : 3 (limite « retours vers l'architecte » atteinte : toute
  nouvelle passe nécessiterait une décision client)
- **Fichiers modifiés** : `docs/mises-a-jour.md`
- **Prochaine étape** : correction des 3 lignes par l'`architecte`, puis point de
  contrôle n°1 — aucune nouvelle re-vérification exigée par le mainteneur

## Phase : Architecture — corrections factuelles (itération 4)

- **Action** : Appel à `architecte` sur les 3 corrections du `mainteneur`
- **Résultat** : Livré — étape 50 corrigée (risque requalifié vers
  `drizzle.config.ts` et l'adaptateur Better Auth ; `db.execute` déclaré
  inchangé ; critère de diff du verrou fondé sur son contenu ; séquence
  hydratation → `specifier` → rafraîchissement du verrou → contrôles ; règle de
  tri pour le piège `drizzle/meta`), étape 51 et ligne de risque §8 alignées.
  `CONTRAT_API.md` et `docs/questions.md` intacts.
- **Itérations** : 4
- **Fichiers modifiés** : `equipe/PLAN.md`
- **Prochaine étape** : **POINT DE CONTRÔLE 1** — présentation au client

## Point de contrôle 1 : présenté

- **Action** : Présentation du plan, du contrat API et des versions vérifiées
- **Résultat** : En attente de la validation explicite du client — aucune
  installation lancée
- **Itérations** : 0
- **Fichiers modifiés** : aucun
- **Prochaine étape** : phase 3 (installation) si « OK », sinon retour à
  l'architecte

## Point de contrôle 1 : demande client de modification (nouveau périmètre)

- **Action** : Le client demande l'installation de `svelte-i18n` (traductions
  fr/en/br) et de `lucide-svelte` (icônes)
- **Vérifications du Chef** : `@lucide/svelte` 1.71.0 est **déjà installé** et
  importé dans une vingtaine de fichiers ; `lucide-svelte` est l'ancien nom
  déprécié, remplacé le 2026-11-10 et présent uniquement dans la maquette
  `src/autre/`. `svelte-i18n` n'est pas installé : le site utilise des
  dictionnaires typés maison.
- **Résultat des clarifications** : icônes → **conserver `@lucide/svelte`**
  (aucune installation) ; i18n → **installer `svelte-i18n` et migrer
  maintenant** (décision client du 2026-11-18, qui tranche Q-2026-11-09-01)
- **Itérations** : 0 (nouveau périmètre, les compteurs de correction repartent)
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`
- **Prochaine étape** : mise à jour du plan par l'`architecte`, audit de
  `svelte-i18n` par le `mainteneur`, puis nouveau point de contrôle n°1

## Phase : Architecture — intégration de `svelte-i18n` (interrompue)

- **Action** : Appel à `architecte` pour intégrer `svelte-i18n` (étapes 52/53) et
  consigner la clarification `lucide-svelte`
- **Résultat** : **Travail écrit mais non rapporté.** Les livrables sont bien sur
  disque (`PLAN.md` révision 3ᵉ passe du 2026-11-18 : §0, §2.1, §2.2, §2.3.1,
  étapes 52 et 53, §3.1, §4, §6, §8, annexe A ; `docs/questions.md` :
  Q-2026-11-09-01 tranchée + D-2026-11-18-08 sur les icônes). L'agent a ensuite
  échoué sur la limite d'usage du fournisseur (**erreur technique**, pas un refus
  de mission) avant de rendre son rapport final.
- **Écart constaté par le Chef** : §7.2 (ligne 459) liste encore `svelte-i18n`
  comme « En attente de Q-2026-11-09-01 » et §7.3 ne le contient pas — le tableau
  des packages est donc incohérent avec §0 et avec les étapes 52/53. À corriger
  avant l'audit du mainteneur.
- **Itérations** : 0 (mission non aboutie)
- **Fichiers modifiés** : `equipe/PLAN.md`, `docs/questions.md` (par l'architecte)
- **Prochaine étape** : reprise de l'`architecte` sur le seul écart §7.2/§7.3,
  puis audit `svelte-i18n` par le `mainteneur`

## Point de contrôle 1 : VALIDÉ par le client (2026-11-19)

- **Action** : Le client a donné son « OK final » sur le plan, le contrat API et
  le tableau des versions complété (incluant `svelte-i18n`)
- **Résultat** : **VALIDÉ** — passage à la phase 3 (installation des dépendances)
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`
- **Prochaine étape** : `mainteneur` — étapes 50, 51 et installation de l'étape 52
  (audit puis ajout de `svelte-i18n`), aucune modification de code métier

## Phase 3 : Installation des dépendances validées — TERMINÉE

- **Action** : Appel à `mainteneur` (étapes 50, 51 et installation de l'étape 52)
- **Résultat** : **Succès, aucun échec bloquant.** `drizzle-orm` **0.45.4**,
  `drizzle-kit` **0.31.11**, `better-auth` resserré à `~1.7.18`,
  `@better-auth/infra` retiré (−3 paquets), `image-size` **2.1.0** exact,
  `svelte-i18n` **4.0.1** exact (peer `svelte ^5` explicite, runtime
  `dist/runtime.js` sans `node:`/`fs`/`Buffer`, 18,3 Ko / 4,6 Ko gzip).
  Contrôles : `check` 0 erreur / 20 avertissements, `build` OK, `test`
  **signature préexistante inchangée** (3 suites vides + Playwright absent),
  `pnpm install --frozen-lockfile` OK (CI sûre). Diff du verrou contrôlé par
  contenu et attribué : 6 retraits, 58 ajouts, réécritures de peers seulement.
- **Itérations** : 1 (3 paliers)
- **Fichiers modifiés** : `package.json`, `pnpm-lock.yaml`,
  `docs/mises-a-jour.md`
- **Points reportés** : `package-lock.json` obsolète toujours présent (suppression
  autorisée par le Chef, à exécuter) ; entrée de `docs/journal.md` non écrite
  (permissions) ; `npm run test` inutilisable comme garde-fou jusqu'aux étapes 45
  et à `npx playwright install`.
- **Prochaine étape** : phase 4 — `dev-backend`, lot A (adaptation étape 50,
  relecture étape 51, étape 36, étape 40)

## Phase 4 : Développement Backend — lot A (en cours)

- **Action** : Appel à `dev-backend`
- **Résultat** : **Partiel, 2 blocages de permissions.** Livrés : étape 50 vérifiée
  sans modification (génération d'essai sur copie → `No schema changes`,
  SHA-256 identiques, `drizzle/` réel intact), étape 51 relue (`ssr.noExternal`
  inchangé, 4 entrées), étape 36 appliquée côté commandes serveur
  (`requireChefEventVisibility` sur create/update/cancel/reactivate), logique
  complète de `src/lib/server/files.ts` + `blobs.ts` (taille remontée, aucune URL
  signée). `check` 0 erreur / 20 avertissements, `build` OK.
  Bloqués : `src/routes/api/files/[...key]/+server.ts` (3 lignes de délégation) et
  `tests/guards.test.ts` — hors périmètre d'écriture de l'agent.
- **Itérations** : 1
- **Fichiers modifiés** : `src/lib/server/member/commands.ts`,
  `src/lib/server/files.ts` (nouveau), `src/lib/server/blobs.ts`
- **Prochaine étape** : reprise du lot A après correction des permissions

## Incident d'orchestration : périmètre d'écriture du backend

- **Cause** : la matrice `edit` de `dev-backend` autorisait `src/lib/server/**`
  mais ni `src/routes/**/+server.ts` (alors que sa mission le cite
  explicitement), ni `tests/**` (que le plan lui confie aux étapes 36 et 45).
  Aucun agent ne pouvait donc écrire l'endpoint de l'étape 40 : trou de
  configuration, pas refus de mission.
- **Correctif** : ajout de `"src/routes/**/+server.ts": allow` et
  `"tests/**": allow` dans `dev-backend.md`. `src/lib/member/permissions.ts`
  reste au frontend (territoire `src/lib/**` hors `server`).
- **Fichiers modifiés** : `.opencode/agents/dev-backend.md`
- **Prochaine étape** : reprise du lot A (endpoint + preuve automatique de l'étape
  36)

## Phase 4 : Développement Backend — lot A TERMINÉ

- **Action** : Reprise de `dev-backend` après correction des permissions
- **Résultat** : **Lot A complet.** `GET /api/files/[...key]` branché (3 lignes de
  délégation, logique dans `files.ts`, endpoint présent dans le bundle) ;
  `tests/guards.test.ts` rempli — **16 cas** exécutant la vraie commande
  `runMemberCommand` sur une transaction factice évaluant réellement les `where`
  drizzle (create/update, chef vs secrétaire vs admin, élargissement de
  visibilité, changement de pupitre). `check` 0 erreur / 20 avertissements,
  `build` OK, `npx vitest run tests/guards.test.ts` → 16/16. Suite globale :
  56 tests passants, seules les 2 suites vides restantes échouent (étapes 45,
  52/53).
- **Itérations** : 2
- **Fichiers modifiés** : `src/routes/api/files/[...key]/+server.ts`,
  `tests/guards.test.ts`
- **Prochaine étape** : lot B (étapes 41 et 42 — téléversements réels et quota)

## Phase 4 : Développement Backend — lot B (en cours)

- **Action** : Appel à `dev-backend` (étapes 41 et 42)
- **Résultat** : en attente
- **Itérations** : 0
- **Fichiers modifiés** : attendus
  `src/routes/api/member/upload/+server.ts` (nouveau),
  `src/lib/server/storage.ts`, `src/lib/server/member/commands.ts`
