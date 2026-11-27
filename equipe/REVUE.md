# Revue technique

## 1. Informations générales

- **Date de la revue** : 2026-11-26
- **Type de revue** : Initiale
- **Auditeur** : Agent Tech Lead
- **Commit audité** : Non spécifié (état courant du dépôt)
- **Documents consultés** :
  - `equipe/PLAN.md` §10 (étapes 58–73)
  - `equipe/CONTRAT_API.md` §3.1, §7.11, §7.12, §11.1, §12
  - `equipe/INTEGRATION.md` (verdict SATISFAISANT, points TL-01 à TL-06)
  - `docs/questions.md` — Q-2026-11-25-01/02/03 (résolues par le Chef)

## 2. Résumé exécutif

Le chantier « chargement ciblé de l'espace privé » (étapes 58 à 73) est **implémenté, compilé et buildé sans erreur**. L'architecture « un load par page, un DTO par page » (§7.11 du contrat) est respectée : le layout ne charge que le socle (`MemberShell`), chaque page charge ses propres données via une fonction de lecture ciblée exécutée dans une transaction RLS (`withUserContext` + `set_config('app.profile_id', ...)`). Les guards serveur (`requireAuth`, `requireRole`) sont appliqués dans chaque `+page.server.ts`. La suppression effective de `buildMemberSnapshot` et de `GET /api/member` est confirmée. Les mutations restent unifiées sous `POST /api/member/action` avec un retour `CommandResult` sans snapshot (§7.12). Les décisions du Chef (Q-2026-11-25-01/02/03) sont appliquées.

## 3. Statistiques

| Gravité | Nombre |
|---------|--------|
| P0 (bloquant critique) | 0 |
| P1 (majeur) | 1 |
| P2 (significatif) | 2 |
| P3 (mineur) | 1 |
| **Total** | **4** |

## 4. Vérification du plan

| Étape du plan | Réalisée | Conforme | Remarque |
|---------------|----------|----------|----------|
| 58 – Fonctions de lecture ciblées : socle (`getMemberShell`) | Oui | Oui | `queries/shell.ts` + `hooks.server.ts` |
| 59 – Chargements `overview` / `agenda` / `event` / `eventForm` | Oui | Oui | `queries/overview.ts`, `agenda.ts`, `events.ts` |
| 60 – Chargements `directory` / `pupitre` / `documents` / `notifications` | Oui | Oui | `queries/directory.ts`, `pupitre.ts`, `documents.ts`, `notifications.ts` |
| 61 – Chargements `profile` / `settings` / `adminOverview` / `adminMembers` | Oui | Oui | `queries/profile.ts`, `settings.ts`, `adminOverview.ts`, `adminMembers.ts` |
| 62 – Chargements `adminInvitations` / `adminArticles` / `adminMedia` / `adminNotifications` | Oui | Oui | `queries/invitations.ts`, `articles.ts`, `media.ts`, `notifications.ts` (admin) |
| 63 – Layout adhérents : socle uniquement (`memberShell`) | Oui | Oui | `routes/dashboard/+layout.server.ts` |
| 64 – Pages `overview` / `agenda` / `agenda/[id]` / `agenda/nouveau` / `agenda/[id]/modifier` | Oui | Oui | 5 fichiers `+page.server.ts` |
| 65 – Pages `membres` / `pupitre/*` / `documents` / `notifications` / `profil` / `securite` | Oui | Oui | 7 fichiers `+page.server.ts` |
| 66 – Pages admin (11 fichiers) | Oui | Oui | `routes/dashboard/admin/**/+page.server.ts` |
| 67 – DTO `MemberPageEnvelope` + types de page | Oui | Oui | `src/lib/member/types.ts` (§3.1 du contrat) |
| 68 – `POST /api/member/action` : retour `CommandResult` sans snapshot | Oui | Oui | `routes/api/member/action/+server.ts` |
| 69 – Suppression `buildMemberSnapshot` + `GET /api/member` | Oui | Oui | Fichiers absents (confirmés) |
| 70 – Guards `requireAuth` / `requireRole` dans chaque load ciblé | Oui | Oui | `queries/common.ts` + tous les `+page.server.ts` |
| 71 – Relecture rôle/statut dans la transaction (défense en profondeur) | Oui | Oui | Chaque `queries/*.ts` relit `profiles.role` / `account_status` |
| 72 – Contexte RLS `app.profile_id` via `withUserContext` sur **chaque** lecture | Oui | Oui | `db/index.ts:63-75` + `runQuery` dans `queries/common.ts` |
| 73 – Tests `member-queries.test.ts` (clés DTO, comptage requêtes, refus rôle) | Non | Non vérifiable | Attribué au Testeur (Q-2026-11-25-02, option A) — planifié, non exécuté |

