# Décisions validées et questions ouvertes

La première partie conserve les décisions validées utiles à l'équipe de
développement. Les questions non tranchées sont consignées à la fin avec leur
date, leur raison et une proposition; elles ne deviennent pas des exigences
avant validation par le chef de projet.

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
- Les réponses restent après suspension et sont anonymisées lors de la
  suppression du compte si elles sont conservées à des fins historiques
  (arbitrage du 2026-11-06).

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

## Arbitrages reçus — 2026-11-06

### Q-2026-11-06-01 — Clôture et retrait des réponses d'événement

- **Question :** Quand les réponses doivent-elles être verrouillées, et un
  membre peut-il retirer sa réponse avant cette échéance ?
- **Pourquoi :** [`event.md`](./event.md) décrit un ancien modèle `agenda`
  fondé sur une date seule, avec réponses jamais supprimées; la
  [`Spec.md`](./Spec.md) et le [`brief.md`](./brief.md) retiennent `events`,
  des dates avec fuseau et la suppression des réponses à la suspension ou à la
  suppression du compte. Les règles de modification après la fin ou
  l'annulation ne sont pas harmonisées. Cela affecte la migration, les actions
  serveur, l'interface et les tests des deux équipes.
- **Proposition initiale :** Traiter les exemples de [`agenda.md`](./agenda.md) et
  [`event.md`](./event.md) comme historiques; suivre le modèle `events` de la
  spécification. Autoriser le propriétaire à modifier ou retirer sa réponse
  jusqu'à `end_at` en `Europe/Paris`; verrouiller les réponses après la fin ou
  l'annulation, sans effacer celles déjà enregistrées. Conserver la règle
  validée de suppression des réponses lors de la suspension ou suppression du
  compte.
- **État :** Décidée.
- **Décision :** Suivre les règles de [`event.md`](./event.md) et
  [`agenda.md`](./agenda.md), qui se complètent. La réponse peut être modifiée
  jusqu'à minuit le lendemain de la date de l'événement, sans historique.
  Après clôture ou annulation, elle est en lecture seule et n'est pas
  supprimée. Mettre à jour le [`brief.md`](./brief.md) et la
  [`Spec.md`](./Spec.md) en conséquence.

### Q-2026-11-06-02 — Traitement des images et service Cloudflare Images

- **Question :** Confirme-t-on Cloudflare Images pour les transformations et
  une dimension de sortie maximale de 2000 × 2000 pixels ?
- **Pourquoi :** [`media.md`](./media.md) présente Cloudflare Images et une
  sortie de 2000 × 2000 pixels, mais décrit aussi un quota de 10 Go. Le
  [`brief.md`](./brief.md) et la décision R2 ci-dessus fixent le quota à 8 Go
  et ne valident pas explicitement Cloudflare Images ni la dimension de sortie;
  ils fixent seulement les limites du fichier source et la conversion WebP.
  Le choix change le pipeline d'upload, la configuration Cloudflare et les
  coûts éventuels.
- **Proposition initiale :** Garder le quota global de 8 Go comme seule règle valide.
  Confirmer Cloudflare Images et la limite de sortie de 2000 × 2000 avec
  l'association avant d'en faire une dépendance opérationnelle; à défaut,
  limiter le travail backend aux contrôles et au stockage prévus, sans
  introduire ce service ni inventer une autre dimension de sortie.
- **État :** Décidée.
- **Décision :** Suivre les règles de transformation et d'affichage de
  [`media.md`](./media.md), notamment Cloudflare Images, WebP jusqu'à
  2000 × 2000 pixels et variantes 400 × 400 / 2000 × 2000. Le quota global
  reste celui validé le 5 novembre : 8 Go, alerte à 7 Go et blocage à 8 Go.
  Mettre à jour le [`brief.md`](./brief.md) et corriger le quota historique
  de 10 Go dans [`media.md`](./media.md).

### Q-2026-11-06-03 — Conservation et suppression des données personnelles

- **Question restante :** Quelles durées de conservation appliquer aux
  réponses aux événements, aux journaux d'audit et aux messages de contact ?
- **Pourquoi :** La [`Spec.md`](./Spec.md), le [`README.md`](../README.md) et
  le [`backlog.md`](./backlog.md) signalent ces règles comme ouvertes. Le
  schéma documente une table de demandes de suppression, mais ne suffit pas à
  définir les délais ni les données à effacer ou anonymiser. Cela conditionne
  les suppressions en base, les tâches de maintenance et les tests backend.
- **État :** Partiellement décidée; les durées de conservation restent
  ouvertes.
- **Décision :** Un membre peut demander la suppression de son compte. Le
  compte est immédiatement désactivé; l'administrateur traite la demande,
  supprime les données personnelles, les photos de profil et les associations
  avec les pupitres, puis anonymise les réponses conservées à des fins
  historiques. Les données soumises à une obligation légale sont conservées
  séparément avec un accès restreint. L'administrateur clôt la demande et
  notifie le membre. Aucune purge automatique irréversible n'est activée avant
  validation des durées par l'association.

### Q-2026-11-06-04 — Service workers PWA et OneSignal

- **Question :** Quel service worker unique doit contrôler le site en
  production : celui de OneSignal ou un worker applicatif intégrant les
  notifications ?
- **Pourquoi :** [`pwa.md`](./pwa.md) indique qu'un même périmètre ne peut pas
  être contrôlé par deux service workers et laisse deux pistes ouvertes.
  [`Spec.md`](./Spec.md) interdit d'activer le worker PWA en production avant
  d'avoir tranché. Le choix relève principalement du front-end, mais bloque la
  validation du cache et des notifications.
- **Proposition initiale :** Ne publier aucun worker applicatif tant que
  l'intégration OneSignal n'a pas été vérifiée en développement et en
  production. Retenir ensuite une seule portée de worker, sans cache des pages
  ni données membres.
