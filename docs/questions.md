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
- **État :** **Décidée le 2026-11-18 — `svelte-i18n` retenu, migration dans cette
  session.** La proposition initiale (conserver les dictionnaires typés) est
  **écartée par le client**.
- **Décision client (2026-11-18), formulation exacte de la demande au point de
  contrôle n°1 :** « installation de svelte-i18n pour les traductions en
  français, anglais et breton et installation de lucide-svelte pour les
  icons ». Après vérification et clarification : `svelte-i18n` est **installé et
  la migration est faite maintenant** ; `lucide-svelte` **n'est pas installé**
  (voir D-2026-11-18-08 ci-dessous).
- **Portée de la décision :**
  1. `svelte-i18n` devient la bibliothèque de messages du **site public
     uniquement** (`fr`, `en`, `br`) ; l'espace adhérents et l'authentification
     restent en français, hors catalogues.
  2. Les textes existants (`src/lib/i18n/fr.ts`, `en.ts`, `br.ts`) sont repris
     **mot pour mot** dans des catalogues de messages : contenus déjà validés
     comme contenus provisoires en attente de validation (Q-2026-11-09-02,
     Q-2026-11-10-01 à -06, -08, Q-2026-11-11-01) ne sont **pas** réécrits.
  3. La locale reste portée par le segment `[lang=lang]` (`fr` par défaut) ;
     **aucune détection de la langue du navigateur** n'est introduite, pour que
     le rendu serveur et l'hydratation client ne puissent pas diverger.
  4. Tous les éléments SEO déjà livrés (titre, `description`, `canonical`,
     `hreflang` `fr`/`en`/`br`/`x-default`, Open Graph) et le `%lang%` de
     `src/app.html` sont **préservés à l'identique**.
  5. Le design public reste figé à 98 % : **aucun changement visuel attendu**,
     prouvé par comparaison avant/après des trois langues (mêmes textes rendus,
     mêmes balises SEO), jamais par une impression.
- **Renvoi plan :** `equipe/PLAN.md` §2.2, §2.3, **étapes 52 et 53** (vague 1),
  §4, §7.3, §8, annexe A. Aucun endpoint de `equipe/CONTRAT_API.md` n'est
  modifié : `+layout.server.ts` renvoie déjà `{ lang }`.

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

## 2026-11-11 — Espace membre en mode démonstration

### Q-2026-11-11-02 — Périmètre et fonctionnement de la démo

- **Date :** 2026-11-11
- **Problème :** la mission demande de livrer tout l'espace membre avec des
  données fictives, sans Neon, avec un sélecteur de rôle absent de la
  production. Plusieurs choix ne sont pas tranchés par les documents : le mode
  de déploiement autorisé, l'accès au tableau de bord, la persistance, le type
  de photos fictives, le périmètre exact des modules, l'éditeur d'articles, la
  répartition des droits de gestion des comptes, la modification des profils,
  les statuts simulés, l'emplacement du trombinoscope et le niveau de
  simulation des notifications et des documents.
- **Pourquoi :** ces choix conditionnent l'architecture, les routes, les
  données fictives et la garantie d'absence en production. Les décider par
  supposition exposerait à construire des écrans ou des droits que le client
  refuserait ensuite.
- **Proposition :** appliquer les réponses ci-dessous et les consigner dans
  `equipe/PLAN-DEMO.md` avant toute modification de code.

### Décision client — Q-2026-11-11-02

**Décision :** les choix suivants sont validés le 2026-11-11.

- **Mode démo :** développement local uniquement (`npm run dev`), jamais dans
  un build de production.
- **Accès :** sélecteur de profil permanent ; `/dashboard` accessible
  directement.
- **Persistance :** `localStorage` avec bouton de réinitialisation des données
  fictives.
- **Photos :** portraits illustrés fictifs générés localement, aucune personne
  réelle.
- **Périmètre :** tout le périmètre documenté — agenda/RSVP, trombinoscope,
  profil, événements, documents, articles, médias, notifications, invitations,
  membres, réglages.
