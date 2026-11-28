# Revue technique

## 1. Informations générales

- **Date de la revue** : 2026-11-28
- **Type de revue** : Initiale (commit `41a266c` sur `dev`)
- **Auditeur** : Agent Tech Lead
- **Commit audité** : 41a266c
- **Documents consultés** :
  - `AGENTS.md`
  - `equipe/CONTRAT_API.md` (§3.1, §4, §7.10, §7.11, §11.1)
  - `equipe/INTEGRATION.md`
  - `equipe/PLAN.md` (étapes 58–73)
  - Code source : `src/lib/member/store.svelte.ts`, `src/routes/dashboard/admin/**/+page.server.ts`, `src/routes/dashboard/agenda/**/+page.server.ts`, `src/lib/member/pages/*.svelte`, `src/lib/member/services/members.ts`, `src/lib/server/member/queries/*.ts`

## 2. Résumé exécutif

L'infrastructure technique est en place : le store expose les getters conformes aux DTO de page (§7.11), les 4 routes admin ont maintenant leurs guards `requireRole('secretaire')`, et l'arbre `src/routes/public/` a été supprimé. **Cependant, 5 pages frontend n'utilisent pas les nouveaux getters** et continuent de lire `member.profiles` (fallback déprécié) ou `member.documents.length`, ce qui rend des données vides ou incorrectes malgré des DTO serveur corrects. La route `/dashboard/agenda/[id]/modifier` manque son guard de rôle. Le verdict est **À REFAIRE** pour ces défauts P1.

## 3. Statistiques

| Gravité                | Nombre |
| ---------------------- | ------ |
| P0 (bloquant critique) | 0      |
| P1 (majeur)            | 6      |
| P2 (significatif)      | 2      |
| P3 (mineur)            | 0      |
| **Total**              | **8**  |

## 4. Vérification du plan

| Étape du plan                                    | Réalisée | Conforme | Remarque                                                   |
| ------------------------------------------------ | -------- | -------- | ---------------------------------------------------------- |
| 58–62 : Chargement ciblé (store, types, queries) | Oui      | Partiel  | Store prêt, mais pages non migrées                         |
| 63–67 : Routes admin + guards                    | Oui      | Partiel  | 4/4 routes corrigées, mais 1 route canonique défaillante   |
| 68–73 : Nettoyage routes publiques               | Oui      | Oui      | `src/routes/public/` supprimé, aucune référence résiduelle |
| Build / Check / Lint                             | Oui      | Oui      | Validé par le Chef (`check=0`, `lint=0`, `build=✅`)       |

## 5. Vérification du contrat API

| Endpoint                                  | Frontend conforme                     | Backend conforme | Statut     | Remarque                                    |
| ----------------------------------------- | ------------------------------------- | ---------------- | ---------- | ------------------------------------------- |
| `GET /dashboard/admin/agenda`             | Non (page non vérifiée)               | Oui              | ERREUR     | Backend OK, guard `secretaire` présent      |
| `GET /dashboard/admin/articles/new`       | Non (page non vérifiée)               | Oui              | ERREUR     | Backend OK, guard `secretaire` présent      |
| `GET /dashboard/admin/articles/[id]/edit` | Non (page non vérifiée)               | Oui              | ERREUR     | Backend OK, guard `secretaire` présent      |
| `GET /dashboard/admin/notifications`      | Non (page non vérifiée)               | Oui              | ERREUR     | Backend OK, guard `secretaire` présent      |
| `GET /dashboard/agenda/nouveau`           | Non vérifié                           | Oui              | OK         | Guard `chef_pupitre` conforme matrice       |
| `GET /dashboard/agenda/[id]/modifier`     | Non vérifié                           | **Non**          | **ERREUR** | **Manque `requireRole('chef_pupitre')`**    |
| `GET /dashboard/admin/membres`            | **Non** (lit `profiles` fallback)     | Oui              | **ERREUR** | DTO `members` non lu par la page            |
| `GET /dashboard/pupitre/membres`          | **Non** (lit `profiles` via service)  | Oui              | **ERREUR** | DTO `members` (`PupitreMember[]`) non lu    |
| `GET /dashboard/admin`                    | **Non** (lit `profiles.length`)       | Oui              | **ERREUR** | DTO `counts` / `storage` non lu             |
| `GET /dashboard` (overview)               | **Non** (lit `documents.length`)      | Oui              | **ERREUR** | DTO `documentsCount` non lu                 |
| `GET /dashboard/admin/articles`           | **Non** (lit `profiles` pour auteurs) | Oui              | **ERREUR** | DTO `authors` (`DirectoryProfile[]`) non lu |

