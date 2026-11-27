# 2026-11-25

### Clarification des documents de référence

- `Spec_UI.md` et `event.md` sont maintenant des index courts vers les sources
  canoniques (`maquette_UI.md`, `Spec.md`, `brief.md` et `database.md`) plutôt
  que des spécifications parallèles. Les agents ne lisent que les sections
  utiles de `equipe/PLAN.md` et `equipe/CONTRAT_API.md`.
- La bibliothèque d'animation tierce a été retirée des consignes et
  spécifications actives. Les exigences d'accessibilité pour le mouvement
  réduit sont conservées.
- Les images sources sont converties en WebP avant stockage dans R2; Cloudflare
  Image Resizing ne sert que les variantes d'affichage. Cloudflare Images n'est
  pas utilisé.
- Les traductions publiques `fr`, `en` et `br` sont présentes dans les
  dictionnaires typés de `src/lib/i18n/`. `svelte-i18n` reste dans les
  dépendances, mais le code actuel n'importe pas cette bibliothèque.
- Écart de réalisation : `inspectImageUpload()` valide les images, mais ne les
  convertit pas en WebP. La conversion avant stockage R2 reste à implémenter.
- Les commandes documentées utilisent pnpm; le verrou npm `package-lock.json`
  a été supprimé. `pnpm-lock.yaml` reste le verrou de référence.
- Le README ne pointe plus vers `docs/Structure.md` ni `docs/backlog.md`, qui
  ont été supprimés.

## 2026-11-23

### Finalisation étapes 55-56 (RLS + quota)

- **Étapes 55 et 56** terminées et validées : migrations `0006`+`0007` sur Neon `test`, alignement code complet, migration `0008` fonctions de quota R2.
- **Matrice par rôle** : 48/48 assertions conformes — création chef `interne+1 pupitre` acceptée, tous les autres cas refusés, `events_delete` corrigé via `app.can_manage_event`, `reserve_storage_bytes`/`finalize_storage_upload`/`release_storage_bytes` opérationnels.
- **Code aligné** : `event.create` → `SELECT app.create_event(...)` (8 arguments), `event.update` ciblage immuable pour chef, `canViewPresenceDetail` → `length===1 && isChefOf(...)`, `bureauPosition` depuis `bureau_title`, `isChef` masqué du trombinoscope public (§12.3).
- **Build/check/build** : `npm run check` → 0 erreur ; `npm run build` → OK.
- **Revues** : Intégration et Revue technique toutes deux **VALIDÉ** — aucune régression, assemblage backend/frontend cohérent, trombinoscope §12.3 conforme (`isChef` masqué pour les membres publics).
- **Fichiers** : `drizzle/0006_rls_hardening.sql`, `drizzle/0007_events_delete_policy_fix.sql`, `drizzle/0008_storage_quota_functions.sql`, `drizzle/meta/_journal.json` mis à jour ; 5 fichiers Svelte/modifiés pour retrait badges `isChef` et alignement visibility `EventFormPage` ; `equipe/INTEGRATION.md` + `equipe/REVUE.md` produits.

**Reste (point de contrôle 2 client)** :
- Transmission `isChef` dans profils sec/admin pour l'écran d'administration des pupitres (non critique, déjà noté dans la revue).
- **Option A choisie** : droits d'écriture `tests/**` attribués à `dev-backend` et `testeur` via les fichiers de configuration `.opencode/agents` (`.opencode/agents/dev-backend.md` et `.opencode/agents/testeur.md`). La matrice de tests PostgreSQL par rôle (48 assertions) peut désormais être automisée. Arbitrage clos — pas de changement de code supplémentaire requis pour cette étape.

- **Décision client** `svelte-i18n` conservé (non câblé mais accepté).
- **Dépendances** : `@lhci/cli@^0.13.0` ajouté en `npm install --legacy-peer-deps` (novembre 2026) — script `lhci` disponible pour audits de performance, non requis par le fonctionnement métier.
- `production` jamais contactée, seules `test` concernée.
- Aucune migration `0000`-`0005` modifiée.
