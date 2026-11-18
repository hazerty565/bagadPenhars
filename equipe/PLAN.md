# Plan d'implémentation — Site Bagad Penhars

> Rôle : **ARCHITECTE**. Je n'écris que dans `equipe/PLAN.md`, `equipe/CONTRAT_API.md` et `docs/questions.md` ; je ne code pas et je ne lance aucune commande. Ce plan fait foi pour le développeur backend, le développeur frontend, le testeur et le mainteneur.
>
> **Version du 2026-11-17, mise à jour du 2026-11-18** après les décisions client sur les quatre questions ouvertes de la session d'architecture (Q-2026-11-17-01 à -04, détail dans `docs/questions.md`). Établie après lecture de `AGENTS.md`, `docs/brief.md`, `docs/journal.md` (jusqu'au 2026-11-15), `docs/Spec.md`, `docs/architecture.md`, `docs/database.md`, `docs/pwa.md`, `docs/media.md`, `docs/event.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/questions.md`, de l'état réel des routes, des chargements publics et des commandes serveur de l'espace adhérents. Les sections 1 à 10 du plan du 2026-11-08 sont remplacées par le présent document ; **l'annexe A conserve les étapes 1 à 35 avec leur état au 2026-11-17**.
>
> **Révision du 2026-11-18 (2ᵉ passe) — audit des dépendances du mainteneur.** Prise en compte de `docs/mises-a-jour.md` (statut `PLAN À ACTUALISER`) : §2.1 (majeures différées complétées), §2.2 (quatre décisions de packages), §3 (**nouvelles étapes 50 et 51**, préalables bloquantes), §4 (règle de verrouillage), §7 (versions réelles constatées, `drizzle-orm`/`drizzle-kit` alignés sur les peers de `better-auth` 1.7, `@better-auth/infra` retiré, `image-size` 2.1.0 épinglé, `resend` 6 différé), §8 (défauts de verrouillage et ruptures Drizzle) et annexe A. Aucune étape existante n'est supprimée ni renumérotée ; **aucun élargissement de périmètre** : le design public et l'espace adhérents restent figés à 98 %.
>
> **Révision du 2026-11-18 (3ᵉ passe) — point de contrôle n°1 : i18n et icônes.** Demande client : « installation de svelte-i18n pour les traductions en français, anglais et breton et installation de lucide-svelte pour les icons ». Après vérification du dépôt et clarification client : **`svelte-i18n` est installé et migré dans cette session** (Q-2026-11-09-01 **tranchée**, étapes **52** puis **53**, vague 1) ; **`lucide-svelte` n'est ni installé ni migré**, la demande étant **satisfaite par l'état existant** (`@lucide/svelte` 1.71.0 déjà installé et utilisé ; `lucide-svelte` déprécié le 2026-11-10, présent uniquement dans `src/autre/`, maquette hors build — voir `docs/questions.md` D-2026-11-18-08 et §0 ci-dessous). Sections touchées : §0, §2.1, §2.2, §2.3 (§2.3.1 nouvelle), §3 (étapes 52 et 53), §3.1 (ordre du public), §4, §6, §7.2/§7.3/§7.4, §8, annexe A. **Aucun endpoint ni signature de `equipe/CONTRAT_API.md` n'est modifié.**

>
> **Conflit de priorité :** en cas de contradiction entre ce plan et `AGENTS.md`, `AGENTS.md` prévaut et l'écart est signalé dans `docs/questions.md`. Aucune règle métier n'est inventée : tout point non tranché est une question ouverte (§0 et §6).

## 0. Questions ouvertes (tête de plan)

**Aucune question bloquante au 2026-11-18.** Les quatre questions de la session du 2026-11-17 ont été tranchées par le client et **Q-2026-11-09-01 (i18n) l'a été le 2026-11-18** (point de contrôle n°1) ; leur état et leur décision figurent dans `docs/questions.md` (sections 2026-11-17 et 2026-11-18). Le plan est exécutable de bout en bout.

**Audit des dépendances du 2026-11-18 (`docs/mises-a-jour.md`, statut `PLAN À ACTUALISER`) :** aucun point ne relève d'une décision client. Les trois arbitrages qui revenaient à l'architecte sont tranchés (§2.2 et §7) — retrait de `@better-auth/infra`, `image-size@2.1.0` exact avec import de la racine, `resend` 6 différé — et l'alignement `drizzle-orm`/`drizzle-kit` sur les peers de `better-auth` est porté par les **étapes 50 et 51** (vague 0, préalables bloquantes). Décisions consignées dans `docs/questions.md`, section 2026-11-18.

| Question | Sujet | Décision client du 2026-11-18 | Effet sur le plan |
| --- | --- | --- | --- |
| **Q-2026-11-17-01** | Motion exigé par `AGENTS.md`, absent du dépôt et inutilisé | **A** — entériner l'absence de Motion ; animations CSS existantes respectant `prefers-reduced-motion` ; mise à jour de `AGENTS.md` §0 actée | Étape 46 exécutable. Aucun paquet Motion (§7.2). Aucune étape ne dépend de la correction documentaire. |
| **Q-2026-11-17-02** | Lien d'invitation : Spec §4.2 = 1 h, code = 7 jours | **A** — 1 heure, conformément à `docs/Spec.md` §4.2 ; code à aligner (7 jours → 1 heure) | Étape 45 débloquée ; l'alignement du code fait partie de son livrable. |
| **Q-2026-11-17-03** | Photo de profil réelle vs palette illustrée 1–12 | Deux temps : palette conservée d'abord, photo personnelle réelle quand R2 sera branché, en fin de session (formulation client : « palette dans un premier temps et utilisation de photo perso quand R2 sera branché à la fin ») | Étape 43 = palette conservée, aucun changement d'écran ; **nouvelle étape 49** = téléversement réel après R2, repli sur la palette si `avatarUrl` est vide. |
| **Q-2026-11-17-04** | `category`, `image`, `imageAlt` de l'article public absents de la table | **A** — migration additive `category`, `image_url`, `image_alt` nullables, interface publique inchangée, valeurs vides masquées | Étape 38 débloquée et porte la migration. |
| **Q-2026-11-09-01** | Bibliothèque i18n du site public : dictionnaires typés maison ou `svelte-i18n` | **`svelte-i18n` retenu** ; migration faite **dans cette session** (demande client du point de contrôle n°1, 2026-11-18) | **Étapes 52 et 53** (vague 1), placées **avant** les branchements publics 37, 38, 39. Aucun endpoint modifié (§2.3). |

**Clarification du 2026-11-18 sur les icônes (à ne pas rouvrir).** La demande « installation de lucide-svelte pour les icons » est **déjà satisfaite** et ne déclenche **aucune installation, aucune migration** : `@lucide/svelte` **1.71.0** est installé (`dependencies`, épinglé) et importé dans la vingtaine de composants et routes qui en ont besoin, et il figure dans `ssr.noExternal` ; `lucide-svelte` est l'**ancien nom déprécié** (remplacé le 2026-11-10), présent **uniquement** dans `src/autre/` (maquette hors build et hors tests) et dans `package-lock.json` (artefact npm périmé mis hors jeu par l'étape 51). Décision consignée dans `docs/questions.md` (D-2026-11-18-08) pour qu'un audit ultérieur ne rouvre pas le point.

**Gouvernance documentaire — `AGENTS.md` §0 :** `AGENTS.md` cite encore Motion à tort. La correction de §0 revient au **client** ou à un agent explicitement autorisé par lui (l'architecte n'écrit jamais dans `AGENTS.md`). **Après l'étape 52, la mention de `svelte-i18n` dans `AGENTS.md` §0 cesse d'être un écart** : le paquet sera installé et utilisé. Seul **Motion** reste en divergence documentaire. Aucune étape du plan n'attend cette correction : l'étape 46 constate l'absence de Motion et n'a pas à modifier `AGENTS.md`.

**Q-2026-11-09-01 (i18n) est tranchée le 2026-11-18** : `svelte-i18n` est retenu et la migration a lieu **dans cette session**, portée par les étapes **52** et **53** et placée avant les branchements publics (voir §3.1). Les dictionnaires typés ne sont donc plus « la référence par défaut de la V1 » : ils deviennent la **source** des catalogues de messages, sans réécriture des textes.

## 1. Besoin (2 phrases max)

Le client demande de reprendre le projet à son état réel et de le mener jusqu'en production : le design public (98 %) et l'espace adhérents (98 %) sont figés, il reste à brancher les données réelles, à verrouiller les autorisations, à tester et à déployer, sans refonte graphique. Les 2 % restants sont réservés aux correctifs fonctionnels et d'accessibilité strictement nécessaires.

## 2. Décisions techniques

### 2.1 Périmètre exact de la session

**Dans le périmètre** (chaque ligne est couverte par une étape du §3) :

| Élément | Pourquoi il entre dans la session |
| --- | --- |
| Agenda, actualités et galerie publics branchés sur Neon | Les trois dernières sources publiques provisoires (`src/lib/data/agenda.ts`, `articles.ts`, `site.ts → homeGallery`) ; sans elles le site public affiche encore des données de démonstration. |
| `GET /api/files/[...key]` et téléversements réels (documents PDF, photos d'album, puis photo de profil à l'étape 49) | Le fichier de route est vide et `document.create` n'écrit qu'une ligne de métadonnées (`size: 0`, aucun objet R2) : aucune pièce jointe n'est réellement stockée ni servie. |
| Quota 8 Go / alerte 7 Go / blocage 8 Go sur les téléversements | Le schéma est en `bigint` et les seuils existent, mais aucun upload ne les fait varier. |
| Durcissement serveur des règles de gestion d'événements | Écart réel : un chef peut créer ou modifier un événement avec une visibilité `public`/`interne` alors que la règle validée est « chef = un seul de ses pupitres, visibilité `pupitre` ». |
| Envoi OneSignal côté serveur et journal d'envoi | `notification.send` écrit en base mais n'envoie rien ; les préférences existent et ne sont pas appliquées. |
| Tests d'autorisation, de RLS et du parcours d'invitation | `tests/guards.test.ts`, `tests/i18n.test.ts` et `tests/invitation.test.ts` sont vides ; aucune preuve automatique des refus. |
| Suppression des routes historiques `src/routes/public/...`, sitemap réel, correctifs d'accessibilité et de mobile | Le site public actuel vit sous `(public)` ; l'ancienne arborescence répond encore. Sitemap vide. |
| Mise en production Cloudflare Pages (Hyperdrive `bagad-prod` → Neon `production`) | Dernière étape du roadmap, jamais exécutée. |
| Assainissement des dépendances signalées par Dependabot | 57 alertes dont 2 critiques, listées comme reste à faire au journal du 2026-11-15. |
| Alignement des dépendances sur leurs peers (`drizzle-orm`/`drizzle-kit` vs `better-auth` 1.7) et hygiène du verrou | Écart silencieux constaté par l'audit du 2026-11-18 : l'adaptateur d'authentification tournait hors du périmètre de support de son fournisseur. Préalable bloquant aux étapes backend (étapes 50 et 51), sans aucun effet sur l'interface. |
| **Installation de `svelte-i18n` et migration de l'i18n public** (étapes 52 et 53) | Demande explicite du client au point de contrôle n°1 du 2026-11-18 ; `AGENTS.md` §0 prescrit `svelte-i18n` et `docs/mises-a-jour`/Q-2026-11-09-01 laissaient l'écart ouvert. Porte sur les seuls textes publics, sans réécriture de contenu et sans changement visuel (preuve avant/après exigée). |

**Hors périmètre de cette session** (et pourquoi) :

| Élément | Raison de l'exclusion |
| --- | --- |
| Refonte graphique publique ou privée | Design figé à 98 % (public et espace adhérents) ; seuls les correctifs nécessaires sont admis. |
| Paiement, cotisation en ligne, inscription libre, annuaire public des membres | Hors périmètre absolu du `docs/brief.md`. |
| Éditeur d'articles Milkdown | Fonctionnel aujourd'hui avec un formulaire Markdown ; paquet non installé, mise à niveau différée (§7). |
| Champs `phone`/`address` dans le profil adhérent | Colonnes présentes, mais aucun champ correspondant dans l'interface livrée : les ajouter serait une modification d'écran non demandée. |
| Rappels planifiés J-3 (Scheduled Worker) | Décision Q-2026-11-08-07 déjà prise, mais elle dépend d'un envoi OneSignal stabilisé : planifiée après l'étape 44, hors de cette session. |
| Lecteur audio | Aucune piste fournie (Q-2026-11-09-03) ; l'état vide honnête est conservé. |
| Contenus éditoriaux à valider (accueil, Formation, Bagad, partenaires, mentions légales) | Dépendent de Q-2026-11-09-02, Q-2026-11-10-01 à -06, -08 et Q-2026-11-11-01 : validation du bureau, pas du code. |
| Montées de version **majeures** | Risque de régression élevé sans valeur fonctionnelle ; traitées comme dette différée (§2.1.1 et §8), jamais comme étape de cette session. |
| Montées de version **mineures/patch** constatées par l'audit du 2026-11-18 (hors paquets des étapes 50 et 51) | Elles sont réelles mais un `pnpm install` libre en ferait bouger une trentaine d'un coup : le diff du verrou deviendrait inattribuable. Traitées par lots ultérieurs, après l'étape 47 (§8). |
| **Icônes** : installation de `lucide-svelte` ou migration du paquet d'icônes | **Sans objet — déjà satisfait.** `@lucide/svelte` 1.71.0 est installé et utilisé ; `lucide-svelte` est l'ancien nom déprécié (2026-11-10) et n'existe que dans `src/autre/`. Décision client du 2026-11-18 : aucune installation, aucune migration (`docs/questions.md` D-2026-11-18-08). |

#### 2.1.1 Majeures disponibles mais **hors session** (constat du 2026-11-18)

Sept majeures sont publiées et **volontairement différées** : aucune n'apporte de valeur fonctionnelle sur un design figé à 98 %, et chacune entraîne un lot solidaire de paquets. Elles sont consignées ici pour ne pas être « découvertes » en cours de session. À ces sept s'ajoutent les trois déjà différées (Tailwind 4, Zod 4, Svelte 6).

