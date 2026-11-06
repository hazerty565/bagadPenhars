# Feuille de route

## Focus actuel

**Fiabiliser le socle Neon/Better Auth/Cloudflare avant d'étendre les fonctions métier** : implémenter
le driver Neon, Drizzle et Hyperdrive, les guards SvelteKit, le contexte RLS
transactionnel et les policies sur les tables sensibles. La CI
`check` / `lint` / `build` est ajoutée; son premier passage et la complétion
des fonctions serveur restent à valider.

## Jalons

1. **Socle et conventions** — consignes, documentation de référence, CI et
   installation reproductible.
2. **Persistance et authentification** — décider des fournisseurs, créer les
   migrations et implémenter sessions, guards et autorisations.
3. **Fonctions adhérents** — profils, invitations, pupitres, agenda et
   présences.
4. **Contenus et fichiers** — articles, médias, partitions et accès contrôlés.
5. **Mise en production** — tests des flux critiques, configuration des
   environnements, déploiement et vérification des accès.

L'ordre et le contenu des jalons peuvent évoluer après les décisions ouvertes
de [`questions.md`](./questions.md).
