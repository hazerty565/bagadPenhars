# Journal

## 2026-10-26

### Spécification développeur

#### Choix Supabase uniquement

#### Fait

- Alignement du README, de `Context.MD` et des documents d'architecture sur
  Supabase Auth, PostgreSQL/RLS et Storage; Netlify reste l'hébergeur.
- Suppression des anciennes références de fournisseurs dans les documents
  concernés et remplacement par la cible Supabase.
- Avertissement sur le schéma et les intégrations historiques qui doivent
  encore être migrés vers Supabase.
- Remplacement des questions de choix fournisseur par des tâches de migration
  et de définition des policies RLS.

#### Reste à faire

- Migrer le code d'authentification, le schéma PostgreSQL et les fichiers vers
  Supabase; définir puis tester les policies RLS.

### Fait

- Création de `Spec.md` avec les exigences fonctionnelles, les rôles, la
  sécurité et les critères d'acceptation.
- Ajout de `Spec.md` à l'ordre de lecture dans `AGENTS.md`.
- Consignation des divergences de fournisseurs et du rôle secrétaire dans
  `docs/questions.md`.

#### Reste à faire

- Trancher les fournisseurs cibles et le modèle de permissions avant de
  développer les flux concernés.

### Fait

- Ajout des consignes communes et des renvois pour Claude, Gemini et Copilot.
- Ajout du brief, de l'architecture, de l'état du schéma, de la feuille de
  route, du backlog, des questions ouvertes et de cette entrée de journal.
- Ajout d'une CI GitHub Actions pour `check`, `lint` et `build` sur push et
  pull request.
- Suppression de la virgule finale invalide dans `package.json`, qui empêchait
  son interprétation comme JSON.
- Préservation du README déjà présent et de ses modifications locales.

### Validation

- Le JSON de `package.json` est valide et Prettier accepte les nouveaux
  documents et la configuration.
- `pnpm run check` échoue sur 15 erreurs préexistantes dans 14 fichiers,
  notamment l'authentification incomplète et des composants incompatibles avec
  le mode runes de Svelte.
- `pnpm run lint` signale deux fichiers Svelte préexistants non formatés.
- `pnpm run build` échoue sur des erreurs de compilation Svelte préexistantes.

### Reste à faire

- Corriger les échecs préexistants de `check`, `lint` et `build` afin que la CI
  puisse passer.
- Faire trancher les questions d'architecture et compléter authentification,
  contrôles d'accès et migrations.
