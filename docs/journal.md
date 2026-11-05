# Journal de développement

## 2026-11-05

### Plateforme retenue

- Stack cible : SvelteKit 5, TypeScript, Tailwind, Motion, Better Auth, Neon
  PostgreSQL, Drizzle, Cloudflare Pages, Cloudflare R2, Resend, Cloudflare
  Turnstile et OneSignal.
- Neon utilise les branches `test` pour le développement, les tests et les
  previews, et `production` pour la production.
- Drizzle génère les migrations dans `drizzle/` avec les métadonnées de
  `drizzle/meta/`. Cloudflare Hyperdrive est retenu pour les connexions Neon.

### Décisions fonctionnelles

- Le rôle applicatif est enregistré dans `profiles.role`; `app_role` est le nom
  de l'ENUM PostgreSQL.
- Les rôles sont `member`, `chef_pupitre`, `secretaire` et `admin`.
- Les statuts sont `pending`, `active` et `suspended`.
- Les quatre pupitres sont indépendants : Bombarde, Caisse claire, Cornemuse et
  Percussion.
- Le sondage est un événement avec `is_poll = true`; les réponses sont
  `present` ou `absent`, sans table métier séparée.
- Le formulaire de contact passe par un endpoint SvelteKit, Resend et
  Cloudflare Turnstile.

### Stockage R2

- Les buckets sont `bagad-public` et `bagad-private`.
- Le quota global est limité à 8 Go; l'alerte administrateur intervient à
  7 Go; les nouveaux uploads sont bloqués à 8 Go.
- Les images sont limitées à 15 Mo et converties en WebP avec une qualité
  cible de 82, sous une dimension maximale de 6000 × 6000 pixels.
- Les fichiers OGG sont limités à 30 Mo et les PDF à 20 Mo.
- `storage_usage` suit les octets publics, privés et réservés, avec
  réconciliation entre R2 et Neon.

### Organisation du démarrage

- Le front-end et le back-end peuvent démarrer en parallèle à partir des
  contrats documentés.
- Le front-end utilise les runes Svelte 5; le back-end commence par les
  migrations, Better Auth, les guards, les routes serveur, R2 et les tests
  d'autorisation.