| Paquet | Verrouillé le 2026-11-18 | Majeure disponible | Contrainte qui interdit la montée en session |
| --- | --- | --- | --- |
| `@sveltejs/kit` | 2.61.1 | **3.3.1** | peer `svelte ^5.57.1` + `vite ^8.0.12` : entraîne un lot Svelte/Kit/adaptateur, hors périmètre. |
| `@sveltejs/adapter-cloudflare` | 7.2.10 | **8.0.3** | exige `@sveltejs/kit ^3.0.0-next.0` : **interdite** tant que Kit reste en 2. |
| `typescript` | 6.0.3 | **7.0.2** | portage natif ; ferait bouger `svelte-check` et `typescript-eslint` en pleine session. |
| `vitest` (+ `@vitest/browser-playwright`, `vitest-browser-svelte`) | 4.1.7 / 4.1.7 / 2.1.1 | **5.1.1 / 5.1.1 / 3.1.0** | chaîne solidaire ; l'étape 45 repose dessus. |
| `@cloudflare/workers-types` | 4.20260702.1 | **5.20261118.1** | rupture de typage Workers, à coupler avec la majeure de l'adaptateur. |
| `prettier-plugin-svelte` | 3.5.2 | **4.2.0** | nouveau contrat de plugin ; réécrirait le formatage de tout le dépôt. |
| `resend` | 4.8.0 | **6.38.1** | majeure sans impact sur notre usage, mais sans valeur fonctionnelle : **différée** (§7.1), le gain de graphe ne justifie pas un diff de verrou en session. |

### 2.2 Table des décisions

| Choix | Raison |
| --- | --- |
| Langage : **TypeScript** (SvelteKit 5, runes uniquement) | Stack figée par `AGENTS.md` ; `$state`, `$derived`, `$effect`, `$props` ; interdits `export let`, `$:`, `on:click`, stores legacy pour l'état local. |
| Structure dossiers : routes SvelteKit par groupes (`(public)/[lang=lang]`, `dashboard`, `auth`, `api`) | Arborescence déjà en place et cohérente avec `docs/Structure.md` ; `(public)` porte les pages localisées, `dashboard` l'espace adhérents en français. |
| Base de données : **Neon PostgreSQL** + **Drizzle ORM** + `pg` / `drizzle-orm/node-postgres` via **Cloudflare Hyperdrive** | Décision Q-2026-11-08-01 ; `neon-serverless` est exclu au-dessus d'Hyperdrive. Les lectures privées ne passent jamais par un cache de requêtes partagé. |
| Framework : **SvelteKit 2 + adapter-cloudflare**, Better Auth pour l'identité, R2 pour les objets | Stack cible du brief ; Better Auth ne porte que l'identité et la session, jamais le rôle métier. |
| **Surface unique de mutation de l'espace adhérents : `POST /api/member/action`** (`{ action, payload }` → `{ snapshot, result }`) | Déjà implémentée et utilisée par tous les services client. Une commande = une transaction RLS + retour d'un instantané cohérent ; évite les actions de formulaire dispersées par page. |
| **Instantané serveur (`MemberSnapshot`) comme unique source de vérité côté client** | La lecture est faite sous RLS dans `buildMemberSnapshot` ; le client n'infère jamais un droit et ne reçoit jamais un identifiant de profil en entrée. |
| **Autorisations vérifiées deux fois** : fonctions pures `src/lib/member/permissions.ts` + politiques RLS | Défense en profondeur (`AGENTS.md` §2, `docs/database.md` §2). Masquer un bouton n'est jamais une protection. |
| **Rôles lus uniquement dans `profiles.role`** (ENUM `app_role`), statut dans `profiles.account_status` | Règle de sécurité ; testé par les guards. |
| Contexte RLS : `withUserContext(profileId, cb)` → transaction + `set_config('app.profile_id', ..., true)` | Le contexte est local à la transaction et ne fuit pas sur une connexion Hyperdrive réutilisée. |
| Stockage : buckets figés `R2_PUBLIC` / `R2_PRIVATE`, aucun objet privé servi par URL publique, **aucune URL signée** | Décision Q-2026-11-08-04 ; les objets privés passent par `GET /api/files/private/...` après guard. |
| Images : original stocké dans R2, variantes produites **à la diffusion** par Cloudflare Image Resizing (400×400, 2000×2000) | Décision Q-2026-11-08-03 ; `sharp` est un binaire natif, inutilisable sur Workers. Aucune conversion WebP côté serveur. |
| Validation de taille d'image : lecture d'en-tête (paquet pur JS, §7) plutôt qu'un décodeur natif | Les contrôles 15 Mo / 6000×6000 / PDF 20 Mo doivent être faits côté serveur, avant écriture R2. |
| i18n public : **`svelte-i18n`** + **catalogues de messages par langue** (`fr`, `en`, `br`) dans `src/lib/i18n/` | Q-2026-11-09-01 **tranchée le 2026-11-18** sur demande client (étapes 52 et 53). Les dictionnaires typés existants restent la **source** des catalogues (textes repris mot pour mot, complétude `fr`/`en`/`br` toujours vérifiée par `npm run check` grâce au type `Dictionary`) ; l'accès passe par l'API de messages. Aucune chaîne localisée en dur dans un composant public ; espace adhérents et authentification en français, hors catalogues. |
| Locale : **segment `[lang=lang]` uniquement**, repli `fr`, **aucune détection navigateur**, aucun cookie de langue | Décision d'architecture §2.3.1 : la même URL doit produire le même HTML au serveur et dans le navigateur. `getLocaleFromNavigator` / `Accept-Language` feraient diverger le rendu SSR (Cloudflare Workers) et l'hydratation → flash de langue, contenu indexé dans une langue et affiché dans une autre, `hreflang` faux. |
| Icônes : **`@lucide/svelte` 1.71.0 conservé, `lucide-svelte` non installé** | État déjà conforme : le bon paquet est installé et importé, l'ancien nom est déprécié depuis le 2026-11-10 et ne subsiste que dans `src/autre/` (maquette hors build). Décision client du 2026-11-18 : aucune installation, aucune migration. |
| Notifications : OneSignal appelé **uniquement côté serveur** via `fetch`, audience résolue en base | Aucun paquet nécessaire ; la clé REST ne quitte jamais le serveur ; un `playerId` client n'est jamais accepté. |
| Tests : **Vitest** (`npm run test`), tests d'autorisation et de RLS en base de test | Chaîne déjà installée (`vitest`, Playwright) ; les fichiers vides existent et doivent être remplis. |
| Packages : **aucune installation par les développeurs** ; l'architecte propose, le mainteneur vérifie et installe, le client valide (§7) | Gouvernance `AGENTS.md` §5 et « Gouvernance des packages ». Les **seules** installations de la session sont portées par les étapes 50 et 51, exécutées par le mainteneur, avec diff de verrou contrôlé. |
| Migrations : **additives uniquement**, `drizzle/` + `drizzle/meta/`, jamais de modification d'une migration appliquée | Règle absolue ; les colonnes éditoriales de l'article (Q-2026-11-17-04, option A tranchée le 2026-11-18) suivent ce chemin. |
| Animations : **CSS/Tailwind uniquement, aucune dépendance Motion** | Q-2026-11-17-01 option A (2026-11-18) : aucun composant n'importe Motion, les transitions existantes sont en CSS et respectent `prefers-reduced-motion` ; installer Motion rouvrirait le frontend pour un gain nul sur un design figé à 98 %. |
| Photo de profil : **palette 1–12 conservée, photo réelle en fin de session seulement** | Q-2026-11-17-03 en deux temps : l'étape 43 ne touche à aucun écran, l'étape 49 branche le téléversement une fois R2 opérationnel, avec repli palette quand `avatarUrl` est vide. |
| Déploiement : Preview = Hyperdrive `bagad-dev` → Neon `test` ; Production = `bagad-prod` → Neon `production` | Décisions Q-2026-11-14-01 ; secrets séparés par environnement, `.env` local limité au développement. |
| ORM et migrations : **`drizzle-orm` 0.45.4 + `drizzle-kit` 0.31.11** (montée préalable, étape 50) | Ce sont les versions exigées par les peers de `better-auth` 1.7 (`drizzle-orm ^0.45.2`, `drizzle-kit >=0.31.4`) ; l'adaptateur utilisé dans `src/lib/server/auth.ts` est précisément celui couvert par ce peer. Les peers sont `optional`, donc l'écart était **silencieux** : le corriger est un préalable, pas un confort (audit du 2026-11-18, §1). |
| `@better-auth/infra` : **retiré** de `package.json` (étape 51) | Aucun import dans `src/`, `scripts/`, `tests/`, `.github/` ; c'est la **seule** source du peer `zod >=4.1.12` non satisfait. Le retirer fait maigrir le graphe sans toucher une ligne de code. Le `zod` 4 transitif reste présent (via `better-call`) : il reste neutralisé par `ssr.noExternal`, **sans aucun `override`**. |
| `image-size` : **2.1.0 exact**, import de la racine uniquement (étape 51) | Seule API compatible Workers : la racine ne charge aucun module Node, contrairement au sous-chemin `image-size/fromFile` qui est interdit. Version épinglée pour que la compatibilité Workers ne dérive pas silencieusement. |
| `resend` : **4.8.0 conservé**, majeure 6 **différée** | `emails.send({ from, to, subject, html, text, replyTo })` est identique en 4 et 6 ; le seul gain (retrait de React du graphe) ne vaut pas une majeure en session. Reporté avec les sept majeures du §2.1.1. |

### 2.3 Lots backend / frontend et points de jonction

Le backend ne touche pas aux composants ; le frontend ne construit jamais une clé R2, un rôle ou une permission. Les points de jonction sont contractuels (voir `equipe/CONTRAT_API.md`).

| # | Jonction | Backend fournit | Frontend consomme | Interdit |
| --- | --- | --- | --- | --- |
| **J1** | Instantané adhérent | `GET /api/member` → `{ snapshot }` ; `POST /api/member/action` → `{ snapshot, result }` | Le store applique le snapshot reçu | Recalculer un droit, envoyer `profileId` comme acteur |
| **J2** | Chargements publics | Objets de page de forme figée (`PublicAgendaEvent`, `PublicArticle`, `PublicAlbum`, `PublicPhoto`) | Composants inchangés | Changer la forme sans modifier le contrat |
| **J3** | Fichiers | URLs `avatarUrl`, `downloadUrl` construites côté serveur | Affichage et téléchargement par ces URLs | Composer une clé R2 ou une URL `r2.dev` côté client |
| **J4** | Téléversements | `POST /api/member/upload` (multipart) → `{ snapshot, result }` | Envoi du `FormData`, application du snapshot | Envoyer un chemin de stockage ou une taille déclarée |
| **J5** | Erreurs | Codes stables (`forbidden`, `event_locked`, `quota_exceeded`, …) + statut HTTP | Traduction en messages d'interface | Afficher un message brut du serveur |
| **J6** | i18n | Aucun texte localisé renvoyé par le serveur (sauf e-mails et quelques libellés serveur explicites) ; `+layout.server.ts` renvoie `lang` | Tous les libellés publics viennent des catalogues de messages (`src/lib/i18n/`), via l'API de `svelte-i18n` | Chaîne française en dur dans un composant public ; détection de langue côté client |
| **J7** | SEO | Loads exposent les données nécessaires (slug, date, `lang`) ; `lang` est déjà renvoyé par `+layout.server.ts` | `sitemap.xml` et métadonnées générés depuis ces données, `<svelte:head>` par page | Sitemap listant une page privée ou un brouillon ; `hreflang` calculé depuis autre chose que `lang` |

### 2.3.1 Architecture i18n et point de jonction avec le SEO

Cette sous-section fixe la décision prise avec Q-2026-11-09-01 (tranchée le 2026-11-18) et borne la migration des étapes 52 et 53.

| Point | Décision | Conséquence opposable |
| --- | --- | --- |
| **Catalogues de messages** | Un catalogue par langue (`fr`, `en`, `br`) dans `src/lib/i18n/`, enregistré **statiquement** auprès de `svelte-i18n` | Aucun chargement dynamique de catalogue au rendu côté Worker (pas de `fetch`/`fs`) : les trois langues pèsent quelques kilo-octets et sont déjà présentes dans le bundle aujourd'hui |
| **Type de référence** | Les catalogues **conservent** le type `Dictionary` (`src/lib/i18n/types.ts`), qui décrit la forme de `fr` | La complétude `fr`/`en`/`br` reste garantie à la compilation : une clé oubliée dans `en.ts` casse `npm run check`, exactement comme aujourd'hui. Perdre cette garantie serait une régression fonctionnelle, pas un détail |
| **Source de la locale** | **Segment de route `[lang=lang]`** (`src/params/lang.ts`), repli **`fr`** | Une seule URL par langue, partageable, indexable ; `canonical` et `hreflang` restent calculables sans ambiguïté |
| **Détection navigateur** | **Interdite** (`getLocaleFromNavigator`, `Accept-Language`, cookie de préférence de langue) | SSR sur Cloudflare Workers et hydratation client rendent **la même langue pour la même URL** : pas de flash, pas de mismatch d'hydratation, pas de page indexée en `fr` affichée en `en` |
| **Hydratation** | La langue du HTML servi est déjà celle du segment (`html lang="%lang%"`, `hooks.server.ts`) | `document.documentElement.lang` est correct **avant** toute exécution JS ; l'initialisation client ne fait que confirmer la valeur reçue |
| **`%lang%` de `src/app.html`** | **Conservé tel quel** (`transformPageChunk` dans `hooks.server.ts`) | Aucun remplacement par une balise réactive : le `lang` doit être présent dans le HTML brut, avant hydratation |
| **Jonction SEO** | Les balises SEO restent dans le `<svelte:head>` de chaque page, alimentées par les catalogues | Titre, `description`, `canonical`, `hreflang` `fr`/`en`/`br`/`x-default` et Open Graph doivent rester **identiques au caractère près** après migration (preuve exigée, §3 étape 53) |
| **Périmètre** | **Site public uniquement** | `src/routes/dashboard/**` et `src/routes/auth/**` restent en français, sans catalogue : aucune régression ni traduction improvisée |
| **Contrat d'API** | **Aucun changement** | Aucun endpoint, aucun `load` ne change de signature ; `+layout.server.ts` renvoyait déjà `{ lang }`, donc `equipe/CONTRAT_API.md` reste **inchangé** (voir étape 53) |

