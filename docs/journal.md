# Journal

## 2026-10-27

### Référencement de la spécification UI

#### Fait

- Ajout de `docs/Spec_UI.md` aux documents de référence du README pour
  distinguer la spécification de l'interface de la spécification développeur.
- Aucun changement apporté au contenu de la spécification UI.

#### Validation

- Vérification du lien vers `docs/Spec_UI.md` dans le README.

### Déplacement de la spécification développeur

#### Fait

- Déplacement de `Spec.md` vers `docs/Spec.md`.
- Mise à jour des références dans `AGENTS.md`, `README.md` et ce journal.

#### Validation

- Vérification des références au nouvel emplacement et de l'état Git.

## 2026-10-26

### Création du suivi du projet

#### Fait

- Création de `docs/suivi.md` pour regrouper les éléments terminés, ceux qui
  restent à faire et les décisions ouvertes, à partir de la feuille de route,
  du backlog et du journal.
- Intégration de l'ancienne liste de suivi du README, notamment des tâches de
  traduction, d'invitation, de dashboard, de notifications, de tests et de
  déploiement.
- Ajout de cases `[x]` pour les éléments faits et `[o]` pour ceux à faire.
- Conservation des statuts de l'ancienne liste fournie : structure SvelteKit,
  routage public FR / EN / BR et blocage des comptes `pending` marqués faits.
- Échéance globale laissée « à définir »; aucune date n'a été inventée.

#### Reste à faire

- Confirmer la date limite du projet et la reporter dans `docs/suivi.md`.

#### Validation

- Vérification de cohérence avec `docs/roadmap.md`, `docs/backlog.md` et les
  entrées récentes du journal. Documentation uniquement.

### Création de la migration initiale Supabase (`supabase/migrations/001_initial_schema.sql`)

#### Fait

- Initialisation du dossier Supabase via `supabase init` (générant `supabase/config.toml`).
- Création du premier fichier de migration versionné officiel `supabase/migrations/001_initial_schema.sql` contenant :
  - L'extension `pgcrypto`.
  - Les types enum officiels : `app_role`, `event_visibility` (`public`, `pupitre`, `interne`), `response_status` (`present`, `absent`).
  - Les fonctions d'aide RLS `public.my_role_level()` et `public.my_pupitre_ids()` (`security definer`, `search_path = ''`).
  - L'ensemble des tables du domaine avec clés étrangères et cascades d'intégrité référentielle (`pupitres`, `profiles`, `profile_pupitres`, `bureau_positions`, `invitations`, `invitation_pupitres`, `event_series`, `events`, `event_pupitres`, `event_responses`, `documents`, `articles`, `albums`, `media`, `notification_log`, `audit_log`).
  - RLS activée sur 100% des tables avec policies optimisées (InitPlan `(select public.my_role_level())`).
  - Le trigger `on_auth_user_created` sur `auth.users` (`handle_new_user`) gérant l'expiration des invitations (7 jours), l'assignation des pupitres et la création du profil en `pending`.
  - Les index critiques de performance pour les jointures et filtres RLS.
  - Le seed initial des 4 pupitres (`Bombarde`, `Cornemuse`, `Caisse claire`, `Percussion`).

#### Validation

- Migration syntaxiquement valide, complète et conforme à `docs/database.md` et `docs/Spec.md`.

### Arbitrage et alignement de la visibilité des événements (`public`, `interne`, `pupitre`)

#### Fait

- Intégration de la règle de visibilité décidée par le client :
  - `public` : visible par tous (visiteurs non connectés et membres connectés).
  - `interne` : visible par tous les membres connectés approuvés.
  - `pupitre` : visible **exclusivement** par les membres du ou des pupitres ciblés (et la secrétaire/admin).
- Alignement du type enum PostgreSQL `event_visibility as enum ('public', 'pupitre', 'interne')`.
- Mise à jour des policies RLS de lecture dans `docs/database.md` scindant distinctement ces 3 cas.
- Résolution définitive de l'ancienne divergence dans `README.md`, `docs/Spec.md` (§4.4), `docs/brief.md` et `docs/questions.md` (Question 22).

#### Validation

- Chaîne documentaire entièrement alignée et sans ambiguïté.

### Simplification stricte de `response_status` (`present` / `absent`)

#### Fait

