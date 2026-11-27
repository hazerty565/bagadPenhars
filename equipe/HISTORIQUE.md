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
  `equipe/CONTRAT_API.md`, `docs/journal.md`, `docs/questions.md`, `docs/roadmap.md`
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

## Décision client du 2026-11-20 : `svelte-i18n` abandonné

- **Action** : Le client indique « svelte-i18n il ne faut pas y toucher » et
  demande de suivre le travail du `mainteneur` pour la prochaine étape du
  `dev-backend`
- **Résultat** : La migration i18n est **annulée** — les dictionnaires typés
  maison restent la référence. Les étapes **52 et 53** doivent être retirées du
  plan et Q-2026-11-09-01 repassée en « dictionnaires typés retenus ». L'écart
  §7.2 (ligne 459) devient sans objet côté `svelte-i18n`, mais le retrait propre
  des étapes et des renvois reste à faire par l'`architecte`.
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`
- **Prochaine étape** : audit backend en lecture seule (migrations, RLS, rôle
  `bagad_app`, parcours d'invitation, événements, trombinoscope, réponses), puis
  plan validé, puis validation des corrections RLS par l'agent `securite`

## Phase : Audit backend RLS (lecture seule)

- **Action** : Appel à `dev-backend` — audit en lecture seule, aucune écriture
- **Résultat** : Rapport rendu. Environnement confirmé : branche Neon `test`,
  6 migrations, 29 tables, `bagad_app` sans `SUPERUSER`/`BYPASSRLS` ni rôle
  parent ; contexte `app.profile_id` bien local à la transaction et non falsifiable.
  **10 problèmes confirmés** (C1-C10) dont 4 impacts métier réels sur les
  événements : branche créateur dans `app.can_manage_event`, `events_insert`
  sans contrainte de visibilité, élargissement à un 2ᵉ pupitre via
  `event_pupitres_insert`, `events_update` sans borne sur la nouvelle ligne ;
  plus `can_view_presence` qui ouvre les présences nominatives d'un multi-pupitres
  à un chef non gestionnaire, `app.member_directory` sans poste au bureau mais
  exposant `is_chef`, tables Better Auth hors RLS, `GRANT DELETE` sans politique,
  et 3 noms de contexte RLS divergents dans la doc. **10 problèmes potentiels**
  (P1-P10) dont l'invitation en connexion propriétaire, la consommation non
  atomique du jeton, et les fonctions de quota R2 annoncées mais absentes.
  Aucune modification effectuée. 9 arbitrages client proposés (Q-A1 à Q-A9).
- **Itérations** : 0
- **Fichiers modifiés** : aucun
- **Prochaine étape** : arbitrages client, puis plan RLS par l'`architecte`
  (avec retrait des étapes `svelte-i18n`), puis développement backend

## Phase : Arbitrages client sur l'audit RLS

- **Action** : 6 questions regroupant les 9 arbitrages proposés (Q-A1 à Q-A9)
- **Résultat** : Décisions obtenues —
  **Q-A1/Q-A2** : suppression de la branche `created_by` dans
  `app.can_manage_event` ; le droit découle du pupitre, jamais du créateur ;
  création atomique via `app.create_event(..., p_pupitre_ids uuid[])`
  (`SECURITY DEFINER`, `search_path` fixé, `REVOKE PUBLIC`, `GRANT EXECUTE` à
  `bagad_app`) ; **un chef ne crée que des événements `interne`, pour un seul de
  ses pupitres** ; la visibilité `interne` est aussi imposée à l'UPDATE ;
  `events_delete` reste hors décision de la Q-A4 ; `can_view_event` non modifié ;
  les 4 événements `pupitre` créés par des chefs sont conservés et leur cas est
  consigné en question ouverte.
  **Q-A3** : présences nominatives d'un chef limitées aux événements
  **mono-pupitre de son pupitre** ; multi-pupitres et sans pupitre réservés à la
  secrétaire et à l'admin ; correction en base **et** côté backend ; contrat
  §12.2 à aligner.
  **Q-A4** : le chef **peut supprimer** les événements mono-pupitre de son
  pupitre ; multi-pupitres et global réservés à la secrétaire et à l'admin.
  **Q-A6** : accès global de `bagad_app` aux tables Better Auth **accepté et
  documenté** (conditions : connexion serveur uniquement, jamais de jeton renvoyé
  au navigateur) ; **pas** de rôle `bagad_auth`.
  **Q-A7** : `0006_rls_hardening` **puis** `0007_storage_quota_functions`.
  **Q-A5** : retirer `is_chef` de `app.member_directory`.
  **Q-A8** : supprimer `playing_with_neon` par migration.
  **Q-A9** : `app.profile_id` partout ; corriger `AGENTS.md` et
  `docs/database.md`.
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`
- **Prochaine étape** : plan RLS par l'`architecte`, puis validation client
  (aucune modification avant)

