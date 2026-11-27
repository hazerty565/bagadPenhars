# Audit de sécurité

> **Rapport de référence courant : audit statique du durcissement RLS `0006`.**
> L'audit de sécurité initial (12 novembre 2026, code applicatif) reste consultable dans `equipe/AUDIT-DEMO.md`, qui en est la version de référence ; la précédente version de ce fichier est conservée dans l'historique Git. Ses constats d'origine (SEC-M01 à SEC-I04) ne sont ni réévalués ni levés ici : **le présent audit ne porte que sur `drizzle/0006_rls_hardening.sql`**.
>
> **⚠️ Ce rapport a été re-vérifié le 2026-11-21 après corrections.** Les sections 4 à 9 décrivent l'état **avant** correction et sont conservées pour la traçabilité ; **le §10 (addendum) fait foi** pour SEC-RLS-E01, M02, F01 et F03, et porte le **verdict final** en dernière ligne du fichier.

---

## 0. Périmètre, méthode et déclarations

### 0.1 Ce qui a été audité

- Objet de l'audit : `drizzle/0006_rls_hardening.sql` (**420 lignes, relues intégralement**), **avant toute application en base**.
- État antérieur, pour ne pas le contredire à l'aveugle : `drizzle/0002_rls_policies.sql`, `drizzle/0003_auth_profile_lookup.sql`, `drizzle/0005_bureau_title.sql`, `drizzle/0000_handy_alex_wilder.sql` (schéma, clés étrangères), `drizzle/0001_backend_member_model.sql`, `drizzle/meta/_journal.json`.
- Contrat et plan : `equipe/CONTRAT_API.md` §12.1, §12.2, §12.3, §12.4, §12.8, §13 ; `equipe/PLAN.md` étapes 36, 52, 53, 54, 55, 56, 57, §4 (règles RLS), §9 (audit du 2026-11-20, Q-A1 à Q-A9, matrice §9.5, questions ouvertes §9.7).
- Code pour vérifier la cohérence base ↔ serveur : `src/lib/server/member/commands.ts`, `src/lib/member/permissions.ts`, `src/lib/server/member/snapshot.ts`, `src/lib/db/index.ts`.
- Doctrine : `docs/database.md` §2 (défense en profondeur) et §6 (matrice de droits), `AGENTS.md` §2.

### 0.2 Méthode

**Audit statique intégral.** Aucun client PostgreSQL n'est disponible localement et la mission interdit toute connexion : **le SQL n'a pas été exécuté**, aucune policy n'a été observée en fonctionnement, aucun trigger n'a été déclenché. Les conclusions portent sur la lecture ligne à ligne du SQL et sur la comparaison avec l'état `0000`–`0005` et avec le code.

### 0.3 Déclarations explicites

> **Aucune modification de code n'a été faite. Aucune migration n'a été appliquée. La base Neon `test` n'a reçu aucune écriture. `production` n'a jamais été contactée. `0000` à `0005` sont intactes.** Le seul fichier écrit par cet audit est `equipe/SECURITE.md`.

### 0.4 Limites de l'audit

L'absence de faille détectée ne signifie pas que l'application est invulnérable. Cet audit ne remplace ni la revue technique du Tech Lead, ni les tests fonctionnels, ni la matrice SQL par rôle de l'étape 54. Les points non prouvables sans exécution sont listés au §6.

---

## 1. Informations générales

- **Date de l'audit** : 2026-11-21
- **Type d'audit** : initial sur ce périmètre (durcissement RLS `0006`), **avant application**
- **Auditeur** : agent Sécurité (audit indépendant, lecture seule)
- **Commit audité** : non spécifié (arbre de travail courant ; aucun `git` exécutable dans cet environnement)
- **Documents consultés** : voir §0.1

---

## 2. Résumé exécutif

La migration `0006` fait ce qu'elle annonce sur le cœur du sujet : la **branche `created_by` a bien disparu** de `app.can_manage_event` (ligne 47-68), l'insertion directe est fermée aux chefs (190-204), la mise à jour est bornée par `USING` + `WITH CHECK` + trigger (227-290), la suppression est bornée au mono-pupitre dirigé (296-318) et le cas C5 multi-pupitres est réellement fermé pour un **chef de pupitre** (327-350). Le durcissement `SECURITY DEFINER` de `app.create_event` est correct (search_path fixé, `REVOKE … FROM PUBLIC`, `GRANT` à `bagad_app`, aucun SQL dynamique, rôle relu depuis `profiles`).

Trois réserves empêchent une validation sans condition : **`app.can_view_presence` n'a pas de contrôle de rôle** — un profil `member` portant encore une ligne `is_chef` lit les présences nominatives (divergence code/base explicitement déclarée bloquante par le contrat §12.8) ; `app.create_event` **n'écrit pas `location`** alors que le schéma et les commandes l'exigent ; et l'**ordre 54 (base) → 55 (code)** laisse, en production, les chefs de pupitre sans création, modification ni annulation d'événement.

---

## 3. Statistiques (périmètre `0006`)

| Gravité          | Nombre |
| ---------------- | ------ |
| Critique         | 0      |
| Élevé (Majeure)  | 1      |
| Moyen (Modérée)  | 3      |
| Faible (Mineure) | 7      |
| Information      | 4      |
| **Total**        | **15** |