## 6. Défauts détaillés

### 6.1 Défauts P1 (majeurs)

#### R-001 : AdminMembersPage lit `member.profiles` au lieu de `member.adminMembers`

- **Gravité** : P1
- **Fichier** : `src/lib/member/pages/AdminMembersPage.svelte`
- **Ligne/Fonction** : Ligne 46 (`const members = $derived(member.profiles...)`)
- **Constat** : La page utilise le getter déprécié `profiles` (fallback qui convertit `adminMembers` en `MemberProfile[]` partiel) au lieu du getter dédié `adminMembers` qui expose `MemberAdminSummary[]` avec tous les champs requis (email, role, accountStatus, emailConfirmed, level, bureauPositionId, pupitres avec isChef, createdAt).
- **Preuve** : `store.svelte.ts` lignes 200–206 expose `adminMembers` correctement ; `AdminMembersPageData` (§3.1 contrat) attend `members: MemberAdminSummary[]`.
- **Conséquence** : L'affichage fonctionne partiellement (le fallback convertit), mais `email`, `role`, `accountStatus` sont présents alors qu'ils ne devraient l'être que dans l'admin, et `bureauPositionId` (nécessaire à l'édition du titre) est perdu. La pagination `membersCount` n'est pas utilisée.
- **Attendu** : Remplacer `member.profiles` par `member.adminMembers` et adapter les accès aux champs (`profile.role` → `profile.role`, `profile.accountStatus` → `profile.accountStatus`, etc. — les noms sont identiques). Utiliser `member.adminMembersCount` pour le total.
- **Responsable pressenti** : Frontend

#### R-002 : PupitrePage utilise `profilesOfPupitre()` (basé sur `member.profiles`) au lieu de `member.pupitreMembers`

- **Gravité** : P1
- **Fichier** : `src/lib/member/pages/PupitrePage.svelte` + `src/lib/member/services/members.ts`
- **Ligne/Fonction** : `PupitrePage.svelte` ligne 48 (`profilesOfPupitre(pupitreId)`) ; `members.ts` ligne 15–19 (`profilesOfPupitre`)
- **Constat** : Le service `profilesOfPupitre` filtre `member.profiles` (fallback `DirectoryProfile[]` converti en `MemberProfile[]`) au lieu d'utiliser `member.pupitreMembers` qui expose `PupitreMember[]` avec `isChef` — la **seule** projection autorisée à porter `isChef` d'un autre profil (contrat §3.1, §7.11, décision Q-2026-11-25-01).
- **Preuve** : `store.svelte.ts` lignes 215–221 expose `pupitreMembers: PupitreMember[]` ; `PupitrePageData.members` est typé `PupitreMember[]` (§3.1).
- **Conséquence** : L'espace pupitre affiche 0 membre / 0 chef (vu dans le rapport d'intégration I-003). Le champ `isChef` n'est pas disponible via le fallback `profiles`.
- **Attendu** : Remplacer `profilesOfPupitre(pupitreId)` par un filtre sur `member.pupitreMembers` (ou ajouter un getter `pupitreMembersOf(pupitreId)` dans le store). Supprimer `profilesOfPupitre` du service.
- **Responsable pressenti** : Frontend

#### R-003 : AdminOverviewPage lit `member.profiles.length` au lieu de `member.adminCounts.members`