- **État :** Décidée pour le produit; choix technique délégué au front-end.
- **Décision :** La PWA sert aux notifications push OneSignal et doit être
  installée sur Android et iOS pour les recevoir. Aucun mode hors-ligne n'est
  prévu pour les membres et aucune page ni donnée membre n'est mise en cache.
  Le développeur front-end choisit et teste l'architecture compatible avec
  OneSignal avant l'activation en production.

### Q-2026-11-06-05 — Destinataire et confirmation du formulaire de contact

- **Question :** Quelle adresse officielle reçoit les messages et une
  confirmation doit-elle être envoyée à chaque expéditeur ?
- **Pourquoi :** Resend et Turnstile sont retenus, mais le destinataire et la
  confirmation sont décrits comme restant à valider dans le
  [`README.md`](../README.md); la [`Spec.md`](./Spec.md) demande une
  confirmation tandis que la décision du 5 novembre la rend facultative. Le
  formulaire ne peut pas être validé de bout en bout sans cette règle.
- **Proposition initiale :** Fournir l'adresse officielle via une variable
  d'environnement serveur et envoyer une confirmation à l'expéditeur après
  succès de l'envoi à l'adresse de l'association. Ne jamais exposer l'adresse
  de destination ni les secrets Resend dans le navigateur.
- **État :** Décidée.
- **Décision :** Le message est envoyé avec Resend à l'adresse officielle
  configurée dans une variable d'environnement serveur, attendue comme
  `bagadpenhars@gmail.com`. La clé API et l'adresse de réception ne sont
  jamais exposées au navigateur. Après succès de l'envoi à l'association, un
  accusé de réception est envoyé à l'expéditeur; aucun accusé de succès n'est
  envoyé si la remise du message à l'association échoue.

### Q-2026-11-06-06 — Référence du schéma pour les migrations Neon

- **Question :** Confirme-t-on que les fichiers de schéma DrawSQL restent des
  références métier seulement, et que les migrations Neon seront créées à
  partir du modèle Drizzle retenu, sans exécuter la migration Supabase 005 ?
- **Pourquoi :** Les fichiers
  [`bagad-penhars-schema-drawsql.sql`](./bagad-penhars-schema-drawsql.sql) et
  [`bagad-penhars-schema.mmd`](./bagad-penhars-schema.mmd) citent la migration
  Supabase 005 comme source, alors que la cible documentée est Neon/Drizzle et
  interdit de réutiliser les anciennes migrations. Le diagramme Mermaid ne
  représente notamment pas `profile_pupitres.is_chef`, contrairement au SQL et
  au modèle produit. Une référence non clarifiée peut conduire à un schéma
  backend incomplet.
- **Proposition initiale :** Utiliser [`database.md`](./database.md) et les décisions
  produit comme contrat courant; considérer les fichiers DrawSQL comme
  documents de référence à corriger, pas comme des migrations exécutables.
  Créer une migration Drizzle initiale reproductible pour Neon et y inclure
  notamment `profile_pupitres.is_chef`.
- **État :** Décidée.
- **Décision :** Les fichiers DrawSQL `.sql` et `.mmd` sont des références
  métier et de visualisation, jamais des migrations exécutables.
  [`database.md`](./database.md) et les décisions produit validées forment le
  contrat fonctionnel; Drizzle est la référence technique. Les migrations
  Neon sont générées depuis Drizzle sous forme d'une migration initiale
  complète et reproductible, indépendante des migrations Supabase. Aucune
  migration Supabase, notamment la 005, n'est réutilisée. Les fichiers DrawSQL
  sont corrigés pour correspondre au modèle retenu, notamment
  `profile_pupitres.is_chef`.

### Q-2026-11-06-07 — Dates seules ou événements avec heures

- **Question initiale :** Les événements doivent-ils stocker des heures de
  début et de fin, ou seulement une date ?
- **Pourquoi :** [`event.md`](./event.md) et les exemples d'agenda utilisent
  une date seule, tandis que [`Spec.md`](./Spec.md) et les schémas DrawSQL
  décrivaient des heures (`start_at`, `end_at`). Cette divergence affectait le
  schéma backend, le formulaire frontend et le calcul de clôture.
- **État :** Décidée le 2026-11-06.
- **Décision :** Un événement ne stocke qu'une date, sans heure de début ni
  de fin. Il est ouvert aux réponses pendant sa date, puis clos à minuit au
  début du jour suivant (par exemple, un événement daté du 7 novembre est clos
  dès le 8 novembre à 00 h 00). Le stockage est de type SQL `DATE`; le
  traitement de la date courante pour les règles métier se fait selon
  `Europe/Paris`.
- **Conséquences :** Les formulaires ne demandent pas d'heure; le schéma
  utilise un champ date seul; les réponses deviennent en lecture seule dès
  minuit le lendemain. Les références aux heures et aux colonnes
  `start_at`/`end_at` dans les contrats et schémas doivent être supprimées.

## 2026-11-06 — Architecture d'accès aux données

### Q-2026-11-06-08 — RLS Neon, source des rôles et contexte Hyperdrive

- **Question initiale :** Comment combiner RLS Neon, les guards SvelteKit,
  Better Auth et le pooling/cache Hyperdrive, et quelle source fait autorité
  pour les rôles métier ?
- **Pourquoi :** La proposition de stack introduisait RLS et `set_config()`,
  alors que les règles précédentes exigeaient déjà des autorisations serveur
  et réservaient `profiles.role` comme source métier. Un contexte de session
  persistant ou un cache partagé pour des requêtes RLS pourrait mélanger les
  données entre utilisateurs d'une connexion poolée.
