# AGENTS.md : Site Bagad Penhars

Site de l'association Bagad Penhars (Quimper) : vitrine publique + espace adhérents sur invitation, installable en PWA.
Stack : SvelteKit 5 (runes), Tailwind, Motion, Supabase, OneSignal, Netlify.

**Lis ce fichier d'abord, puis `docs/`. En cas de doute, n'invente pas : écris la question dans `docs/questions.md`.**

## 1. Ordre de lecture

| Fichier | Pourquoi |
|---|---|
| `docs/brief.md` | Besoin, rôles, décisions de visibilité |
| `docs/architecture.md` | Routes, flux d'auth, arborescence |
| `docs/database.md` | Schéma, RLS, migrations |
| `docs/pwa.md` | Manifest, service worker, notifications |
| `docs/roadmap.md` | Jalons et « Focus actuel » |
| `docs/backlog.md` | Tâches classées |
| `docs/journal.md` | Où la dernière session s'est arrêtée |

Ne lis que ce dont la tâche a besoin, mais toujours `brief.md` et `journal.md` en début de session.

## 2. Règles d'or

### Svelte 5
- Runes uniquement : `$state`, `$derived`, `$effect`, `$props`.
- Interdits : `export let`, `$:`, `on:click` (utiliser `onclick`), stores legacy pour l'état local.

### Supabase et sécurité
- RLS activée sur **toute** table, y compris les tables publiques (policy de lecture explicite, filtrée sur `published` ou `visibility`).
- Jamais de `using (true)` sans commentaire qui justifie.
- Les rôles se lisent dans `profiles.role`, **jamais** dans `user_metadata`.
- Données via `+page.server.ts` / `+layout.server.ts`, garde sur `event.locals`.
- La clé `service_role` reste dans `src/lib/server/`, jamais côté client.
- Une migration appliquée n'est jamais modifiée : on en ajoute une nouvelle.

### OneSignal
- La clé REST reste côté serveur.
- L'envoi vérifie le rôle : secrétaire (plusieurs pupitres), chef de pupitre (son pupitre), admin.

### PWA
- Le service worker ne met en cache **que** les fichiers statiques et la page `/offline`.
- Jamais d'appel Supabase ni de page HTML d'espace adhérents en cache.
- Tout changement du manifest ou du service worker est consigné dans `docs/pwa.md`.

### UI
- Tailwind uniquement, couleurs et espacements via les tokens du thème.
- Motion : respecter `prefers-reduced-motion`.
- Mobile first, accessibilité (labels, contrastes, focus visible).
- Interface en français.

### Général
- Aucun secret committé (`.env` ignoré, `.env.example` à jour).
- Pas de nouvelle dépendance sans la justifier dans `docs/journal.md`.
- Pas d'annuaire des membres, pas de titres du bureau publics (voir `docs/brief.md`).

## 3. Choisir le travail

1. `docs/roadmap.md` → « Focus actuel »
2. `docs/backlog.md`, dans l'ordre
3. Besoin flou ou contradictoire : poser la question dans `docs/questions.md`, passer à la tâche suivante.

Ne pas entamer de refonte ni de nettoyage qui n'est pas demandé.

## 4. Avant de terminer une tâche

```
npm run check && npm run lint && npm run build
```

- Schéma modifié : nouvelle migration + mise à jour de `docs/database.md` (matrice des droits comprise) + test de policy dans `supabase/tests/`.
- Route ou flux modifié : mise à jour de `docs/architecture.md`.
- Ajouter une entrée datée dans `docs/journal.md` : ce qui est fait, ce qui reste, les pièges rencontrés.

## 5. Demander avant d'agir

- Changer de stack ou ajouter un service tiers.
- Modifier les rôles, la RLS existante ou le flux d'invitation.
- Supprimer des données ou une migration.
- Toucher aux en-têtes de sécurité (CSP) ou à la configuration Netlify.
- Modifier la politique de cache du service worker.

## 6. Hors périmètre

Annuaire des membres, paiement en ligne, inscription libre.