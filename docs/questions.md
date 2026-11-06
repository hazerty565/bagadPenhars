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
- **Proposition initiale :** Ne publier aucun worker applicatif tant que l'intégration
  OneSignal n'a pas été vérifiée en développement et en production. Retenir
  ensuite une seule portée de worker, avec uniquement le cache statique et
  `/offline`; aucune page privée ni donnée membre ne doit être mise en cache.
- **État :** Décidée pour le produit; choix technique délégué au front-end.
- **Décision :** Le site doit être une PWA installable et proposer les
  notifications push OneSignal sur les appareils compatibles. Le hors-ligne
  est limité aux ressources statiques et à `/offline`; aucune page privée ni
  donnée personnelle n'est mise en cache. Le développeur front-end choisit et
  teste l'architecture compatible avec OneSignal avant l'activation en
  production.

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