# Feuille de route

## Focus actuel

**Terminer le point restant des étapes 55-56** : transmettre `isChef` aux
profils secrétaire/admin pour l'écran d'administration des pupitres. Le
journal du 2026-11-23 indique que ce point est non critique; les migrations
RLS et fonctions de quota sont terminées sur l'environnement `test`.

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