Correspondance des échelles : la mission de cet audit utilise Critique / Élevé / Moyen / Faible ; l'équivalence avec le barème du rapport est indiquée entre parenthèses.

---

## 4. Constats détaillés

### 4.1 Constats critiques

**Aucun.** Aucune compromission de masse, aucune exposition de secret, aucun contournement total des protections n'a été trouvé dans `0006`.

---

### 4.2 Constat élevé

---

#### SEC-RLS-E01 — `app.can_view_presence` ne vérifie pas le rôle : un `member` portant encore `is_chef = true` lit les présences nominatives

- **Gravité** : Élevé (Majeure)
- **Fichier** : `drizzle/0006_rls_hardening.sql`
- **Ligne / fonction** : 327-350 (`CREATE OR REPLACE FUNCTION app.can_view_presence`), consommée par 359-365 (`event_responses_select`)
- **Constat** : la fonction réécrite applique bien la borne « exactement un pupitre » (338-341) mais **ne teste jamais `app.current_role()`**. La branche chef est :
  `count(event_pupitres pour l'événement) = 1 AND EXISTS (… app.is_chef_of(ep.pupitre_id))`.
  Or `app.is_chef_of` (0002:108-122) ne lit que `profile_pupitres.is_chef` : il ne vérifie **ni le rôle `chef_pupitre`, ni `profiles.role`**.
  Comparer avec `app.can_manage_event` réécrite dans le **même fichier** (0006:54) qui, elle, exige `app.current_role() = 'chef_pupitre'`. La migration introduit donc une **asymétrie interne** entre deux fonctions qui appliquent la même règle métier.
- **Preuve** :
  - `0006:334-349` : `SELECT app.is_active() AND (app.is_role_at_least('secretaire') OR ((SELECT count(*) …) = 1 AND EXISTS (… app.is_chef_of(ep.pupitre_id))))` — aucune occurrence de `current_role()`.
  - `0002:115-121` : `app.is_chef_of` = `EXISTS (… pp.profile_id = app.current_profile_id() AND pp.pupitre_id = p_pupitre AND pp.is_chef = true)`.
  - `src/lib/member/permissions.ts:85-89` : le code, lui, refuse dès que `actor.role !== 'chef_pupitre'` → **divergence code / SQL**.
  - Population atteignable : `commands.ts:1017-1031` (`member.role`) change `profiles.role` **sans toucher `profile_pupitres`** ; `commands.ts:937-997` (`member.pupitres`) permet à une secrétaire de poser `is_chef = true` sur n'importe quel profil et n'exige un pupitre dirigé que si `role === 'chef_pupitre'` (974). Un chef rétrogradé en `member`, ou un membre marqué `is_chef`, conserve donc l'ouverture.