## Phase : Architecture — plan RLS et retrait de `svelte-i18n`

- **Action** : Appel à `architecte` (2 chantiers : retrait i18n, plan RLS)
- **Résultat** : Livré — `svelte-i18n` retiré (étapes 52/53 supprimées, renvois
  nettoyés, Q-2026-11-09-01 repassée en « dictionnaires typés conservés »).
  Plan porté à **57 étapes** ; les étapes **52 à 57** couvrent le durcissement
  RLS : 52 = `0006` lot événements (C1-C4, Q-A1/A2/A4, `app.create_event`,
  visibilité `interne` imposée à l'INSERT et à l'UPDATE), 53 = `0006` lot
  présences/annuaire/hygiène (C5, C6, C8, P8), 54 = application sur Neon `test`
  - matrice SQL par rôle, 55 = alignement backend (`commands.ts`,
    `permissions.ts`, `snapshot.ts`), 56 = `0007_storage_quota_functions`,
    57 = matrice de tests par rôle et revue croisée. `CONTRAT_API.md` : aucun
    endpoint modifié, §11/§12.1/§12.2/§12.3/§12.4 réalignés + §12.8. 5 questions
    ouvertes consignées (événements `pupitre` existants, `can_view_event`,
    chef multi-pupitres, suppression à venir, correction documentaire).
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/PLAN.md`, `equipe/CONTRAT_API.md`,
  `docs/questions.md`
- **Prochaine étape** : **validation client du plan** (aucune modification de
  code ou de base avant)

## Phase : Vague 0, audit Sécurité et application de `0006`/`0007` sur `test`

- **Action** : `mainteneur` (vague 0), `dev-backend` (0006), `securite` (audit
  puis re-vérification), application en base, matrice par rôle
- **Résultat** : Vague 0 **déjà faite** (50/51 appliquées le 2026-11-19) ;
  `package-lock.json` supprimé, génération d'essai nulle, `0000`-`0005` intactes.
  `check` rouge sur `storage.ts:174` corrigé par le backend.
  `0006_rls_hardening` écrit puis corrigé sur deux constats de la Sécurité
  (E01 : rôle dans `can_view_presence` ; M02 : `location` dans
  `create_event`) — verdict **VALIDÉ SOUS CONDITIONS**, puis **48/48** à la
  matrice. **Défaut réel trouvé par la matrice** : `events_delete` utilisait un
  `id` non qualifié qui se résolvait sur `event_pupitres.id` → un chef obtenait
  `0 ligne` en supprimant son événement ; corrigé par
  **`0007_events_delete_policy_fix`** (réutilise `app.can_manage_event`).
  Appliqué sur Neon **`test`** uniquement : **8 migrations**. `production`
  jamais contactée. Décisions client : cascade `event_responses` conservée ;
  `svelte-i18n` conservé installé (non câblé) ; feu vert `test` donné.
- **Itérations** : 1 (reprise Sécurité) + 1 (correction du défaut de politique)
- **Fichiers modifiés** : `drizzle/0006_rls_hardening.sql`,
  `drizzle/0007_events_delete_policy_fix.sql`, `drizzle/meta/_journal.json`,
  `src/lib/server/storage.ts`, `docs/database.md`, `docs/questions.md`,
  `docs/mises-a-jour.md`, `docs/journal.md`, `equipe/SECURITE.md`,
  `package-lock.json` (supprimé)
- **Prochaine étape** : étape 55 (alignement du code) puis 56
  (`0008_storage_quota_functions`) et 57 (matrice automatisée)

## Phase : Reprise d'état (Phase 0) — session 2026-11-23

- **Action** : Lecture de `equipe/HISTORIQUE.md`, `docs/journal.md`,
  `docs/questions.md`, `equipe/PLAN.md` (étapes 55 à 57), état `git` et
  vérification en lecture seule des fichiers concernés
- **Résultat** : Projet en cours, arbre de travail propre sur la branche `dev`.
  - **Étape 55 : DÉJÀ IMPLÉMENTÉE** (commit `9b29982`) — `commands.ts` crée via
    `app.create_event` pour tous les rôles, `permissions.ts` applique
    `pupitreIds.length === 1 && isChefOf(...)`, `snapshot.ts` ne dérive plus
    `isChef`, `storage.ts` renvoie déjà à `0008_storage_quota_functions`.
    Aucune reprise à faire, seulement vérification.
  - **Étape 56 : NON FAITE** — aucune migration `0008` dans `drizzle/`
    (seulement `0000` à `0007`). Les trois fonctions `app.*_storage_*` appelées
    par `src/lib/server/storage.ts` n'existent pas en base.
  - **Étape 57 : PARTIELLE** — `tests/guards.test.ts` est écrit (565 lignes),
    `tests/rls.test.ts` est absent, `tests/i18n.test.ts` et
    `tests/invitation.test.ts` sont vides (0 octet) : `npm run test` est rouge.
- **Blocage d'orchestration identifié** : aucun agent n'a de droit d'écriture
  sur `tests/**` (`dev-backend` l'exclut, `testeur` n'écrit que
  `equipe/TESTS.md`). La matrice automatisée de l'étape 57 nécessitera un
  arbitrage client (extension de permission ou prise en charge par le testeur
  dans `equipe/TESTS.md`).
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`
- **Prochaine étape** : `dev-backend` pour l'étape 56 (migration `0008`), puis
  arbitrage client sur `tests/**` avant l'étape 57

## Phase : Étape 56 — `0008_storage_quota_functions`

- **Action** : Appel à `dev-backend` (étape 56 + vérification en lecture de
  l'étape 55)
- **Résultat** : **LIVRÉE ET APPLIQUÉE sur Neon `test` uniquement**.
  `drizzle/0008_storage_quota_functions.sql` crée `reserve_storage_bytes`,
  `finalize_storage_upload` (**3 arguments** : réservé, réel, bucket — la
  signature réelle du code, le plan en annonçait 2) et `release_storage_bytes`,
  `SECURITY DEFINER`, `search_path` fixé, `REVOKE PUBLIC`, `GRANT bagad_app`,
  retour `TABLE(ok, pub, priv, res, quota, alert_at, block_at)`. Preuves SQL
  P1-T8 fournies (seuil, réservation disparue, bucket invalide, compteur absent,
  libération bornée). `0006`/`0007` intactes ; `production` jamais contactée ;
  9 migrations enregistrées. `npm run check` 0 erreur, `npm run build` OK.
- **Écart signalé sur l'étape 55** : `src/lib/server/member/snapshot.ts:155`,
  `:164`, `:210` transmettent `isChef` réel dans `profiles[]` pour la branche
  **secrétaire/admin**, alors que le livrable 3 de l'étape 55 / Q-A5 demandent
  qu'aucun `isChef` ne soit transmis. Le retrait casserait l'écran
  d'administration des pupitres : **arbitrage client requis au point de
  contrôle 2** (exception limitée aux rôles habilités, ou endpoint dédié).
- **Itérations** : 0
- **Fichiers modifiés** : `drizzle/0008_storage_quota_functions.sql`,
  `drizzle/meta/_journal.json`, `equipe/HISTORIQUE.md`
- **Prochaine étape** : `integrateur` (assemblage final, build, `equipe/INTEGRATION.md`)

## Phase : Reprise — Frontend étape 55 (échec agent → revue manuelle)

- **Action** : Agent `dev-frontend` non terminé — limite d'utilisation OpenCode atteinte.
  Revue manuelle des fichiers `src/lib/member/pages/*` effectuée à la place.
- **Résultat** : **Aucune modification requise** — le code est conforme au contrat §12.3.
  Preuves :
  - `MembersPage.svelte:198` : commentaire de contrat `<!-- Contrat §12.3 : `isChef` n'apparaît jamais dans le trombinoscope. -->`. Aucune affichage `isChef` dans le rendu trombinoscope.
  - `ProfilePage.svelte:243` : affichage `pupitre.isChef ? ' à chef' : ''` dans le **propre profil** du membre connecté — autorisé par contrat §11 (`getProfileWithPupitres` inclut `isChef`).
  - `OverviewPage.svelte:40` : `chefPupitres` filtré derrière `canSeePupitreSection(actor)` — écran admin uniquement.
  - `DocumentsPage.svelte:22,63` : utilise `isChefOf()` helper — correct.
  - `AdminMembersPage.svelte:84,92,274,349` : utilise `isChef` — attendu pour les rôles secrétaire/admin.
  - `tests/i18n.test.ts`, `tests/invitation.test.ts` : vides (0 octet) — non liés à cet examen.
- **Écartsignalé par le backend** : en réalité comportement attendu — `isChef` masqué `false` pour les autres membres (snapshot:103), valeur réelle seulement pour le membre connecté (snapshot:177, §11). Aucun bug UI.
- **Itérations** : 0 (reprise lecture manuelle)
- **Fichiers modifiés** : aucun (agent non abouti à cause limite système)
- **Prochaine étape** : `integrateur`

## Phase : Intégration (Phase 6) — session 2026-11-23

- **Action** : Appel à `integrateur` (vérification build/check, assemblage Backend→Frontend, production `equipe/INTEGRATION.md`)
- **Résultat** : **INTÉGRATION SATISFAISANTE**.
  `npm run build` ✅ OK (19,27 s), `npm run check` ✅ OK (0 erreur, 20 avertissements préexistants). assemblage Backend→Frontend conforme, trombinoscope §12.3 respecté, étape 55 vérifiée, étape 56 appliquée sur Neon `test`. Aucun bug nouveau.
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/INTEGRATION.md`, `equipe/HISTORIQUE.md`
- **Prochaine étape** : `tech-lead` (Phase 7 — Revue technique)

## Phase : Lancement de l'équipe — échec de l'agent `architecte`

- **Action** : Appel à `architecte` pour revoir et confirmer `equipe/PLAN.md`
  et `equipe/CONTRAT_API.md` avant le point de contrôle 1.
- **Résultat** : **ÉCHEC technique**. L'agent n'a pas pu s'exécuter à deux
  reprises (sessions `ses_df7c3a336ffei513ksm2jVbEKc` et
  `ses_df7c35d2effetNtLhVx2KITJRt`) avec l'erreur du fournisseur :
  `Model unavailable: nvidia/nemotron-3-super-120b-a12b`. Ce n'est pas un refus
  de mission, mais une indisponibilité du modèle d'exécution.
- **Conformité `chef.md` §5** : le workflow est **arrêté**. Aucun agent n'est
  remplacé et aucune étape n'est contournée.
- **Itérations** : 3 tentatives d'appel, toutes trois en échec (ajout de la session `ses_df7b6da34ffekMiCBQ5eN0GSNB`).
- **Fichiers modifiés** : aucun.
- **Prochaine étape** : attendre la disponibilité du fournisseur ou une
  décision du client avant de reprendre l'appel à l'`architecte`.

## Phase : Reprise d'état (Phase 0) — session 2026-11-25

- **Action** : Lecture de `AGENTS.md`, `docs/brief.md`, `docs/journal.md`,
  `docs/questions.md`, `equipe/HISTORIQUE.md`, `equipe/REVUE.md`,
  `equipe/INTEGRATION.md`, `equipe/SECURITE.md`, `equipe/TESTS.md` et
  inspection de `src/lib/server/member/`, `src/routes/dashboard/`
- **Résultat** : Projet en cours. Dernier état validé : Intégration
  **SATISFAISANTE** et Revue technique **VALIDÉ** (2026-11-23). Point de
  contrôle 2 **non franchi** : la phase Tests (testeur) n'est pas lancée.
  Migrations `0000`–`0008` appliquées sur Neon `test` uniquement ;
  `production` jamais contactée.
- **Nouveau besoin client** : refonte de l'espace membre privé pour la
  performance — lectures serveur ciblées par page (agenda, documents, profils),
  réponses limitées aux champs requis, en conservant les guards serveur, la
  transaction avec `app.profile_id` et le RLS.
- **Clarifications client obtenues** (2026-11-25) : (1) périmètre = **tout l'espace privé**
  (membre, chef de pupitre, admin) ; (2) **UI inchangée** — seul le chargement
  des données évolue ; (3) **suppression complète** de `buildMemberSnapshot` et
  des réponses renvoyant l'instantané complet (`/api/member`, retours de
  mutation) au profit de lectures ciblées.
- **Décisions Chef (2026-11-25)** :
  - Q-2026-11-25-01 : `isChef` conservé projection actuelle, exposé uniquement
    dans `getPupitrePage` et `listAdminMembersPage`, jamais dans l'annuaire,
    l'agenda, le détail d'événement ou les notifications.
  - Q-2026-11-25-02 : droits d'écriture `tests/**` attribués au Testeur
    conformément `equipe/TESTS.md`, relecture Backend.
  - Q-2026-11-25-03 : tests `i18n` et `invitation` intégrés aux étapes 45/57
    après l'étape 73, hors chantier « chargement ciblé » 58-73.
- **Itérations** : 0
- **Fichiers modifiés** : `equipe/HISTORIQUE.md`, `docs/questions.md`,
  `equipe/PLAN.md`, `equipe/CONTRAT_API.md`
- **Prochaine étape** : point de contrôle 2 — présentation au client avec
  état actuel (plan + contrat mis à jour §10/§7.11/§7.12, questions résolues),
  puis lancement selon arbitrage client.

## Phase : Développement — chargement ciblé de l'espace privé (étapes 58 à 72)

- **Action** : Exécution des étapes 58 à 72 du chantier « chargement ciblé »
  (plan §10, contrat §3.1/§7.11/§7.12/§11.1) — remplacement de
  `buildMemberSnapshot` par des lectures serveur ciblées par page.
- **Résultat** : Toutes les étapes 58 à 72 impliquées et compilent (0 erreur
  `pnpm run check`, 19 warnings préexistants uniquement).
  - **Étape 58 (B1)** : `queries/common.ts` (requireAuth, requireRole, runQuery),
    `queries/shell.ts` (getMemberShell → MemberProfile), types DTO dans
    `types.ts` (SessionProfile, MemberShell, MemberPageEnvelope, PageSection,
    MemberEventPageItem, AgendaPageData, EventDetailPageData, EventFormPageData,
    EventPageContext, DirectoryProfile).
  - **Étape 59 (B2)** : `queries/agenda.ts` (listAgendaEvents), `queries/events.ts`
    (getEventDetail, getEventForEdit, getPageContext).
  - **Étape 60 (B3)** : `queries/errors.ts` (MemberQueryError),
    `queries/directory.ts` (listDirectoryProfiles), `queries/pupitre.ts`
    (getPupitrePage).
  - **Étape 61 (B4)** : `queries/documents.ts` (listDocumentsPage),
    `queries/notifications.ts` (listNotificationsPage).
  - **Étape 62 (B5)** : `queries/articles.ts`, `queries/media.ts`,
    `queries/invitations.ts`, `queries/settings.ts`, `queries/adminMembers.ts`,
    `queries/adminOverview.ts` — alignés sur le contrat §3.1.
  - **Étape 63 (B6)** : `queries/profile.ts` (getProfilePage),
    `queries/context.ts` (getPageContext avec minRole).
  - **Étape 64 (F2)** : `store.svelte.ts` (MemberStore par sections,
    applyShell/applyPage/clearPage, invalidateAll après mutation), réduction du
    `+layout.server.ts` au socle (`getMemberShell` uniquement).
  - **Étape 64b (F2b)** : `+layout.svelte` migré sur `memberShell`
    (applyShell, clearPage sur navigation).
  - **Étape 65 (F3)** : 6 routes dashboard/agenda adaptées (`+page.server.ts`),
    `queries/overview.ts` créé.
  - **Étape 66 (F4)** : 6 routes pupitre/documents/membres adaptées.
  - **Étape 67 (F5)** : 3 routes notifications/profil/securite adaptées.
  - **Étape 68 (F6)** : 7 routes administration adaptées.
  - **Étape 69 (F7)** : `GET /api/member` supprimé, `POST /api/member/action`
    retourne `{ success, data }` sans snapshot, `runMemberCommand` sans
    snapshot, `grep` → 0 occurrence.
  - **Étape 72 (B7)** : `snapshot.ts` supprimé, interface `MemberSnapshot`
    retirée de `types.ts`, `README.md` nettoyé, `grep` → 0 occurrence.
- **Écarts corrigés** : `applyPage()` connecté dans 19 pages `+page.svelte`,
  `invalidateAll()` ajouté dans `store.svelte.ts`, conflits de nommage
  résolus dans `queries/{directory,documents,invitations,media}.ts`,
  alignement `articles.ts`/`media.ts`/`profile.ts`/`context.ts` sur le contrat.
- **Itérations** : 0
- **Fichiers modifiés** : `src/lib/member/types.ts`, `src/lib/member/store.svelte.ts`,
  `src/lib/member/README.md`, `src/routes/dashboard/+layout.server.ts`,
  `src/routes/dashboard/+layout.svelte`, `src/routes/api/member/+server.ts` (supprimé),
  `src/routes/api/member/action/+server.ts`, 19 fichiers `+page.svelte` sous
  `src/routes/dashboard/`, 10 fichiers de requêtes créés dans
  `src/lib/server/member/queries/`.
- **Prochaine étape** : `testeur` — étape 73 (`tests/member-queries.test.ts`),
  puis intégrateur (build final), tech-lead (revue), sécurité, pentest,
  déployeur.