- Mise à jour du type enum PostgreSQL `response_status` dans `docs/database.md` pour restreindre strictement les valeurs autorisées à `('present', 'absent')` (suppression de `yes`, `no`, `maybe`).
- Harmonisation corrélative dans `docs/Spec.md` (§4.4 et §10 Étape D) et `docs/questions.md` (Question 30).

#### Validation

- Cohérence vérifiée sur l'ensemble de la documentation.

### Améliorations expertes de l'architecture de données (`docs/database.md`)

#### Fait

- Mise à jour de `docs/database.md` suite à l'audit senior Supabase & PostgreSQL :
  - **Multi-pupitres** : Ajout formel de la table de liaison `event_pupitres` (au lieu d'un `pupitre_id` unique) et de `invitation_pupitres` dans le schéma et la matrice des droits.
  - **RLS `event_responses`** : Découpage complet des policies (`select`, `insert`, `update`) pour autoriser la lecture par le chef de pupitre (`my_pupitre_ids()`) et la secrétaire/admin, et permettre le pointage des présences réelles.
  - **Performance InitPlan** : Encapsulation systématique des fonctions de rôle dans `(select public.my_role_level())` dans toutes les policies.
  - **Storage V1** : Retrait du bucket `bagad-avatars` de la V1 conformément aux décisions validées (initiales uniquement).
  - **Trigger d'inscription** : Précision du contrôle d'expiration d'invitation (7 jours) et de la copie des pupitres vers `profile_pupitres`.
  - **Indexation & Cascades** : Ajout de la checklist des index critiques RLS et des directives `ON DELETE CASCADE` / `RESTRICT`.

#### Validation

- `docs/database.md` complet, rigoureux et prêt pour l'écriture des migrations Supabase.

### Validation de la question 30 (Modélisation des sondages dans `events`)

#### Fait

- Intégration de la décision validée par le client pour la Question 30 dans `docs/questions.md`.
- Unification du modèle : suppression de la table `polls` au profit du champ `is_poll BOOLEAN NOT NULL DEFAULT FALSE` dans la table `events`.
- Centralisation des réponses dans `event_responses`, avec distinction des intentions de présence (`yes` / `no` / `maybe`) et des présences réelles (`present` / `absent`).
- Mise à jour corrélative de `docs/database.md` (§2 types, §4 tables, §5 matrice des droits) et de `docs/Spec.md` (§4.4 et §10 Étape D).

#### Validation

- Cohérence vérifiée sur l'ensemble de la chaîne documentaire (`questions.md`, `database.md`, `docs/Spec.md`).

### Validation de la question 27 (Audience des notifications de sondage)

#### Fait

- Intégration de la décision validée par le client pour la Question 27 dans `docs/questions.md`.
- L'audience des push dépend désormais formellement de la portée du sondage : pupitre ciblé uniquement pour les sondages de pupitre, tous les membres pour les sondages internes et publics, sous réserve des préférences activées.
- Mise à jour corrélative de `docs/Spec.md` (§4.6 et §8).

#### Validation

- Alignement complet entre `docs/questions.md` et `docs/Spec.md`.

### Nettoyage et réinitialisation de `package.json`

#### Fait

- Réinitialisation et assainissement de `package.json` : suppression de 12+ dépendances obsolètes ou inutilisées (`better-auth`, `kysely`, `pg`, `@types/pg`, `@netlify/blobs`, `nodemailer`, `@types/nodemailer`, `@tiptap/*`, `leaflet`, `svelte-i18n`, `sveltekit-superforms`, `@sveltejs/adapter-static`).
- Ajout des dépendances officielles de la stack cible : `@supabase/supabase-js`, `@supabase/ssr`, et conservation de `lucide-svelte` et `zod`.
- Déplacement de `@sveltejs/adapter-netlify` dans `devDependencies` conformément aux conventions SvelteKit.
- Neutralisation de l'import erroné de `@better-auth/infra` dans `src/lib/auth/auth.ts`.

#### Validation

- `package.json` valide, minimal et aligné sur les règles de `AGENTS.md` et `docs/Spec.md`.

### Revue des spécifications pour développeur senior & ouverture des arbitrages

#### Fait

- Revue complète de `docs/Spec.md`, `README.md`, `AGENTS.md` et de l'ensemble du dossier `docs/` dans une posture de Chef de Projet pour un développeur senior (5 ans d'expérience SvelteKit 5 runes, Tailwind, Supabase).
- Enrichissement de la section 6 de `docs/Spec.md` avec des directives techniques concrètes : contrats `@supabase/ssr` dans les hooks, gestion rigoureuse des runes (`$state`, `$derived`, `$props`), formulaires avec `use:enhance`, tokens Tailwind et A11y (`focus-visible`, `motion-reduce`).
- Ajout des questions 30 (unification des sondages dans la table `events`) et 31 (purge des dépendances legacy Better Auth / Kysely / pg / Netlify Blobs) dans `docs/questions.md`.