- **Éditeur d'articles :** Milkdown, comme prévu par `docs/Spec.md`.
- **Comptes :** secrétaire = invitations, activation, suspension et pupitres ;
  admin = en plus, rôles, réglages et suppression. Conforme aux documents.
- **Profils :** chacun modifie son profil ; secrétaire/admin modifient les
  pupitres des autres ; admin attribue les rôles ; la photo n'est modifiable
  que par son propriétaire.
- **Statuts :** quatre rôles actifs uniquement ; pas de parcours
  `pending`/`suspended` simulé.
- **Trombinoscope :** nouvelle route `/dashboard/membres`, ouverte à tous les
  membres actifs.
- **Notifications :** centre de notifications et envoi simulé selon le rôle,
  sans push réel.
- **Documents :** liste et dépôt simulé, sans upload réel.

**Conséquence :** l'architecte rédige `equipe/PLAN-DEMO.md` ; aucune
modification de code n'est engagée avant validation de ce plan.

### Q-2026-11-14-01 — Validation du modèle backend et des environnements

- **Date :** 2026-11-14
- **Problème :** la proposition décrit une table `members`, tandis que le
  modèle, le schéma Drizzle et les règles existantes utilisent `profiles`
  reliée à `user` par `auth_user_id`. La documentation d'architecture cite
  aussi `@neondatabase/serverless`, alors que la décision Q-2026-11-08-01 et le
  code retiennent `pg` avec `drizzle-orm/node-postgres`. Enfin, un fichier
  `.env` local ne configure pas les secrets du déploiement Cloudflare Pages.
- **Pourquoi :** le nom et les relations du profil, le driver et le stockage
  des secrets conditionnent les migrations, les guards, les tests et
  l'isolation des environnements. La consigne demande de valider l'architecture
  avant l'implémentation.
- **Proposition :** conserver le modèle relationnel existant (`user` →
  `profiles` → `profile_pupitres`, avec `invitations`, `events`,
  `event_responses` et les tables métier déjà documentées) et le driver
  `pg`/`drizzle-orm/node-postgres`; utiliser localement `.env` avec Neon
  `test`, puis Cloudflare Hyperdrive et les secrets Cloudflare propres à
  Preview/Production. Ne pas déployer ni committer de fichier `.env` de
  production.
- **État :** décidée le 2026-11-14.
- **Décision client :** conserver `profiles` reliée à `user`, ainsi que
  `pg`/`drizzle-orm/node-postgres`. Le fichier `.env` local sert au
  développement sur Neon `test`; Preview et Production utilisent leurs
  environnements Cloudflare séparés pour les secrets et Hyperdrive.
  `BETTER_AUTH_SECRET` est le nom de référence du secret Better Auth.

## 2026-11-17 — Questions issues de la session d'architecture (plan 2026-11-17)

### Q-2026-11-17-01 — Motion déclaré dans `AGENTS.md` mais absent du dépôt

- **Date :** 2026-11-17
- **Problème :** `AGENTS.md` §0 impose « Motion » dans la stack frontend et
  demande de respecter `prefers-reduced-motion` pour Motion. Le paquet `motion`
  n'est pas dans `package.json`, aucun composant ne l'importe, et les animations
  livrées sont en CSS/Tailwind. `svelte-i18n` est dans la même situation, mais il
  est déjà couvert par la question Q-2026-11-09-01.
- **Pourquoi :** installer Motion et réécrire des animations existantes n'est
  pas un correctif fonctionnel ; à l'inverse, laisser `AGENTS.md` prescrire un
  paquet absent fait diverger la source de vérité et le dépôt, ce qui bloque la
  revue de fin de tâche (étape 46).
- **Options possibles :**
  - **A.** Entériner l'état réel : aucune animation Motion, animations CSS
    respectant `prefers-reduced-motion`, et mettre `AGENTS.md` à jour.
  - **B.** Installer `motion` et migrer les transitions existantes vers Motion.
  - **C.** Ne rien changer et laisser la divergence documentée.