- **Gravité** : P1
- **Fichier** : `src/lib/member/pages/AdminOverviewPage.svelte`
- **Ligne/Fonction** : Ligne 95 (`value={member.profiles.length}`)
- **Constat** : La page utilise le fallback `profiles` pour compter les membres, alors que le DTO `AdminOverviewPageData` fournit `counts: { members, pendingInvitations, upcomingEvents }` et `storage: StorageUsage`.
- **Preuve** : `store.svelte.ts` lignes 237–249 expose `adminCounts` et `adminStorage` ; `getAdminOverviewPage` retourne bien ces champs (§11.1).
- **Conséquence** : Compteur « Membres » à 0 si le fallback `profiles` est vide (ce qui est le cas hors section `adminMembers`). Les compteurs « Invitations en attente », « Articles publiés », « Notifications non lues » utilisent aussi des sources incorrectes (`member.invitations`, `member.articles` qui sont pour d'autres sections).
- **Attendu** : Utiliser `member.adminCounts?.members ?? 0`, `member.adminCounts?.pendingInvitations ?? 0`, `member.adminCounts?.upcomingEvents ?? 0`. Pour le stockage, utiliser `member.adminStorage` (formatage via `formatBytes`).
- **Responsable pressenti** : Frontend

#### R-004 : OverviewPage lit `member.documents.length` au lieu de `member.overviewDocumentsCount`

- **Gravité** : P1
- **Fichier** : `src/lib/member/pages/OverviewPage.svelte`
- **Ligne/Fonction** : Ligne 41 (`const documentsCount = $derived(member.documents.length)`)
- **Constat** : La page utilise le getter `documents` (qui lit `DocumentsPageData.documents` — section `documents`) au lieu du champ `documentsCount` de `OverviewPageData`.
- **Preuve** : `store.svelte.ts` lignes 259–264 expose `overviewDocumentsCount` ; `getOverviewPage` retourne `documentsCount: number` (§11.1).
- **Conséquence** : Compteur « Documents disponibles » à 0 sur la page d'accueil membre (vu dans I-003).
- **Attendu** : Remplacer par `member.overviewDocumentsCount`.
- **Responsable pressenti** : Frontend

#### R-005 : AdminArticlesPage lit `member.profiles` pour les auteurs au lieu de `member.authors`

- **Gravité** : P1
- **Fichier** : `src/lib/member/pages/AdminArticlesPage.svelte`
- **Ligne/Fonction** : Ligne 55–58 (`authorName` utilise `member.profiles.find()`)
- **Constat** : La fonction `authorName` cherche l'auteur dans `member.profiles` (fallback `MemberProfile[]` avec email/role/accountStatus) au lieu de `member.authors` qui expose `DirectoryProfile[]` (projection minimale sans données sensibles, contrat §12.3).
- **Preuve** : `store.svelte.ts` lignes 251–257 expose `authors: DirectoryProfile[]` ; `listArticlesPage` retourne `authors: DirectoryProfile[]` (§11.1).
- **Conséquence** : Affichage « Auteur inconnu » pour tous les articles (vu dans I-003). Fuite potentielle de `email`/`role`/`accountStatus` si le fallback est utilisé ailleurs.
- **Attendu** : Remplacer par `member.authors.find(a => a.id === id)`.
- **Responsable pressenti** : Frontend

#### R-006 : Route `/dashboard/agenda/[id]/modifier` manque `requireRole('chef_pupitre')`

- **Gravité** : P1
- **Fichier** : `src/routes/dashboard/agenda/[id]/modifier/+page.server.ts`
- **Ligne/Fonction** : Ligne 9 (seul `requireAuth`)
- **Constat** : La route canonique pour l'édition d'événement par un chef de pupitre n'a que `requireAuth`. Le contrat (§7.11 tableau) exige un rôle minimum `chef_pupitre` (périmètre) / `secretaire`. La fonction `getEventForEdit` vérifie le périmètre en interne, mais la route doit aussi avoir le guard explicite.
- **Preuve** : Comparaison avec `/dashboard/agenda/nouveau` (ligne 9 : `requireRole('chef_pupitre')`) et `/dashboard/admin/articles/[id]/edit` (ligne 17 : `requireRole('secretaire')`).
- **Conséquence** : Tout membre actif (rôle `member`) peut accéder au formulaire d'édition d'événement → HTTP 200 au lieu de 403. La vérification serveur dans `getEventForEdit` renverra `NOT_CHEF_OF_PUPITRE` (403/404), mais l'absence de guard explicite viole le principe de défense en profondeur (§2.7).
- **Attendu** : Ajouter `requireRole(locals, 'chef_pupitre')` après `requireAuth`.
- **Responsable pressenti** : Backend

### 6.2 Défauts P2 (significatifs)

#### R-007 : Doublons de routes `eventForm` non arbitrés

- **Gravité** : P2
- **Fichier** : `equipe/CONTRAT_API.md` (I-010), routes concernées
- **Constat** : Deux routes servent la même section `eventForm` avec des guards différents :
  - `/dashboard/agenda/nouveau` → `chef_pupitre` (création événement mono-pupitre interne)
  - `/dashboard/admin/agenda/new` → `secretaire` (création événement public/interne/pupitre, 0–N pupitres)
  - `/dashboard/agenda/[id]/modifier` → `requireAuth` seul (défaillant, voir R-006)
  - `/dashboard/admin/articles/[id]/edit` → `secretaire`
- **Preuve** : Contrat §7.11 tableau lignes 850–852, 865 ; code des 4 routes.
- **Conséquence** : Ambiguïté UX (deux entrées menu pour « Nouvel événement » / « Modifier événement »), risque de contournement de la matrice des permissions (un chef pourrait accéder à la route admin s'il devine l'URL).
- **Attendu** : Arbitrage du Chef pour désigner la route canonique par rôle, supprimer ou rediriger l'autre. Documenter dans `CONTRAT_API.md` et `docs/questions.md`.
- **Responsable pressenti** : Chef / Architecte

#### R-008 : Getter `profiles` (fallback) maintient une surface d'attaque / confusion

- **Gravité** : P2
- **Fichier** : `src/lib/member/store.svelte.ts`
- **Ligne/Fonction** : Lignes 266–289 (`get profiles()`)
- **Constat** : Le fallback `profiles` convertit `adminMembers` en `MemberProfile[]` avec `email`, `role`, `accountStatus` — des champs interdits dans l'annuaire (contrat §12.3). Pour les autres sections, il tente de lire une clé `profiles` qui n'existe plus dans les DTO de page.
- **Preuve** : Code du getter ; contrat §3.1 note « `profiles` déprécié en fallback ».
- **Conséquence** : Risque de régression si une page utilise `member.profiles` en croyant avoir des `DirectoryProfile` (ex. `PupitrePage` via `profilesOfPupitre`). Fuite de données sensibles possible.
- **Attendu** : Une fois toutes les pages migrées (R-001 à R-005), supprimer le getter `profiles` et le service `profilesOfPupitre` / `visibleProfiles` / `activeChefs` / `eventAudience` qui en dépendent. Remplacer par des getters typés par section.
- **Responsable pressenti** : Frontend

## 7. Points à vérifier

| Point                                                           | Raison                                                                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Tests `pnpm test` après corrections                             | `tests/i18n.test.ts` et `tests/invitation.test.ts` sont vides (0 octet) — hors périmètre Tech Lead, mais bloquant pour la CI |
| Bindings `wrangler.jsonc` (R2_PUBLIC / R2_PRIVATE / HYPERDRIVE) | Configuration déploiement, accord Chef requis (I-005)                                                                        |
| Migration `0008` appliquée sur Neon                             | Preuve d'application manquante (I-026 rapport intégration)                                                                   |

## 8. Améliorations non bloquantes

- Supprimer le plugin Vite `bagad-exclude-demo-from-build` (cible `$lib/demo/**` inexistant, 51–54 % temps de build)
- Nettoyer les ~9 Mo d'artefacts de debug à la racine et dans `src/` (`gen_tests.js`, `check_*.log`, `*.bat`, `*.ps1`, `Context.MD`, `docs/lighthouse*.json`)
- Réécrire `static/robots.txt` avec les vraies routes (`/dashboard`, `/auth`, `/api`)
- Ajouter `<link rel="manifest">` dans `app.html` (PWA non installable actuellement, `manifest.webmanifest` vide)
- Justifier ou retirer `@lhci/cli` / `lighthouse` de `package.json` (gouvernance packages AGENTS.md §2)

## 9. Recommandations prioritaires

1. **Corriger les 5 pages frontend** (R-001 à R-005) pour utiliser les getters dédiés du store (`adminMembers`, `pupitreMembers`, `adminCounts`/`adminStorage`, `overviewDocumentsCount`, `authors`). C'est la cause racine des écrans vides signalés dans I-003.
2. **Ajouter `requireRole('chef_pupitre')`** sur `/dashboard/agenda/[id]/modifier/+page.server.ts` (R-006).
3. **Arbitrer les doublons de routes** `eventForm` (R-007) avant de merger — décision Chef/Architecte à consigner dans `docs/questions.md` et `CONTRAT_API.md`.
4. **Supprimer le fallback `profiles`** une fois les migrations faites (R-008).

## 10. Verdict

VERDICT : À REFAIRE