- **État :** Décidée le 2026-11-06.
- **Décision :** Better Auth authentifie l'identité et gère les sessions.
  `profiles.role` et `profiles.account_status` restent les seules sources
  d'autorité pour les rôles et statuts métier. Les guards SvelteKit et les
  politiques RLS Neon/PostgreSQL sont cumulés : l'UI filtre le menu côté
  serveur, chaque route/action vérifie ses permissions et chaque table
  sensible applique des policies explicites. Le contexte est établi avec
  `set_config(..., true)` au début de la transaction et reste limité à cette
  transaction. Hyperdrive sert au pooling; les lectures privées dépendantes
  du contexte RLS ne sont jamais servies depuis un cache partagé.
- **Conséquences :** Les migrations doivent activer RLS et définir les
  policies des tables sensibles. Les tests couvrent les accès anonymes et par
  rôle, l'absence de contexte ainsi que deux utilisateurs successifs sur une
  connexion réutilisée. Le menu filtré ne constitue pas un contrôle d'accès;
  toute URL directe reste protégée par le serveur.

## 2026-11-07 — Questions issues de la relecture de bout en bout

### Q-2026-11-07-01 — Besoin fonctionnel concret au-delà du socle technique

- **Date :** 2026-11-07
- **Problème :** Le client n'a exprimé aucun besoin fonctionnel métier concret à implémenter par le développeur backend et le développeur frontend. Le plan actuel (`equipe/PLAN.md`) couvre uniquement le focus actuel : socle Neon/Better Auth/Cloudflare, CI, gardes d'accès, contexte RLS transactionnel et policies sur les tables sensibles.
- **Pourquoi :** Toute étape fonctionnelle supplémentaire serait une supposition interdite ; le plan ne peut pas engager les développeurs sur un besoin métier non exprimé par le client.
- **Proposition :** Poursuivre l'implémentation du focus actuel (socle) telle que décrite aux étapes 1 à 8 de `equipe/PLAN.md`. Le besoin fonctionnel sera ajouté à ce plan (nouvelle étape ou extension d'une étape existante) une fois tranché par le client.

### Décision client — Q-2026-11-07-01

Le périmètre fonctionnel du projet Bagad Penhars est déjà défini dans les documents de référence et dans les huit étapes du plan d'implémentation.

Aucun nouveau besoin fonctionnel n'est à inventer ni à demander.

Les développeurs backend et frontend doivent réaliser les fonctionnalités décrites dans le plan, en respectant les spécifications, les décisions validées et les critères de fin de chaque étape.

**Ordre de réalisation :**

- Étapes 1 à 3 : socle technique et sécuritaire.
- Étapes 4 à 7 : fonctionnalités métier de l'application.
- Étape 8 : validation globale et qualité.

Toute fonctionnalité supplémentaire non prévue devra faire l'objet d'une validation préalable du client.

L'architecte doit donc s'appuyer sur les besoins déjà documentés et ne pas confondre absence de nouveau besoin avec absence de besoin fonctionnel.

### Q-2026-11-07-02 — Couleurs et icônes définitives du thème PWA

- **Date :** 2026-11-07
- **Problème :** Le fichier `docs/pwa.md` §3 indique que les couleurs du manifest sont "à remplacer par celles du thème du site", et §10 liste "Couleurs et icônes définitives du thème" comme point restant à définir. Aucune couleur primaire ni palette n'est fixée pour le site.
- **Pourquoi :** Le design du header, du hero et des composants UI dépend de ces couleurs ; sans elles, l'intégration visuelle reste bloquée et le manifest PWA n'est pas finalisé.
- **Proposition :** Demander au client ou au bureau de l'association de valider la couleur primaire et la palette (ou proposer une teinte par défaut cohérente avec l'identité visuelle du bagad), puis mettre à jour `docs/pwa.md`, `tailwind.config.js` et `static/manifest.webmanifest`.

### Décision client — Q-2026-11-07-02

il y a un exemple de design dans le dossier `src\autre`, l'icone de l'aplication arrivera plus tard dans le dossier `src\routes\public`

### Q-2026-11-07-03 — Installation de l'application PWA avant ou après la connexion

- **Date :** 2026-11-07
- **Problème :** `docs/pwa.md` §10 pose la question : "Faut-il proposer l'installation de l'application avant ou après la connexion ?" Aucun choix n'a été tranché.
- **Pourquoi :** Ce choix conditionne l'affichage du bouton d'installation PWA, le parcours d'onboarding du membre et l'expérience d'activation des notifications push sur Android et iOS.
- **Proposition :** Proposer l'installation de la PWA après la connexion (espace adhérents), car les notifications push concernent les membres actifs ; afficher une page d'aide "Installer l'application" dans l'espace adhérents, comme prévu par `docs/pwa.md` §7.

### Décision client — Q-2026-11-07-03

Proposition validée : proposer l'installation de la PWA après la connexion (espace adhérents)

## 2026-11-08 — Questions issues de la revue du chef de projet

> Questions ouvertes avant de poursuivre l'implémentation. Tant qu'elles ne sont
> pas tranchées, l'équipe ne doit pas les implémenter par supposition.

### Q-2026-11-08-01 — Transactions RLS et driver Neon sur Cloudflare

- **Date :** 2026-11-08
- **Problème :** `src/lib/db/index.ts` utilise `drizzle-orm/neon-http`, qui ne permet pas de transaction interactive. Or `docs/database.md` exige `set_config('app.user_id', ..., true)` au début de la même transaction que les requêtes métier. Les deux exigences sont incompatibles en l'état.
- **Pourquoi :** sans transaction unique, le contexte RLS ne peut pas être garanti ; soit le contexte fuit sur une connexion poolée, soit les policies ne voient pas l'identité et refusent tout accès privé. Cela bloque les étapes 1 à 3 du plan et tous les tests RLS.
- **Proposition :** passer à `drizzle-orm/neon-serverless` avec un `Pool` (WebSocket) au-dessus de Cloudflare Hyperdrive, et exposer un helper unique `withUserContext(profileId, callback)` qui ouvre la transaction, exécute `set_config(..., true)`, puis les requêtes. À défaut, conserver `neon-http` et remplacer `set_config` par un contexte transmis en paramètre explicite à chaque requête, mais cette variante affaiblit la défense en profondeur RLS et doit être validée explicitement.

