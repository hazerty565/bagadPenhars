# Backlog

Les tâches sont classées par priorité. Les éléments terminés décrivent le
travail couvert par la présente mise à jour; les autres restent à faire.

## P0 — Bloquant

- [x] Rendre `package.json` valide pour permettre l'installation et l'exécution
      des scripts.
- [x] Ajouter une CI sur push et pull request pour `check`, `lint` et `build`.
- [ ] Exécuter les validations en CI et corriger les erreurs qui bloquent les
      commandes du projet.
- [ ] Mettre en place Better Auth, Neon PostgreSQL et Cloudflare R2.
- [ ] Configurer Drizzle, Cloudflare Hyperdrive, les deux buckets R2, Resend et
      Cloudflare Turnstile.
- [ ] Ajouter le driver `@neondatabase/serverless` et intégrer son accès à
      Neon via Hyperdrive.
- [ ] Examiner le modèle PostgreSQL sur la branche Neon `test` et établir son
      application reproductible sans modifier une migration déjà appliquée.
- [ ] Finaliser les migrations additives nécessaires pour les invitations,
      profils, membres, événements, réponses et suppression de compte.
- [ ] Implémenter la gestion des sessions et les guards côté serveur; vérifier
      les autorisations des actions et routes de fichiers.
- [ ] Activer RLS et écrire les policies des tables sensibles; initialiser
      `set_config(..., true)` dans chaque transaction protégée et exclure du
      cache partagé Hyperdrive les lectures dépendantes de l'utilisateur.
- [ ] Définir et mettre en œuvre un mécanisme de migrations reproductible pour
      Neon.
- [ ] Implémenter le quota R2 de 8 Go, l'alerte à 7 Go, la réservation Neon,
      la validation des formats et tailles, les conversions WebP et la
      réconciliation R2/Neon.

## P1 — Fonctions principales

- [ ] Comparer le schéma SQL avec les fonctions décrites dans le README et
      créer les migrations manquantes, notamment pour les invitations.
- [ ] Définir et tester les autorisations serveur pour toutes les routes,
      actions et objets R2.
- [ ] Ajouter les tests SQL d'accès pour les comptes anonyme, membre actif,
      chef de pupitre, secrétaire et admin.
- [ ] Tester l'absence de contexte RLS et l'isolation de deux identités sur
      une connexion réutilisée par Hyperdrive.
- [ ] Implémenter atomiquement la suspension et la suppression des comptes,
      avec cascade des réponses et retrait des données Storage associées.
- [ ] Fermer les réponses des événements passés par une procédure PostgreSQL
      validée, sans lancer de purge automatique tant que le périmètre exact
      de suppression n'est pas confirmé.
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
