# Backlog

Les tâches sont classées par priorité. Les éléments terminés décrivent le
travail couvert par la présente mise à jour; les autres restent à faire.

## P0 — Bloquant

- [x] Rendre `package.json` valide pour permettre l'installation et l'exécution
      des scripts.
- [x] Ajouter une CI sur push et pull request pour `check`, `lint` et `build`.
- [ ] Exécuter les validations en CI et corriger les erreurs qui bloquent les
      commandes du projet.
- [ ] Migrer l'authentification, la base PostgreSQL et le stockage de fichiers
      vers Supabase (Auth, PostgreSQL/RLS et Storage).
- [ ] Implémenter la gestion des sessions et les guards côté serveur; vérifier
      les autorisations des actions et routes de fichiers.
- [x] Définir et mettre en œuvre un mécanisme de migrations reproductible
      (CLI Supabase et `supabase/migrations/001_initial_schema.sql`).

## P1 — Fonctions principales

- [ ] Comparer le schéma SQL avec les fonctions décrites dans le README et
      créer les migrations manquantes, notamment pour les invitations.
- [ ] Définir et tester les policies RLS pour toutes les tables et les buckets
      Supabase Storage.
- [ ] Terminer les flux d'invitation, d'approbation et de gestion des membres.
- [ ] Terminer l'agenda, les réponses de présence et les permissions par
      pupitre.
- [ ] Valider l'accès aux partitions et la gestion des médias.

## P2 — Qualité et exploitation

- [ ] Ajouter des tests d'intégration des parcours d'authentification et des
      permissions.
- [ ] Décider si les tests navigateur doivent être exécutés dans la CI.
- [ ] Vérifier la configuration des environnements, des emails et du stockage
      lors du déploiement.
- [ ] Faire relire les traductions bretonnes.
