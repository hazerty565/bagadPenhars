# Plan de réalisation — Bagad Penhars

> **Version cible du 2026-11-05.** Supabase, Supabase Auth/Storage/RLS et
> Netlify/Netlify Forms sont obsolètes et ne doivent pas être réimplémentés.

## 1. Plateforme

- SvelteKit 5 en TypeScript avec les runes et l'adapter Cloudflare Pages.
- Tailwind CSS, Motion, responsive mobile-first et accessibilité.
- Better Auth pour les sessions, mots de passe, vérifications e-mail et
  invitations.
- Base Neon PostgreSQL `bagadpenhars` avec Drizzle et Cloudflare Hyperdrive :
  branche `test` pour les preview et les validations, branche `production`
  pour la production.
- Cloudflare R2 avec buckets `bagad-public` et `bagad-private`; alerte et
  blocage des téléversements à 9,5 GB.
- Resend pour les invitations et les e-mails; Cloudflare Turnstile pour le
  formulaire public.
- OneSignal côté serveur pour les notifications push.

## 2. Séquence de réalisation

1. Configurer les branches Neon et les variables serveur de Cloudflare Pages.
2. Installer et configurer Better Auth avec la base Neon.
3. Créer les migrations PostgreSQL métier sur `test`, puis exécuter et tester
   leurs autorisations serveur.
4. Configurer R2 et ses préfixes public/privé.
5. Implémenter invitations, profils, activation, suspension et suppression.
6. Implémenter agenda, événements, pupitres, sondages et présences.
7. Implémenter contenus, albums, documents et formulaire de contact.
8. Implémenter OneSignal et la PWA sans mise en cache des données privées.
9. Valider CI, preview Cloudflare, accès Neon `test`, puis promotion sur
   Neon `production`.

## 3. Livrables de validation

- Connexion, déconnexion, invitation et réinitialisation testées.
- Comptes `pending`/`suspended` refusés sur toutes les routes métier.
- Droits admin, secrétaire, chef de pupitre et membre testés.
- Aucun téléchargement privé accessible sans session et autorisation.
- Aucun secret Neon, Better Auth, R2 ou OneSignal dans le client.
- Aucune page adhérent ou requête de données/fichiers dans le cache PWA.
- `check`, `lint` et `build` exécutés avant mise en production.

## 4. Questions bloquantes

Les réponses avec propositions par défaut sont dans
[`questions.md`](../docs/questions.md), notamment les mappings de branches,
le choix ORM, le quota R2, le fournisseur e-mail et le traitement des contacts.
