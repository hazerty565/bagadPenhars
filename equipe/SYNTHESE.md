# Synthèse documentaire - Site Bagad Penhars

**Objet :** relecture des documents du projet, vérification de leur cohérence mutuelle et extrait des exigences à destination du développeur, du tech-lead et du testeur.
**Sources lues :** `AGENTS.md` (racine) + l'intégralité de `docs/` (18 fichiers : 8 principaux + 10 complémentaires, dont les schémas SQL/Mermaid et l'image DrawSQL).
**Règle observée :** aucune information absente n'est inventée ; elle est consignée comme question ouverte (section 9). Aucun fichier source du projet n'a été lu ni modifié. Ce qui est écrit dans `equipe/` fait foi.

---

## 1. Stack technique

| Couche | Choix retenu | Précisions |
|---|---|---|
| Framework frontend | SvelteKit 5 (runes) + TypeScript | Runes uniquement : $state, $derived, $effect, $props. Interdits : export let, $:, on:click (utiliser onclick), stores legacy pour l'état local. |
| Styling / UI | Tailwind CSS, Motion | Tokens du thème uniquement (couleurs, rayons, espacements). Mobile first, prefers-reduced-motion, focus visible, accessibilité WCAG AA, interface en français. |
| Identité / sessions | Better Auth | Sessions, comptes, invitations, mots de passe. Handler central dans src/lib/server/auth.ts, hooks serveur, event.locals. |
| Base de données | Neon PostgreSQL | Base bagadpenhars, branches test (dev/tests/preview) et production. Politiques RLS natives en défense en profondeur. |
| ORM / migrations | Drizzle ORM | Migrations versionnées sous drizzle/ + métadonnées drizzle/meta/. Migration initiale reproductible ; migration appliquée jamais modifiée (additive uniquement). |
| Driver / pooling | @neondatabase/serverless + Cloudflare Hyperdrive | Connexions via Hyperdrive. Cache de requêtes réservé aux lectures publiques indépendantes de l'identité (jamais lectures protégées par RLS). |
| Hébergement | Cloudflare Pages | Runtime SvelteKit, bindings Neon (variables d'env) et R2. |
| Stockage fichiers | Cloudflare R2 | Deux buckets : bagad-public (objets publiés) et bagad-private (profils, documents, albums privés). Quota global 8 Go (alerte 7 Go, blocage upload à 8 Go). Table storage_usage pour les compteurs. |
| Optimisation images | Cloudflare Images | WebP, sortie max 2 000 × 2 000 px, qualité 82, suppression métadonnées, variantes 400 × 400 (q75, cover) / 2 000 × 2 000 (q82, contain). |
| E-mails | Resend | Invitations, réinitialisations Better Auth, messages de contact. Clé API côté serveur uniquement. |
| Antispam contact | Cloudflare Turnstile | Validé côté serveur avant tout envoi. |
| Notifications push | OneSignal | Clé REST côté serveur uniquement. Première version : push uniquement, envoi auto à la création d'un événement. |
| Tests | Vitest (déclaré dans Structure.md) | tests/ + *.test.ts sous les routes. E2E/Playwright en réflexion (voir backlog P2). |

**Langues :** site public fr, en, br ; espace adhérents et authentification en français uniquement.

---

## 2. Règles d'or et contraintes

### 2.1 Svelte 5 (AGENTS.md, Spec.md)
- Runes uniquement : $state, $derived, $effect, $props.
- Interdits : export let, $:, on:click (utiliser onclick), stores Svelte legacy pour l'état local.
