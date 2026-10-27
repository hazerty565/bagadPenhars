# Suivi du projet

> État du projet : 26 octobre 2026
> Échéance globale : **à définir**

`[x]` = fait · `[o]` = à faire

## Déjà fait

- [x] Mettre en place les documents de référence, la feuille de route, le
  backlog et le journal.
- [x] Rendre `package.json` valide et ajouter la CI sur push et pull request.
- [x] Mettre en place la structure SvelteKit.
- [x] Mettre en place le routage multilingue FR / EN / BR du site public.
- [x] Bloquer l'accès à l'espace adhérents pour les comptes `pending`.
- [x] Confirmer Supabase comme cible pour l'authentification, la base de
  données et le stockage, et aligner la documentation.
- [x] Compléter la spécification avec les décisions fonctionnelles confirmées
  et consigner les décisions encore ouvertes.
- [x] Aligner la documentation des événements et des droits par pupitre.

## À faire — priorité bloquante

- [o] Faire passer `check`, `lint` et `build`, puis valider leur exécution en
  CI. Les dernières vérifications ont encore signalé des erreurs préexistantes.
- [o] Migrer l'authentification, la base PostgreSQL et les fichiers vers
  Supabase (Auth, PostgreSQL/RLS et Storage).
- [o] Mettre en place les sessions et les guards côté serveur; vérifier les
  autorisations des actions et des routes de fichiers.
- [o] Définir et mettre en œuvre un mécanisme de migrations reproductible.
- [o] Définir et tester les policies RLS de toutes les tables et des buckets
  Supabase Storage.
- [o] Comparer le schéma SQL aux fonctionnalités prévues et créer les
  migrations manquantes, notamment pour les invitations.

## À faire — fonctionnalités principales

- [o] Terminer le flow d'invitation et la gestion des membres.
- [o] Terminer le dashboard : agenda, partitions et profil.
- [o] Terminer les sections chef de pupitre et admin.
- [o] Terminer les événements, les réponses de présence et les permissions
  par pupitre.
- [o] Valider la gestion des médias et l'accès aux documents.
- [o] Intégrer les notifications OneSignal.

## À faire — qualité et mise en production

- [o] Compléter les traductions EN et BR; faire relire le breton.
- [o] Gérer et vérifier les pages d'erreur 401, 403, 404 et 500.
- [o] Ajouter des tests pour l'authentification, les permissions, les guards
  et les traductions.
- [o] Ajouter des tests E2E avec Playwright.
- [o] Décider si les tests navigateur doivent être exécutés dans la CI.
- [o] Vérifier et terminer l'affichage responsive sur mobile.
- [o] Vérifier les environnements, les emails et le stockage lors du
  déploiement.
- [o] Déployer et vérifier le site sur Netlify.

## Décisions encore ouvertes

- [o] Confirmer l'audience des notifications de sondage et le calendrier
  d'intégration de Netlify Forms.
- [o] Définir les durées de conservation et le processus de suppression de
  compte.

La date limite sera ajoutée lorsque l'échéance sera confirmée. Le détail des
tâches et leur ordre de priorité restent suivis dans le [backlog](./backlog.md);
les validations et les changements réalisés sont consignés dans le
[journal](./journal.md).
