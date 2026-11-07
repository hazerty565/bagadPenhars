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

## 2026-11-06

### Arbitrages produit appliqués

- Les réponses aux événements restent modifiables jusqu'à minuit le lendemain
  de la date de l'événement; elles sont conservées en lecture seule après
  annulation ou clôture.
- Les événements ne stockent qu'une date sans heure; ils sont clos à minuit
  au début du jour suivant selon `Europe/Paris`.
- L'arbitrage Q-2026-11-06-07 confirme les dates civiles seules; le schéma
  DrawSQL et les critères de clôture sont alignés.
- Better Auth reste responsable de l'identité et des sessions; les rôles
  métier viennent de `profiles.role`. Les guards SvelteKit sont complétés par
  les policies RLS Neon, avec contexte `set_config(..., true)` limité à chaque
  transaction. Les lectures privées ne sont pas mises en cache par Hyperdrive.
- Cloudflare Images est retenu pour les transformations WebP et les variantes
  d'affichage; le quota R2 global reste de 8 Go.
- Le processus de suppression de compte, la cohabitation OneSignal/PWA, le
  formulaire Resend et la référence Drizzle/Neon sont consignés dans
  `docs/questions.md` et reflétés dans les documents de référence.
- Les durées de conservation des réponses, des journaux d'audit et des
  messages de contact restent à valider; aucune purge automatique
  irréversible n'est activée avant cette validation.

## 2026-11-07

### Branche de travail

- La branche `proto` est créée depuis `main` pour recevoir les changements
  locaux; `main` reste inchangée.