### Décision client — Q-2026-11-08-01

**Décision :** conserver `node-postgres` (`pg`) avec `drizzle-orm/node-postgres` et Cloudflare Hyperdrive. Ne pas utiliser `drizzle-orm/neon-serverless`, car le driver Neon WebSocket n'est pas destiné à être utilisé au-dessus d'Hyperdrive.

Créer un helper serveur `withUserContext(profileId, callback)` qui :

1. Ouvre une transaction PostgreSQL.
2. Définit `app.user_id` avec `set_config('app.user_id', profileId, true)`.
3. Exécute toutes les requêtes métier protégées dans cette même transaction.
4. Valide ou annule la transaction selon le résultat.

Le `profileId` doit provenir de la session Better Auth vérifiée côté serveur. Toutes les requêtes protégées du callback doivent utiliser exclusivement l'objet transactionnel Drizzle.

**Conséquence :** adapter `src/lib/db/index.ts` si nécessaire et vérifier les tests RLS avant de débloquer les étapes 1 à 3 du plan backend.

### Q-2026-11-08-02 — Modèle de comptage du quota de stockage

- **Date :** 2026-11-08
- **Problème :** `docs/database.md` §5 décrit une table `storage_usage` globale (`public_bytes`, `private_bytes`, `reserved_bytes`, `updated_at`), tandis que `docs/media.md` décrit une table par bucket (`bucket_name`, `used_bytes`, `quota_bytes`, seuils, `last_sync_at`). Le schéma Drizzle actuel suit la version globale, avec des colonnes `integer` incapables de contenir 8 Go.
- **Pourquoi :** les deux modèles imposent des requêtes, des réservations et des tests différents ; le choix conditionne la fonction de réservation atomique et l'écran d'administration du quota. La colonne `integer` provoquera un dépassement de capacité dès 2 Go.
- **Proposition :** retenir le modèle global de `database.md` (une seule ligne, les deux buckets additionnés), passer les colonnes en `bigint`, ajouter `quota_bytes`, `alert_threshold_bytes`, `block_threshold_bytes` et `last_sync_at` à cette même table, et corriger `docs/media.md` pour supprimer la variante par bucket.

### Décision client — Q-2026-11-08-02

**Décision :** Proposition validée.

### Q-2026-11-08-03 — Transformation et diffusion des images

- **Date :** 2026-11-08
- **Problème :** `docs/media.md` décrit des URL `https://imagedelivery.net/{CF_ACCOUNT_HASH}/{r2_key}/...`, or Cloudflare Images ne sert pas directement les clés d'un bucket R2. Le document affirme aussi que Cloudflare Images « ne stocke pas les images », ce qui est faux pour les transformations d'images hébergées.
- **Pourquoi :** le pipeline d'upload (étapes 3 à 5 de `media.md`) et l'affichage des vignettes en dépendent. Une implémentation au hasard produirait des URL mortes et un quota Cloudflare Images mal consommé.
- **Proposition :** trancher entre (A) Cloudflare Images avec upload des images dans Images et stockage des identifiants, ou (B) R2 + Cloudflare Image Resizing à la volée sur un domaine public, ou (C) génération de vignettes WebP au moment de l'upload et stockage des deux tailles dans R2. Recommandation de l'équipe : option B, la plus proche du besoin réel (deux variantes fixes 400×400 et 2000×2000) et sans nouveau stockage.

### Décision client — Q-2026-11-08-03

**Décision :** Proposition validée.

### Q-2026-11-08-04 — Noms des bindings R2

- **Date :** 2026-11-08
- **Problème :** trois noms différents coexistent : `R2_BUCKET` (`docs/Structure.md`), `R2_BUCKET_PUBLIC` / `R2_BUCKET_PRIVATE` (`docs/media.md`) et `bagad_public` / `bagad_private` (`src/lib/server/blobs.ts`). Par ailleurs, `blobs.ts` appelle `createSignedGetUrl()`, qui n'existe pas sur un binding R2 Workers.
- **Pourquoi :** un nom de binding erroné casse silencieusement tous les uploads et téléchargements en production ; l'API de signature inexistante empêche de servir les objets privés.
- **Proposition :** figer `R2_PUBLIC` et `R2_PRIVATE` comme noms de bindings dans `wrangler.toml`/Cloudflare Pages et dans `.env.example`, et servir les objets privés via l'endpoint SvelteKit `/api/files/[...key]` après guard, sans URL signée. Mettre à jour `docs/Structure.md`, `docs/media.md` et `src/lib/server/blobs.ts` en conséquence.

### Décision client — Q-2026-11-08-04

**Décision :** Proposition validée.

### Q-2026-11-08-05 — État « annulé » des événements

- **Date :** 2026-11-08
- **Problème :** `docs/event.md` et `docs/Spec.md` §4.4 exigent qu'un événement puisse être annulé et que ses réponses passent en lecture seule. Le schéma `events` ne contient ni statut ni date d'annulation.
- **Pourquoi :** sans colonne dédiée, l'annulation ne peut être ni affichée, ni testée, ni distinguée d'un événement simplement passé. Cela bloque les critères d'acceptation RSVP.
- **Proposition :** ajouter par migration additive `cancelled_at timestamptz NULL` (et éventuellement `cancelled_by uuid`) à `events` ; l'état affiché devient `annule` si `cancelled_at` est renseigné, sinon `clos` si `event_date < (now() AT TIME ZONE 'Europe/Paris')::date`, sinon `actif`. Confirmer que seuls l'admin, la secrétaire et le chef du pupitre concerné peuvent annuler.

