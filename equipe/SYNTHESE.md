# Synth�se documentaire - Site Bagad Penhars

**Objet :** relecture des documents du projet, v�rification de leur coh�rence mutuelle et extrait des exigences � destination du d�veloppeur, du tech-lead et du testeur.
**Sources lues :** `AGENTS.md` (racine) + l'int�gralit� de `docs/` (18 fichiers : 8 principaux + 10 compl�mentaires, dont les sch�mas SQL/Mermaid et l'image DrawSQL).
**R�gle observ�e :** aucune information absente n'est invent�e ; elle est consign�e comme question ouverte (section 9). Aucun fichier source du projet n'a �t� lu ni modifi�. Ce qui est �crit dans `equipe/` fait foi.

---

## 1. Stack technique

| Couche              | Choix retenu                                     | Pr�cisions                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework frontend  | SvelteKit 5 (runes) + TypeScript                 | Runes uniquement : $state, $derived, $effect, $props. Interdits : export let, $:, on:click (utiliser onclick), stores legacy pour l'�tat local.                                                    |
| Styling / UI        | Tailwind CSS, Motion                             | Tokens du th�me uniquement (couleurs, rayons, espacements). Mobile first, prefers-reduced-motion, focus visible, accessibilit� WCAG AA, interface en fran�ais.                                     |
| Identit� / sessions | Better Auth                                      | Sessions, comptes, invitations, mots de passe. Handler central dans src/lib/server/auth.ts, hooks serveur, event.locals.                                                                           |
| Base de donn�es     | Neon PostgreSQL                                  | Base bagadpenhars, branches test (dev/tests/preview) et production. Politiques RLS natives en d�fense en profondeur.                                                                               |
| ORM / migrations    | Drizzle ORM                                      | Migrations versionn�es sous drizzle/ + m�tadonn�es drizzle/meta/. Migration initiale reproductible ; migration appliqu�e jamais modifi�e (additive uniquement).                                    |
| Driver / pooling    | @neondatabase/serverless + Cloudflare Hyperdrive | Connexions via Hyperdrive. Cache de requ�tes r�serv� aux lectures publiques ind�pendantes de l'identit� (jamais lectures prot�g�es par RLS).                                                       |
| H�bergement         | Cloudflare Pages                                 | Runtime SvelteKit, bindings Neon (variables d'env) et R2.                                                                                                                                          |
| Stockage fichiers   | Cloudflare R2                                    | Deux buckets : bagad-public (objets publi�s) et bagad-private (profils, documents, albums priv�s). Quota global 8 Go (alerte 7 Go, blocage upload � 8 Go). Table storage_usage pour les compteurs. |
| Optimisation images | Cloudflare Images                                | WebP, sortie max 2 000 � 2 000 px, qualit� 82, suppression m�tadonn�es, variantes 400 � 400 (q75, cover) / 2 000 � 2 000 (q82, contain).                                                           |
| E-mails             | Resend                                           | Invitations, r�initialisations Better Auth, messages de contact. Cl� API c�t� serveur uniquement.                                                                                                  |
| Antispam contact    | Cloudflare Turnstile                             | Valid� c�t� serveur avant tout envoi.                                                                                                                                                              |
| Notifications push  | OneSignal                                        | Cl� REST c�t� serveur uniquement. Premi�re version : push uniquement, envoi auto � la cr�ation d'un �v�nement.                                                                                     |
| Tests               | Vitest (d�clar� dans Structure.md)               | tests/ + *.test.ts sous les routes. E2E/Playwright en r�flexion (voir backlog P2).                                                                                                                 |

**Langues :** site public fr, en, br ; espace adh�rents et authentification en fran�ais uniquement.

---

## 2. R�gles d'or et contraintes

### 2.1 Svelte 5 (AGENTS.md, Spec.md)

- Runes uniquement : $state, $derived, $effect, $props.
- Interdits : export let, $:, on:click (utiliser onclick), stores Svelte legacy pour l'�tat local.