- **Scénario de risque** : un chef de pupitre est rétrogradé (ou un membre est marqué `is_chef` pour une raison d'organisation) ; `profile_pupitres.is_chef` reste vrai. Sur tout événement mono-pupitre de ce pupitre, `can_view_presence` renvoie vrai et `event_responses_select` (0006:362-364) lui livre **toute la liste nominative** (qui a répondu, présent/absent) des membres du pupitre. C'est exactement l'accès que Q-A3 réserve au « chef de pupitre ».
- **Impact** : lecture de données nominatives de présence par un compte qui n'a plus le rôle ; contraire à Q-A1 (« perdre le statut de chef fait perdre le droit »), à §12.2 et à §12.8 (« les policies RLS et les gardes serveur appliquent la même règle ; une divergence est un défaut bloquant »). Ce n'est **pas** une régression introduite par `0006` (0002 n'avait pas non plus le contrôle de rôle), mais `0006` réécrit la fonction pour fermer C5 et laisse ce trou.
- **Correction recommandée (non appliquée)** : dans la branche chef, ajouter `AND app.current_role() = 'chef_pupitre'` (une ligne, symétrique de `can_manage_event:54`), et couvrir la matrice par un test « membre avec `is_chef = true` → refusé » (voir T38, §6.3). À faire **avant** l'étape 54 : `0006` devient immuable dès sa première application (Q-A7, `docs/database.md` §2.3), sinon la correction exigera une migration `0008`.
- **Responsable pressenti** : Backend (SQL).

---

### 4.3 Constats moyens

---

#### SEC-RLS-M01 — Les commandes de `commands.ts` seront refusées par la nouvelle RLS : l'ordre 54 → 55 rend les chefs inopérants en production

- **Gravité** : Moyen (Modérée) — **ce n'est pas une faille, c'est la conséquence fonctionnelle d'un ordre d'application**
- **Fichier** : `drizzle/0006_rls_hardening.sql` (190-221, 227-241) confronté à `src/lib/server/member/commands.ts` (412-531)
- **Ligne / fonction** : `commands.ts:466-486` (delete puis insert de `event_pupitres`), `commands.ts:422-441` (insertion directe dans `events`), `0006:198-221`
- **Constat** : le backend signale que `event.update` supprime puis réinsère `event_pupitres`. C'est **confirmé** :
  - `event_pupitres_delete` (0006:216-221) est réservée à `is_role_at_least('secretaire')` ; un chef qui exécute `DELETE FROM event_pupitres WHERE event_id = …` ne voit aucune ligne supprimable → **0 ligne, sans erreur** (RLS `USING` filtre silencieusement) ;
  - `event_pupitres_insert` (0006:198-204) est réservée au même rôle → l'`INSERT` suivant lève **42501** et fait échouer toute la transaction.
  - `event.create` (commands.ts:422-434) insère **directement** dans `events` alors que `events_insert` (0006:190-196) est réservée à la secrétaire/l'admin → refus pour un chef (attendu, c'est l'objet de Q-A2, corrigé par l'étape 55).
  - De plus `event.cancel` / `event.reactivate` (commands.ts:490-516) font un `UPDATE events` : sur un événement existant en visibilité `pupitre` (les **4 événements de chefs** de la branche `test`), le `WITH CHECK` (0006:231-237) exige `visibility = 'interne'`, et le trigger (0006:277-280) **interdit** de changer la visibilité → **refus 42501** : un chef ne peut plus annuler ses propres événements `pupitre`. C'est la question ouverte §9.7 b, non tranchée.
- **Scénario / impact** : si `0006` est appliquée en production **avant** l'étape 55, tout chef de pupitre perd : création d'événement, modification (échec au milieu d'une transaction multi-ordres), annulation et réactivation. Le site reste « debout », mais la fonction première des chefs disparaît, sans erreur explicite côté UI pour le `DELETE` à 0 ligne.
- **Correction recommandée** : ne pas livrer 54 et 55 en production dans deux fenêtres distinctes. Sur `test`, l'ordre est sans danger (c'est même la seule façon de mesurer). Pour la production : appliquer `0006` et livrer le code aligné **dans la même fenêtre**, ou attendre que `commands.ts` appelle `app.create_event` et ne déplace plus le ciblage par delete/insert. Ne pas « corriger » la policy pour accommoder le code : §12.8 fait primer la règle, pas l'implémentation.
- **Responsable pressenti** : Backend (étape 55) + Chef (séquencement du déploiement).

---

#### SEC-RLS-M02 — `app.create_event` ne prend pas `location` : l'étape 55 perdra le lieu de l'événement

- **Gravité** : Moyen (Modérée) — perte de donnée fonctionnelle, pas faille d'accès
- **Fichier** : `drizzle/0006_rls_hardening.sql`
- **Ligne / fonction** : signature 78-86, `INSERT` 137-155
- **Constat** : la fonction accepte `(p_title, p_description, p_event_date, p_event_type, p_is_poll, p_visibility, p_pupitre_ids)` et n'écrit que ces colonnes. Or `events.location` est `varchar(200) NOT NULL DEFAULT ''` (0001:54) et `commands.ts:357` impose un lieu de 2 à 200 caractères, exposé par `MemberEvent.location` (types) et par `snapshot.ts:275`.
- **Scénario / impact** : dès que l'étape 55 fait passer `event.create` par la fonction (livrable 55.1 : « `event.create` appelle `app.create_event(...)` pour tous les rôles »), le lieu saisi est **silencieusement remplacé par la valeur par défaut `''`**. Aucune erreur, aucune trace : régression invisible en recette si le contrôle ne porte pas explicitement sur ce champ.
- **Correction recommandée** : ajouter `p_location text` à la signature (avec validation `length ≤ 200`), et adapter le `GRANT`/`REVOKE` (les signatures y sont répétées 167-184). À faire avant l'étape 54, pour la même raison d'immuabilité qu'en E01.
- **Responsable pressenti** : Backend (SQL + étape 55).

---

#### SEC-RLS-M03 — La suppression par un chef détruit définitivement les réponses de présence (cascade)

- **Gravité** : Moyen (Modérée) — **décision client requise**, l'auditeur ne tranche pas
- **Fichier** : `drizzle/0006_rls_hardening.sql` (296-318) + schéma `drizzle/0000_handy_alex_wilder.sql:269`
- **Ligne / fonction** : `events_delete` 297-318 ; FK `event_responses_event_id_events_id_fk … ON DELETE cascade`
- **Constat** : `0006` donne à un chef le droit de **supprimer** les événements mono-pupitre de son pupitre (Q-A4). La suppression d'un événement entraîne, par la clé étrangère en `ON DELETE cascade`, la suppression de **toutes** les lignes `event_responses` de cet événement (`0000:269`), et de ses lignes `event_pupitres` (`0000:267`). Aucun `cancelled_at`, aucune archive : la perte est **irréversible**. La cascade s'exécute avec les privilèges du propriétaire de la table référencée ; la policy `event_pupitres_delete` restreinte à la secrétaire (0006:216-221) ne s'y oppose donc pas — c'est bien ce que décrit le commentaire 209-214, et c'est cohérent.
- **Scénario / impact** : un chef supprime un événement de son pupitre : l'historique de présence (qui était présent, qui était absent) disparaît, alors que §12.2 ne prévoit la suppression des réponses **que** par anonymisation à la suppression de compte (`profile_id = NULL`), jamais par suppression d'événement. Le geste est à un clic, sans confirmation serveur au-delà de l'UI, et la secrétaire n'a aucun moyen de le constater après coup.
- **Correction recommandée (au choix du client, pas de l'auditeur)** : soit assumer la perte (documenter dans `docs/event.md`), soit la borner (interdire la suppression d'un événement passé, ou exiger un événement sans réponse, ou remplacer la suppression par `cancelled_at`). Une correction technique minimale, sans changer le schéma : ajouter dans `events_delete` un `AND NOT EXISTS (SELECT 1 FROM public.event_responses r WHERE r.event_id = id)`. Toute autre voie (FK `ON DELETE set null`, table d'archive) est un changement de schéma, hors du périmètre de `0006`.
- **Responsable pressenti** : Client (règle métier) puis Backend.

---

### 4.4 Constats faibles

---

#### SEC-RLS-F01 — `REVOKE DELETE ON public.invitations` est effectif, mais `invitation_pupitres` conserve `DELETE`

- **Gravité** : Faible (Mineure)
- **Fichier** : `drizzle/0006_rls_hardening.sql:417` ; `drizzle/0002_rls_policies.sql:481, 614-616`
- **Constat** : le `REVOKE` ferme bien le seul chemin de suppression d'invitation (aucune policy `DELETE` sur `invitations` n'existe — vérifié : `0002` ne définit que `invitations_select`, `_insert`, `_update`). Mais `bagad_app` garde `DELETE` sur `public.invitation_pupitres`, avec la policy `invitation_pupitres_delete` (secrétaire/admin). Un futur « annuler l'invitation » écrit en supprimant les lignes de ciblage continuerait donc de **réussir silencieusement**, en laissant une invitation sans pupitre. C6 n'est fermé qu'à moitié.
- **Correction recommandée** : `REVOKE DELETE ON public.invitation_pupitres FROM bagad_app;` et suppression de la policy correspondante (dans la mesure où aucun flux légitime ne l'utilise : `commands.ts` ne supprime jamais ces lignes).
- **Responsable pressenti** : Backend.

#### SEC-RLS-F02 — `app.create_event` accepte `visibility = 'pupitre'` sans aucun pupitre (secrétaire)

- **Gravité** : Faible
- **Fichier** : `0006:109-115` (branche secrétaire) comparé à `commands.ts:379-381`
- **Constat** : le code refuse `pupitre` sans ciblage ; la fonction ne le refuse pas. Résultat possible : un événement `pupitre` à 0 ligne `event_pupitres`, donc lisible par la seule secrétaire, l'admin et son créateur (`can_view_event`, 0002:194-199) — un « global déguisé » invisible pour tous.
- **Correction recommandée** : `IF p_visibility = 'pupitre' AND coalesce(array_length(v_pupitres,1),0) = 0 THEN RAISE … END IF;`
- **Responsable pressenti** : Backend.

#### SEC-RLS-F03 — Le trigger protège `created_by` mais pas `cancelled_by` : attribution d'annulation falsifiable

- **Gravité** : Faible
- **Fichier** : `0006:249-284`
- **Constat** : `guard_event_update_bounds` interdit à un non-secrétaire de modifier `created_by`, `is_poll` et `visibility`, mais laisse `cancelled_by` libre. Un chef peut donc annuler un événement de son pupitre en l'attribuant à un autre profil (`commands.ts:499` le renseigne correctement, mais la base ne l'impose pas), ou réattribuer une annulation existante.
- **Correction recommandée** : `IF NEW.cancelled_by IS DISTINCT FROM OLD.cancelled_by AND NEW.cancelled_by IS DISTINCT FROM app.current_profile_id() THEN RAISE …` (ou exiger `cancelled_by` = acteur).
- **Responsable pressenti** : Backend.

#### SEC-RLS-F04 — `events_insert` ne vérifie pas `created_by = app.current_profile_id()`

- **Gravité** : Faible
- **Fichier** : `0006:190-196`
- **Constat** : la policy `WITH CHECK` ne teste que `is_active()` et le rôle. Une secrétaire peut donc insérer un événement en l'attribuant à un autre profil. L'effet n'est pas neutre : `can_view_event` conserve la branche `created_by` (0002:193, maintenue volontairement — Q-A7 c), donc **attribuer `created_by` revient à accorder la lecture** d'un événement `pupitre` à ce tiers.
- **Correction recommandée** : `AND created_by = app.current_profile_id()` dans le `WITH CHECK` (la fonction `create_event` respecte déjà cette règle, 0006:153).
- **Responsable pressenti** : Backend.

#### SEC-RLS-F05 — Le court-circuit `session_user = 'neondb_owner'` est correct, mais rien ne garantit que le runtime n'est pas le propriétaire

- **Gravité** : Faible (condition d'exploitation)
- **Fichier** : `0006:259-261` ; `src/lib/db/index.ts:37-52`
- **Constat (partie vérifiée)** : le choix de `session_user` est **le bon**. À l'intérieur d'une fonction `SECURITY DEFINER`, `current_user` vaut toujours le propriétaire de la fonction ; seul `session_user` (le rôle réellement connecté) distingue une session applicative. `bagad_app` n'a aucun rôle parent (audit §9), et `SET ROLE` ne modifie pas `session_user` : `0006` **ne peut pas** être contourné depuis `bagad_app`. Le motif est identique à `app.guard_profile_sensitive_columns` (0002:420).
- **Résidu** : si `DATABASE_URL_APP` / l'URL Hyperdrive pointe un jour sur `neondb_owner` (erreur de configuration, réutilisation d'une chaîne d'administration, `dev` local), alors **le trigger se tait et, plus grave, le propriétaire contourne la RLS sur toutes les tables**. Aucun contrôle ne le détecte aujourd'hui ; `src/lib/db/index.ts` ne vérifie pas le rôle effectif.
- **Correction recommandée** : exiger dans la matrice de l'étape 54 une assertion `SELECT session_user, current_user` doit valoir `bagad_app` (T34), et envisager côté serveur un `RAISE`/refus de démarrage si ce n'est pas le cas.
- **Responsable pressenti** : Backend + Intégrateur (configuration Hyperdrive).

#### SEC-RLS-F06 — `profile_pupitres_select` ouvre `is_chef` à tout membre actif : Q-A5 n'est fermé qu'en façade

- **Gravité** : Faible
- **Fichier** : `drizzle/0002_rls_policies.sql:567-569` (non modifié par `0006`) ; `0006:387-393`
- **Constat** : `0006` retire bien `is_chef` du JSON de `app.member_directory` (387-393), mais la policy `profile_pupitres_select` autorise tout membre actif à lire **toutes** les lignes de `profile_pupitres`, `is_chef` compris. L'affirmation de §12.3 « `isChef` est strictement interne » n'est donc portée que par la vue et par le code, pas par la RLS. L'exploitation directe est exclue aujourd'hui (seul le serveur détient les identifiants base, risque Q-A6 accepté), mais toute nouvelle requête serveur ou tout cache mal placé réintroduirait la donnée.
- **Correction recommandée** : exposer `is_chef` à `bagad_app` uniquement via une fonction `SECURITY DEFINER` (`app.is_chef_of`), et restreindre `profile_pupitres_select` à `(pupitre_id, profile_id)` pour les membres — ou, a minima, documenter la limite. Hors périmètre strict de `0006` : à porter comme décision d'architecture.
- **Responsable pressenti** : Architecte puis Backend.

#### SEC-RLS-F07 — Aucun instantané `drizzle/meta/0006_snapshot.json`

- **Gravité** : Faible (risque d'outillage, pas de sécurité)
- **Fichier** : `drizzle/meta/_journal.json:47-53` (entrée `idx: 6` présente) ; `drizzle/meta/` ne contient que `0000` à `0004`
- **Constat** : la migration sera bien prise par `drizzle-kit migrate` (le journal la référence), mais l'instantané manque — `0005` est dans le même cas. L'étape 52 liste pourtant « et son instantané `drizzle/meta/` ». Un futur `drizzle-kit generate` pourrait produire un différentiel erroné et proposer de « recréer » des objets existants.
- **Correction recommandée** : générer les instantanés manquants **sur une copie** du dossier (règle §4 du plan), vérifier `git status drizzle/` ensuite.
- **Responsable pressenti** : Backend + mainteneur des dépendances.

---

### 4.5 Informations

#### SEC-RLS-I01 — Les agrégats de réponses ne sont pas fournis par la base

`snapshot.ts:279` lit `event_responses` (filtré par RLS) et expose ces lignes telles quelles ; `app.event_response_counts` (0002:242-254) n'est appelé nulle part. Avec `event_responses_select` (0006:359-365), un membre ne voit que **sa** ligne : tout décompte calculé côté client à partir de `responses` ne comptera que lui. §12.2 promet pourtant « sa propre réponse **et les agrégats** ». Ce n'est pas une fuite (le sens de l'erreur est sûr), mais l'étape 55 doit brancher `app.event_response_counts`. À ne pas confondre avec un défaut d'`0006`.

#### SEC-RLS-I02 — `0006` est rejouable (idempotence vérifiée statiquement)

`DROP POLICY IF EXISTS` avant chaque `CREATE POLICY` (190, 198, 215, 227, 296, 359), `CREATE OR REPLACE FUNCTION` (40, 78, 249, 327), `DROP TRIGGER IF EXISTS` (286), `DROP VIEW IF EXISTS` (376), `GRANT`/`REVOKE` idempotents, `DROP TABLE IF EXISTS` (420). Une seconde exécution sur `test` ne devrait pas échouer — ce qui ne dispense pas de la laisser appliquée **une fois** (étape 54).

#### SEC-RLS-I03 — Aucune écriture de données : les 16 événements de `test` restent intacts

Relecture des 420 lignes : la migration ne contient que du DDL (`CREATE`/`DROP`/`ALTER` implicite par `CREATE OR REPLACE`, `GRANT`/`REVOKE`). **Aucun `INSERT`, `UPDATE` ou `DELETE` de données** n'y figure. Le `DROP TABLE public.playing_with_neon` (420) est le seul retrait de données et porte sur une table résiduelle (Q-A8). L'affirmation du commentaire 28-30 est donc exacte.

#### SEC-RLS-I04 — Le badge « chef » du trombinoscope disparaîtra silencieusement

`0006:387-393` retire `is_chef` du JSON `pupitres` de la vue. `snapshot.ts:96` retombe alors sur `Boolean(undefined) = false`, et `MemberCard.svelte:34` / `MembersPage.svelte:200` affichent `${pupitre.isChef ? ' · chef' : ''}` : tous les badges disparaissent. C'est **conforme** à §12.3 (aucun `isChef` exposé), mais l'interface doit être alignée à l'étape 55/46 pour ne pas laisser un affichage trompeur.

---

## 5. Contrôles réalisés

| Contrôle                                                                                | Statut             | Résultat                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lecture intégrale de `0006` (420 lignes)                                                | Réalisé            | 15 constats (0 critique)                                                                                                                                                                                                                                         |
| Branche `created_by` retirée de `can_manage_event`                                      | Réalisé            | **Conforme** (0006:47-68 ; comparer 0002:160)                                                                                                                                                                                                                    |
| Durcissement `SECURITY DEFINER` de `create_event`                                       | Réalisé            | **Conforme** (search_path, REVOKE PUBLIC, GRANT ciblé, pas de SQL dynamique)                                                                                                                                                                                     |
| Rôle non fourni par le client (relu depuis `profiles`)                                  | Réalisé            | **Conforme** (`current_profile_id` 93, `current_role` 116, `is_role_at_least` 109)                                                                                                                                                                               |
| Bornes de création pour un chef (interne / 1 pupitre / dirigé)                          | Réalisé            | **Conforme** (118, 122, 126 ; doublons neutralisés 103-107)                                                                                                                                                                                                      |
| Atomicité événement + ciblage                                                           | Réalisé            | **Conforme** (une seule fonction, une seule transaction implicite)                                                                                                                                                                                               |
| Insertion directe fermée (C2/C3)                                                        | Réalisé            | **Conforme** (190-204)                                                                                                                                                                                                                                           |
| `USING` + `WITH CHECK` + trigger sans trou entre eux (C4)                               | Réalisé            | **Conforme** (227-290), avec la réserve M01 sur le code                                                                                                                                                                                                          |
| `session_user` = propriétaire : légitimité du court-circuit                             | Réalisé            | **Conforme** (`current_user` serait inopérant sous `SECURITY DEFINER`) ; condition d'exploitation F05                                                                                                                                                            |
| `events_delete` bornée au mono-pupitre dirigé, aucun droit au créateur                  | Réalisé            | **Conforme** (296-318) ; conséquence M03                                                                                                                                                                                                                         |
| Fermeture de C5 (chef sur multi-pupitres)                                               | Réalisé            | **Conforme pour un `chef_pupitre`** (338-341) ; **trou de rôle E01**                                                                                                                                                                                             |
| `event_responses_select` : propre ligne toujours, autres seulement via présence         | Réalisé            | **Conforme** (359-365)                                                                                                                                                                                                                                           |
| `member_directory` : plus d'`isChef`, `bureau_title` en fin, `security_invoker = false` | Réalisé            | **Conforme** (376-408)                                                                                                                                                                                                                                           |
| `member_directory` : aucune donnée personnelle supplémentaire                           | Réalisé            | **Conforme** (colonnes de §12.3 uniquement ; ni email, ni téléphone, ni adresse, ni date de naissance, ni statut de compte, ni `bureau_position_id`)                                                                                                             |
| `REVOKE DELETE ON invitations` effectif (aucune policy DELETE résiduelle)               | Réalisé            | **Conforme** (417 ; `0002` n'a pas de policy `DELETE` sur `invitations`) ; réserve F01 sur la table enfant                                                                                                                                                       |
| `DROP TABLE playing_with_neon` sans dépendance cachée                                   | **Non réalisable** | Dépendances invisibles hors base — cf. §6                                                                                                                                                                                                                        |
| Régressions de `GRANT` sur objets recréés                                               | Réalisé            | **Conforme** : `CREATE OR REPLACE` conserve les privilèges ; la vue recréée est re-`GRANT` (408) ; la fonction nouvelle est explicitement `GRANT` (176-184) car `GRANT EXECUTE ON ALL FUNCTIONS` (0002:507) est antérieur et ne couvre pas les fonctions futures |
| Policies oubliées / laissées ouvertes à `PUBLIC`                                        | Réalisé            | Aucune : toutes les policies de `0006` sont `TO bagad_app` ; aucune policy permissive §4.5 du script de secours n'est réintroduite                                                                                                                               |
| Fonctions `STABLE`/`VOLATILE`                                                           | Réalisé            | Correct : `can_manage_event` et `can_view_presence` en `STABLE` (lecture seule), `create_event` en `VOLATILE` par défaut (écriture)                                                                                                                              |
| `WITH CHECK` absent là où `USING` seul ne protège pas                                   | Réalisé            | Aucun cas dans `0006` (UPDATE : les deux présents ; INSERT : `WITH CHECK` présent ; DELETE : `USING` seul, correct)                                                                                                                                              |
| Cohérence code ↔ RLS                                                                    | Réalisé            | 3 écarts : M01 (delete/insert du ciblage, cancel), M02 (`location`), E01 (rôle des présences)                                                                                                                                                                    |
| `git status` / `git log` / SHA audité                                                   | Non réalisé        | Shell indisponible (`Permission denied: shell`) — arbre de travail courant                                                                                                                                                                                       |
| Exécution du SQL / test dynamique / base contactée                                      | Non réalisé        | Interdit par la mission et impossible sans client PostgreSQL                                                                                                                                                                                                     |

---

## 6. Ce qui ne peut pas être prouvé sans exécuter le SQL

### 6.1 Comportements non observables statiquement

1. **`42501` réellement levé** : je distingue par lecture les refus qui **lèvent** (violation de `WITH CHECK` en `UPDATE`, insert refusé) de ceux qui **filtrent silencieusement** (tout `USING` de `DELETE`/`SELECT`). Seule l'exécution le confirme, et le choix entre erreur et 0 ligne change le message que l'UI doit afficher.
2. **La cascade contourne-t-elle la RLS de l'enfant ?** Le comportement attendu (actions référentielles exécutées avec les privilèges du propriétaire) doit être **observé** : suppression d'un événement par un chef → `event_pupitres` et `event_responses` réellement supprimées, malgré `event_pupitres_delete` réservée à la secrétaire.
3. **Propriétaire de la vue et absence de `FORCE ROW LEVEL SECURITY`** sur la base vivante : `0006` repose sur `security_invoker = false` + propriétaire qui contourne la RLS. Aucun `FORCE ROW LEVEL SECURITY` n'apparaît dans `0000`–`0006`, mais l'état réel de la branche `test` doit être constaté (sinon `member_directory` renverrait 0 ligne et le trombinoscope serait vide).
4. **Dépendances de `app.member_directory`** : `DROP VIEW` sans `CASCADE` échouerait si un autre objet (vue, règle) en dépend sur la base réelle.
5. **Dépendances de `playing_with_neon`** : une FK ou une vue pointant dessus ferait échouer le `DROP TABLE`.
6. **Privilèges réels** : `has_function_privilege('bagad_app', 'app.create_event(text,text,date,public.event_type,boolean,public.event_visibility,uuid[])'::regprocedure, 'EXECUTE')`, et vérification qu'aucun autre rôle que `bagad_app`/propriétaire n'a `EXECUTE` sur `create_event`.
7. **`session_user` effectif du runtime** : dépend de l'URL Hyperdrive / `DATABASE_URL_APP`, invisible ici (F05).
8. **Idempotence réelle d'une seconde exécution** et enregistrement unique dans `drizzle.__drizzle_migrations`.
9. **Comportement du trigger face aux écritures concurrentes** (deux chefs, même événement) et verrouillage pris par `can_manage_event` (fonction `STABLE` lisant `event_pupitres` dans la même transaction).
10. **Volumétrie / plan d'exécution des sous-requêtes** de policy (chaque ligne testée appelle `can_manage_event`, elle-même `SECURITY DEFINER`) : risque de performance, non de sécurité, non mesurable ici.

### 6.2 Constats à lever **par la preuve**, pas par la déclaration

- **E01** n'est corrigé que si la nouvelle définition de `can_view_presence` (ou une migration ultérieure) est relue **et** si le test « member avec `is_chef = true` → 0 ligne » passe en base.
- **M02** n'est corrigé que si une création d'événement via la fonction renvoie un `location` non vide.
- **M01** n'est résolu que si un parcours complet chef (créer / modifier / annuler / supprimer) passe après `0006` **avec** le code de l'étape 55.

### 6.3 Assertions à ajouter à la matrice de l'étape 54 (en plus de T01–T33)

| #   | Rôle / cas                                      | Action                                                                                                              | Attendu                                                                                                     |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| T34 | `bagad_app`                                     | `select session_user, current_user`                                                                                 | `bagad_app` — sinon le runtime est propriétaire et **toute** la RLS est contournée                          |
| T35 | chef                                            | `UPDATE events SET title=…` sur son événement `interne` mono-pupitre (via le code actuel, delete+insert du ciblage) | **refus** explicite (42501) tant que l'étape 55 n'est pas livrée — documenter, ne pas « réparer » la policy |
| T36 | chef                                            | annule un événement `pupitre` existant de son pupitre                                                               | comportement à **trancher** (Q-A7 b) ; mesurer aujourd'hui : refus 42501                                    |
| T37 | chef                                            | supprime son événement mono-pupitre portant des réponses                                                            | mesurer le nombre de `event_responses` avant/après → confirme la cascade (M03)                              |
| T38 | `member` avec `profile_pupitres.is_chef = true` | lit `event_responses` d'un événement mono-pupitre de ce pupitre                                                     | **refus** (0 ligne) — actuellement **faux** : c'est E01                                                     |
| T39 | chef                                            | crée un événement avec un lieu via `app.create_event`                                                               | `location` conservé (aujourd'hui impossible : M02)                                                          |
| T40 | secrétaire                                      | `DELETE FROM invitation_pupitres WHERE …`                                                                           | comportement attendu après F01 : refus de privilège                                                         |
| T41 | `bagad_app`                                     | `DELETE FROM invitations`                                                                                           | erreur de **privilège** (42501), pas 0 ligne (T27 le prévoit déjà : le conserver tel quel)                  |
| T42 | propriétaire (migration)                        | `DELETE`/`UPDATE` via `session_user = neondb_owner`                                                                 | passe sans trigger — confirme le court-circuit et **fige** la condition F05                                 |

---

## 7. Recommandation explicite sur le feu vert

- **Neon `test`** : la migration **peut être appliquée en l'état sans risque de sécurité majeur** — elle ne dégrade aucune protection existante, n'écrit aucune donnée et ferme C1 à C5 pour le cas nominal. Elle est même **nécessaire** pour mesurer (§6.3).
- **Mais** : `0006` devient **immuable** dès sa première application sur `test` (Q-A7, `docs/database.md` §2.3). Appliquer maintenant fige le trou **E01** et l'absence de `location` (**M02**) : la correction exigera alors une migration `0008`. Comme `0006` n'a encore été appliquée nulle part, **il est moins coûteux de corriger E01 et M02 dans `0006` avant l'étape 54** (deux modifications locales, rejouables, sans données à migrer). C'est ma recommandation principale.
- **`production`** : **feu vert refusé** en l'état, pour trois raisons cumulatives : E01 ouvert ; M01 (les chefs perdraient toute action sur les événements si l'étape 55 n'est pas livrée dans la même fenêtre) ; M02 (perte silencieuse du lieu à l'étape 55). L'autorisation de déploiement reste par ailleurs subordonnée à l'accord explicite du client (Q-A7).

**Ce que je ne dis pas** : je n'affirme à aucun moment que l'application est « sécurisée ». Cet audit est statique ; les comportements de policy, de trigger et de cascade doivent être **démontrés en base** (§6).

---

## 8. Ce qui relève du client (je ne tranche pas)

1. **Q-A7 b — événements `pupitre` créés par des chefs** : avec `WITH CHECK` (0006:231-237) et le trigger (0006:277-280), un chef **ne peut plus modifier ni annuler** ses 4 événements `pupitre` existants. Faut-il une exception transitoire, une reprise de données (les passer en `interne`), ou l'acceptation du gel ? La migration n'écrit rien (I03) : l'état actuel est « non modifiable », pas « cassé ».
2. **M03 — suppression d'événement et historique de présence** : accepter la perte irréversible (cascade) ou la borner (interdire la suppression d'un événement porteur de réponses / d'un événement passé). Le plan laisse la question e ouverte.
3. **Q-A7 d — chef de plusieurs pupitres** : la règle « exactement un pupitre » (0006:122) interdit à un chef bi-pupitre de créer un événement couvrant ses deux pupitres. Comportement conforme au plan, mais c'est une règle métier à confirmer.
4. **Q-A7 e — suppression d'un événement passé** : aucune restriction temporelle n'est posée par `0006`. À confirmer avant que des événements anciens existent en production.
5. **F06 — `isChef` et RLS** : accepter que `isChef` reste lisible par tout membre actif au niveau SQL (Q-A5 fermé en façade seulement), ou engager un durcissement de `profile_pupitres` hors `0006`.
6. **M01 — séquencement du déploiement** : la décision d'appliquer `0006` et l'étape 55 dans la même fenêtre (avec indisponibilité courte des fonctions « événement » pour les chefs) relève du Chef et du client.

---

## 9. Traçabilité

| Constat                                                             | Gravité     | État                                                  |
| ------------------------------------------------------------------- | ----------- | ----------------------------------------------------- |
| SEC-RLS-E01 — `can_view_presence` sans contrôle de rôle             | Élevé       | **Ouvert** — corrigeable dans `0006` avant l'étape 54 |
| SEC-RLS-M01 — code incompatible (delete/insert du ciblage, cancel)  | Moyen       | Ouvert — étape 55 + séquencement                      |
| SEC-RLS-M02 — `create_event` sans `location`                        | Moyen       | **Ouvert** — corrigeable dans `0006` avant l'étape 54 |
| SEC-RLS-M03 — suppression par chef = perte des réponses (cascade)   | Moyen       | Ouvert — décision client                              |
| SEC-RLS-F01 — `invitation_pupitres` garde `DELETE`                  | Faible      | Ouvert                                                |
| SEC-RLS-F02 — `pupitre` sans ciblage accepté par la fonction        | Faible      | Ouvert                                                |
| SEC-RLS-F03 — `cancelled_by` non protégé par le trigger             | Faible      | Ouvert                                                |
| SEC-RLS-F04 — `events_insert` ne vérifie pas `created_by`           | Faible      | Ouvert                                                |
| SEC-RLS-F05 — court-circuit propriétaire : condition d'exploitation | Faible      | Ouvert — assertion T34                                |
| SEC-RLS-F06 — `profile_pupitres_select` expose `is_chef`            | Faible      | Ouvert — hors `0006`                                  |
| SEC-RLS-F07 — instantané `drizzle/meta/0006` absent                 | Faible      | Ouvert — outillage                                    |
| SEC-RLS-I01 — agrégats non servis par la base                       | Information | À traiter à l'étape 55                                |
| SEC-RLS-I02 — `0006` rejouable                                      | Information | Constaté                                              |
| SEC-RLS-I03 — aucune écriture de données                            | Information | Constaté                                              |
| SEC-RLS-I04 — badge « chef » retiré de l'UI par effet de bord       | Information | À aligner (55/46)                                     |

**Audit antérieur non rouvert ici** : l'audit du 12 novembre 2026 (code applicatif, `equipe/AUDIT-DEMO.md`) conserve ses constats SEC-M01 à SEC-I04, dont SEC-M02 (RLS absente) que `0002` puis `0006` traitent. Leur levée devra être prononcée sur preuves, pas sur la seule existence de ces migrations.

**Conditions opposables pour un feu vert** (toutes vérifiables) :

1. E01 corrigé dans `app.can_view_presence` (contrôle de rôle) et prouvé par T38 ;
2. M02 corrigé (`p_location`) et prouvé par T39 ;
3. T34 (session_user = `bagad_app`), T37 (cascade), T27/T41 (privilège `DELETE invitations`) exécutés sur `test` avec le résultat attendu ;
4. plan de livraison 54 + 55 dans la même fenêtre, validé par le Chef et le client ;
5. décision client écrite sur M03 et Q-A7 b/e.

VERDICT : VALIDÉ SOUS CONDITIONS