### Décision client — Q-2026-11-08-05

**Décision :** Proposition validée.

### Q-2026-11-08-06 — Création du compte à l'invitation

- **Date :** 2026-11-08
- **Problème :** le brief exige que le compte Auth soit créé immédiatement à l'invitation, avec confirmation d'e-mail et définition du mot de passe dans l'heure. Better Auth ne crée un utilisateur que via son flux d'inscription ou son plugin d'administration ; le dépôt ne contient ni l'un ni l'autre de façon opérationnelle.
- **Pourquoi :** le parcours d'invitation (étape 4 du plan) dépend entièrement de ce choix : qui crée l'utilisateur, qui envoie l'e-mail, comment le lien expire, comment le profil `pending` est rattaché.
- **Proposition :** activer le plugin `admin` de Better Auth et créer l'utilisateur côté serveur avec `admin.createUser({ email, password: aléatoire, ... })`, puis envoyer un lien de définition de mot de passe via Resend ; conserver la table `invitations` comme journal (jeton empreinté, expiration, consommation) et non comme source d'authentification. Documenter le flux dans `docs/architecture.md`.

### Décision client — Q-2026-11-08-06

**Décision :** Seuls le secrétaire et l'admin peuvent inviter des personnes.

### Q-2026-11-08-07 — Rappels de notification : création ou J-3

- **Date :** 2026-11-08
- **Problème :** `docs/Spec.md` §4.6 prévoit un envoi automatique à la création d'un événement et une préférence de rappel sans réponse ; `docs/event.md` prévoit un cron quotidien envoyant un rappel 3 jours avant aux membres sans réponse. Les deux mécanismes ne sont pas exclusifs mais ne sont pas arbitrés pour la V1.
- **Pourquoi :** le cron et la table `notification_rappel` (ou `notification_log`) conditionnent l'implémentation backend, les tests et la charge OneSignal. Un envoi non voulu est visible par tous les membres.
- **Proposition :** V1 = notification push à la création de l'événement uniquement, plus un rappel J-3 pour les membres sans réponse envoyé par un Scheduled Worker Cloudflare, en respectant `notification_preferences`. Aucun envoi si la préférence correspondante est désactivée. Confirmer que les sondages publics notifient tous les membres, comme le prévoit `Spec.md`.

### Décision client — Q-2026-11-08-07

**Décision :** Proposition validée.

### Q-2026-11-08-08 — Durées de conservation et purge

- **Date :** 2026-11-08
- **Problème :** la question Q-2026-11-06-03 est toujours partiellement ouverte : aucune durée n'est fixée pour les réponses aux événements, les journaux d'audit (`activity_log`), les messages de contact et les invitations expirées.
- **Pourquoi :** `docs/Spec.md` interdit toute purge automatique irréversible avant validation. Sans durées, l'équipe ne peut pas écrire les tâches de maintenance ni les tests de suppression, et la base grossira indéfiniment.
- **Proposition :** fixer des durées par défaut à valider par l'association : réponses anonymisées conservées sans limite, `activity_log` 24 mois, messages de contact 12 mois, invitations expirées 30 jours. Implémenter une tâche de purge désactivée par défaut, activable par variable d'environnement après validation.

### Décision client — Q-2026-11-08-08

**Décision :** Proposition validée.

### Q-2026-11-08-09 — Sort des dossiers historiques Supabase et Netlify

- **Date :** 2026-11-08
- **Problème :** `supabase/` (migrations dépréciées) et `netlify/` subsistent alors que la cible validée est Neon + Cloudflare Pages. `AGENTS.md` interdit de réintroduire Supabase et demande de ne pas toucher à la configuration Netlify sans accord.
- **Pourquoi :** leur présence entretient la confusion sur la plateforme réelle, pollue les recherches et peut faire échouer un futur outillage de déploiement.
- **Proposition :** déplacer ces dossiers dans `docs/archive/` (ou les supprimer après accord explicite du client), et ajouter une note dans `docs/journal.md`. Aucune migration ni donnée n'est supprimée : les fichiers restent consultables comme historique.

### Décision client — Q-2026-11-08-09

**Décision :** On garde les dossiers : les migrations peuvent être copiées si elles correspondent au besoin. Ils peuvent être déplacés dans `docs/Archive/` avec une note dans `docs/journal.md`.

### Q-2026-11-09-01 — Bibliothèque i18n du site public

- **Date :** 2026-11-09
- **Problème :** `AGENTS.md` demande d'utiliser le paquet `svelte-i18n` pour le public (`fr`, `en`, `br`), mais le paquet n'est pas installé et la page d'accueil a été livrée avec des dictionnaires TypeScript typés maison (`src/lib/i18n/`).
- **Pourquoi :** le choix conditionne la façon dont les prochaines pages publiques déclareront leurs textes, les tests de complétude des traductions et l'éventuelle détection automatique de la langue du navigateur.
- **Proposition :** conserver les dictionnaires typés maison pour la V1 (aucune dépendance supplémentaire, complétude vérifiée à la compilation) et réévaluer `svelte-i18n` si un besoin de pluriels, de formats riches ou de chargement paresseux apparaît. Confirmer ce choix.

### Q-2026-11-09-02 — Validation des contenus de la page d'accueil

- **Date :** 2026-11-09
- **Problème :** les textes de présentation, l'année de création (1985), l'adresse (`6 Av. des Oiseaux`, `29000 Quimper`), l'e-mail (`bagadpenhars@gmail.com`) et les liens Facebook/Instagram proviennent du site officiel `https://bagad-penhars.com/` et n'ont pas été reconfirmés par le bureau.
- **Pourquoi :** ces informations sont publiques et engagent l'association ; une adresse ou une année erronée serait visible immédiatement.
- **Proposition :** faire valider ces éléments par le bureau avant mise en production, ainsi que les légendes des photographies de la galerie d'accueil.