## 3. Étapes

Chaque étape est livrable et testable seule, avec un maître d'œuvre unique. La numérotation continue celle de l'historique (annexe A) : les étapes **50 et 51** s'ajoutent après l'étape 49 et forment la **vague 0**, préalable bloquante (§3.1) ; les étapes **52** (socle i18n) et **53** (bascule i18n des composants publics) s'ajoutent après elles et forment la **vague 1**, placée **avant** les branchements publics 37, 38 et 39 (raison exacte au §3.1). Aucune étape ne dépend plus d'un arbitrage : les questions Q-2026-11-17-01 à -04 et **Q-2026-11-09-01** sont tranchées (voir §0).

> **Règle de dépendance des étapes 50, 51 et 52 :** les étapes **50 et 51** sont les **seules** étapes autorisées à modifier `package.json`, `pnpm-lock.yaml` et l'arbre installé **hors ajout de `svelte-i18n`** ; cet ajout est porté par l'**étape 52**, par le mainteneur, avec le même protocole (diff de verrou contrôlé, `check`+`build`+`test` de part et d'autre). Aucune autre étape ne déplace ni n'ajoute un paquet. Les étapes 50 et 51 doivent être terminées **avant** toute étape backend (36, 40, 41, 44) parce que le driver et l'adaptateur d'authentification en dépendent ; l'étape 52 vient **après** elles pour que le diff du verrou reste attribuable.

### Étape 50 (vague 0) : Hydratation à l'identique puis mise à niveau bloquante `drizzle-orm` / `drizzle-kit`

- **Livrable** : environnement installé et aligné sur les peers de `better-auth` 1.7. Dans cet ordre, sans exception :
  1. **Hydratation à l'identique** : `pnpm install --frozen-lockfile` (c'est exactement ce que fait la CI). Interdits à ce stade : `pnpm install` libre, `pnpm update`, `npm install` (voir §8 : le verrou est en retard sur ses propres plages et `package-lock.json` est un artefact npm périmé). **Premier contrôle de référence** immédiatement après, sur cet arbre hydraté : `npm run check && npm run build && npm run test`. Il établit la ligne de base — indispensable puisque `node_modules/` est absent et qu'aucun contrôle n'a jamais tourné sur cet état : tout écart ultérieur devient imputable à la seule montée de Drizzle, et non à une casse préexistante.
  2. **Mise à niveau ciblée** de deux paquets, et de deux seulement : `drizzle-orm` → **0.45.4** et `drizzle-kit` → **0.31.11** (`pnpm add -E` sur ces deux noms ; le mainteneur vérifie que le diff de `pnpm-lock.yaml` ne contient **que** leur sous-arbre et leurs entrées de peer `better-auth`).
  3. **Adaptation du code si l'API change** (développeur backend, seul habilité à toucher `src/`) : les deux zones où une rupture est **réellement** attendue sont l'**outillage `drizzle-kit`** (`drizzle.config.ts` : options de la 0.31) et l'**adaptateur Better Auth** (`src/lib/server/auth.ts`, `drizzleAdapter`). À relire sans présomption de casse : `src/lib/server/db-admin.ts` et `src/lib/db/index.ts` (`drizzle` / `NodePgDatabase` / `transaction`), `src/lib/server/invitations.ts` et `src/lib/server/member/*` (opérateurs `and/asc/desc/eq/ne/inArray/sql`). **`db.execute` n'est pas une rupture** et ne doit pas être cherché comme telle : la signature est **identique** en `drizzle-orm` 0.39.3 et 0.45.4 (`execute<TRow extends Record<string, unknown> = Record<string, unknown>>(query: SQLWrapper | string): PgRaw<…>`, `QueryResult.rows` intact), donc `src/hooks.server.ts:27-30` compile sans retouche ; seule amélioration **facultative** : `db.execute<{ profile_id: string | null }>(…)` pour supprimer le cast final. Les codecs `pg` (`timestamp`, `json`, `bytea`) restent à vérifier sur les colonnes `timestamp` du schéma et sur les paramètres `json` passés en `sql` brut. **`npm run check` ne détectera aucune rupture de configuration** : `drizzle.config.ts` est hors du périmètre de `svelte-check`, et `metaFolder`, `strict`, `breakOnError` sont absents du type `Config` en 0.30.6 comme en 0.31.11 (propriétés excédentaires déjà tolérées aujourd'hui) — seule l'exécution de `db:generate` fait foi (point 5). Aucun changement de schéma, aucune migration écrite dans cette étape.
  4. **Preuve de non-régression** : `npm run check && npm run build && npm run test`. Le `build` est obligatoire (c'est le seul contrôle qui attrape une rupture de résolution de `zod` 3/4 via `ssr.noExternal`). Si `check` échoue sur un type de la couche d'accès aux données (adaptateur, opérateurs, codecs), la correction se fait dans le code appelant, **jamais** par un `as any` global ni par un `override` de paquet. Un échec sur `db.execute` n'est **pas** attendu et signalerait un problème d'installation, pas une rupture d'API.
  5. **Preuve d'innocuité sur les migrations** : `drizzle-kit` 0.31 peut réécrire les instantanés de `drizzle/meta/`. **Interdit** de lancer `db:generate` sur le dépôt tel quel : d'abord une génération d'essai sur une **copie** du dossier `drizzle/`, pour démontrer qu'aucune migration appliquée n'est modifiée. Le résultat est consigné dans `docs/journal.md` ; le dossier réel n'est touché que si le diff est nul.
     - **Piège préexistant, non imputable à la 0.31** : `drizzle/meta/_journal.json` déclare **6** entrées (idx 0 → 5, jusqu'à `0005_bureau_title`) alors que `drizzle/meta/` ne contient que **5** instantanés (`0000` → `0004`) — `0005_bureau_title.sql` (fonction `app.set_profile_bureau_title`, `GRANT`/`REVOKE`) n'a jamais eu d'instantané, alors que 0001/0002/0003 sont identiques à l'octet près. Le diff de la génération d'essai peut donc être **antérieur à la montée**. Règle de lecture à appliquer avant toute conclusion : diff **nul** ⇒ rien à faire, on s'arrête là ; diff **limité au seul `0005`** (création du `0005_snapshot.json` manquant, ou retouche de l'entrée `idx: 5` de `_journal.json`) ⇒ **préexistant**, consigné dans `docs/journal.md` avec la mention « antérieur à l'étape 50, indépendant de `drizzle-kit` 0.31 » et **non corrigé ici** ; diff qui touche les instantanés `0000` → `0004`, un fichier `.sql` déjà appliqué, ou l'ordre / les `tag` des entrées existantes ⇒ **imputable à la 0.31**, on arrête et `drizzle/` réel n'est pas touché. Dans tous les cas, le dossier réel reste intact dans cette étape.
- **Qui installe** : le **mainteneur**, et lui seul (gouvernance `AGENTS.md` §5). **Qui adapte le code** : le développeur backend. **Qui valide** : le mainteneur rejoue `check`/`build`/`test` sur un clone propre après `pnpm install --frozen-lockfile`.
- **Testable** : `pnpm install --frozen-lockfile` réussit sur un clone neuf après l'étape ; `pnpm why drizzle-orm` et `pnpm why drizzle-kit` renvoient 0.45.4 et 0.31.11 ; `better-auth` n'a plus de peer `drizzle-orm`/`drizzle-kit` non satisfait ; **le diff de `pnpm-lock.yaml` reste limité aux deux paquets et à leur sous-arbre** — attendu : **retrait** de `gel`, de `esbuild-register` et de `esbuild@0.19.12` (dont la disparition **réécrit toutes les lignes de peer qui le citent**, notamment celles de `vite@8.0.14(…)(esbuild@0.19.12)`), **ajout** de `esbuild@0.25.x`, de `tsx ^4.21.0` et de leurs dépendances, **réécriture** des lignes de résolution de peers de `better-auth@1.7.18(…)(drizzle-kit@…)(drizzle-orm@…)` avec les nouvelles versions ; **interdit** dans ce diff : toute autre version de paquet direct (`svelte`, `@sveltejs/kit`, `vite`, `zod`, `better-auth`, `pg`…), tout paquet ajouté ou retiré hors de ce sous-arbre, toute modification sous `drizzle/` — un `git diff --stat` volumineux est donc **normal et attendu** : le critère est le **contenu** du diff, pas son nombre de lignes ; `npm run check && npm run build && npm run test` passent ; `git status drizzle/` est vide après la génération d'essai.
- **Dépend de** : rien. **Bloque** : toutes les étapes backend (36, 40, 41, 44) et, par transitivité, 42, 45, 47 et 49.
- **Responsable** : Mainteneur (installation, contrôle du diff) + Backend (adaptation du code).
- **Fichiers** : `package.json`, `pnpm-lock.yaml`, `drizzle.config.ts`, `src/lib/server/auth.ts`, `src/lib/server/db-admin.ts`, `src/lib/db/index.ts`, `src/hooks.server.ts`, `src/lib/server/invitations.ts`, `src/lib/server/member/*` (uniquement si un type de retour change), `docs/journal.md`.
- **Statut** : **PLANIFIÉE — à exécuter en premier.** Aucune commande n'a été lancée par l'architecte.

### Étape 51 (vague 0) : Paquets de la session et hygiène des verrouillages

- **Livrable** : les trois décisions de packages du §7 appliquées et les défauts de verrouillage neutralisés.
  1. **Retrait de `@better-auth/infra`** (`pnpm remove @better-auth/infra`) : aucun import à corriger (vérifié dans `src/`, `scripts/`, `tests/`, `.github/`). Après retrait, relire la liste `ssr.noExternal` de `vite.config.ts` : `'better-auth'`, `'@better-auth/core'`, `'zod'` et `'@lucide/svelte'` **restent** (le `zod` 4 vient de `better-call`, pas d'`@better-auth/infra`), puis reconstruire.
  2. **`image-size@2.1.0` en version exacte** (`pnpm add -E image-size@2.1.0`) : diff attendu du verrou = **une seule entrée** (le paquet n'a aucune dépendance). Toute autre ligne modifiée est un signal à examiner avant de continuer.
  3. **Resserrement de la plage `better-auth`** de `^1.0.0` à **`~1.7.18`** dans `package.json` : `^1.x` laisserait adopter une 1.8 qui relèverait encore ses peers sans revue. La montée en 1.7.25 est **hors session** (patch sans valeur fonctionnelle, elle élargirait le diff du verrou). **La formulation « verrou inchangé » est fausse** : le `specifier` de l'importateur `better-auth` de `pnpm-lock.yaml` passe lui aussi de `^1.0.0` à `~1.7.18`, et le verrou **doit** être rafraîchi — sinon toute installation suivante, **CI comprise**, échoue en `ERR_PNPM_OUTDATED_LOCKFILE`. Ce qui reste vrai : **aucun paquet ne bouge**, la version résolue demeure 1.7.18 (elle satisfait déjà la nouvelle plage). Séquence exacte et sûre, dans cet ordre :
     - a. **hydrater avec le verrou tel qu'il est**, `specifier` `^1.0.0` compris : `pnpm install --frozen-lockfile` (c'est le point 1 de l'étape 50 ; **ne changer aucun `specifier` avant**) ;
     - b. **puis** modifier `package.json` : `better-auth` → `~1.7.18`, avec les autres points de cette étape (retrait d'`@better-auth/infra`, `image-size` exact, suppression de `package-lock.json`) ;
     - c. **puis** rafraîchir le verrou sans réinstaller (`pnpm install --lockfile-only`) : seules les lignes d'importateur sont réécrites, la résolution des paquets ne bouge pas ;
     - d. **puis** contrôler le diff (critère ci-dessous) **avant tout autre geste** ;
     - e. **puis seulement** `npm run check && npm run build && npm run test`, complétés ici par un `pnpm install --frozen-lockfile` qui doit **réussir** : c'est la seule preuve que `package.json` et le verrou sont d'accord. Ne jamais laisser une modification de `specifier` sans rafraîchissement du verrou : le code passe en local et la CI casse.
  4. **Mise hors jeu de `package-lock.json`** (artefact npm périmé qui référence `lucide-svelte`, paquet déprécié, et ignore `@better-auth/infra`, `leaflet`, `@types/leaflet`) : suppression du fichier par le mainteneur, ou à défaut mention explicite dans `docs/journal.md` qu'il ne sert jamais de base d'installation. La CI n'utilise que pnpm : aucun impact CI.
  5. **Consignation de `minimumReleaseAgeExclude`** (`pnpm-workspace.yaml`) : l'exception `@lucide/svelte@1.71.0` est **inerte** tant qu'aucune `minimumReleaseAge` n'est configurée (`.npmrc` ne contient que `engine-strict=true`). Elle est conservée comme garde-fou documentaire ; **aucune `minimumReleaseAge` n'est activée en session** (elle pourrait bloquer les installations ciblées des étapes 50 et 51).
- **Qui installe** : le **mainteneur**. **Qui vérifie le commentaire `ssr.noExternal`** : le développeur backend (relecture), avec `build` à l'appui.
- **Testable** : `@better-auth/infra` absent de `package.json` et du verrou ; `pnpm why image-size` renvoie exactement 2.1.0 ; `package.json` déclare `better-auth: ~1.7.18` **et le `specifier` de l'importateur `better-auth` du verrou est aligné sur `~1.7.18`** (une ligne de verrou change, **aucun paquet ne bouge** : la version résolue reste 1.7.18) ; **`pnpm install --frozen-lockfile` réussit sur un clone neuf** — sans ce contrôle, un `specifier` modifié sans rafraîchissement passe en local et casse la CI en `ERR_PNPM_OUTDATED_LOCKFILE` ; `git diff --stat pnpm-lock.yaml` ne montre que les entrées attendues (pour le retrait d'`@better-auth/infra`, la disparition de ses dépendances **exclusives** `@xmldom/xmldom` et `libphonenumber-js` en fait partie ; `jose`, `@noble/hashes`, `@better-fetch/fetch`, `better-call` et `@better-auth/utils` sont partagés avec `better-auth` et restent) ; `npm run check && npm run build && npm run test` passent dans cet ordre ; `vite.config.ts` contient toujours les quatre entrées de `ssr.noExternal`.
- **Dépend de** : étape 50 (l'arbre doit être sain avant d'ajouter/retirer un paquet).
- **Responsable** : Mainteneur (installation) + Backend (relecture `ssr.noExternal`).
- **Fichiers** : `package.json`, `pnpm-lock.yaml`, `package-lock.json` (suppression), `pnpm-workspace.yaml` (commentaire seulement, aucune valeur ajoutée), `vite.config.ts` (relecture, aucun changement attendu), `docs/journal.md`.
- **Statut** : **PLANIFIÉE.** L'installation de `image-size` est la seule partie validée sans réserve par l'audit ; les trois autres points sont des décisions d'architecte consignées en `docs/questions.md`.

### Étape 52 (vague 1) : Socle i18n — installation de `svelte-i18n`, catalogues de messages et initialisation SSR/client

> **Pourquoi deux étapes (52 puis 53) et pas une seule.** L'installation + l'initialisation serveur + la bascule de ~30 composants publics dépassent la règle « 1 à 2 sessions de dev ». L'étape 52 ne touche que `src/lib/i18n/`, `hooks.server.ts`, le layout public et les tests : **elle ne peut rien casser visuellement**, puisque l'affichage continue de passer par les dictionnaires typés déjà en place (aucune réécriture de texte). L'étape 53 porte la bascule mécanique et sa preuve. Découper ainsi isole le risque de plateforme (SSR Cloudflare, stores globaux) du risque de rendu (comparaison avant/après).

- **Livrable** : `svelte-i18n` installé **par le mainteneur** et le socle de messages opérationnel, sans encore changer l'aspect d'une seule page.
  1. **Installation** : ajout de `svelte-i18n` aux **`dependencies`** (dépendance d'exécution : le client en a besoin). La **version est choisie par le mainteneur** — le plan ne prescrit **aucun numéro de version**, l'architecte ne connaissant pas la dernière stable publiée au 2026-11-18. Protocole identique aux étapes 50/51 : `pnpm add` ciblé, **diff de `pnpm-lock.yaml` limité au sous-arbre de `svelte-i18n` et de ses dépendances transitives**, `npm run check && npm run build && npm run test` de part et d'autre. Aucun autre paquet ne bouge (interdit : `pnpm update`, `pnpm install` libre).
  2. **Catalogues de messages** : `src/lib/i18n/fr.ts`, `en.ts`, `br.ts` **restent la source unique** et **conservent le type `Dictionary`** (`types.ts`). Ils sont enregistrés auprès de `svelte-i18n` par **enregistrement statique** (`register('fr', fr)` et équivalents), sans chargement dynamique : côté Worker, aucun accès `fs`/`fetch` n'est admissible, et l'enregistrement paresseux introduirait un état asynchrone par requête.
  3. **Textes repris mot pour mot** : la migration **ne réécrit aucun contenu**. Les textes déjà validés **et** ceux encore provisoires (accueil, Formation, Bagad, partenaires, mentions légales — Q-2026-11-09-02, Q-2026-11-10-01 à -06 et -08, Q-2026-11-11-01) sont transvasés **à l'identique**, ponctuation typographique (apostrophes `’`, espaces insécables, tirets) comprise. **Aucune correction orthographique, aucune reformulation, aucune traduction nouvelle** n'est autorisée dans cette étape : la validation du bureau reste la seule voie de modification des contenus.
  4. **Initialisation** : `init({ fallbackLocale: 'fr', initialLocale })` avec une locale issue **exclusivement** du segment `[lang=lang]` (repli `fr`, valeur illisible → `fr`), et **attente de la locale avant rendu** côté serveur, pour que le HTML sorti des Workers soit déjà dans la bonne langue. Côté client, l'initialisation **reçoit la même locale** que celle du HTML servi : elle ne la recalcule pas.
  5. **Interdictions explicites** : pas de `getLocaleFromNavigator`, pas de lecture d'`Accept-Language`, pas de cookie de préférence de langue (§2.3.1). Un repli sur la langue du navigateur créerait un HTML serveur en `fr` hydraté en `en`.
  6. **`ssr.noExternal`** : les **quatre entrées existantes** (`better-auth`, `@better-auth/core`, `zod`, `@lucide/svelte`) ne sont **ni retirées ni réordonnées**. `svelte-i18n` n'est ajouté à la liste **que si** le `build` SSR échoue sans lui, et dans ce cas avec un `build` à l'appui et une relecture du commentaire du fichier. Toute autre modification de `vite.config.ts` est hors périmètre.
  7. **Serveur hors composant** : les deux accès serveur au dictionnaire (`+page.server.ts` de l'accueil pour `gallery.captions`, `contact/+page.server.ts` pour les sujets d'e-mail) passent par un **accesseur non réactif à locale explicite**, jamais par le store global pendant un `await` (voir risque §8 « état global partagé »). Le choix exact de l'accesseur est arrêté à l'installation, avec la documentation du paquet.
  8. **Capture de référence (obligatoire, avant toute modification de composant)** : production du HTML **rendu serveur** des pages publiques dans les trois langues — accueil, `bagad`, `formation`, `agenda`, `articles`, `articles/[slug]`, `media`, `partenaires`, `contact`, `informations-legales` — soit **30 URL**. Le corpus est conservé dans un répertoire de travail **non committé** (hors dépôt ou ignoré par git) et sert de base à la comparaison de l'étape 53.
- **Testable** :
  - `svelte-i18n` figure dans `dependencies` ; `pnpm why svelte-i18n` renvoie une version unique ; le diff de `pnpm-lock.yaml` ne contient que son sous-arbre ; `pnpm install --frozen-lockfile` réussit sur un clone neuf.
  - Les 30 URL capturent un HTML **identique** à l'état d'avant l'étape (l'étape 52 ne doit rien changer au rendu) : `diff` du texte visible normalisé et des balises `<head>` **vide**.
  - Le HTML brut (sans JS) contient `html lang="fr"`, `lang="en"`, `lang="br"` selon l'URL, et le titre/`description` de la bonne langue : `%lang%` n'est jamais laissé tel quel.
  - **Concurrence** : 20 paires de requêtes simultanées `/fr` et `/br` renvoient chacune **leur** langue, **0** inversion. C'est la preuve qu'aucune locale ne fuit d'une requête à l'autre dans l'isolate Workers (voir §8).
  - `tests/i18n.test.ts` (aujourd'hui vide) est rempli : résolution de `lang` depuis `[lang=lang]` et repli `fr`, parité des clés `fr`/`en`/`br`, échantillon de rendu par locale.
  - `npm run check && npm run lint && npm run build && npm run test` passent ; poids du bundle client relevé et consigné (différence avant/après, une seule copie de `intl-messageformat` dans le graphe).
- **Dépend de** : étapes **50 et 51** (verrou sain, un seul diff attribuable ; `node_modules` hydraté et ligne de base établie).
- **Bloque** : étape **53**, puis **37**, **38**, **39** et **46**.
- **Responsable** : **Mainteneur** (installation, version, diff de verrou, poids du bundle) + **Frontend** (catalogues, initialisation, accesseur serveur, capture de référence).
- **Fichiers** : `package.json`, `pnpm-lock.yaml`, `src/lib/i18n/*` (catalogues, types, index), `src/hooks.server.ts` (initialisation si elle y est retenue), `src/routes/(public)/[lang=lang]/+layout.server.ts` et `+layout.svelte` (locale), `vite.config.ts` (**seulement** si le build l'exige), `tests/i18n.test.ts`, `docs/journal.md`. **Aucun composant public n'est réécrit dans cette étape.**
- **Statut** : **PLANIFIÉE.** Q-2026-11-09-01 tranchée le 2026-11-18. Version de `svelte-i18n` **volontairement non prescrite** : elle relève du mainteneur.

### Étape 53 (vague 1) : Bascule des pages et composants publics sur `svelte-i18n`, avec preuve avant/après

- **Livrable** : les pages publiques et leurs composants lisent leurs textes par l'API de messages, **sans qu'aucun texte rendu ne change**.
  1. **Remplacement de la prop `t: Dictionary`** : les composants publics ne reçoivent plus le dictionnaire (`getDict(data.lang)` → accès aux messages) ; ils continuent de recevoir `lang` là où il sert aux URL, au `hreflang` et aux formats. Le layout public, le `Nav`, le `Footer`, le lecteur flottant et les composants d'accueil sont traités dans la même passe, sinon le rendu est incohérent.
  2. **Structures non scalaires** : les tableaux (`about.paragraphs`, `agenda.months`, `formation.items.*.paragraphs`/`tags`, `legal.sections`, `gallery.captions`) et les objets indexés par clé métier (`pupitres.items`, `prestations.items`, `agenda.types`, `contact.form.subjects`) doivent être lus **sans aplatir ni renuméroter** les catalogues. Si l'accesseur retenu pour ces nœuds n'est pas disponible, le catalogue est **conservé tel quel** et lu directement : l'objectif de l'étape est la migration, pas le contournement par duplication de textes.
  3. **Serveur** : le `+page.server.ts` de l'accueil (légendes de galerie) est aligné **dans la même passe que l'étape 39** qui remplace `homeGallery` ; le `+page.server.ts` de contact (sujets d'e-mail) est aligné ici, avec l'accesseur à locale explicite de l'étape 52. **Aucune signature de load ne change** (§2.3.1).
  4. **SEO préservé, sans exception** : chaque page conserve son `<svelte:head>` — `<title>`, `<meta name="description">`, `<link rel="canonical">`, les quatre `hreflang` (`fr`, `en`, `br`, `x-default`), `og:type`/`og:site_name`/`og:title`/`og:description`/`og:url`/`og:locale`/`og:image`. Les **valeurs** doivent être identiques à celles d'avant la migration ; seule la **source** de la chaîne change. `src/app.html` (`%lang%`) et `transformPageChunk` dans `hooks.server.ts` restent intacts.
  5. **Espace adhérents et authentification** : **inchangés**, en français, hors catalogues. Aucune clé de traduction n'est créée « pour plus tard ».
  6. **Preuve avant/après** : les 30 URL capturées à l'étape 52 sont régénérées et comparées automatiquement — texte visible normalisé (espaces, fins de ligne) **et** balises SEO listées au point 4. La preuve est un **rapport de comparaison** joint au journal, pas une appréciation : un seul écart de texte ou de balise invalide l'étape.
- **Testable** :
  - `diff` des textes visibles, page par page et langue par langue, **vide** sur les 30 URL ; `diff` des balises `<head>` (titre, description, `canonical`, `hreflang` ×4, Open Graph) **vide**.
  - Le HTML servi **sans exécuter de JS** contient les textes de la langue de l'URL : preuve que le SSR est correct et qu'il n'y a **pas de flash** à l'hydratation.
  - Aucune occurrence de `getDict(` sous `src/routes/(public)/` ni dans les composants publics ; la prop `t` n'apparaît plus dans les composants publics ; **aucune** occurrence de `getLocaleFromNavigator`, `navigator.language` ou `Accept-Language` sous `src/`.
  - Aucun fichier de `src/routes/dashboard/**` ni `src/routes/auth/**` modifié (`git diff --stat` le prouve) ; aucun texte du dashboard déplacé dans un catalogue.
  - `npm run check && npm run lint && npm run build && npm run test` passent ; `tests/i18n.test.ts` couvre la parité des clés et un rendu par langue.
  - **Contrôle visuel de non-régression** : comparaison d'écrans (captures) des trois langues sur au moins l'accueil et une page secondaire, sans écart de mise en page — le design public reste figé à 98 %.
- **Dépend de** : étape **52** (socle, catalogues, capture de référence) ; **exécutée avant** 37, 38 et 39 pour ne pas réécrire deux fois les mêmes fichiers (voir §3.1).
- **Bloque** : **37**, **38**, **39** et, par transitivité, **46** et **47**.
- **Responsable** : **Frontend** (bascule, comparaison, rapport) + **Backend** en relecture sur les deux `+page.server.ts` concernés.
- **Fichiers** : `src/lib/i18n/*`, `src/routes/(public)/[lang=lang]/**` (pages et layout), `src/lib/components/**` (composants publics **uniquement**), `src/routes/(public)/[lang=lang]/contact/+page.server.ts`, `src/routes/(public)/[lang=lang]/agenda/+page.server.ts` (si un libellé serveur y subsiste), `tests/i18n.test.ts`, `docs/journal.md`.
- **Contrat d'API** : **inchangé**. Aucun endpoint, aucun `load`, aucun champ n'est ajouté, retiré ou renommé : `+layout.server.ts` renvoyait déjà `{ lang }` et continue. **`equipe/CONTRAT_API.md` n'est donc pas modifié par cette étape** — c'est une décision explicite, pas un oubli.
- **Statut** : **PLANIFIÉE.**


### Étape 36 : Durcir les règles de gestion d'événements

- **Livrable** : dans `src/lib/server/member/commands.ts` et `src/lib/member/permissions.ts`, un chef ne peut créer ou modifier un événement qu'avec `visibility = 'pupitre'` et un seul pupitre qu'il dirige ; la secrétaire et l'admin conservent `public`/`interne`/`pupitre` et le multi-pupitres. `event.update` ne peut ni élargir la visibilité ni déplacer l'événement hors du périmètre du chef. Un test unitaire couvre les refus.
- **Testable** : `event.create` par un chef avec `visibility: 'public'` renvoie 403 ; `event.update` d'un événement de son pupitre vers `visibility: 'public'` renvoie 403 ; même appel par la secrétaire renvoie 200 ; `npm run test` passe.
- **Dépend de** : rien.
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/commands.ts`, `src/lib/member/permissions.ts`, `tests/guards.test.ts`.

### Étape 37 : Brancher l'agenda public sur Neon

- **Livrable** : les chargements `GET /[lang=lang]` (`nextPublicEvents`) et `GET /[lang=lang]/agenda` lisent la table `events` : `visibility = 'public'`, `cancelled_at IS NULL`, `event_date >= (now() AT TIME ZONE 'Europe/Paris')::date` pour l'agenda à venir, tri par date ; `location` provient de `events.location`. Les composants et les formes `PublicAgendaEvent` / `PublicEvent` ne changent pas. `src/lib/data/agenda.ts` n'est plus importé par une route.
- **Testable** : avec les données de test, un événement `interne`, un événement `pupitre` et un événement annulé n'apparaissent jamais ; un événement public passé va dans « passés » ; aucune occurrence de `$lib/data/agenda` sous `src/routes/` ; le HTML rendu ne contient aucune donnée privée.
- **Dépend de** : rien (étape 36 indépendante).
- **Responsable** : Backend (load) + Frontend (vérification d'affichage).
- **Fichiers** : `src/routes/(public)/[lang=lang]/+page.server.ts`, `src/routes/(public)/[lang=lang]/agenda/+page.server.ts`, `src/lib/server/public/events.ts` (nouveau).

### Étape 38 : Brancher les actualités publiques sur Neon

- **Livrable** : `GET /[lang=lang]/articles`, `GET /[lang=lang]/articles/[slug]` et `latestArticles` de l'accueil lisent `articles` filtré sur `is_published = true` et `published_at IS NOT NULL`, triés par `published_at` décroissant. Le Markdown (`content`) est converti en `ArticleSection[]` par une fonction pure partagée, sans nouvelle dépendance. Un brouillon renvoie 404. Migration additive de Q-2026-11-17-04 (option A, décidée le 2026-11-18) : `articles.category`, `articles.image_url` et `articles.image_alt`, toutes `text NULL`. L'interface publique ne change pas de structure : `category`, `imageUrl` et `imageAlt` sont exposés tels quels et **masqués à l'affichage quand ils sont vides** (ni catégorie factice, ni image de remplacement).
- **Testable** : publier un article le fait apparaître en liste et en détail ; le dépublier le fait disparaître et renvoie 404 en direct ; un brouillon n'est jamais listé ; un article sans catégorie ni image s'affiche sans bloc vide ; aucune occurrence de `$lib/data/articles` sous `src/routes/` ; `npm run check && npm run build` passent.
- **Dépend de** : rien (Q-2026-11-17-04 tranchée ; migration additive incluse dans cette étape, appliquée d'abord sur Neon `test`).
- **Responsable** : Backend (requêtes + migration) + Frontend (rendu Markdown).
- **Fichiers** : `src/routes/(public)/[lang=lang]/articles/+page.server.ts`, `src/routes/(public)/[lang=lang]/articles/[slug]/+page.server.ts`, `src/routes/(public)/[lang=lang]/+page.server.ts`, `src/lib/server/public/articles.ts` (nouveau), `src/lib/markdown.ts` (nouveau, extraction de `MarkdownView.svelte`), migration `drizzle/`.

### Étape 39 : Brancher les albums et la galerie d'accueil sur Neon

- **Livrable** : `GET /[lang=lang]/media` renvoie les albums `is_published = true` avec leurs médias ordonnés par `position`, triés par `album_date` décroissante ; `caption`, `alt` et `position` viennent de `media`. L'accueil reçoit trois photos publiques distinctes issues des albums publiés (moins de trois si la base en contient moins), avec `thumbnailUrl` / `fullUrl` construits côté serveur. `homeGallery` n'est plus utilisé par une route.
- **Testable** : un album non publié est invisible et introuvable en direct ; l'ordre affiché suit `position` ; l'accueil n'affiche aucune photo d'album non publié et trois identifiants distincts ; aucune occurrence de `homeGallery` sous `src/routes/`.
- **Dépend de** : étape 40 pour les URLs d'objets privés si un album privé est exposé ; les albums publics peuvent utiliser `public_url` avant.
- **Responsable** : Backend + Frontend.
- **Fichiers** : `src/routes/(public)/[lang=lang]/media/+page.server.ts`, `src/routes/(public)/[lang=lang]/+page.server.ts`, `src/lib/server/public/albums.ts` (nouveau).

### Étape 40 : Servir les fichiers R2 (`GET /api/files/[...key]`)

- **Livrable** : implémentation du fichier aujourd'hui vide. Clé `public/...` → flux depuis `R2_PUBLIC` avec cache public ; clé `private/...` → session + compte actif + contrôle de visibilité (avatar : propriétaire ; document : tout membre actif ; média privé : secrétaire/admin), en-tête `Cache-Control: private, no-store`, aucun objet privé introuvable révélé (404). Aucune URL signée. `src/lib/server/blobs.ts` n'appelle plus `createSignedGetUrl`.
- **Testable** : anonyme sur `private/...` → 401 ; membre A sur l'avatar de B → 403 ; document actif → 200 `application/pdf` ; clé inconnue → 404 ; aucun `createSignedGetUrl` dans `src/` ; réponse publique sans cookie.
- **Dépend de** : bindings `R2_PUBLIC` / `R2_PRIVATE` configurés (Q-2026-11-08-04 tranchée).
- **Responsable** : Backend.
- **Fichiers** : `src/routes/api/files/[...key]/+server.ts`, `src/lib/server/blobs.ts`, `wrangler.toml` / configuration Cloudflare Pages.

### Étape 41 : Téléverser réellement les documents PDF (R2 + quota)

- **Livrable** : nouvelle route `POST /api/member/upload` en `multipart/form-data`, `kind = "document"` : garde `canDepositDocument`, PDF uniquement ≤ 20 Mo, réservation de quota, écriture R2 `private/documents/{documentId}/{uuid}.pdf`, puis ligne `documents` avec la taille réelle, confirmation de quota. En cas d'échec, libération de la réservation et aucune ligne orpheline. L'interface n'appelle plus `document.create` pour un dépôt réel.
- **Testable** : PDF 20 Mo accepté, 20,1 Mo → 413, `.docx` → 415, chef hors pupitre → 403 ; `storage_usage.private_bytes` augmente du taille réelle ; quota simulé au seuil → 507 et aucun objet écrit.
- **Dépend de** : étape 40.
- **Responsable** : Backend.
- **Fichiers** : `src/routes/api/member/upload/+server.ts` (nouveau), `src/lib/server/storage.ts` (réservation/confirmation/libération), `src/lib/server/member/commands.ts` (retrait de l'écriture métadonnées seules), `src/lib/member/services/documents.ts`.

### Étape 42 : Téléverser réellement les photos d'album

- **Livrable** : `kind = "albumPhoto"` dans `POST /api/member/upload` : images JPG/PNG/WebP ≤ 15 Mo et ≤ 6000×6000, écriture `public/albums/{albumId}/{uuid}.{ext}` dans `R2_PUBLIC`, ligne `media` avec `alt`, `caption`, `position = max + 1`, `size` réel et quota. La restriction `isAllowedPhoto` (visuels existants seulement) disparaît pour l'ajout ; `album.photo.move` et `album.photo.remove` restent inchangés. Un original n'est jamais converti côté serveur.
- **Contrôle de dimensions (paquet `image-size` 2.1.0, §7.3)** : lecture de l'**en-tête uniquement**, via l'import de la **racine** (`import { imageSize } from 'image-size'`) — **jamais** `image-size/fromFile` (sous-chemin Node, interdit côté Worker) ; le contrôle intervient **avant** l'écriture R2, sans conserver le buffer complet en mémoire ; une `TypeError` (format non reconnu) est traduite en `415 unsupported_type`. Le paquet est installé par l'étape 51 : cette étape ne peut pas être livrée sans elle.
- **Testable** : dépôt par la secrétaire → photo visible dans l'album avec `position` correcte ; dépôt par un membre → 403 ; 15,1 Mo → 413 ; dimensions > 6000 → 415 ; quota mis à jour ; un fichier non image → 415.
- **Dépend de** : étapes 40, 39 **et 51** (le paquet `image-size` doit être installé avant d'écrire le contrôle).
- **Responsable** : Backend.
- **Fichiers** : `src/routes/api/member/upload/+server.ts`, `src/lib/server/member/commands.ts` (`album.photo.add` conservé pour les visuels existants), `src/lib/member/photos.ts`, `src/lib/member/services/albums.ts`, `src/lib/server/storage.ts` (contrôle d'en-tête).

### Étape 43 : Palette de portraits conservée (aucun changement d'écran)

- **Livrable** : décision Q-2026-11-17-03 premier temps appliquée telle quelle. `profiles.avatar` (entier 1 à 12) reste la seule représentation de membre ; `profiles.avatar_url` reste vide ; aucun bouton ni champ de dépôt n'est ajouté au profil. `profile.avatar` (commande existante) continue de valider `1 ≤ avatar ≤ 12`. Le trombinoscope et le profil affichent le portrait illustré. Vérification documentaire : la vue `app.member_directory` expose déjà `avatar` **et** `avatar_url`, et `buildMemberSnapshot` sélectionne déjà `avatar_url` sans le transmettre ; aucune migration, aucune policy et aucun champ d'API ne sont donc requis avant l'étape 49.
- **Testable** : `profile.avatar` avec `0`, `13` ou `1.5` renvoie une erreur de validation ; le profil affiche les douze portraits et permet d'en choisir un ; `profiles.avatar_url` reste `NULL` après changement de portrait ; `app.member_directory` renvoie bien les colonnes `avatar` et `avatar_url` pour un membre actif ; `npm run test` passe.
- **Dépend de** : rien (étape volontairement sans interface nouvelle ; le téléversement réel est l'étape 49).
- **Responsable** : Frontend (constat) + Backend (vérification de la vue).
- **Fichiers** : aucun fichier de code modifié ; `src/lib/member/pages/ProfilePage.svelte`, `src/lib/member/services/profiles.ts` et `src/lib/server/member/snapshot.ts` sont **seulement relus** pour constater l'état ; constat consigné dans `docs/journal.md` (décision client du 2026-11-18 et renvoi à l'étape 49).

### Étape 44 : Envoi OneSignal réel et journal d'envoi

- **Livrable** : `notification.send` résout l'audience en base (`all`, `pupitre`, `profiles`), applique les préférences (`global`, `events`, `reminders`), appelle l'API OneSignal côté serveur avec la clé REST, écrit une ligne `notification_log` par envoi (`type`, `title`, `content`, `sent_at`, `status`), sans accepter de destinataire fourni par le navigateur. Un refus OneSignal ne fait pas échouer la notification en base mais la journalise en échec.
- **Testable** : envoi par la secrétaire → une requête OneSignal (mock) et une ligne de journal ; chef ciblant un pupitre non dirigé → 403 ; membre tentant `all` → 403 ; préférence `events = false` → destinataire exclu ; clé REST absente du bundle client (`grep` sur `.svelte-kit/output`).
- **Dépend de** : étape 12 (RLS) et étape 36 pour les règles de rôle déjà en place.
- **Responsable** : Backend.
- **Fichiers** : `src/lib/notifications/server.ts`, `src/lib/server/member/commands.ts` (`notification.send`), `src/lib/db/schema.ts` (`notification_log`), `tests/` (test d'audience).

### Étape 45 : Tests d'autorisation, RLS et parcours d'invitation

- **Livrable** : `tests/guards.test.ts`, `tests/invitation.test.ts` et un nouveau `tests/rls.test.ts` couvrent : absence de contexte → aucune donnée privée ; membre A puis membre B sur la même connexion poolée → isolation ; refus de chaque rôle sur une action hors périmètre ; parcours invitation (jeton invalide, expiré, déjà consommé, adresse non concordante, activation d'un e-mail non confirmé refusée) ; verrouillage RSVP à 00 h 00 `Europe/Paris`.
- **Préalable de code inclus (Q-2026-11-17-02, option A décidée le 2026-11-18)** : aligner la durée du lien d'invitation sur **1 heure** conformément à `docs/Spec.md` §4.2 — `invitation.create` et `invitation.resend` (`src/lib/server/member/commands.ts`) passent de `Date.now() + 7 * 24 * 60 * 60 * 1000` à `Date.now() + 60 * 60 * 1000` ; la durée d'expiration est également configurée côté Better Auth (Spec §4.2 point 6, l'expiration ne doit pas exister seulement dans la table applicative) ; les libellés d'interface et les entrées de journal qui annoncent « 7 jours » sont corrigés. Le renvoi reste possible et remplace le jeton sans créer de second compte.
- **Testable** : `npm run test` passe ; chaque test nomme la règle et le statut attendu ; une invitation créée expire au bout d'une heure (test avec horloge contrôlée) et un renvoi produit un nouveau `expiresAt` proche de `now + 1 h` ; retirer une politique RLS fait échouer au moins un test (constat documenté dans la revue) ; aucune occurrence de « 7 jours » ni de `7 * 24 * 60 * 60 * 1000` dans `src/`.
- **Dépend de** : étapes 12 et 20 (Q-2026-11-17-02 tranchée, l'étape est débloquée).
- **Responsable** : Partagé (backend pour la base, testeur pour les scénarios).
- **Fichiers** : `tests/guards.test.ts`, `tests/invitation.test.ts`, `tests/rls.test.ts` (nouveau), `vitest.config.ts` si environnement nécessaire.

### Étape 46 : Nettoyage des routes historiques, SEO et accessibilité

- **Livrable** : suppression de `src/routes/public/[lang=lang]/...` (doublon historique, Q-2026-11-10-07) avec redirection des anciennes URLs vers `/[lang=lang]/...` ; `sitemap.xml` réel (pages publiques + articles et albums publiés, variantes `fr`/`en`/`br`, `hreflang`) ; `robots.txt` excluant `/dashboard`, `/auth`, `/api` ; correctifs 2 % : focus visible, libellés, contrastes, aucun défilement horizontal à 320 px, `prefers-reduced-motion` respecté. Aucune refonte visuelle. **Q-2026-11-17-01 (option A) :** aucune animation Motion n'est ajoutée ni installée ; les animations existantes sont en CSS/Tailwind et doivent toutes respecter `prefers-reduced-motion`. La correction de `AGENTS.md` §0 (retrait de Motion) n'est **pas** un livrable de cette étape : l'architecte et les développeurs n'écrivent pas dans `AGENTS.md` ; elle revient au client ou à un agent explicitement autorisé (§0).
- **Testable** : aucune route ne répond sous `/public/` ; une ancienne URL redirige en 301/308 ; le sitemap ne contient ni brouillon ni page privée ; navigation clavier complète sur les pages publiques ; `prefers-reduced-motion: reduce` supprime les transitions non essentielles (vérifié au clavier et en émulation) ; aucun import `motion` sous `src/` ; `npm run check && npm run lint && npm run build` passent.
- **Dépend de** : étapes 37 à 39 (Q-2026-11-17-01 tranchée ; aucune dépendance à une écriture dans `AGENTS.md`).
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/public/**` (suppression), `src/routes/sitemap.xml/+server.ts`, `src/routes/robots.txt/+server.ts` ou `static/robots.txt`, composants publics concernés.

### Étape 47 : Mise en production Cloudflare Pages

- **Livrable** : Hyperdrive `bagad-dev` → branche Neon `test` pour Preview, `bagad-prod` → branche `production` pour Production ; secrets (`BETTER_AUTH_SECRET`, Resend, Turnstile, OneSignal) séparés par environnement ; bindings `R2_PUBLIC` / `R2_PRIVATE` configurés ; `.env.example` à jour sans secret ; migrations appliquées d'abord sur `test`, puis `production`. Smoke tests : connexion, agenda public, agenda privé, téléchargement d'un document, affichage d'une photo de profil (étape 49), contact, invitation.
- **Testable** : déploiement Preview utilisant `test` ; déploiement Production utilisant `production` ; les sept parcours de smoke test réussissent ; aucun secret dans le dépôt ; `wrangler pages deployment` sans erreur.
- **Dépend de** : étapes 36 à 46 **et 49**.
- **Responsable** : Backend + Partagé.
- **Fichiers** : `wrangler.toml`, `.env.example`, `docs/architecture.md`, `docs/database.md`, `docs/journal.md`.

### Étape 48 : Assainir les dépendances

- **Livrable** : traitement des 57 alertes Dependabot (2 critiques) par mises à jour **ciblées et compatibles** ; `pnpm audit` documenté. Périmètre strictement distinct des étapes 50/51 : elle **hérite** d'un verrou déjà sain (Drizzle aligné sur ses peers, `@better-auth/infra` retiré, `image-size` épinglé) et ne refait aucune de leurs opérations ; elle ne déplace **aucune majeure** (§2.1.1) et n'ouvre pas de lot de montées mineures (traité hors session, avec diff contrôlé par paquets). **Elle ne part pas d'un `pnpm install` libre** : chaque correctif est installé un par un, avec contrôle du diff de verrou.
- **Testable** : `pnpm install --frozen-lockfile` sur un clone neuf ; `pnpm audit --prod` sans vulnérabilité critique ou haute non justifiée ; `npm run check`, `lint`, `build` et `test` passent ; le diff de `pnpm-lock.yaml` ne contient que les paquets corrigés.
- **Dépend de** : étapes **50 et 51** (obligatoire : on ne corrige pas des alertes sur un verrou instable) ; peut ensuite courir en parallèle ; à terminer avant l'étape 47.
- **Responsable** : Mainteneur + Backend.
- **Fichiers** : `package.json`, `pnpm-lock.yaml`, `docs/journal.md`.

### Étape 49 : Téléversement réel de la photo de profil (après branchement de R2)

- **Livrable** : second temps de Q-2026-11-17-03, exécuté **après** l'étape 40 et la mise en service des bindings R2. `kind = "avatar"` dans `POST /api/member/upload` : seul le propriétaire dépose (`requireOwnProfile` + `canChangeAvatar`), image JPG/PNG/WebP ≤ 15 Mo et ≤ 6000 × 6000 vérifiée côté serveur (en-tête, paquet pur JS du §7), original écrit tel quel dans `R2_PRIVATE` sous `private/profiles/{profileId}/avatar.{ext}` (aucune conversion serveur), réservation de quota puis confirmation, mise à jour de `profiles.avatar_url` avec l'URL servie par `/api/files/private/profiles/{profileId}/avatar.{ext}`, suppression de l'ancienne clé en cas de remplacement. L'instantané adhérent expose `avatarUrl: string | null` (branche « soi-même » et branche `app.member_directory`, qui sélectionne déjà la colonne) ; le profil et le trombinoscope affichent la photo **si et seulement si** `avatarUrl` est renseigné, sinon le portrait illustré `avatar` (1–12) reste affiché. La commande `profile.avatar.remove` remet `avatar_url` à `NULL` et réaffiche la palette, sans supprimer le portrait choisi. Aucune migration : `profiles.avatar_url` et `app.member_directory.avatar_url` existent déjà.
- **Contrôle de dimensions (paquet `image-size` 2.1.0, §7.3)** : même règle qu'à l'étape 42 — import de la **racine** (`import { imageSize } from 'image-size'`), **jamais** `image-size/fromFile` ; lecture d'en-tête seule, **avant** l'écriture R2 ; `TypeError` → `415 unsupported_type`. Le contrôle est partagé avec l'étape 42 (une seule fonction serveur, deux `kind`), il ne doit pas être dupliqué.
- **Testable** : dépôt par le propriétaire → `avatarUrl` renseigné et image servie en 200 avec `Cache-Control: private, no-store` ; dépôt pour un autre profil → 403 `forbidden_own_profile` ; compte suspendu → 403 `account_suspended` ; 15,1 Mo → 413 `file_too_large` ; dimensions > 6000 → 415 `unsupported_type` ; fichier non image → 415 ; quota atteint → 507 `quota_exceeded` sans objet écrit ; `profile.avatar.remove` → `avatarUrl` nul et portrait illustré réaffiché ; un autre membre voit la photo dans le trombinoscope et ne peut pas la remplacer ; `npm run test` passe.
- **Dépend de** : étapes 40, 41 (route d'upload et quota opérationnels), **51** (`image-size` installé) et 43 (palette constatée) ; R2 `R2_PUBLIC` / `R2_PRIVATE` configurés sur l'environnement de test.
- **Responsable** : Backend (upload, quota, instantané) + Frontend (bouton de dépôt et repli palette, seul ajout d'écran admis dans les 2 %).
- **Fichiers** : `src/routes/api/member/upload/+server.ts`, `src/lib/server/member/commands.ts` (`profile.avatar.remove`), `src/lib/server/member/snapshot.ts` (`avatarUrl` exposé dans les deux branches), `src/lib/member/types.ts` (`MemberProfile.avatarUrl`), `src/lib/member/pages/ProfilePage.svelte`, composant d'avatar du trombinoscope, `docs/database.md` si la matrice de lecture de l'avatar est précisée.

### 3.1 Ordre et parallélisme

| Vague | Étapes | Remarque |
| --- | --- | --- |
| **0** | **50, 51** | **Préalables bloquantes, dans cet ordre.** 50 : hydratation `--frozen-lockfile` puis `drizzle-orm`/`drizzle-kit`. 51 : retrait `@better-auth/infra`, `image-size` exact, resserrement `better-auth`, hygiène des verrous. Aucune étape backend ne démarre avant. |
| 1 | 36, 37, 40, 48 | Indépendantes entre elles **après la vague 0** ; 40 débloque 41–43 et 49. 48 ne démarre qu'une fois le verrou sain (étapes 50/51). |
| 2 | 38, 39, 44 | 38 porte désormais sa migration (Q-2026-11-17-04 tranchée) ; 39 profite de 40 |
| 3 | 41, 42, 43 | Même route d'upload pour 41 et 42, à livrer dans cet ordre (documents → album) ; 42 exige `image-size` (étape 51) ; 43 ne modifie aucun écran |
| 4 | 45, 46, 49 | 45 verrouille les règles et aligne l'invitation à 1 h ; 46 nettoie et finit l'interface ; 49 branche la photo de profil une fois R2 opérationnel et `image-size` installé |
| 5 | 47 | Après tout le reste, étape 49 comprise |

## 4. Règles du projet

- N'écrire que dans les fichiers de son rôle ; l'architecte n'écrit que `equipe/PLAN.md`, `equipe/CONTRAT_API.md` et `docs/questions.md` ; les développeurs ne modifient jamais `equipe/`.
- Ne jamais inventer une règle métier absente des documents : si une information manque, écrire la question dans `docs/questions.md` et attendre.
- Lire `profiles.role` (ENUM `app_role`) et `profiles.account_status` ; jamais `user_metadata`, jamais un rôle ou un identifiant d'acteur envoyé par le navigateur.
- Chaque load, action et endpoint privé vérifie ses propres droits côté serveur ; le menu filtré et l'affichage conditionnel sont des aides d'interface.
- Toute opération protégée passe par `withUserContext` : transaction, `set_config('app.profile_id', ..., true)`, mêmes connexion et transaction pour toutes les requêtes.
- Aucun cache de requêtes Hyperdrive pour une lecture dépendante de l'identité ; le cache est réservé aux lectures publiques.
- Migrations additives uniquement sous `drizzle/` avec `drizzle/meta/` ; une migration appliquée n'est jamais modifiée ; vérification sur Neon `test` avant `production`. La montée de `drizzle-kit` (étape 50) n'autorise **aucune** réécriture d'instantané : génération d'essai sur **copie** du dossier, `git status drizzle/` vide à la fin.
- Dépendances : seul le **mainteneur** installe ; seul le verrou issu des **étapes 50 et 51** fait foi ; `pnpm install --frozen-lockfile` pour hydrater, jamais `pnpm install` libre ni `npm install` (`package-lock.json` est un artefact périmé qui référence `lucide-svelte`). Toute mise à niveau est ciblée, un paquet à la fois, avec contrôle du diff de verrou et `check`+`build`+`test` de part et d'autre.
- Aucun `pnpm.overrides` / `resolutions` n'est autorisé, en particulier sur `zod` : la coexistence `zod` 3 / `zod` 4 est neutralisée par `ssr.noExternal` dans `vite.config.ts`, dont la liste ne doit être modifiée qu'avec un `build` à l'appui.
- Aucun objet privé en bucket public, aucune URL signée, aucune clé R2 construite côté client ; tout objet privé passe par `/api/files/private/...` après guard.
- Quota global unique de 8 Go (alerte 7 Go, blocage 8 Go) : toute écriture R2 réserve, confirme ou libère le compteur ; aucune écriture sans réservation.
- Svelte 5 : runes uniquement ; interdits `export let`, `$:`, `on:click` (utiliser `onclick`), stores legacy pour l'état local ; Tailwind via les tokens du thème ; mobile first ; `prefers-reduced-motion` respecté. Aucune animation Motion : les transitions restent en CSS/Tailwind (Q-2026-11-17-01, option A).
- i18n : textes publics centralisés dans `src/lib/i18n/`, jamais de chaîne localisée en dur ; espace adhérents et authentification en français.
- Aucun secret committé ; `.env` ignoré, `.env.example` à jour ; clé REST OneSignal et clé Resend strictement serveur.
- Aucune nouvelle dépendance sans justification dans `docs/journal.md` et validation selon §7 ; aucun développeur n'installe un paquet de sa propre initiative.
- Hors périmètre absolu : paiement/cotisation en ligne, inscription libre, annuaire public, titres du bureau publics.
- Fin de tâche : `npm run check && npm run lint && npm run build && npm run test` ; schéma modifié ⇒ migration + `docs/database.md` (matrice RLS incluse) ; route ou flux modifié ⇒ `docs/architecture.md` ; entrée datée dans `docs/journal.md`.

## 5. Données provisoires à brancher sur Neon (contrat de remplacement)

Seules trois sources sont concernées. Les autres fichiers de `src/lib/data/` (`site.ts` hors `homeGallery`, `pupitres.ts`, `formation.ts`, `partenaires.ts`, `nav.ts`) sont du contenu éditorial et **restent statiques**.

| Fichier provisoire | Export utilisé aujourd'hui | Remplacé par | Forme de sortie à conserver | Règle de remplacement |
| --- | --- | --- | --- | --- |
| `src/lib/data/agenda.ts` | `agendaSections()` (`{ upcoming, past }`) | table `events` + `event_pupitres` | `PublicAgendaEvent` / `PublicEvent` : `id`, `title`, `description`, `eventDate`, `eventType`, `isPoll`, `state`, `location` | `visibility = 'public'` et `cancelled_at IS NULL` uniquement ; état calculé avec le jour `Europe/Paris` ; tri date croissante (à venir) / décroissante (passés). |
| `src/lib/data/articles.ts` | `publishedArticles(lang)`, `latestArticles(lang, limit)`, `articleBySlug(lang, slug)` | table `articles` + `profiles` (auteur) | `PublicArticle` : `slug`, `title`, `excerpt`, `category`, `date`, `imageUrl`, `imageAlt`, `content: ArticleSection[]` | `is_published = true` et `published_at` non nul ; brouillon → 404 ; Markdown converti en sections par une fonction pure ; colonnes `category`, `image_url`, `image_alt` nullables (Q-2026-11-17-04, option A) ; une valeur vide n'est pas affichée. |
| `src/lib/data/site.ts` → `homeGallery` | `homeGallery` (photos statiques) | tables `albums` + `media` | `PublicPhoto` : `id`, `caption`, `sortOrder`, `thumbnailUrl`, `fullUrl` | Albums `is_published = true` seulement ; trois photos distinctes ; URLs construites côté serveur (`/api/files/public/...` ou `public_url`), jamais une clé R2 côté client. |

**Interdits après branchement** : un load public ne doit plus importer `$lib/data/agenda`, `$lib/data/articles` ni `homeGallery` ; aucun repli silencieux sur les données provisoires en cas d'erreur base (mieux vaut une page vide ou une 500 explicite qu'un contenu de démonstration en production).

## 6. Traitement des questions ouvertes existantes

| Question | État | Traitement dans ce plan |
| --- | --- | --- |
| Q-2026-11-05 (plateforme, identité, pupitres, contact, R2, organisation) | tranchées | Appliquées ; aucune réouverture. |
| Q-2026-11-06-01 (clôture RSVP) | tranchée | Appliquée (verrou à 00 h 00 `Europe/Paris`) ; testée à l'étape 45. |
| Q-2026-11-06-02 (images) | tranchée puis précisée par Q-2026-11-08-03 | Image Resizing à la diffusion ; aucune conversion serveur. |
| Q-2026-11-06-03 (conservation) | tranchée par Q-2026-11-08-08 | 24 mois `activity_log`, 12 mois contact, 30 jours invitations expirées, réponses anonymisées sans limite ; purge désactivée par défaut. Aucune purge planifiée dans cette session. |
| Q-2026-11-06-04 (service workers) | tranchée | Service worker notifications uniquement ; hors périmètre de cette session. |
| Q-2026-11-06-05 (contact) | tranchée | Action `send` déjà livrée, conforme ; documentée au contrat §6.5. |
| Q-2026-11-06-06, -07, -08 | tranchées | Schéma Drizzle, dates civiles, RLS/Hyperdrive : appliqués. |
| Q-2026-11-08-01 à -09 | tranchées | Appliquées (driver, quota, images, bindings, annulation, invitations, rappels, conservation, archives). |
| Q-2026-11-09-01 (i18n) | **ouverte** | Dictionnaires typés conservés ; ne bloque aucune étape ; aucune page publique nouvelle. |
| Q-2026-11-09-02 (contenus accueil) | **ouverte** | Validation bureau ; hors code. |
| Q-2026-11-09-03 (pistes audio) | **ouverte** | Lecteur laissé en état vide ; hors session. |
| Q-2026-11-10-01 à -06, -08 | **ouvertes** | Contenus éditoriaux (Formation, mascottes, photos, partenaires, coordonnées, expéditeur Resend) ; hors code, sauf l'expéditeur Resend qui doit être configuré à l'étape 47. |
| Q-2026-11-10-07 (route de contact historique) | **ouverte** | Traitée par l'étape 46 (suppression et redirection). |
| Q-2026-11-10-09 (agenda public provisoire) | **ouverte** | Résolue de fait par l'étape 37 : l'agenda public lit Neon ; le lieu vient de `events.location`. |
| Q-2026-11-10-10 (débordement navigation desktop) | **ouverte** | Correctif d'accessibilité des 2 % inclus dans l'étape 46. |
| Q-2026-11-11-01 (mentions légales) | **ouverte** | Contenu à fournir par le bureau ; hors code. |
| Q-2026-11-11-02 (mode démonstration) | périmée | L'espace adhérents a été rebranché sur le backend réel le 2026-11-15 ; aucune donnée fictive ni `localStorage` ne subsiste. |
| Q-2026-11-14-01 (modèle backend) | tranchée | `profiles` + `pg`/`node-postgres` ; environnements séparés (étape 47). |
| **Q-2026-11-17-01 à -04** | **tranchées le 2026-11-18** | Voir §0 : aucune étape n'est plus bloquée ; la photo de profil suit un calendrier en deux temps (étapes 43 puis 49) et la durée d'invitation est alignée à 1 heure dans l'étape 45. |

## 7. Packages

Aucun package n'est installé par les développeurs. Le mainteneur vérifie version, compatibilité, maintenance, licence, impact bundle et type de mise à jour ; le client valide tout ajout important.

**État de la liste au 2026-11-18 (2ᵉ passe, après l'audit `docs/mises-a-jour.md`) :** la colonne « Version retenue » donne la **version réelle** (verrou constaté ou version exigée par un peer), et non plus le plancher de la plage de `package.json`. Quand la dernière version publiée diffère, l'écart est indiqué dans le statut et **n'est pas** une raison de bouger en session : le diff du verrou doit rester minimal et attribuable aux seules étapes 50 et 51. **Ce plan ne prescrit aucun `pnpm.overrides` / `resolutions`** — en particulier jamais sur `zod` (§8).

Seules les étapes **50** (hydratation + `drizzle-orm`/`drizzle-kit`) et **51** (retrait `@better-auth/infra`, `image-size` exact, resserrement `better-auth`) modifient `package.json` ou le verrou.

### 7.1 Packages conservés

| Package | Usage | Raison | Alternative | Statut |
| --- | --- | --- | --- | --- |
| `svelte` **5.56.0** (`^5.55.2`) | Application SvelteKit | Stack imposée ; runes uniquement | — | Conservé. Dernière 5.58.0 : montée mineure **hors session** (§2.1.1). |
| `@sveltejs/kit` **2.61.1** (`^2.57.0`) | Framework | Stack imposée | — | Conservé. Majeure 3.3.1 **différée** ; max de la majeure 2 = 2.70.4, hors session. |
| `@sveltejs/vite-plugin-svelte` **7.1.2** (`^7.0.0`) | Intégration Vite/Svelte | Exigé par Kit 2 | — | Conservé. Dernière 7.3.1, hors session. |
| `vite` **8.0.14** (`^8.0.7`) | Bundler | Exigé par Kit 2 et `@sveltejs/vite-plugin-svelte` 7 | — | Conservé. Dernière 8.3.8, hors session. |
| `@sveltejs/adapter-cloudflare` **7.2.10** (`^7.0.0`) | Déploiement Cloudflare Pages | Cible d'hébergement du brief | adaptateur Node (incompatible Pages) | Conservé (version maximale de la majeure 7). **Majeure 8.0.3 interdite** : elle exige `@sveltejs/kit ^3`. |
| `typescript` **6.0.3** (`^6.0.2`) + `svelte-check` **4.4.8** (`^4.4.6`) + `@types/node` **22.19.19** (`^22`) | Typage et `npm run check` | Chaîne de vérification déjà branchée ; la CI épingle Node 22 | `tsc` seul (pas de vérification des `.svelte`) | Conservé. TypeScript 7 **différé** ; `@types/node` **ne monte pas en 26** (CI Node 22) ; `svelte-check` 4.7.8 et `@types/node` 22.20.5 hors session. |
| `tailwindcss` **3.4.19** (`^3.4.0`) + `postcss` **8.5.15** (`^8.4.32`) + `autoprefixer` **10.5.0** (`^10.4.16`) | Styles par tokens | Thème existant ; Tailwind 4 serait une réécriture | Tailwind 4 | Conservé. Tailwind 4 **différé** ; `postcss` 8.5.33 et `autoprefixer` 10.6.2 hors session. |
| `better-auth` **1.7.18**, plage resserrée à **`~1.7.18`** (étape 51) | Identité, sessions, invitations | Unique autorité d'identité ; seule version compatible avec `svelte ^5`, `@sveltejs/kit ^2` et `drizzle-orm ^0.45.2` | solution maison (risque sécurité) | Conservé. La plage `^1.0.0` laissait adopter une 1.8 qui relèverait ses peers sans revue : resserrée à la mineure 1.7. Montée en 1.7.25 **hors session**. Toute montée impose de relire `ssr.noExternal` puis de reconstruire. |
| `drizzle-orm` **0.45.4** (`^0.45.2`) — **montée étape 50** (verrou actuel 0.39.3) | ORM | Migrations reproductibles déjà en place ; **version exigée par le peer de `better-auth` 1.7** et utilisée par `drizzleAdapter` dans `src/lib/server/auth.ts` | SQL brut | **À monter (étape 50), bloquant.** Ne pas lancer la phase d'installation sur 0.39. Ne pas sauter à la 1.0.0-rc. |
| `drizzle-kit` **0.31.11** (`>=0.31.4`) — **montée étape 50** (verrou actuel 0.30.6) | Génération de migrations | Même peer ; cohérence `drizzle-orm`/`drizzle-kit` | — | **À monter (étape 50), bloquant.** Peut réécrire `drizzle/meta/` : génération d'essai sur copie obligatoire avant tout `db:generate`. |
| `pg` **8.23.1** (`^8.13.1`) + `@types/pg` **8.23.1** (`^8.11.10`) | Driver transactionnel | Exigé par `set_config(..., true)` sous Hyperdrive (Q-2026-11-08-01) | `@neondatabase/serverless` (exclu) | Conservé, à jour. Import serveur uniquement. |
| `zod` **3.25.76** (`^3.24.2`) | Validation des formulaires (contact, connexion, réinitialisation) | 15 fichiers `src/` utilisent l'API Zod 3 | Yup, Valibot | Conservé. **v4 différée** ; un `zod` 4 transitif coexiste (via `better-call`), neutralisé par `ssr.noExternal` : **aucun `override`**. |
| `resend` **4.8.0** (`^4.0.0`) | E-mails (contact, invitations, réinitialisation) | Déjà intégré côté serveur, import serveur uniquement | SMTP maison | Conservé. **Majeure 6.38.1 différée** (§2.1.1) : `emails.send` inchangé, aucun besoin fonctionnel. |
| `@lucide/svelte` **1.71.0** (épinglé sans `^`) | Icônes | Déjà utilisé partout | SVG maison | Conservé, figé volontairement. 1.75.0 publiée le jour de l'audit : **aucune adoption en session** ; doit rester dans `ssr.noExternal` (composants `.svelte`). |
| `leaflet` **1.9.4** (`^1.9.4`) + `@types/leaflet` **1.9.22** (`^1.9.22`) | Carte de la page Contact | **Usage confirmé** : `Map.svelte` importe la CSS en statique et charge `leaflet` dynamiquement dans `onMount` ; `MapPanel` est monté par la page Contact. La mention « à confirmer à l'étape 46 » est **levée** | iframe OpenStreetMap | Conservé, à jour. La 2.0 reste en beta : **ne pas toucher**. |
| `vitest` **4.1.7** (`^4.1.3`) + `@vitest/browser-playwright` **4.1.7** (`^4.1.3`) + `vitest-browser-svelte` **2.1.1** (`^2.1.0`) | Tests unitaires et navigateur | Chaîne solidaire déjà installée ; étapes 45 et 47 | Jest + Playwright seul | Conservé en majeure 4. Majeure 5 / `vitest-browser-svelte` 3 **différées** (chaîne solidaire). |
| `playwright` **1.60.0** (`^1.59.1`, et non 1.59 comme indiqué précédemment) | Navigateur de test | Exigé par `@vitest/browser-playwright` 4 | — | Conservé. 1.65.1 seulement avec une `@vitest/browser-playwright` compatible : **hors session**. |
| `wrangler` **4.158.0** (`^4.40.0`) | Déploiement | Cible Cloudflare | — | Conservé. Dernière 4.164.0, hors session ; `adapter-cloudflare` 7.2.10 exige `wrangler ^4.118.0` (satisfait). |
| `@cloudflare/workers-types` **4.20260702.1** (`^4.20241205.0`) | Types Workers | Cible Cloudflare | — | Conservé en majeure 4. Majeure 5 **différée** (rupture de typage, à coupler avec la majeure de l'adaptateur). |
| `prettier` **3.8.3** (`^3.8.1`) + `prettier-plugin-svelte` **3.5.2** (`^3.5.1`) + `eslint` **10.4.1** (`^10.2.0`) + `@eslint/js` **10.0.1** (`^10.0.1`) + `@eslint/compat` **2.1.0** (`^2.0.4`) + `typescript-eslint` **8.60.0** (`^8.58.1`) + `eslint-plugin-svelte` **3.19.0** (`^3.17.0`) + `eslint-config-prettier` **10.1.8** (`^10.1.8`) + `globals` **17.6.0** (`^17.4.0`) | Qualité (`npm run lint` = prettier + eslint) | Chaîne complète déjà branchée | Biome | Conservé. `prettier-plugin-svelte` 4 **différé** ; montées mineures (eslint 10.15, typescript-eslint 8.73, plugin-svelte 3.24.1, globals 17.14) hors session. |

### 7.2 Packages déclarés mais absents : ne pas installer sans arbitrage

| Package | Usage prévu | Raison de l'absence | Alternative | Statut |
| --- | --- | --- | --- | --- |
| `svelte-i18n` | i18n public `fr`/`en`/`br` (`AGENTS.md` §0) | Non installé ; dictionnaires typés maison livrés | Dictionnaires typés (état actuel) | **En attente de Q-2026-11-09-01** |
| `motion` | Animations (`AGENTS.md` §0) | Non installé, aucun composant ne l'importe | CSS/Tailwind + `prefers-reduced-motion` | **Écarté** par Q-2026-11-17-01 (option A, 2026-11-18) : aucune installation, aucune migration d'animation ; la correction de `AGENTS.md` §0 revient au client |

### 7.3 Package proposé pour cette session

| Package | Usage | Raison | Alternative | Statut |
| --- | --- | --- | --- | --- |
| **`image-size` 2.1.0 (version exacte, étape 51)** | Lire les dimensions JPEG/PNG/WebP côté Worker (contrôle 6000×6000), **étapes 42 et 49** | 0 dépendance runtime, 0 peer, MIT ; la **racine** du paquet ne charge aucun module Node (`node:fs`, `Buffer`) — uniquement des parseurs `Uint8Array` — donc bundlable pour Workers ; double distribution CJS/ESM (esbuild de l'adaptateur Cloudflare) ; API `imageSize(Uint8Array) → { width, height, type }`, qui **lève une `TypeError` sur format non reconnu** (correspondance directe avec le `415 unsupported_type` des étapes 42 et 49) ; ne lit que l'en-tête, donc le contrôle se fait **avant** l'écriture R2, sans conserver un buffer complet en mémoire | accepter sans contrôle de dimensions (risque quota/abus) ; `sharp` (natif, incompatible Workers) ; `probe-image-size` (API à flux, plus lourd) | **Validé techniquement par le mainteneur pour la version exacte 2.1.0.** Règle d'usage obligatoire : **importer la racine** (`import { imageSize } from 'image-size'`), **jamais** le sous-chemin `image-size/fromFile` (seule partie Node-spécifique, interdite côté Worker). Les étapes 42 et 49 ne peuvent pas être livrées sans ce paquet. Ne pas retenir `legacy` 1.2.1. |

### 7.4 Volontairement écartés ou retirés

| Package | Usage tenté | Décision |
| --- | --- | --- |
| **`@better-auth/infra` 0.4.27** | Aucun usage : **zéro import** dans `src/`, `scripts/`, `tests/`, `.github/` | **RETIRÉ (étape 51).** Seule source du peer non satisfait `zod >=4.1.12` ; le retirer ne touche aucune ligne de code et fait maigrir le graphe. Le `zod` 4 transitif de `better-call` reste, neutralisé par `ssr.noExternal` ; **aucun `override`**. Montée en 0.4.31 **refusée** (elle conserverait un peer non satisfait pour un paquet inutilisé) ; maintien tel quel **refusé** (dette invisible à chaque installation). |
| `sharp` | Conversion WebP serveur | **Refusé** : binaire natif, incompatible avec Cloudflare Workers ; les variantes sont produites par Image Resizing (Q-2026-11-08-03). |
| SDK serveur OneSignal | Envoi push | **Inutile** : l'API REST via `fetch` suffit et évite une dépendance supplémentaire. |
| `@neondatabase/serverless` | Accès Neon | **Interdit** au-dessus d'Hyperdrive (Q-2026-11-08-01). |
| Cloudflare Images (stockage) | Hébergement des images | **Écarté** : décision Q-2026-11-08-03 (R2 + Image Resizing). |
| `@milkdown/kit` (+ thème) | Éditeur d'articles prévu par la Spec | **Différé** : hors session (aucune refonte d'écran) ; à valider avant toute installation. |
| `marked` / `markdown-it` | Rendu Markdown public | **Non nécessaire** : `MarkdownView.svelte` contient déjà un analyseur minimal ; l'étape 38 l'extrait en fonction pure partagée. |

## 8. Risques

| Risque | Impact | Parade | Porteur |
| --- | --- | --- | --- |
| Cloudflare Image Resizing exige une zone Cloudflare avec la fonction activée ; un déploiement `*.pages.dev` seul ne suffit pas | Variantes 400/2000 indisponibles, images non conformes | Valider la zone avant l'étape 42 ; repli : servir l'original avec dimensions bornées | Mainteneur + Backend |
| Photo de profil (étape 49) conditionnée au branchement de R2 : si l'environnement R2 n'est pas prêt en fin de session, l'étape glisse | Le trombinoscope reste en portraits illustrés | Accepté par le client (Q-2026-11-17-03 : « palette dans un premier temps ») ; l'étape 43 garantit une application cohérente sans photo ; aucune étape de production n'est bloquée | Backend + Chef de projet |
| Téléversement de fichiers via SvelteKit sur Workers : limites de taille et de mémoire | Échec des PDF 20 Mo / images 15 Mo | Tester les tailles réelles dès l'étape 41 ; streaming `request.formData()` → `R2.put`, pas de buffer global | Backend |
| Politiques RLS et commandes applicatives divergent (deux sources de vérité) | Faille d'autorisation silencieuse | Tests RLS (étape 45) + revue croisée `commands.ts` / policies à chaque migration | Backend + testeur |
| Deux conventions de pupitre coexistent (`caisse_claire` dans `roles.ts`, `caisse-claire` comme slug en base) | Comparaisons qui échouent silencieusement | Toujours résoudre le slug via `pupitres.slug` ; ne jamais comparer une constante en dur | Backend |
| Quota non atomique sous concurrence (deux uploads simultanés) | Dépassement des 8 Go | Réservation en base dans la même transaction que la ligne métier ; test de concurrence | Backend |
| `pnpm-lock.yaml` en retard sur ses **propres plages** (« antécédent E1 ») | Un `pnpm install` **libre** re-résoudrait une trentaine de paquets d'un coup (`@sveltejs/kit` 2.61.1 → 2.70.4, `svelte` 5.56.0 → 5.58.0, `vite` 8.0.14 → 8.3.8, `eslint` 10.4.1 → 10.15.0…), et plus rien ne serait attribuable en cas de casse : ni `image-size`, ni Drizzle, ni le lot mineur. | **Étapes 50 et 51** : hydratation par `pnpm install --frozen-lockfile` (comme la CI), puis mises à niveau **ciblées** avec contrôle du diff de verrou. `pnpm update`, `pnpm install` libre et `npm install` sont **interdits** pendant la session ; les montées mineures partent en lots ultérieurs après l'étape 47. | Mainteneur |
| `node_modules/` **absent** au 2026-11-18 : aucun `check`/`build`/`test` n'a pu être exécuté pendant l'audit | Le premier contrôle réel n'arrive qu'après l'installation ; une casse préexistante serait imputée à tort aux étapes 50/51 | L'étape 50 impose l'ordre « hydratation à l'identique → contrôle (`check`+`build`+`test`) → **puis** mise à niveau ciblée → contrôle à nouveau » : tout écart entre les deux contrôles est imputable à la seule montée. | Mainteneur |
| `package-lock.json` **matériellement faux**, pas seulement périmé (entrée racine `lucide-svelte@^1.0.1`, paquet déprécié ; ignore `@better-auth/infra`, `leaflet`, `@types/leaflet`) | Un `npm install` installerait le mauvais paquet d'icônes et casserait le build | **Étape 51** : fichier supprimé du dépôt (ou explicitement déclaré hors jeu) ; **jamais** base d'installation ; la CI n'utilise que pnpm, donc aucun impact CI. | Mainteneur |
| Exception `minimumReleaseAgeExclude` (`@lucide/svelte@1.71.0` dans `pnpm-workspace.yaml`) **inerte** : aucune `minimumReleaseAge` n'est configurée (`.npmrc` = `engine-strict=true` seulement) | Fausse impression de quarantaine ; rien ne protège réellement de l'adoption d'une version publiée le jour même | Consigné comme garde-fou **documentaire** ; ne jamais le présenter comme une protection active. Aucune `minimumReleaseAge` activée en session (bloquerait les installations ciblées). | Mainteneur |
| `drizzle-orm` 0.45 : codecs `pg` (`timestamp`, `json`, `bytea`) ; `drizzle-kit` 0.31 : configuration et instantanés | Comportement des colonnes `timestamp` et des paramètres `json` en `sql` brut ; réécriture éventuelle des instantanés de `drizzle/meta/` ; **rupture de configuration invisible à `npm run check`** (`drizzle.config.ts` hors du périmètre de `svelte-check`, options `metaFolder`/`strict`/`breakOnError` absentes du type `Config` en 0.30.6 comme en 0.31.11). **`db.execute` n'est pas concerné** : signature identique en 0.39.3 et 0.45.4, `src/hooks.server.ts` compile sans retouche. | Étape 50 : adaptation du code appelant (jamais un `as any` global), `npm run check` + `npm run build` comme gardes, relecture des `timestamp` du schéma et des `sql` bruts ; pour la configuration, seule la génération d'essai sur copie fait foi. | Backend + Mainteneur |
| `drizzle-kit` 0.31 réécrit les instantanés de `drizzle/meta/` | Modification d'une migration appliquée — **règle absolue violée** | Étape 50 : `db:generate` **interdit** sur le dépôt tel quel ; génération d'essai sur copie de `drizzle/`, `git status drizzle/` doit rester vide, constat au journal. | Backend + Mainteneur |
| Peers `drizzle-orm`/`drizzle-kit` non satisfaits par `better-auth` 1.7, **silencieux** (peers `optional`, verrou câblé quand même) | L'adaptateur d'authentification tourne hors du périmètre de support de son fournisseur, sur la surface la plus sensible (identité, sessions, invitations) sans aucun signal d'installation | **Étape 50, préalable bloquante** ; vérification par `pnpm why` après montée ; toute montée ultérieure de `better-auth` impose de relire ses peers avant de l'adopter. | Mainteneur |
| Coexistence `zod` 3 (racine, 15 fichiers) / `zod` 4 (transitif via `better-call`) neutralisée par `ssr.noExternal` | Un `override` forçant une seule version casserait l'un des deux consommateurs ; une entrée retirée de `ssr.noExternal` casse le build SSR | Ne jamais ajouter d'`override`/`resolutions` ; relire `['better-auth','@better-auth/core','zod','@lucide/svelte']` après tout changement dans le graphe Better Auth (étape 51 incluse) puis **reconstruire** — seul contrôle qui attrape cette régression. | Backend |
| 57 alertes Dependabot dont 2 critiques | Vulnérabilité en production | Étape 48 avant l'étape 47, **après** les étapes 50/51 (le verrou doit être sain avant d'y toucher) ; aucune majeure imposée sans validation. | Mainteneur |
| OneSignal : clé REST ou audience mal résolue | Envoi massif non désiré ou fuite de clé | Audiences résolues en base, tests de rôle, clé uniquement serveur, journal d'envoi | Backend |
| Branchement Neon des pages publiques sans repli | Page publique en erreur 500 si la base est indisponible | Accepté explicitement (pas de données de démonstration en production) ; surveiller à l'étape 47 | Backend |
| Écarts de contenu non validés par le bureau (Q-09-02, Q-10-*) | Informations publiques erronées | Ne pas modifier les contenus ; validation avant mise en production | Chef de projet |
| Migrations appliquées par erreur sur `production` sans passer par `test` | Perte ou corruption de données | Ordre imposé : `test` puis `production`, journal daté, aucune migration modifiée | Backend |

## Annexe A — Historique du plan du 2026-11-08 (étapes 1 à 35) : état au 2026-11-17

État déduit du journal (jusqu'au 2026-11-15) et de la lecture des routes et commandes ; à confirmer par le chef de projet. « Partiel » signifie qu'une partie du livrable existe mais que le critère de fin n'est pas démontré.

| # | Intitulé | Maître d'œuvre | État | Couvert / repris par |
| --- | --- | --- | --- | --- |
| 1 | Socle Neon, Cloudflare, bindings, tests d'accès | Backend | Partiel | Étapes 40, 47 |
| 2 | Identité, sessions, guards, mots de passe | Backend | Fait | — |
| 3 | RLS, contexte transactionnel, tests d'isolation | Backend | Partiel (policies faites, tests absents) | Étape 45 |
| 4 | Invitations, activation, trombinoscope V1, journalisation | Backend | Partiel (photo réelle reportée à l'étape 49) | Étapes 43, 45, 49 |
| 5 | Agenda, présences, sondages | Backend + Frontend | Partiel (privé fait, public provisoire) | Étapes 36, 37 |
| 6 | Articles, médias, documents, contact | Backend + Frontend | Partiel (contact fait ; uploads absents) | Étapes 38–43, 49 |
| 7 | Notifications, PWA, livraison | Frontend + Backend | Non fait | Étape 44 |
| 8 | CI et validation globale | Partagé | Partiel | Étape 45 |
| 9 | Lockfile et installation CI | Partagé | À vérifier (verrou en retard sur ses plages, `node_modules` absent, `package-lock.json` périmé) | **Étapes 50 et 51** (+ 48 pour les alertes) |
| 10 | Better Auth et tables déclarées | Backend | Fait | — |
| 11 | Driver transactionnel et `withUserContext` | Backend | Fait | — |
| 12 | RLS, policies, tests d'isolation | Backend | Partiel | Étape 45 |
| 13 | Migration initiale et scripts | Backend | Fait (outillage `drizzle-kit` à réaligner sur 0.31) | Étape 50 |
| 14 | Quota `bigint` et fonctions atomiques | Backend | Partiel (schéma fait, uploads absents) | Étapes 41–43, 49 |
| 15 | Annulation d'événement et lecture seule | Backend | Fait | — |
| 16 | Bindings R2 et service des fichiers privés | Backend | Non fait (route vide) | Étape 40 |
| 17 | Archivage Supabase/Netlify | Partagé | Fait (`docs/Archive/`) | — |
| 18 | Fin de migration Svelte 5 runes | Frontend | Fait | — |
| 19 | Harmonisation documentaire | Partagé | Partiel | Étape 47 |
| 20 | Invitations, activation, cycle de compte | Backend + Frontend | Fait (durée du jeton alignée à 1 h par l'étape 45) | Étape 45 |
| 21 | Agenda privé, RSVP, sondages | Backend + Frontend | Fait | Étape 45 (tests) |
| 22 | Trombinoscope V1 | Backend + Frontend | Fait (palette, photo réelle à l'étape 49) | Étapes 43, 49 |
| 23 | Profil, suppression de compte, journalisation | Backend + Frontend | Partiel (suppression de compte absente) | Hors session |
| 24 | Documents et partitions PDF | Backend + Frontend | Partiel (métadonnées seules) | Étape 41 |
| 25 | Articles et albums publics | Backend + Frontend | Non fait (données provisoires) | Étapes 38, 39 |
| 26 | Formulaire de contact | Backend | Fait | — |
| 27 | Pages publiques complètes | Frontend | Fait (design), données provisoires | Étapes 37–39 |
| 28 | Préférences et envoi OneSignal serveur | Backend + Frontend | Partiel (préférences faites, envoi absent) | Étape 44 |
| 29 | Rappels J-3 et rappel sans réponse | Backend | Non fait | Hors session (après 44) |
| 30 | PWA, service worker, installation | Frontend | À vérifier | Hors session |
| 31 | SEO et i18n publics | Frontend | Partiel (sitemap vide) | Étape 46 |
| 32 | Lecteur audio flottant | Frontend | État vide | Hors session (Q-2026-11-09-03) |
| 33 | Accessibilité et mobile first | Frontend | Partiel | Étape 46 |
| 34 | CI verte et couverture de tests | Partagé | Partiel (tests vides) | Étape 45 |
| 35 | Mise en production Cloudflare Pages | Backend + Partagé | Non fait | Étape 47 |

**Décisions client du 2026-11-08 rappelées** (toujours valides, détail dans `docs/questions.md`) : Q-01 `pg` + `node-postgres` ; Q-02 quota global en `bigint` ; Q-03 R2 + Image Resizing ; Q-04 bindings `R2_PUBLIC`/`R2_PRIVATE` ; Q-05 `cancelled_at` ; Q-06 secrétaire et admin invitent ; Q-07 notification à la création + rappel J-3 ; Q-08 conservation (24/12/30 mois, purge désactivée par défaut) ; Q-09 archives conservées dans `docs/Archive/`.

**Décisions client du 2026-11-18** (détail dans `docs/questions.md`) : Q-2026-11-17-01 option A (aucun Motion, `AGENTS.md` §0 corrigé par le client) ; Q-2026-11-17-02 option A (lien d'invitation 1 heure) ; Q-2026-11-17-03 deux temps (palette maintenant, photo personnelle quand R2 est branché → étapes 43 puis 49) ; Q-2026-11-17-04 option A (migration additive `category`, `image_url`, `image_alt`).

**Ajout du 2026-11-18 (2ᵉ passe) :** les étapes **50** et **51** ne reprennent aucune étape de l'annexe A ; elles constituent la **vague 0** (préalables de dépendances) issue de l'audit du mainteneur (`docs/mises-a-jour.md`). La numérotation des étapes 36 à 49 est **inchangée**.