- **Recommandation :** **A**, aucune valeur fonctionnelle ajoutée par Motion ici
  et le design est figé à 98 % ; B rouvre le frontend pour un gain nul.
- **État :** **Décidée le 2026-11-18 — option A.**
- **Décision client (2026-11-18) :** entériner l'absence de Motion. Aucune
  animation Motion n'est ajoutée ; les animations CSS existantes respectent
  `prefers-reduced-motion` ; la mise à jour de `AGENTS.md` §0 est actée.
- **Précision d'exécution :** ni l'architecte ni aucun autre agent n'écrit dans
  `AGENTS.md` (seul le client ou un agent explicitement autorisé le fait). La
  correction documentaire de §0 est donc portée par le client ; l'étape 46 ne
  dépend d'aucune action impossible et n'attend pas cette correction.

### Q-2026-11-17-02 — Durée de vie du lien d'invitation : 1 heure ou 7 jours

- **Date :** 2026-11-17
- **Problème :** `docs/Spec.md` §4.2 impose un lien expirant **après une heure**.
  Le code (`invitation.create`, `invitation.resend` dans
  `src/lib/server/member/commands.ts`) calcule `Date.now() + 7 jours`, et le
  journal du 2026-11-15 documente « expiration 7 jours » dans l'interface. Aucune
  décision client ne modifie la Spec.
- **Pourquoi :** la durée conditionne le test du parcours d'invitation (étape 45),
  le message affiché aux secrétaires et la politique de renvoi. Choisir sans
  arbitrage revient à contredire soit la Spec, soit le code livré.
- **Options possibles :**
  - **A.** Appliquer la Spec : 1 heure, renvoi possible ensuite.
  - **B.** Entériner 7 jours et modifier `docs/Spec.md` §4.2 en conséquence.
- **Recommandation :** **A** — la Spec est la référence fonctionnelle validée ;
  si 7 jours étaient voulus, il faut une décision écrite, pas un écart de code.
- **État :** **Décidée le 2026-11-18 — option A.**
- **Décision client (2026-11-18) :** 1 heure, conformément à `docs/Spec.md` §4.2.
  Le code doit être aligné (7 jours → 1 heure) et l'étape 45 est débloquée.
- **Conséquences :** `invitation.create` et `invitation.resend`
  (`src/lib/server/member/commands.ts`) calculent `Date.now() + 1 h` ; la durée
  d'expiration est aussi configurée côté Better Auth (Spec §4.2 point 6) ; les
  libellés et le journal qui annonçaient « 7 jours » sont corrigés ; le test du
  parcours d'invitation vérifie l'expiration à 1 heure et le renvoi.

### Q-2026-11-17-03 — Photo de profil réelle ou portrait illustré

- **Date :** 2026-11-17
- **Problème :** l'espace adhérents livré utilise une palette de portraits
  illustrés (`profiles.avatar`, entier 1 à 12, commande `profile.avatar`). La
  Spec (§4.3, F15/F19) et le schéma prévoient aussi une photo
  (`profiles.avatar_url`), et `app.member_directory` l'expose déjà. Aucun écran
  ne permet de déposer une photo.