### Q-2026-11-09-03 — Pistes audio du lecteur

- **Date :** 2026-11-09
- **Problème :** le lecteur flottant est livré en état vide honnête (« Aucune piste publiée ») car aucun fichier audio n'est présent dans le dépôt.
- **Pourquoi :** l'étape 32 du plan (lecteur audio) ne peut pas être finalisée sans pistes, titres, durées et droits de diffusion.
- **Proposition :** fournir les fichiers (MP3/OGG) et leurs métadonnées, ou valider que le lecteur reste en état vide jusqu'à l'étape 32.

### Q-2026-11-10-01 — Informations pratiques de la page Formation

- **Date :** 2026-11-10
- **Problème :** `docs/maquette_UI.md` §8.3 demande de présenter, pour chaque pupitre, les instruments, les niveaux, le contenu des cours, les horaires, le lieu et les modalités de prêt d'instrument. Ces informations ne sont pas dans le dépôt ; elles ont été reprises de la page Formation du site officiel `https://bagad-penhars.com/formation` (niveaux dès 8 ans et adultes ; Espace Chaptal, 6 avenue des Oiseaux, 29000 Quimper ; mardi 17 h–21 h ; 210 € nouveaux apprenants avec prêt d'instrument la première année, 90 € cotisation bagad sans les cours Sonerion, 60 € sympathisant ; cours d'essai gratuit).
- **Pourquoi :** ces montants et ces horaires engagent l'association. Le site officiel peut être obsolète, et une page Formation qui annoncerait un tarif ou un horaire périmé induirait en erreur les personnes qui veulent rejoindre le bagad.
- **Proposition :** faire reconfirmer par le bureau les quatre points repris (niveaux, lieu, horaires, tarifs), en particulier la distinction entre cotisation bagad et cotisation sympathisant, puis indiquer la date de dernière mise à jour à afficher.

### Q-2026-11-10-02 — Mascottes du site

- **Date :** 2026-11-10
- **Problème :** aucune charte ne prévoit de mascotte. L'association a fourni quatre silhouettes vectorielles de cerf (`static/mascotte_1.svg` à `mascotte_4.svg`), une par pupitre, désormais intégrées à la page Formation.
- **Pourquoi :** une mascotte devient un signe de reconnaissance de l'association ; elle doit être validée comme telle, et son usage (taille, présence sur les autres pages, éventuel logo dérivé) doit être tranché.
- **Proposition :** valider la mascotte cerf et sa déclinaison par pupitre, puis décider de son emploi hors de la page Formation. Le hero de la page Formation réunit désormais les quatre silhouettes sur une image composée (`static/mascottes-groupe.svg`) : confirmer que cette composition convient, ou fournir une illustration de groupe dessinée comme telle.

### Q-2026-11-10-03 — Photographies des pupitres

- **Date :** 2026-11-10
- **Problème :** la page Formation devait utiliser les fichiers `Formation_*.webp` du dossier `static/`. Seul `Formation_bombarde.webp` est présent (renommé depuis `IMG_0873.webp`, la photo officielle de la bombarde). Les trois autres pupitres utilisent provisoirement les photographies du site officiel déjà déposées : `IMG_0874.webp` (cornemuse, practice chanters), `IMG_0881.webp` (caisse claire, practice pads) et `IMG_0880.webp` (percussions, grosse caisse).
- **Pourquoi :** ces trois images ne suivent pas la convention `Formation_*` et pourraient être remplacées par de meilleures prises de vue ; il faut aussi s'assurer des autorisations de diffusion des personnes reconnaissables.
- **Proposition :** déposer les fichiers `Formation_cornemuse.webp`, `Formation_caisse-claire.webp` et `Formation_percussion.webp`, ou valider définitivement les trois images actuelles ; confirmer les autorisations à l'image.

### Q-2026-11-10-04 — Partenaires : liste, liens et usage des logos

- **Date :** 2026-11-10
- **Problème :** la page Partenaires affiche quatre structures reprises de la page officielle `https://bagad-penhars.com/partenaires` — Quimper, Département du Finistère, Mederien Penhars et « fenetres detoit 29 » — avec les logos fournis dans `static/logos/` et un lien vers le site de chacune. Le nom du quatrième partenaire a été normalisé en « Fenêtres de toit 29 ».
- **Pourquoi :** `docs/maquette_UI.md` §8.6 n'autorise à publier un logo et un lien que s'ils ont été fournis et validés. La liste, les URL et l'orthographe des noms n'ont pas été reconfirmées par le bureau, et l'autorisation d'usage de chaque logo n'est pas formalisée.
- **Proposition :** faire valider par le bureau la liste des quatre partenaires, l'ordre d'affichage, l'orthographe « Fenêtres de toit 29 », les quatre URL et l'accord de chaque partenaire pour l'affichage de son logo ; préciser s'il faut ajouter une catégorie (institutionnel, association, entreprise).

### Q-2026-11-10-05 — Coordonnées et horaires affichés sur la page Contact

