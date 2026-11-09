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