- **Pourquoi :** l'étape 43 doit choisir entre brancher un téléversement réel
  (donc toucher l'interface du profil et du trombinoscope) et conserver la
  palette. Le design privé est figé à 98 % : ajouter un bouton de dépôt n'est
  acceptable que si c'est un correctif fonctionnel attendu.
- **Options possibles :**
  - **A.** Photo réelle téléversée, portrait illustré conservé comme repli
    lorsque `avatar_url` est vide.
  - **B.** Palette illustrée seule, `avatar_url` réservé à un usage futur.
- **Recommandation :** **A** — le trombinoscope est censé montrer les membres ;
  la palette était une solution de démonstration.
- **État :** **Décidée le 2026-11-18 — décision intermédiaire en deux temps.**
- **Décision client (2026-11-18), formulation exacte :** « palette dans un
  premier temps et utilisation de photo perso quand R2 sera branché à la fin ».
- **Traduction en deux temps :**
  1. **Immédiat** — l'étape 43 devient « palette conservée, aucun changement
     d'écran » : les portraits illustrés 1 à 12 restent la seule représentation,
     `profiles.avatar_url` reste vide, aucun bouton de dépôt n'est ajouté.
  2. **Fin de session, après branchement de R2** — nouvelle étape 49 :
     téléversement réel de la photo de profil, avec repli automatique sur la
     palette quand `avatar_url` est vide.
- **Cohérence vérifiée :** la vue `app.member_directory` expose déjà `avatar`
  et `avatar_url`, et l'instantané adhérent (`buildMemberSnapshot`) sélectionne
  `avatar_url` sans encore le transmettre. Aucune migration n'est donc
  nécessaire : l'étape 49 ajoute `avatarUrl` au profil exposé et l'écran choisit
  la photo si `avatarUrl` est renseigné, sinon le portrait illustré.

### Q-2026-11-17-04 — Champs éditoriaux de l'article public absents de la table

- **Date :** 2026-11-17
- **Problème :** la vue publique d'un article attend `category`, `image` et
  `imageAlt` (`PublicArticle` dans `src/lib/types.ts`). La table `articles`
  contient uniquement `title`, `slug`, `excerpt`, `content`, `is_published`,
  `published_at`, `author_id`. Les articles publics venant de
  `src/lib/data/articles.ts`, l'écart n'apparaît pas encore.
- **Pourquoi :** brancher les actualités sur Neon (étape 38) oblige soit à
  inventer une catégorie et une image, soit à modifier la vue publique, soit à
  ajouter des colonnes. Aucune de ces trois solutions n'est décidée.
- **Options possibles :**
  - **A.** Migration additive : `category text NULL`, `image_url text NULL`,
    `image_alt text NULL` ; l'interface reste identique, les valeurs vides sont
    masquées (aucune refonte).
  - **B.** Retirer catégorie et image de la carte d'article publique.
  - **C.** Continuer à servir les articles publics depuis les données
    provisoires.
- **Recommandation :** **A** — design public préservé, aucune donnée inventée,
  migration additive conforme aux règles du projet.
- **État :** **Décidée le 2026-11-18 — option A.**
- **Décision client (2026-11-18) :** migration additive `category`,
  `image_url`, `image_alt`, toutes nullables ; interface publique inchangée ;
  valeurs vides masquées.
- **Conséquences :** l'étape 38 est débloquée et porte la migration ; la carte
  d'article publique conserve sa structure et n'affiche ni catégorie ni image
  quand la colonne est vide ; aucune refonte graphique.

## 2026-11-18 — Audit des dépendances du mainteneur : arbitrages de l'architecte

**Contexte.** Le mainteneur a rendu son audit dans `docs/mises-a-jour.md` avec le
statut `PLAN À ACTUALISER`, motif unique : le §7.1 conservait `drizzle-orm` 0.39
et `drizzle-kit` 0.30 alors que `better-auth` 1.7 (verrouillé 1.7.18 et réellement
utilisé avec `drizzleAdapter` dans `src/lib/server/auth.ts`) exige
`drizzle-orm ^0.45.2` et `drizzle-kit >=0.31.4`.

**Aucune décision client n'est requise ici.** Les six points ci-dessous sont des
arbitrages techniques qui revenaient à l'architecte ; ils sont consignés pour la
traçabilité et pour que ni le mainteneur ni les développeurs ne les rouvrent. Le
périmètre fonctionnel est inchangé (design public et espace adhérents figés à
98 %), aucune refonte n'est ouverte, aucun écran n'est modifié.

**Aucune question nouvelle bloquante.** Le plan reste exécutable de bout en bout ;
les seules questions encore ouvertes sont éditoriales ou documentaires
(Q-2026-11-09-01, Q-2026-11-09-02, Q-2026-11-09-03, Q-2026-11-10-*, Q-2026-11-11-01)
et ne bloquent aucune étape.

### D-2026-11-18-01 — `drizzle-orm` / `drizzle-kit` alignés sur les peers de `better-auth`

- **Décision :** `drizzle-orm` **0.45.4** (plage `^0.45.2`) et `drizzle-kit`
  **0.31.11** (`>=0.31.4`). Porté par l'**étape 50**, préalable bloquante de la
  vague 0 : hydratation `pnpm install --frozen-lockfile`, puis montée ciblée des
  deux paquets, puis `check` + `build` + `test`, puis génération d'essai de
  migration sur **copie** de `drizzle/`.
- **Pourquoi :** les peers sont `optional`, donc l'écart était silencieux (le
  verrou câblait quand même `better-auth@1.7.18(…drizzle-orm@0.39.3)`), et il
  touche l'intégration la plus sensible du projet (identité, sessions,
  invitations). Ne pas sauter à la `1.0.0-rc` : hors périmètre.
