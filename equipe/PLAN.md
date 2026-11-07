# Plan d'implémentation — Site Bagad Penhars

> Rôle : ARCHITECTE. Je n'écris que dans `equipe/` et `docs/questions.md` ; je ne code pas, je ne lis pas de code source, je ne lance aucune commande. Ce plan fait foi pour le développeur backend, le développeur frontend et le testeur. Il est établi à partir de `docs/brief.md`, `docs/Spec.md`, `docs/architecture.md`, `docs/database.md`, `docs/pwa.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/journal.md` et `docs/questions.md`. Aucune information absente des documents n'est devinée.

## 1. Besoin tel qu'exprimé par le client

> « @architecte tu es la relation avec le client, tu émet le besoin aux développeur backend et frontend »

Le client demande à l'architecte de faire le lien entre le client et l'équipe de développement, et d'émettre le besoin sous forme de plan aux développeurs backend et frontend. Aucun besoin fonctionnel métier n'a encore été précisé dans cette demande ; le plan ci-dessous couvre donc le **focus actuel** du projet défini dans le roadmap (socle Neon/Better Auth/Cloudflare, CI, gardes d'accès, contexte RLS transactionnel et policies sur les tables sensibles), en attendant que le besoin fonctionnel soit tranché (voir §10).

## 2. Besoin reformulé en 2 phrases

L'architecte reçoit le besoin du client et le restitue sous forme de plan d'implémentation faisant foi, adressé séparément au développeur backend et au développeur frontend, avec les interfaces entre les deux et les critères de validation. Comme le besoin fonctionnel concret n'est pas encore exprimé, le plan porte sur le focus actuel du projet : fiabiliser le socle Neon/Better Auth/Cloudflare, la CI, les gardes SvelteKit, le contexte RLS transactionnel et les policies sur les tables sensibles.

## 3. Décisions techniques

| Décision | Raison |
|---|---|
| Plan unique dans `equipe/PLAN.md` ; questions dans `docs/questions.md` | Convention du projet : ce qui est écrit dans `equipe/` fait foi ; les questions ouvertes sont consignées dans `docs/questions.md` (format date / question / pourquoi / proposition). |
| Langue du plan : français ; format Markdown | Documents sources et équipe sont francophones ; Markdown est lisible partout et versionnable. |
| Pas de code écrit, pas de lecture de code source, aucune commande lancée | Rôle de l'architecte : il écrit la carte, il ne cuisine pas. |
| Frontend : SvelteKit 5 (runes uniquement : `$state`, `$derived`, `$effect`, `$props`), TypeScript, Tailwind, Motion, i18n `fr`/`en`/`br` pour le public, français pour l'espace adhérents et l'authentification | Stack figée par `AGENTS.md` et `docs/brief.md` ; interdiction des `export let`, `$:`, `on:click` et des stores legacy. |
| Backend : SvelteKit actions et endpoints serveur (`+page.server.ts`, `+layout.server.ts`), Better Auth pour l'identité et les sessions, Drizzle comme ORM, `@neondatabase/serverless` comme driver, Cloudflare Hyperdrive pour le pooling, Cloudflare R2 pour le stockage, Resend, Cloudflare Turnstile, OneSignal | Stack cible imposée par `docs/brief.md`, `docs/Spec.md`, `docs/architecture.md` et `docs/database.md`. |
| Rôles métier lus dans `profiles.role` (ENUM PostgreSQL `app_role` : `member`, `chef_pupitre`, `secretaire`, `admin`), jamais dans `user_metadata` | Règle de sécurité du projet ; Better Auth est la source de l'identité, pas de l'autorité des rôles. |
| `account_status` dans `profiles` : `pending`, `active`, `suspended` ; indépendant du rôle | Référence `docs/database.md` et `docs/Spec.md` §4.2/§4.3. |
| RLS Neon/PostgreSQL activé avec policies explicites sur les tables sensibles ; `set_config(..., true)` établi en début de chaque transaction protégée ; pas de cache partagé Hyperdrive pour les lectures privées | Défense en profondeur imposée par `docs/database.md` et `docs/Spec.md` §5 ; évite le mélange de données sur une connexion poolée. |
| Aucune migration déjà appliquée n'est modifiée ; seules des migrations additives sous `drizzle/` avec métadonnées dans `drizzle/meta/` | Règle de reproductibilité de `docs/database.md` §2 et de l'AGENTS.md. |
| Secrets (Neon, Better Auth, OneSignal, Resend) strictement côté serveur, jamais exposés au client ni committés (`.env` ignoré, `.env.example` à jour) | Règle de sécurité de l'AGENTS.md. |
| PWA : service worker ne met en cache que les fichiers statiques et `/offline` ; aucune page privée ni donnée Neon/R2 en cache | Règle de `docs/pwa.md` et de `docs/Spec.md` §6. |

## 4. Ce que le développeur backend doit réaliser

Le développeur backend est responsable de tout ce qui s'exécute côté serveur et de la base de données :

1. **Socle Neon et Cloudflare** : configurer les environnements dev/preview/production sans partage de secrets ; configurer les deux branches Neon (`test`, `production`) et les variables Cloudflare Pages associées ; configurer Better Auth avec l'adapter Cloudflare et Neon ; mettre en place la structure de migrations PostgreSQL reproductible sous `drizzle/` ; établir le schéma métier (tables et contraintes du modèle conservé dans `docs/database.md` §3) avec index et fonctions ; configurer les bindings R2 (`bagad-public`, `bagad-private`) sans rendre aucun objet privé accessible par URL publique permanente ; écrire des tests d'intégration d'accès pour anonyme, membre, chef de pupitre, secrétaire et administrateur.
2. **Identité, sessions et autorisations** : intégrer Better Auth dans le hook serveur et peupler `event.locals` (`profile`, `role`, `accountStatus`) depuis Neon ; ne jamais dériver les droits de `user_metadata` ; implémenter les guards centralisés (`src/lib/auth/guards.ts`) appliqués dans les layouts, actions et endpoints ; protéger les téléchargements de fichiers ; implémenter connexion, déconnexion, récupération et réinitialisation de mot de passe avec gestion des erreurs et sessions expirées.
3. **Invitations, profils et membres** : invitations e-mail à usage unique expirant après une heure (jeton empreinté, pas stocké en clair) ; création immédiate du compte Auth et du profil (`account_status = pending`, `profiles.role = member`) ; confirmation e-mail et définition du mot de passe dans l'heure sans activation du compte ; activation manuelle par admin ou secrétaire uniquement si l'e-mail est confirmé ; modification par un membre de ses propres champs de profil (hors rôle et pupitres) ; changement d'e-mail via le flux sécurisé Better Auth ; journalisation des changements de rôle et actions d'administration sans secrets.
4. **RLS, contexte transactionnel et tests d'autorisation** : activer RLS et écrire les policies `SELECT`/`INSERT`/`UPDATE`/`DELETE` explicites sur toutes les tables sensibles ; établir le contexte RLS avec `set_config(..., true)` au début de chaque transaction métier ; s'assurer que le rôle PostgreSQL runtime n'est pas propriétaire des tables et ne dispose pas de `BYPASSRLS` ; tester l'accès anonyme, l'absence de contexte, chaque rôle métier, l'isolation de deux utilisateurs successifs sur une connexion Hyperdrive réutilisée, et les tentatives d'accès aux lignes hors périmètre.
5. **Stockage R2, quotas et uploads** : quota global de 8 Go sur les deux buckets additionnés ; alerte administrateur à 7 Go ; blocage des nouveaux uploads à 8 Go ; contrôles côté serveur des formats et tailles (images 15 Mo max, 6000×6000 max, conversion WebP qualité 82, dimensions de sortie max 2000×2000, OGG 30 Mo, PDF 20 Mo ; pas de vidéo) ; table `storage_usage` (`public_bytes`, `private_bytes`, `reserved_bytes`, `updated_at`) avec réservation/confirmation/libération/réconciliation atomiques ou reproduites côté serveur ; mises à jour des compteurs sur suppressions et remplacements ; synchronisation périodique R2/Neon.
6. **Notifications (côté serveur uniquement)** : appeler OneSignal côté serveur (clé REST secrète, jamais côté client) ; appliquer les audiences autorisées selon le rôle et le pupitre (secrétaire : plusieurs pupitres ; chef : son pupitre ; admin : global) ; ne jamais faire confiance aux identifiants de pupitre ou de destinataire soumis par le navigateur.
7. **Migrations** : vérifier sur la branche Neon `test` avant toute application sur `production` ; aucune purge automatique irréversible avant validation des durées de conservation.

## 5. Ce que le développeur frontend doit réaliser

Le développeur frontend est responsable de l'interface utilisateur, de sa consommation des contrats backend et de la PWA :

1. **Interface publique** : pages publiques localisées (`fr`, `en`, `br`) — accueil, présentation du bagad, formation (quatre pupitres), agenda public en lecture seule, actualités, albums photo, contacts — en Svelte 5 runes, Tailwind, mobile-first, accessibilité (labels, contrastes WCAG AA, focus visible), SEO (métadonnées par langue, sitemap public uniquement, `robots.txt`). Aucun profils privés, coordonnées membres, partitions privées ni titres du bureau exposés. Prévisualisation avant publication des articles/albums. Éditeur Milkdown pour les articles (contenu Markdown conservé).
2. **Formulaire de contact** : endpoint SvelteKit sur Cloudflare Pages, protégé par Cloudflare Turnstile côté serveur, envoi via Resend à l'adresse officielle configurée côté serveur, accusé de réception à l'expéditeur après succès de l'envoi à l'association, aucune pièce jointe, adresse de réception et clé API Resend jamais exposées au navigateur.
3. **Espace adhérents (connexion requise)** : connexion, dashboard avec profil, agenda privé (événements `public`, `interne`, `pupitre` selon les règles de visibilité et de pupitre ciblé), réponses de présence (`present`/`absent`, modifiables jusqu'à minuit `Europe/Paris` le lendemain de la date de l'événement, verrouillées ensuite, non retirables, conservées en lecture seule après annulation/clôture), trombinoscope réservé aux membres actifs connectés exposant uniquement les champs autorisés (nom, prénom, photo, pupitres, niveau musical, fonction au bureau), partitions/documents, gestion de son propre profil, préférences de notifications, page d'aide à l'installation PWA (iOS).
4. **Guides UI** : menu filtré côté serveur selon les permissions résolues (aide d'interface uniquement, ne remplace pas un guard) ; toute URL directe reste protégée côté serveur ; aucune donnée privée dans le HTML public ni dans le cache PWA.
5. **PWA et service worker** : `static/manifest.webmanifest`, icônes, `src/service-worker.ts` (cache statique + `/offline`, navigation réseau uniquement avec repli `/offline`, aucune origine tierce interceptée), `src/routes/offline` prérendue, en-têtes Cloudflare Pages (`Cache-Control: no-cache` sur le service worker). Choix et documentation de l'architecture de cohabitation avec le service worker OneSignal (piste A : `importScripts` depuis le worker applicatif, ou piste B : worker OneSignal seul avec cache minimal), à tester en dev et en production avant activation. Installation et notifications testées sur Android et iPhone.

## 6. Interfaces entre le backend et le frontend

Le frontend et le backend s'appuient sur des contrats documentés, non sur du code partagé supposé :

- **Appels frontend → backend** : le frontend consomme les actions SvelteKit (`+page.server.ts`) et les endpoints API serveur. Les données protégées arrivent via `event.locals` (profil, rôle, statut de compte) établies par Better Auth et les guards ; le frontend ne doit jamais faire confiance à un rôle ou identifiant transmis par le client.
- **Réponses backend → frontend** : schémas de réponse JSON typés, retours typés (`fail`/`success`), erreurs explicites pour les formulaires invalides (pas de modification des données en cas d'invalidité). Le menu est filtré côté serveur, mais chaque route/action/endpoint vérifie ses propres permissions.
- **Stockage** : les fichiers privés (`bagad-private`) sont servis par un endpoint SvelteKit de garde après vérification du compte et du rôle, ou via URL signée courte ; jamais d'URL publique permanente pour un objet privé. Les métadonnées (clé, taille, type MIME, visibilité, propriétaire) sont conservées dans Neon.
- **Notifications** : OneSignal est appelé côté serveur uniquement ; le frontend reçoit l'abonnement push et affiche les notifications, sans jamais manipuler la clé REST.
- **Authentification** : Better Auth gère sessions, comptes, invitations et mots de passe ; les routes `/auth/...` et `/api/auth/...` sont le point d'entrée ; le rôle et le statut métier viennent de `profiles.role` / `profiles.account_status`.
- **Convention de nommage** : identifiants SQL en anglais et `snake_case` ; types métier générés ou contrôlés pour les entités PostgreSQL et les réponses API.

## 7. Étapes de travail (chacune livrable et testable seule)

| # | Étape | Maître d'œuvre | Critère de fin (étape terminée) |
|---|---|---|---|
| 1 | **Socle Neon et Cloudflare** — environnements, branches Neon, variables Cloudflare Pages, Better Auth + Neon adapter, structure de migrations, schéma métier, bindings R2, tests d'intégration d'accès | Backend | Installation locale documentée ; migrations applicables à une base Neon neuve sans modification de migration existante ; autorisations serveur testées sur chaque table et R2 ; tests intégrés passants pour anonyme, membre, chef de pupitre, secrétaire, admin. |
| 2 | **Identité et autorisations** — Better Auth dans le hook serveur, `event.locals` (profile, role, accountStatus), guards centralisés, connexion/déconnexion/mot de passe, protection des layouts/actions/endpoints/fichiers | Backend | Chaque parcours privé refuse côté serveur les utilisateurs anonymes et les comptes `pending` ou `suspended` ; les tests démontrent les refus et les accès autorisés. |
| 3 | **RLS, contexte transactionnel et tests d'autorisation** — RLS activé, policies explicites sur les tables sensibles, `set_config(..., true)` en début de transaction, tests d'isolation (absence de contexte, deux identités sur connexion réutilisée, lignes hors périmètre) | Backend | Tests SQL d'accès passés pour tous les rôles ; absence de contexte refusé ; isolation vérifiée ; aucune donnée privée servie depuis le cache partagé Hyperdrive. |
| 4 | **Invitations, profils et membres** — invitations e-mail, activation manuelle, modification de profil propre, trombinoscope V1 (champs autorisés uniquement), journalisation admin | Backend | Cycle invitation → mot de passe → attente → approbation testé (e-mail non confirmé, jeton invalide/expiré/déjà utilisé, adresse non concordante) ; trombinoscope accessible aux membres actifs connectés sans champs privés. |
| 5 | **Agenda, présences et sondages** — événements (date seule, `event_type`, visibilité `public`/`interne`/`pupitre`, `is_poll`), réponses dans `event_responses` (`present`/`absent`), règles de verrouillage à minuit `Europe/Paris`, permissions par rôle et pupitre | Backend + Frontend | Tests de visibilité public/privé, permissions par rôle, propriété des réponses et cas de dates invalides passés ; un membre ne voit et ne répond qu'aux événements de ses pupitres ciblés. |
| 6 | **Articles, médias, documents et contact** — brouillon/publié, uploads R2 avec contrôles formats/tailles et quotas, partitions servies via autorisation serveur, albums publics, formulaire contact (Turnstile + Resend + accusé de réception) | Backend + Frontend | Tests de brouillon/publication, accès aux objets Storage selon les droits, refus d'upload non autorisé, validation du formulaire de contact bout en bout. |
| 7 | **Notifications, PWA et livraison** — OneSignal côté serveur avec audiences autorisées, service worker et cohabitation OneSignal, cache statique + `/offline` uniquement, installation et notifications testées sur Android et iPhone | Frontend + Backend | Notifications testées sur navigateurs ciblés et appareils mobiles ; parcours hors-ligne sans fuite de données privées ; aucune page adhérent ni donnée membre en cache. |
| 8 | **CI et validation globale** — CI sur push et pull request pour `check`, `lint` et `build` ; premier passage validé | Partagé | `npm run check && npm run lint && npm run build` passe ; les échecs préexistants non liés sont signalés clairement ; documentation de conception (`docs/architecture.md`, `docs/database.md`, `docs/pwa.md`) mise à jour si changement de route, schéma, visibilité, stockage ou notification. |

## 8. Règles du projet à respecter (y compris non écrites par le demandeur)

- Écrire uniquement dans `equipe/PLAN.md` et `docs/questions.md` ; aucun autre fichier n'est modifié par l'architecte.
- Ne lancer aucune commande et n'écrire aucun code ; le plan est une carte, pas une implémentation.
- Ne jamais supposer qu'une information est disponible si elle n'est pas dans les documents : la marquer comme question ouverte dans `docs/questions.md` (format : date / question / pourquoi / proposition).
- Les rôles se lisent dans `profiles.role` (ENUM `app_role`), jamais dans `user_metadata` ; Better Auth est la source de l'identité et des sessions, pas de l'autorité des rôles métier.
- Chaque transaction applicative établit son contexte utilisateur avec `set_config(..., true)` avant les requêtes métier ; le contexte est local à la transaction et n'est jamais conservé dans l'état d'une connexion Hyperdrive réutilisable.
- Les lectures protégées par RLS ne passent pas par un cache partagé de requêtes ; Hyperdrive sert au pooling, le cache de requêtes est réservé aux lectures explicitement publiques et indépendantes de l'identité.
- Toute modification de schéma fait l'objet d'une migration additive reproductible sous `drizzle/` ; une migration appliquée n'est jamais modifiée.
- Svelte 5 : runes uniquement ; interdits `export let`, `$:`, `on:click` (utiliser `onclick`), stores legacy pour l'état local.
- Formulaires et mutations : actions SvelteKit avec progressive enhancement, validation serveur systématique et retours typés (`fail`, `success`).
- Guards centralisés dans `src/lib/auth/guards.ts`, appliqués dans les layouts, actions et endpoints ; le filtrage du menu est une aide d'interface uniquement, jamais un contrôle d'accès.
- PWA : le service worker ne met en cache que les fichiers statiques et la page `/offline` ; jamais de page HTML d'espace adhérents ni de données Neon/R2 en cache ; tout changement du manifest ou du service worker est consigné dans `docs/pwa.md`.
- UI : Tailwind uniquement avec les tokens du thème ; Motion respecte `prefers-reduced-motion` ; mobile-first, accessibilité (labels, contrastes WCAG AA, focus visible) ; interface en français (public en `fr`/`en`/`br`, espace adhérents et auth en français).
- Aucun secret committé (`.env` ignoré, `.env.example` à jour) ; pas de nouvelle dépendance sans justification dans `docs/journal.md`.
- Le trombinoscope est réservé aux membres actifs connectés et n'expose que les champs autorisés dans `docs/brief.md` ; les titres du bureau ne sont jamais publics.
- Hors périmètre (pour l'instant) : annuaire public des membres, paiement/cotisations en ligne, inscription libre.
- Avant de considérer une tâche terminée (côté développeur) : `npm run check && npm run lint && npm run build` ; schéma modifié ⇒ nouvelle migration + mise à jour de `docs/database.md` + tests d'autorisation dans `tests/` ; route ou flux modifié ⇒ mise à jour de `docs/architecture.md` ; entrée datée dans `docs/journal.md`.

## 9. Critères de validation attendus (globaux)

Une fonctionnalité est considérée livrable lorsque :

1. son comportement correspond aux règles de `docs/Spec.md` et `docs/brief.md` ;
2. les rôles autorisés peuvent l'utiliser et les rôles non autorisés en sont refusés côté serveur ;
3. les données privées ne sont pas révélées par les routes, les réponses API, le stockage public, les caches ou les journaux ;
4. les formulaires invalides retournent une erreur explicite et ne modifient pas les données ;
5. l'interface fonctionne sur mobile et reste accessible ;
6. les tests couvrent les cas normaux, les refus d'accès et les entrées invalides pertinents, y compris les tests RLS (absence de contexte, accès autorisés/refusés, isolation des utilisateurs via le pool de connexions) ;
7. les documents concernés (`docs/architecture.md`, `docs/database.md`, `docs/pwa.md`) sont mis à jour en cas de changement de route, schéma, visibilité, stockage ou notification ;
8. `npm run check`, `npm run lint` et `npm run build` passent, ou les échecs préexistants et non liés sont signalés clairement.

## 10. Questions ouvertes

Le besoin exprimé par le client est une mission de relation client, pas une fonctionnalité métier concrète. Une question a été consignée dans `docs/questions.md` pour obtenir le besoin fonctionnel précis avant d'ajouter toute étape fonctionnelle au-delà du focus actuel (socle) :

- **Date :** date inconnue (non fournie dans la demande)
- **Question :** Quel besoin fonctionnel concret le client souhaite-t-il voir implémenter par le développeur backend et le développeur frontend, au-delà du focus actuel du projet (socle Neon/Better Auth/Cloudflare, CI, gardes d'accès, RLS) décrit aux étapes 1 à 8 de ce plan ?
- **Pourquoi :** sans cette précision, toute étape fonctionnelle supplémentaire serait une supposition interdite ; le plan ne peut pas engager les développeurs sur un besoin métier non exprimé.
- **Proposition :** poursuivre l'implémentation du focus actuel (socle) telle que décrite à l'étape 7 ; le besoin fonctionnel sera ajouté à ce plan (nouvelle étape ou extension d'une étape existante) une fois tranché par le client.
decision: >
  Le périmètre fonctionnel du projet est déjà défini dans
  les huit étapes du plan de travail.

  Aucun nouveau besoin fonctionnel n'est à ajouter.

  Les développeurs backend et frontend doivent réaliser
  les fonctionnalités décrites aux étapes 1 à 8,
  en respectant les spécifications, les décisions validées
  et les critères de fin de chaque étape.

  Les étapes 1 à 3 constituent le socle technique et sécuritaire.
  Les étapes 4 à 7 couvrent les fonctionnalités métier
  de l'application Bagad Penhars.
  L'étape 8 assure la validation globale et la qualité du projet.

  Toute fonctionnalité supplémentaire non prévue devra
  faire l'objet d'une validation préalable du client.
Les autres questions déjà présentes dans `docs/questions.md` (durées de conservation des réponses/journaux/messages de contact, cohabitation service worker PWA/OneSignal, etc.) ne sont pas reposées ici ; certaines y sont déjà tranchées, d'autres restent ouvertes et sont suivies à cet endroit.
