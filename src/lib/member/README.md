# Espace adhérents — client

Ce dossier contient le client de l'espace adhérents : le store alimenté par le
chargement ciblé par page, les services de mutation, les permissions et les pages.

## Fonctionnement

- Le **store** (`store.svelte.ts`) ne fabrique plus aucune donnée : il reçoit un
  socle `memberShell` (profil + compteur de notifications non lues) et des
  données de page ciblées (`memberPage`) via le chargement par page
  (contrat `CONTRAT_API.md` §7.11), et les expose en lecture.
- Toute mutation passe par un service de `services/`, qui appelle
  `member.request(action, payload)` vers `POST /api/member/action`. L'action est
  revalidée et autorisée côté serveur (Better Auth + RLS Neon) ; le serveur
  renvoie le résultat de la commande, que le client revalide via
  `invalidateAll()`.
- Les erreurs serveur remontent en `MemberApiError` (avec `status` et `code`).
  Les contrôles de `permissions.ts` restent côté client pour l'ergonomie ; ils ne
  remplacent jamais la vérification serveur.

## Organisation

| Fichier / dossier | Rôle                                                          |
| ----------------- | ------------------------------------------------------------- |
| `clock.ts`        | Date du jour (saisie de formulaires) et formatage             |
| `types.ts`        | Types de chargement ciblé par page (`CONTRAT_API.md` §3.1)   |
| `store.svelte.ts` | Store par sections, `member.request`, notifications d'interface |
| `permissions.ts`  | Droits métier (miroir des guards serveur)                     |
| `pupitres.ts`     | Liste des pupitres (`bombarde`, `cornemuse`, …)               |
| `photos.ts`       | Bibliothèque de visuels partagée client/serveur (albums)      |
| `services/`       | Mutations : construisent la commande et appliquent le retour  |
| `components/`     | Coquille, barre latérale, notifications                       |
| `pages/`          | Pages de l'espace adhérents (agenda, documents, admin…)       |

## Règles

- L'e-mail de connexion est une donnée Better Auth : il ne se modifie pas ici.
- La déconnexion est un `POST` (action de formulaire), jamais un lien `GET`.
- Aucune donnée adhérente n'est mise en cache hors du store en mémoire ; il
  n'y a pas de `localStorage`.