- **Date :** 2026-11-10
- **Problème :** la page Contact affiche l'adresse (Espace Chaptal, 6 avenue des Oiseaux, 29000 Quimper), le courriel `bagadpenhars@gmail.com` et les horaires « Mardi 17 h – 21 h », « Vendredi 20 h – 22 h 30 » et « Samedi 15 h – 17 h 30 ». Le mardi est repris de `https://bagad-penhars.com/contact` et de la page Formation du site officiel ; le vendredi et le samedi ont été corrigés ou ajoutés sur demande le 2026-11-10 et ne correspondent plus au site officiel (qui indique 18 h – 21 h le vendredi et pas de samedi). Aucun de ces éléments n'est encore reconfirmé par écrit, et seule la journée du mardi est décrite dans les informations pratiques de la formation.
- **Pourquoi :** une adresse, un horaire ou une adresse électronique erronés sont visibles immédiatement et empêchent les visiteurs de joindre l'association. La carte place le marqueur au 6 avenue des Oiseaux d'après le géocodage OpenStreetMap (47,9920253 / −4,1209120), pas d'après un relevé de l'association.
- **Proposition :** confirmer l'adresse complète, le nom du lieu (« Espace Chaptal »), l'adresse de réception des messages, les trois plages horaires (mardi, vendredi et samedi) et la position exacte du marqueur ; préciser aussi si les horaires concernent les cours, les répétitions ou l'accueil du public.

### Q-2026-11-10-06 — Expéditeur Resend et clés Turnstile par environnement

- **Date :** 2026-11-10
- **Problème :** l'envoi Resend utilise aujourd'hui `CONTACT_EMAIL` comme adresse d'expédition (`from`). Or cette variable désigne l'adresse de réception (`bagadpenhars@gmail.com`) : Resend refuse d'expédier depuis une adresse dont le domaine n'est pas authentifié, et un expéditeur `@gmail.com` ne peut pas l'être. Par ailleurs les clés Turnstile présentes dans `.env` semblent être celles de production, limitées au domaine `bagad-penhars.com` : le widget peut donc refuser de s'afficher sur `localhost` ou sur une URL de préversion Cloudflare Pages.
- **Pourquoi :** sans expéditeur vérifié, aucun message ne part en production ; sans clés de test, le formulaire ne peut pas être vérifié de bout en bout en développement ni en préversion.
- **Proposition :** créer un domaine d'envoi authentifié chez Resend (par exemple `bagad-penhars.com`) et renseigner une variable `CONTACT_FROM` dédiée (déjà prévue dans `.env.example`, avec repli sur `CONTACT_EMAIL`). Fournir en complément les clés Turnstile de test ou autoriser `localhost` et les domaines `*.pages.dev` sur le widget de production. Confirmer que l'adresse d'expédition peut différer de l'adresse de réception.

### Q-2026-11-10-07 — Ancienne route de contact issue du squelette

- **Date :** 2026-11-10
- **Problème :** `src/routes/public/[lang=lang]/contact/` subsiste à côté de la route réelle `src/routes/(public)/[lang=lang]/contact/`. Ce vestige du squelette expose une page à l'URL `/public/fr/contact`, poste vers `/api/[lang=lang]/contact` (endpoint inexistant), contient un gestionnaire inutilisé et une balise `<token-input>` inconnue. Il ne fait pas partie du site livré mais il est compilé et déclenche une erreur ESLint.
- **Pourquoi :** une route morte qui répond et un formulaire factice peuvent être indexés ou confondre un futur intervenant ; `AGENTS.md` demande par ailleurs de ne pas supprimer un fichier sans l'avoir compris.
- **Proposition :** supprimer le dossier `src/routes/public/` (vestige) après validation, ou confirmer qu'il sert encore de référence. En attendant, seule la balise auto-fermante a été corrigée pour ne plus produire d'avertissement de compilation.

### Q-2026-11-10-08 — Chiffres, photos et ancienneté de la page Bagad

- **Date :** 2026-11-10
- **Problème :** la page Bagad reprend du site officiel les textes de présentation, les chiffres « 25+ musiciens actifs » et « 100+ concerts et festivals », et deux photographies (`groupe_bagad.webp`, `couple_joueur.webp`) dont la première porte un filigrane de photographe (« Bazotos Création »). Le site officiel affiche aussi « 40+ ans d'expérience » et « 40 années d'existence », ce qui ne correspond pas à une création en 1985 (41 ans en 2026) ; la page livrée n'affiche donc que « 1985 — année de création », sans nombre d'années.
- **Pourquoi :** un effectif, un nombre de concerts ou une ancienneté erronés sont des affirmations visibles qui engagent l'association ; publier une photographie sans accord ni crédit pose en plus une question de droits.
- **Proposition :** confirmer l'année de création, les deux chiffres, l'autorisation de publier les deux photographies et le crédit à afficher (ou fournir des photos sans filigrane). Décider enfin comment exprimer l'ancienneté : année de création seule (état actuel), formule « depuis 1985 », ou nombre d'années calculé automatiquement.

### Q-2026-11-10-09 — Agenda public provisoire et lieu des événements

- **Date :** 2026-11-10
- **Problème :** la page Agenda lit `src/lib/data/agenda.ts` et non Neon. Ce module reprend les onze événements publiés sur le site officiel, mais la sortie « Passeurs des lumières » y était datée du 11 décembre 2026 : elle a été fixée au **12 décembre 2026** sur indication du bureau. Par ailleurs, la table `events` ne stocke que le titre, la date et le type : aucun lieu, alors que le site officiel en affiche un pour chaque date. Enfin, aucune description ni horaire n'est publiée par le site officiel ; rien n'a été inventé.
- **Pourquoi :** les dates et les lieux engagent publiquement l'association, et publier un agenda factice sans le signaler peut tromper un visiteur. Le lieu étant nécessaire à l'affichage, son absence du schéma imposera une migration dès que l'agenda sera éditable.
- **Proposition :** confirmer les onze dates et lieux ; décider de l'ajout d'une colonne `location` dans `events` (et, si besoin, d'une description et d'un horaire) par une nouvelle migration ; remplacer `agendaSections()` par une lecture Neon dans le `load` de la page et de l'accueil une fois l'agenda éditable. Les données provisoires sont signalées dans `docs/journal.md`.

### Q-2026-11-10-10 — Débordement horizontal de la navigation desktop