- **Exécution :** installation par le **mainteneur** seul ; adaptation de
  `drizzle.config.ts`, de l'adaptateur et du typage de `db.execute`
  (`src/hooks.server.ts`) par le **développeur backend** ; diff du verrou limité
  aux deux paquets et contrôlé avant validation.
- **Renvoi plan :** §2.2, §3 étape 50, §7.1, §8.

### D-2026-11-18-02 — `@better-auth/infra` **retiré**

- **Décision :** retrait pur et simple (`pnpm remove`, étape 51). Ni montée en
  0.4.31, ni maintien assumé.
- **Pourquoi :** zéro import dans `src/`, `scripts/`, `tests/`, `.github/` ; c'est
  la **seule** source du peer non satisfait `zod >=4.1.12`. Le retirer supprime un
  peer non satisfait et allège le graphe **sans toucher une ligne de code**. La
  montée en 0.4.31 conserverait un paquet inutilisé avec un peer toujours non
  satisfait ; le maintien laisserait une dette invisible à chaque installation.
- **Précision :** le `zod` 4 transitif **reste** (il vient de `better-call`, via
  `@better-auth/core`) ; la liste `ssr.noExternal` de `vite.config.ts`
  (`better-auth`, `@better-auth/core`, `zod`, `@lucide/svelte`) est donc
  **inchangée** et doit être relue puis suivie d'un `npm run build`.
  **Aucun `override` / `resolutions` n'est prescrit** (il casserait l'un des deux
  consommateurs de `zod`).
- **Renvoi plan :** §2.2, §3 étape 51, §7.4, §8.

### D-2026-11-18-03 — `image-size@2.1.0` en version exacte, import de la racine uniquement