## 5. Vérification du contrat API

| Endpoint / Load | Frontend conforme | Backend conforme | Statut | Remarque |
|-----------------|-------------------|------------------|--------|----------|
| `GET /dashboard` (layout → `memberShell`) | Oui | Oui | OK | `getMemberShell` → `MemberShell` |
| `GET /dashboard` (page → `overview`) | Oui | Oui | OK | `getOverviewPage` → `OverviewPageData` |
| `GET /dashboard/agenda` | Oui | Oui | OK | `listAgendaEvents` → `AgendaPageData` |
| `GET /dashboard/agenda/[id]` | Oui | Oui | OK | `getEventDetail` → `EventDetailPageData` (Q-A3 respecté) |
| `GET /dashboard/membres` | Oui | Oui | OK | `listDirectoryProfiles` → `DirectoryProfile[]` (sans email/role) |
| `GET /dashboard/pupitre/*` | Oui | Oui | OK | `getPupitrePage` → `PupitrePageData` (`isChef` autorisé ici) |
| `GET /dashboard/admin/membres` | Oui | Oui | OK | `listAdminMembersPage` → `AdminMembersPageData` (email/role/isChef autorisés) |
| `POST /api/member/action` | Oui | Oui | OK | Retour `CommandResult` (§7.12), plus de `snapshot` |

## 6. Défauts détaillés

### 6.1 Défauts P0 (bloquants critiques)

*Aucun.*

### 6.2 Défauts P1 (majeurs)

#### REV-01 : Tests `member-queries.test.ts` absents (étape 73 non exécutée)
- **Gravité** : P1
- **Fichier** : `tests/member-queries.test.ts` (existe mais non validé)
- **Ligne/Fonction** : Fichier de test
- **Constat** : L'étape 73 du plan prévoit des tests automatisés couvrant les clés DTO, le comptage de requêtes par page, les refus de rôle (403) et la règle Q-A3 (présences nominatives). Le fichier `tests/member-queries.test.ts` est présent dans le dépôt (vu dans `git status`) mais n'a pas été exécuté ni validé. L'intégrateur le signale comme « Planifié » (TL-05).
- **Preuve** : `equipe/INTEGRATION.md` §7 (TL-05) ; `equipe/PLAN.md` étape 73 ; `docs/questions.md` Q-2026-11-25-02 (décision Chef : attribution au Testeur).
- **Conséquence** : Aucune preuve automatisée de non-régression sur les lectures ciblées, les gardes et le comptage de requêtes. Le chantier ne peut pas être considéré comme pleinement clos tant que ces tests ne passent pas.
- **Attendu** : Exécution de `pnpm run test` avec les tests `member-queries.test.ts` passant (couverture : clés DTO, comptage requêtes, refus rôle, Q-A3).
- **Responsable pressenti** : Testeur

### 6.3 Défauts P2 (significatifs)