#### Validation

- `git diff --check` vérifié sans incohérence.
- Aucune régression sur les documents de référence.
### Alignement des policies documentées pour les événements

#### Fait

- Confirmation : tous les membres approuvés peuvent lire les événements
  ciblés par pupitre; un chef ne crée et gère que ceux de son ou ses pupitres.
- Alignement de la matrice des droits, de la policy de lecture et de l'exemple
  de test dans `docs/database.md`; seuls l'admin et la secrétaire créent les
  événements communs internes et ceux de l'agenda public.
- Retrait de la question 30, désormais résolue. La spécification décrivait déjà
  ce comportement.

#### Validation

- Relecture des formulations de la question 22, de `docs/Spec.md` et de la policy
  documentée pour vérifier leur cohérence.
- `git diff --check` réussit. `npm run check` et `npm run build` échouent sur
  des erreurs Svelte/TypeScript préexistantes; `npm run lint` s'arrête sur des
  écarts Prettier dans de nombreux fichiers du dépôt.

### Harmonisation du nom du document PWA

#### Fait

- Renommage de `docs/Pwa.MD` en `docs/pwa.md`, conformément aux références
  dans `AGENTS.md`.
- Mise à jour des liens et références dans `README.md` et `docs/Spec.md`, puis
  retrait de la question documentaire désormais résolue.

#### Validation

- Vérification des références au nom du document PWA et de l'état Git.
- Documentation uniquement : aucune commande de validation applicative
  exécutée.

### Harmonisation du README

#### Fait

- Réécriture du README pour refléter les décisions validées sur les langues,
  rôles, invitations, pupitres, événements, documents, médias et notifications.
- Distinction entre la cible Supabase/Netlify et les éléments historiques
  encore présents dans le dépôt; correction des instructions d'installation
  et des commandes selon `package.json` et `pnpm-lock.yaml`.
- Évaluation des réponses : les décisions produit principales sont lisibles;
  les notifications de sondage, le calendrier et la confirmation Netlify
  Forms, ainsi que la conservation et la suppression restent à préciser.
- Signalement d'une divergence entre la décision de visibilité des événements
  par pupitre et le modèle RLS proposé dans `docs/database.md`; ajout d'une
  question à valider dans `docs/questions.md`.

#### Validation

- Relecture croisée du README avec `docs/Spec.md`, `docs/questions.md`,
  `docs/architecture.md`, `docs/database.md` et `package.json`.
- Documentation uniquement : aucune commande de validation applicative
  exécutée.

### Mise à jour de la spécification développeur

#### Fait

- Lecture du README, du brief, de l'architecture, de la spécification et des
  réponses renseignées dans `docs/questions.md`.
- Mise à jour de `docs/Spec.md` pour intégrer les décisions confirmées : langues
  publiques et privées, rôle secrétaire, invitations de sept jours, droits
  sur les profils et événements, sondages, fuseau horaire, médias,
  notifications, contact Netlify Forms, environnements Supabase et données
  vierges.
- Mise à jour des décisions 20 à 26 dans `docs/questions.md`; ajout des
  décisions 27 à 29 sur les droits de gestion des sondages par rôle, Netlify
  Forms et les conversions/limites des images; conservation et suppression
  restent à préciser.
- Synchronisation de `docs/Spec.md` avec ces réponses : les chefs gèrent les
  événements de leur pupitre, les vidéos sont refusées, les photos JPG/JPEG
  de 20 Mo maximum sont converties en WebP, et l'intégration du formulaire
  Netlify reste en attente de confirmation de calendrier.

#### Reste à faire

- Confirmer l'audience des notifications de sondage et le calendrier
  d'intégration Netlify Forms; définir les durées de conservation et le
  processus de suppression de compte.

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

- Création de `docs/Spec.md` avec les exigences fonctionnelles, les rôles, la
  sécurité et les critères d'acceptation.
- Ajout de `docs/Spec.md` à l'ordre de lecture dans `AGENTS.md`.
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
