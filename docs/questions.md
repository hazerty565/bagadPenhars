# Décisions validées

Ce document conserve uniquement les décisions validées utiles à l'équipe de
développement. Il ne contient plus de questions ni de plateformes historiques.
Chaque nouvelle ambiguïté produit doit être ajoutée ici avec sa date, son
raisonnement, les options envisagées et la décision du chef de projet.

## 2026-11-05 — Plateforme

- L'hébergement est assuré par Cloudflare Pages.
- Neon PostgreSQL héberge `bagadpenhars`; les branches sont `test` et
  `production`.
- Drizzle génère les migrations; Cloudflare Hyperdrive est le chemin de
  connexion retenu.
- Better Auth fournit les sessions, comptes, invitations et mots de passe.
- Resend envoie les invitations, réinitialisations et messages de contact.
- Cloudflare Turnstile protège le formulaire de contact.
- Cloudflare R2 fournit les deux buckets `bagad-public` et `bagad-private`.
- OneSignal fournit les notifications push.

## 2026-11-05 — Identité et rôles

- `profiles.role` est la colonne applicative lue côté serveur.
- `app_role` est le nom de l'ENUM PostgreSQL contenant `member`,
  `chef_pupitre`, `secretaire` et `admin`.
- `account_status` contient indépendamment `pending`, `active` ou `suspended`.
- Seule la secrétaire et l'administrateur peuvent inviter, valider ou
  suspendre des comptes selon les matrices d'autorisation.
- Les titres honorifiques du bureau ne donnent aucun droit applicatif.

## 2026-11-05 — Pupitres et événements

- Bombarde, Caisse claire, Cornemuse et Percussion sont quatre pupitres
  indépendants.
- `is_chef` associe un chef aux pupitres qu'il dirige.
- Les événements peuvent cibler un pupitre, plusieurs pupitres ou tous les
  pupitres.
- Secrétaire et administrateur peuvent gérer les événements multi-pupitres et
  globaux.
- Un chef ne peut gérer que les événements des pupitres qu'il dirige.
- Le sondage est représenté par `events.is_poll`.
- Les réponses aux sondages utilisent uniquement `present` et `absent`.
- Les réponses disparaissent lors de la suspension ou suppression du compte.

## 2026-11-05 — Formulaire de contact

- Le formulaire appelle un endpoint SvelteKit exécuté sur Cloudflare Pages.
- Le serveur envoie le message avec Resend.
- Une confirmation peut être envoyée à l'expéditeur.
- Les pièces jointes ne sont pas acceptées.
- La soumission est protégée par Cloudflare Turnstile.

## 2026-11-05 — Stockage R2

- Le quota global est de 8 Go; l'alerte administrateur intervient à 7 Go et
  les nouveaux uploads sont bloqués à 8 Go.
- JPG, JPEG, PNG et WebP sont acceptés jusqu'à 15 Mo, limités à
  6000 × 6000 pixels et convertis en WebP avec qualité cible 82.
- OGG est accepté jusqu'à 30 Mo; PDF est accepté jusqu'à 20 Mo.
- Les limites et formats sont contrôlés côté serveur.
- Neon/Drizzle conserve les compteurs publics, privés et réservés.
- La réservation, la confirmation, la libération et la réconciliation sont
  transactionnelles ou reproduites côté serveur.
- Les suppressions et remplacements mettent le compteur à jour.

## 2026-11-05 — Organisation du développement

- Le front-end et le back-end démarrent en parallèle à partir des contrats
  documentés.
- Le front-end stabilise d'abord l'interface publique et privée en Svelte 5,
  avec données temporaires si nécessaire.
- Le back-end commence par les migrations, l'identité, les guards, les charges
  et actions serveur, R2 et les tests d'autorisation.