#### REV-02 : `pupitre/+layout.server.ts` ne vérifie pas l'authentification (TL-04)
- **Gravité** : P2
- **Fichier** : `src/routes/dashboard/pupitre/+layout.server.ts`
- **Ligne/Fonction** : Ligne 3 (load minimal)
- **Constat** : Le layout pupitre ne fait **pas** le garde `requireAuth` ; il renvoie seulement `{ user: locals.user }`. Les pages enfants (`pupitre/+page.server.ts`, `pupitre/membres/+page.server.ts`, etc.) appliquent bien `requireAuth` + `requireRole('chef_pupitre')` via `runQuery`. L'accès est donc refusé au niveau des pages, mais le layout lui-même est accessible sans vérification.
- **Preuve** : Code lu dans `src/routes/dashboard/pupitre/+layout.server.ts` (3 lignes) ; `equipe/INTEGRATION.md` TL-04.
- **Conséquence** : Risque faible (les données sont protégées au niveau page), mais incohérence avec le principe « guards appliqués dans chaque load ». Une future page pupitre sans garde hériterait d'un accès non vérifié.
- **Attendu** : Ajouter `requireAuth` dans `pupitre/+layout.server.ts` (ou documenter explicitement l'exception acceptée).
- **Responsable pressenti** : Backend

#### REV-03 : `MemberProfile` expose encore des champs interdits pour l'annuaire (cohérence `DirectoryProfile`)
- **Gravité** : P2
- **Fichier** : `src/lib/member/types.ts`
- **Ligne/Fonction** : Interface `MemberProfile` (lignes 43–58)
- **Constat** : `MemberProfile` (utilisé pour le profil de session dans `MemberShell`) expose `email`, `role`, `accountStatus`, `joinedAt`. C'est correct pour le profil **courant**. En revanche, `DirectoryProfile` (annuaire) les exclut correctement. Le contrat §12.3 et Q-A5 interdisent les valeurs inventées ; l'ancien `snapshot.ts` fabriquait `email: ''`, `role: 'member'`… — c'est corrigé. Le point reste une réserve de cohérence : s'assurer qu'aucun chemin de code ne réutilise `MemberProfile` pour afficher un autre membre.
- **Preuve** : `src/lib/member/types.ts` interfaces `MemberProfile` vs `DirectoryProfile` ; `equipe/INTEGRATION.md` TL-03.
- **Conséquence** : Risque de fuite accidentelle si un composant utilise le mauvais type. Le store `src/lib/member/store.svelte.ts` doit être vérifié.
- **Attendu** : Vérifier que `member.profiles` dans le store est bien typé `DirectoryProfile[]` (conforme au contrat §3.1 note) et qu'aucun composant n'affiche `email`/`role` d'autrui.
- **Responsable pressenti** : Frontend

### 6.4 Défauts P3 (mineurs)

#### REV-04 : Warnings `state_referenced_locally` préexistants (TL-01)
- **Gravité** : P3
- **Fichier** : `src/routes/dashboard/articles/ArticleFormPage.svelte`, `src/routes/dashboard/agenda/EventFormPage.svelte`, `src/routes/dashboard/profil/ProfilePage.svelte`, `src/routes/+layout.svelte`
- **Ligne/Fonction** : Diverses (état local référencé mais non réactif)
- **Constat** : 19 warnings `state_referenced_locally` préexistants sur 4 composants. Ne bloquent pas le build. Hors périmètre du chantier (composants inchangés).
- **Preuve** : `equipe/INTEGRATION.md` §4 (commande `pnpm run check` : 0 erreur, 19 warnings) ; TL-01.
- **Conséquence** : Aucun impact fonctionnel. Dette technique à corriger hors session.
- **Attendu** : Corriger en utilisant `$derived` ou passer par props, lors d'une prochaine session de nettoyage.
- **Responsable pressenti** : Frontend

## 7. Points à vérifier

| Point | Raison |
|-------|--------|
| Exécution effective de `pnpm run test` avec `member-queries.test.ts` | Fichier présent mais non exécuté dans cette session ; étape 73 bloquante pour la clôture du chantier |
| Vérification du store `src/lib/member/store.svelte.ts` : `member.profiles` typé `DirectoryProfile[]` | Conformité au contrat §3.1 (note) ; éviter toute régression d'affichage `email`/`role` d'autrui |
| Aucune régression sur les pages publiques (agenda, articles, médias) | Le chantier ne les touche pas, mais un `build` complet a passé — confirmation par le testeur recommandée |

## 8. Améliorations non bloquantes

- Uniformiser l'application de `requireAuth` dans **tous** les layouts (ajouter dans `pupitre/+layout.server.ts` pour cohérence).
- Documenter explicitement dans `docs/architecture.md` le pattern « un load par page, transaction RLS par lecture » pour les futurs intervenants.
- Nettoyer les 19 warnings `state_referenced_locally` lors d'une session dédiée.

## 9. Recommandations prioritaires

1. **Exécuter l'étape 73** : faire passer les tests `member-queries.test.ts` (responsable : Testeur). C'est la seule action bloquante pour valider définitivement le chantier.
2. **Corriger REV-02** : ajouter `requireAuth` dans `pupitre/+layout.server.ts` (responsable : Backend) — correction rapide, cohérence défensive.
3. **Vérifier REV-03** : audit du store et des composants pour confirmer l'absence d'affichage `email`/`role` d'autrui (responsable : Frontend).

## 10. Verdict

VERDICT : À REFAIRE