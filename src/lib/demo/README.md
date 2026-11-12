# Espace membre — mode démonstration

Ce dossier contient **uniquement** le jeu de données, la session simulée, les
permissions et les services de la démonstration de l’espace membre.

## Avertissements

- Toutes les données sont **fictives**. Noms, adresses e-mail, événements,
  documents et notifications sont inventés. Les portraits sont des
  illustrations SVG générées localement, jamais des photographies de personnes.
- Tout s’exécute **dans le navigateur**. Les services de ce dossier ne sont pas
  une API, ne sont pas sécurisés et ne prétendent pas l’être.
- Le mode démonstration n’existe qu’en **développement local** (`vite dev`).
  Aucune variable d’environnement, aucun cookie et aucune URL ne peuvent
  l’activer dans un build de production.
- Les futurs guards serveur (Better Auth + Neon) resteront seuls autoritaires.
  Les contrôles de permission de ce dossier servent à valider l’ergonomie et à
  refuser proprement les actions dans la démonstration ; ils ne contournent ni
  ne remplacent une vérification serveur.
- Aucun secret, jeton ou chaîne de connexion ne doit être ajouté ici ni dans le
  `localStorage`.

## Organisation

| Fichier / dossier   | Rôle                                                       |
| ------------------- | ---------------------------------------------------------- |
| `mode.ts`           | Détection `dev`, marqueur de build                         |
| `clock.ts`          | Date de démonstration figée et formatage                   |
| `types.ts`          | Types miroirs de `docs/database.md`                        |
| `fixtures/`         | Seed déterministe et contrôle d’intégrité                  |
| `store.svelte.ts`   | État réactif, persistance `localStorage`, réinitialisation |
| `session.svelte.ts` | Profil actif et changement de profil                       |
| `permissions.ts`    | Source de vérité unique des droits                         |
| `services/`         | Mutations contrôlées, interface identique au futur backend |
| `components/`       | Bandeau, sélecteur de profil, coquille de démonstration    |

## Persistance

Clé : `bagadpenhars.demo.v1`. Le bouton « Réinitialiser » du bandeau recharge
le seed. En cas de JSON invalide, de version inconnue ou de quota dépassé, le
seed est rechargé et un message discret l’indique.

## Remplacement par le backend

Les pages n’appellent que `$lib/demo/services`. Le jour de l’intégration Neon,
chaque service peut être remplacé par un appel `fetch` vers un endpoint
SvelteKit équivalent, ou par un `load` serveur, sans reconstruire les
composants d’interface.