- **Décision :** version **exacte 2.1.0** (`--save-exact`), installée à l'étape 51,
  utilisée par les étapes **42** (photos d'album) et **49** (photo de profil).
- **Règle d'usage opposable :** `import { imageSize } from 'image-size'` —
  **jamais** `image-size/fromFile` (seul sous-chemin Node-spécifique, interdit
  côté Worker). Lecture d'en-tête seule, contrôle **avant** l'écriture R2 ;
  `TypeError` sur format non reconnu → `415 unsupported_type`. Ne pas retenir
  `legacy` 1.2.1.
- **Pourquoi :** validé techniquement par le mainteneur (0 dépendance runtime, 0
  peer, MIT, entrée racine sans module Node, double distribution CJS/ESM).
- **Renvoi plan :** §7.3, §3 étapes 42 et 49.

### D-2026-11-18-04 — `resend` : majeure 6 **différée**, 4.8.0 conservé

- **Décision :** rester en **4.8.0** ; la montée en 6.38.1 rejoint les sept
  majeures différées du §2.1.1.
- **Pourquoi :** `src/lib/server/email.ts` n'utilise que
  `new Resend(apiKey)` et `emails.send({ from, to, subject, html, text, replyTo })`,
  identiques en 4 et 6 ; la 6 renomme `inlineContentId` (non utilisé) et supprime
  `@react-email/render`. Le gain de graphe est réel mais ne justifie pas une
  majeure en session sur un design figé : la décision par défaut est de ne pas
  déplacer une majeure sans besoin fonctionnel.
- **Renvoi plan :** §2.1.1, §2.2, §7.1.

### D-2026-11-18-05 — Défauts de verrouillage : traitement en phase d'installation, sans exécution

- **Constat, tel que relevé le 2026-11-18 :** `node_modules/` **absent** (aucun
  `check`/`build`/`test` possible avant installation) ; `pnpm-lock.yaml` **en
  retard sur ses propres plages** (un `pnpm install` libre ferait bouger une
  trentaine de paquets) ; `package-lock.json` **matériellement faux** (entrée
  racine `lucide-svelte@^1.0.1`, paquet déprécié ; ignore `@better-auth/infra`,
  `leaflet`, `@types/leaflet`) ; exception `minimumReleaseAgeExclude`
  (`@lucide/svelte@1.71.0`) **inerte**, aucune `minimumReleaseAge` n'étant
  configurée (`.npmrc` = `engine-strict=true` seulement).
- **Décision :** marche à suivre imposée par les étapes 50 et 51 — hydratation
  **`pnpm install --frozen-lockfile`** uniquement, puis montées ciblées une par
  une, diff du verrou contrôlé, `check` + `build` + `test` de part et d'autre ;
  `pnpm update`, `pnpm install` libre et `npm install` **interdits** ;
  `package-lock.json` supprimé du dépôt (ou explicitement déclaré hors jeu) ;
  `minimumReleaseAge` **non activée** en session et l'exception documentée comme
  garde-fou inactif, jamais comme protection.
- **Point de vigilance (non bloquant, hors rôle de l'architecte) :** la
  suppression de `package-lock.json` est un changement de dépôt ; elle est
  exécutée par le mainteneur. Si le chef de projet préfère ne pas supprimer le
  fichier, l'alternative est de le laisser en place en le déclarant explicitement
  hors jeu dans `docs/journal.md` — dans les deux cas il ne doit **jamais** servir
  de base d'installation.
- **Aucune commande n'a été lancée** par l'architecte : ce point décrit une marche
  à suivre, pas une exécution.
- **Renvoi plan :** §3 étapes 50 et 51, §4, §8.

### D-2026-11-18-06 — Plage `better-auth` resserrée à `~1.7.18`

- **Décision :** `package.json` passe de `^1.0.0` à **`~1.7.18`**, verrou inchangé
  (1.7.18). Aucun paquet ne bouge : le diff du verrou reste nul sur ce point.
- **Pourquoi `~` et non `^` :** `^1.0.0` **et** `^1.7.x` acceptent tous deux une
  future 1.8, qui relèverait ses peers (comme `drizzle-orm` l'a fait en 1.5 puis
  1.7) sans revue. Seul le tilde borne à la mineure 1.7, c'est-à-dire à la branche
  dont les peers ont été vérifiés par l'audit. La recommandation du mainteneur
  (`^1.7.25`) corrige le plancher mais laisse la porte ouverte à 1.8 ; elle est
  donc écartée au profit de `~1.7.18`.
- **Effet de bord assumé :** la montée 1.7.18 → 1.7.25 (patch) est **hors
  session** : elle n'apporte rien fonctionnellement et élargirait le diff du
  verrou que le mainteneur veut minimal et contrôlable. À reprendre dans un lot
  ultérieur, après l'étape 47.
- **Renvoi plan :** §7.1, §3 étape 51.

## 2026-11-18 — Point de contrôle n°1 : `svelte-i18n` et icônes

**Contexte.** Demande client au point de contrôle n°1 : « installation de
svelte-i18n pour les traductions en français, anglais et breton et installation
de lucide-svelte pour les icons ». Les deux volets ont été vérifiés dans le
dépôt **avant** toute décision, puis clarifiés avec le client : le volet i18n
est retenu et migré dans cette session ; le volet icônes est **déjà satisfait**
par l'état existant et ne déclenche aucune installation, aucune migration.

Les deux points ci-dessous sont consignés pour éviter qu'un audit ultérieur ne
rouvre l'un ou l'autre : ils ne sont pas des questions ouvertes.

### D-2026-11-18-07 — `svelte-i18n` installé, migration faite dans cette session

- **Décision :** `svelte-i18n` est **ajouté aux dépendances d'exécution** par le
  **mainteneur** (version choisie par lui, voir plan §7.3) et la migration est
  **exécutée dans cette session**, en deux étapes séparées pour tenir en 1 à 2
  sessions de développement chacune : **étape 52** (socle : installation,
  initialisation SSR/client, catalogues, locale issue de `[lang=lang]`,
  preuve) puis **étape 53** (bascule des composants publics vers l'API de
  messages, preuve de non-régression avant/après).
- **Tranche :** Q-2026-11-09-01 (voir la décision ajoutée à son entrée).
- **Pourquoi maintenant :** la demande client est explicite et les étapes de
  branchement public (37, 38, 39) ne sont pas encore exécutées. Migrer avant
  elles évite de réécrire deux fois les mêmes fichiers ; migrer après les avoir
  livrées aurait doublé le travail sur les mêmes `+page.server.ts`.
- **Ce que la décision ne change pas :** aucun endpoint, aucun `load` ne change
  de signature (`+layout.server.ts` renvoie déjà `{ lang }`) ; `CONTRAT_API.md`
  reste **inchangé**. L'espace adhérents reste en français, hors catalogues.
- **Renvoi plan :** §2.2, §2.3, §3 étapes 52 et 53, §3.1, §4, §7.2, §7.3, §8.

### D-2026-11-18-08 — Icônes : `@lucide/svelte` 1.71.0 déjà installé, `lucide-svelte` **non ajouté**

- **Constat de vérification (2026-11-18), à ne pas réinterpréter :**
  - `@lucide/svelte` **1.71.0** est déjà déclaré dans `package.json`
    (`dependencies`, épinglé sans `^`) et importé dans une vingtaine de fichiers
    sous `src/lib/components/` et `src/routes/` ; il figure dans `ssr.noExternal`
    de `vite.config.ts` parce qu'il publie des composants `.svelte`.
  - `lucide-svelte` est l'**ancien nom du paquet**, déprécié et remplacé par
    `@lucide/svelte` le **2026-11-10**.
  - `lucide-svelte` n'apparaît **que** dans `src/autre/` (maquette de design
    fournie par le client, exclue du build et des tests par `vite.config.ts`) et
    dans `package-lock.json`, artefact npm **périmé et matériellement faux** que
    l'étape 51 met hors jeu.
- **Décision client (2026-11-18) :** **aucune installation, aucune migration
  d'icônes.** La demande « installation de lucide-svelte » est **satisfaite par
  l'état existant** ; le nom correct est `@lucide/svelte`.
- **Conséquences :**
  1. Aucun paquet ajouté, aucun import modifié, aucun fichier de `src/autre/`
     touché : la maquette reste hors build et hors périmètre.
  2. Toute demande ultérieure formulée comme « installer `lucide-svelte` » doit
     être lue comme **déjà satisfaite** par `@lucide/svelte` 1.71.0 ; un audit
     qui rouvrirait ce point contredirait cette décision.
  3. `lucide-svelte` reste classé **écarté** dans le plan (§7.4) ; seule
     l'hygiène du verrou de l'étape 51 traite `package-lock.json`, sans rien
     installer.
- **Renvoi plan :** §0, §2.1, §2.2, §7.4, §8.