- **Date :** 2026-11-10
- **Problème :** entre environ 1024 px et 1380 px de large, la barre de navigation desktop dépasse la largeur de la fenêtre (95 px mesurés à 1284 px), ce qui provoque un défilement horizontal. Le défaut se produit aussi sur `/fr/bagad` et les autres pages publiques : il est antérieur à la page Agenda.
- **Pourquoi :** 1280 px est la largeur la plus courante des écrans de portables ; un défilement horizontal à cette taille se voit immédiatement.
- **Proposition :** corriger le `Nav` (réduire les espacements, raccourcir le bouton « Écouter » ou déplacer le point de rupture). La modification touche le layout partagé, elle attend donc une validation avant d'être engagée.
- **Avancement du 2026-11-11 :** à la demande du bureau, « Le Bagad » ne passe plus à la ligne dans la barre de navigation (`whitespace-nowrap`) et l'espacement entre les liens a été réduit de `gap-7` à `gap-5`. Mesures après correction : 74 → **45 px** de débordement à 1024 px, 112 → **82 px** à 1280 px, 24 → **0 px** à 1440 px. Le débordement résiduel vient du bloc de droite (réseaux sociaux, langues, « Écouter », « Connexion ») : le problème reste donc ouvert.

### Q-2026-11-11-01 — Identité juridique à compléter sur la page « Informations légales »

- **Date :** 2026-11-11
- **Problème :** la page `/fr/informations-legales` est rédigée avec les seules
  informations publiques déjà connues : nom de l'association, adresse du siège
  (6 avenue des Oiseaux, 29000 Quimper), adresse e-mail de contact, hébergeur
  (Cloudflare Pages) et hébergement de la base (Neon). Il manque les éléments
  que la loi impose de publier et qu'aucune source du dépôt ne contient :
  forme juridique et numéro d'immatriculation (RNA, et SIREN si l'association
  en dispose) — **fournis le 2026-11-11, voir le dernier point** —, nom du
  président en exercice en tant que directeur de la publication, et crédits
  photographiques (au moins une image porte un filigrane d'auteur,
  « Finnegan's / Bazotos Création »).
- **Pourquoi :** ces mentions engagent juridiquement l'association ; les
  inventer serait à la fois inexact et risqué. La page reste donc volontairement
  générale sur ces trois points (« le président de l'association, en exercice »,
  photographies appartenant à leurs auteurs).
- **Proposition :** communiquer la forme juridique, le numéro RNA et, le cas
  échéant, le SIREN, le nom du président en exercice et les crédits photo à
  afficher ; ils seront ajoutés en tête de la section « Éditeur du site » et
  dans une ligne de crédits. Confirmer aussi que le site n'utilise ni mesure
  d'audience ni cookie publicitaire (vérifié dans le code à cette date) et que
  la conservation des données décrite correspond à la pratique du bureau.
- **Compléments relevés le 2026-11-11** en comparant la page à la fiche
  « Mentions sur votre site internet : les obligations à respecter »
  (economie.gouv.fr, LCEN art. 6-III et RGPD art. 13) :
  - **Téléphone de l'association** : la LCEN impose un numéro de téléphone pour
    contacter la personne morale ; le site n'en publie aucun et le dépôt n'en
    contient aucun (la page Contact ne liste que l'adresse et l'e-mail). Un
    numéro de téléphone personnel ne doit pas être publié sans accord exprès :
    le bureau doit fournir le numéro à afficher, ou confirmer qu'aucun numéro
    ne doit figurer.
  - **Téléphone de l'hébergeur** : la LCEN impose nom, raison sociale, adresse
    et numéro de téléphone de l'hébergeur. Seuls le nom et l'adresse de
    Cloudflare, Inc. sont publiés ; le numéro à afficher doit être confirmé sur
    le site de Cloudflare avant d'être écrit.
  - **Base juridique des traitements** : à confirmer (consentement pour le
    formulaire de contact, exécution de la relation d'adhésion pour l'espace
    membres). Non rédigée à ce jour faute de validation.
  - **Caractère obligatoire ou facultatif des données** et conséquences d'un
    refus : à préciser pour le formulaire de contact et le profil adhérent.
  - **Destinataires** : la page cite les prestataires techniques (Cloudflare,
    Neon, OneSignal) mais pas les destinataires au sens du RGPD (bureau,
    secrétaires, chefs de pupitre ayant accès aux réponses de présence).
  - **Durée de conservation** : la page indique « le temps nécessaire » ; une
    durée chiffrée par catégorie de données est attendue (messages de contact,
    comptes adhérents, réponses RSVP).
  - **Crédits photographiques** : la LCEN demande de faire figurer la propriété
    intellectuelle des images. La page renvoie aux auteurs sans les nommer.
  - **Non applicable** à cette association, et donc absent volontairement :
    RCS/RNE, TVA intracommunautaire, CGV, résiliation d'abonnement en ligne,
    activité artisanale ou réglementée. Le point mérite d'être confirmé pour
    écarter toute ambiguïté lors d'une relecture juridique.
- **Résolu le 2026-11-11** pour l'identité de la personne morale : les données
  officielles ont été fournies par le bureau depuis
  <https://annuaire-entreprises.data.gouv.fr/entreprise/bagad-penhars-504354234#association-section>
  et figurent désormais dans l'encart « Identité de l'association » de la page :
  dénomination « Bagad Penhars », forme juridique « Association déclarée »,
  SIREN 504 354 234, SIRET du siège 504 354 234 00024, n° RNA W294 004 157,
  date de création 4 décembre 1985, siège 6 avenue des Oiseaux, 29000 Quimper,
  objet « promotion musicale et culturelle bretonne ». Restent ouverts les
  points listés ci-dessus (téléphones, nom du directeur de la publication,
  crédits photo, précisions RGPD).
