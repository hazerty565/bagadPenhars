# Plan d'implémentation — Site Bagad Penhars

> Rôle : **ARCHITECTE**. Je n'écris que dans `equipe/PLAN.md`, `equipe/CONTRAT_API.md` et `docs/questions.md` ; je ne code pas et je ne lance aucune commande. Ce plan fait foi pour le développeur backend, le développeur frontend, le testeur et le mainteneur.
>
> **Version révisée le 2026-11-25** après les arbitrages client et l'état actuel des documents de référence. Établie après lecture de `AGENTS.md`, `docs/brief.md`, `docs/journal.md`, `docs/Spec.md`, `docs/architecture.md`, `docs/database.md`, `docs/pwa.md`, `docs/media.md`, `docs/event.md`, `docs/roadmap.md`, `docs/questions.md`, ainsi que de l'état réel des routes, des chargements publics et des commandes serveur de l'espace adhérents. Les sections 1 à 10 du plan du 2026-11-08 sont remplacées par le présent document ; **l'annexe A conserve les étapes 1 à 35 avec leur état au 2026-11-17**.
>
> **Révision du 2026-11-18 (2ᵉ passe) — audit des dépendances du mainteneur.** Prise en compte de `docs/mises-a-jour.md` (statut `PLAN À ACTUALISER`) : §2.1 (majeures différées complétées), §2.2 (quatre décisions de packages), §3 (**nouvelles étapes 50 et 51**, préalables bloquantes), §4 (règle de verrouillage), §7 (versions réelles constatées, `drizzle-orm`/`drizzle-kit` alignés sur les peers de `better-auth` 1.7, `@better-auth/infra` retiré, `image-size` 2.1.0 épinglé, `resend` 6 différé), §8 (défauts de verrouillage et ruptures Drizzle) et annexe A. Aucune étape existante n'est supprimée ni renumérotée ; **aucun élargissement de périmètre** : le design public et l'espace adhérents restent figés à 98 %.
>
> **Révision du 2026-11-25 — statut i18n clarifié et intégration de l'audit RLS backend.** Le paquet `svelte-i18n` est conservé dans les dépendances. Les traductions publiques `fr`, `en` et `br` sont fournies par les dictionnaires typés de `src/lib/i18n/`, qui restent le mécanisme utilisé par les composants. Aucune migration des traductions ni modification de l'interface n'est prévue dans ce plan. Les étapes de durcissement RLS restent inchangées. La partie « icônes » de la révision du 2026-11-18 est conservée (`@lucide/svelte` 1.71.0, aucun remplacement — voir `docs/questions.md` D-2026-11-18-08).
>
> **Révision du 2026-11-20 (2ᵉ volet) — plan de durcissement RLS issu de l'audit backend (lecture seule).** L'audit a été conduit sur la branche Neon `test` (6 migrations appliquées, 29 tables, rôle `bagad_app` sans `SUPERUSER`/`BYPASSRLS`) ; **aucun fichier n'a été modifié, aucune migration générée, aucune écriture en base, `production` n'a jamais été contactée**. Les décisions client Q-A1 à Q-A9 (2026-11-20) sont appliquées **sans réinterprétation** et portées par les **nouvelles étapes 52 à 57** (§3) ; la section **§9 « Audit RLS du 2026-11-20 »** est le livrable que le client valide. Aucun endpoint HTTP n'est ajouté ni renommé par ce volet : la création atomique d'événement passe par une **fonction SQL** `app.create_event(...)`, décrite dans le plan. En revanche `equipe/CONTRAT_API.md` est **aligné sur les nouvelles règles** — §11 (`withUserContext` → `app.profile_id` seul, `createEvent`/`updateEvent`/`deleteEvent`), §12.1 (gestion, création `interne`, suppression), §12.2 (présences nominatives), §12.3 (`bureauPosition`, `isChef`), §12.4 (préalable des fonctions de quota) et §12.8 (nouvelle, contexte RLS), plus §4 et §13. **La forme des échanges HTTP ne change pas.**

> **Révision du 2026-11-25 (2ᵉ volet) — chargement ciblé de l'espace privé (étapes 58 à 73, §10).** À la demande du client, `buildMemberSnapshot` et les réponses « instantané complet » (`GET /api/member`, retours de mutation) sont remplacés par **une lecture serveur par page**, avec des DTO ne contenant que les champs utiles. **Aucune évolution de schéma, aucune migration, aucun package, aucune modification d'écran** : les guards serveur, `withUserContext(..., profileId)` et le contexte RLS `app.profile_id` restent la règle pour **chaque** lecture. Cette révision est additive : elle ne renumérote ni ne supprime les étapes 1 à 57. Les points non tranchés (exposition d'`isChef`, droits d'écriture `tests/**`) sont consignés dans `docs/questions.md` (2026-11-25) et rappelés en §10.5.

> **Conflit de priorité :** en cas de contradiction entre ce plan et `AGENTS.md`, `AGENTS.md` prévaut et l'écart est signalé dans `docs/questions.md`. Aucune règle métier n'est inventée : tout point non tranché est une question ouverte (§0, §6 et §9.7).

## 0. Questions ouvertes (tête de plan)

**État au 2026-11-25.** Les dictionnaires typés `fr`/`en`/`br` restent le mécanisme de traduction public ; le paquet `svelte-i18n` est conservé dans les dépendances et n'entraîne aucune étape de migration. Les décisions client des étapes d'invitation, de profil et d'articles sont appliquées dans `Spec.md`, le schéma Drizzle et l'implémentation. Les décisions du **durcissement RLS** sont tranchées par les décisions client **Q-A1 à Q-A9 du 2026-11-20**, appliquées au §3 et détaillées au **§9** ; elles ne bloquent aucune étape. **Restent ouvertes** des questions de périmètre RLS qui n'ont **pas** été tranchées par le client et qui ne doivent pas être décidées par un agent : elles sont consignées dans `docs/questions.md` (section 2026-11-20) et rappelées en §9.7. Aucune d'elles ne bloque le démarrage des étapes 52 à 57.

| Question | Sujet | Décision client | Effet sur le plan |
| --- | --- | --- | --- |
| Profil photo | Palette illustrée puis photo personnelle après branchement R2 | La photo réelle est utilisée si disponible ; sinon le portrait illustré est conservé (`Spec.md` §4.3). | Étape 49 ; aucun changement de palette nécessaire. |
| Articles publics | Colonnes `category`, `image_url`, `image_alt` ajoutées de façon additive | Les champs sont facultatifs ; les valeurs absentes ne sont pas affichées. | Migration incluse à l'étape 38 ; modèle courant dans `src/lib/db/schema.ts`. |
| Traductions publiques | Le paquet `svelte-i18n` est conservé ; les dictionnaires typés `fr`/`en`/`br` restent le mécanisme utilisé | Aucune migration des traductions n'est prévue par ce plan. | Les chaînes restent centralisées dans `src/lib/i18n/`; aucun nouvel ajout ou retrait de paquet. |

**Clarification du 2026-11-18 sur les icônes (à ne pas rouvrir).** La demande « installation de lucide-svelte pour les icons » est **déjà satisfaite** et ne déclenche **aucune installation, aucune migration** : `@lucide/svelte` **1.71.0** est installé (`dependencies`, épinglé) et importé dans la vingtaine de composants et routes qui en ont besoin, et il figure dans `ssr.noExternal` ; `lucide-svelte` est l'**ancien nom déprécié** (remplacé le 2026-11-10), présent **uniquement** dans `src/autre/` (maquette hors build et hors tests) et dans `package-lock.json` (artefact npm périmé mis hors jeu par l'étape 51). Décision consignée dans `docs/questions.md` (D-2026-11-18-08) pour qu'un audit ultérieur ne rouvre pas le point.

**Gouvernance documentaire — écart levé le 2026-11-25.** `AGENTS.md` §2 nomme désormais `set_config('app.profile_id', '...', true)` et déclare `app.current_user_id` / `app.user_id` invalides (Q-A9). `docs/database.md` avait été corrigé le 2026-11-21. Aucun écart de nom de contexte ne subsiste ; le `grep` de l'étape 57 doit désormais être **vert**.


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
| Durcissement serveur **et RLS** des règles de gestion d'événements | Écarts mesurés par l'audit du 2026-11-20 : un chef peut créer un événement `public`/`pupitre`, la branche `created_by` de `app.can_manage_event` le maintient gestionnaire après élargissement, et un chef non gestionnaire lit les présences nominatives d'un événement multi-pupitres. Les décisions Q-A1 à Q-A4 sont appliquées en base **et** côté backend (§9). |
| Envoi OneSignal côté serveur et journal d'envoi | `notification.send` écrit en base mais n'envoie rien ; les préférences existent et ne sont pas appliquées. |
| Tests d'autorisation, de RLS et du parcours d'invitation | `tests/guards.test.ts`, `tests/i18n.test.ts` et `tests/invitation.test.ts` sont vides ; aucune preuve automatique des refus. |
| Suppression des routes historiques `src/routes/public/...`, sitemap réel, correctifs d'accessibilité et de mobile | Le site public actuel vit sous `(public)` ; l'ancienne arborescence répond encore. Sitemap vide. |
| Mise en production Cloudflare Pages (Hyperdrive `bagad-prod` → Neon `production`) | Dernière étape du roadmap, jamais exécutée. |
| Assainissement des dépendances signalées par Dependabot | 57 alertes dont 2 critiques, listées comme reste à faire au journal du 2026-11-15. |
| Alignement des dépendances sur leurs peers (`drizzle-orm`/`drizzle-kit` vs `better-auth` 1.7) et hygiène du verrou | Écart silencieux constaté par l'audit du 2026-11-18 : l'adaptateur d'authentification tournait hors du périmètre de support de son fournisseur. Préalable bloquant aux étapes backend (étapes 50 et 51), sans aucun effet sur l'interface. |
| **Durcissement RLS et correction backend issus de l'audit du 2026-11-20** (étapes 52 à 57) | Décisions client Q-A1 à Q-A9 appliquées en base et dans le code : gestion d'événement dérivée du pupitre, création atomique, présences nominatives, `bureauPosition`, `is_chef`, quota R2. Le contrat HTTP n'est pas modifié (§9). |

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
| Migration des traductions vers `svelte-i18n` | **Hors périmètre de ce plan.** Le paquet reste conservé ; les dictionnaires typés `fr`/`en`/`br` demeurent le mécanisme utilisé par le site public. Aucune migration de traduction n'est prévue. |
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
| Structure des dossiers : routes SvelteKit par groupes (`(public)/[lang=lang]`, `dashboard`, `auth`, `api`) | Arborescence déjà en place et cohérente avec `docs/architecture.md` ; `(public)` porte les pages localisées, `dashboard` l'espace adhérents en français. |
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
| i18n public : dictionnaires typés `fr`/`en`/`br` dans `src/lib/i18n/` | Le paquet `svelte-i18n` est conservé dans les dépendances ; les dictionnaires restent le mécanisme utilisé. Le type `Dictionary` vérifie la complétude à la compilation ; locale portée par `[lang=lang]`, repli `fr`. Aucune chaîne localisée en dur dans un composant public ; espace adhérents et authentification en français. |
| **Droit de gestion d'un événement : dérive du pupitre, jamais du créateur** | Décisions Q-A1/Q-A2/Q-A4 (2026-11-20) : la branche `OR e.created_by = app.current_profile_id()` de `app.can_manage_event` est **retirée**. Un chef ne gère (modifie, supprime) que les événements **mono-pupitre** d'un pupitre qu'il dirige ; perdre le statut de chef fait perdre le droit. |
| **Création d'événement : fonction SQL `SECURITY DEFINER` `app.create_event(..., p_pupitre_ids uuid[])`** | `events_insert` puis `event_pupitres_insert` ne peuvent plus fonctionner séparément sans la branche créateur. La fonction insère l'événement **et** ses pupitres dans la même transaction (`search_path` fixé, `REVOKE PUBLIC`, `GRANT EXECUTE` à `bagad_app`) ; `events_insert` est réservé à la secrétaire et à l'admin. Chef : exactement 1 pupitre qu'il dirige et `visibility = 'interne'` ; secrétaire/admin : 0 à N pupitres et toutes visibilités (0 = événement global). |
| **Présences nominatives tranchées en base et côté backend** | Q-A3 (2026-11-20) : un chef ne lit les présences nominatives que pour les événements **mono-pupitre de son pupitre** ; multi-pupitres et sans pupitre : secrétaire/admin seulement. Corrigé dans `app.can_view_presence` / `event_responses_select` **et** dans `src/lib/member/permissions.ts` (le `.some(...)` actuel accorde trop). |
| **Tables Better Auth hors RLS : risque accepté et documenté** | Q-A6 (2026-11-20) : `user`, `session`, `account`, `verification` restent hors RLS, **sans** rôle `bagad_auth`. Conditions opposables écrites en §9.6 (connexion `bagad_app` serveur uniquement, aucune connexion Neon depuis le navigateur, identifiants jamais exposés, sessions/comptes/jetons jamais renvoyés par une API, tables métier toujours sous RLS). |
| Migrations : **`0006_rls_hardening` puis `0007_storage_quota_functions`**, additives, jamais de réécriture de `0000`–`0005` | Q-A7 (2026-11-20). `production` n'est touchée qu'après validation explicite, toujours après `test`. |
| Locale : **segment `[lang=lang]` uniquement**, repli `fr`, **aucune détection navigateur**, aucun cookie de langue | Décision d'architecture §2.3.1 : la même URL doit produire le même HTML au serveur et dans le navigateur. `getLocaleFromNavigator` / `Accept-Language` feraient diverger le rendu SSR (Cloudflare Workers) et l'hydratation → flash de langue, contenu indexé dans une langue et affiché dans une autre, `hreflang` faux. |
| Icônes : **`@lucide/svelte` 1.71.0 conservé, `lucide-svelte` non installé** | État déjà conforme : le bon paquet est installé et importé, l'ancien nom est déprécié depuis le 2026-11-10 et ne subsiste que dans `src/autre/` (maquette hors build). Décision client du 2026-11-18 : aucune installation, aucune migration. |
| Notifications : OneSignal appelé **uniquement côté serveur** via `fetch`, audience résolue en base | Aucun paquet nécessaire ; la clé REST ne quitte jamais le serveur ; un `playerId` client n'est jamais accepté. |
| Tests : **Vitest** (`npm run test`), tests d'autorisation et de RLS en base de test | Chaîne déjà installée (`vitest`, Playwright) ; les fichiers vides existent et doivent être remplis. |
| Packages : **aucune installation par les développeurs** ; l'architecte propose, le mainteneur vérifie et installe, le client valide (§7) | Gouvernance `AGENTS.md` §5 et « Gouvernance des packages ». Les **seules** installations de la session sont portées par les étapes 50 et 51, exécutées par le mainteneur, avec diff de verrou contrôlé. |
| Migrations : **additives uniquement**, `drizzle/` + `drizzle/meta/`, jamais de modification d'une migration appliquée | Règle absolue ; les colonnes éditoriales de l'article (Q-2026-11-17-04, option A tranchée le 2026-11-18) suivent ce chemin. |
| Animations | Transitions CSS/Svelte existantes ; respecter `prefers-reduced-motion` et éviter toute dépendance d'animation supplémentaire. |
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
| **J6** | i18n | Aucun texte localisé renvoyé par le serveur (sauf e-mails et quelques libellés serveur explicites) ; `+layout.server.ts` renvoie `lang` | Tous les libellés publics viennent des dictionnaires typés `src/lib/i18n/` via `getDict(lang)` | Chaîne française en dur dans un composant public ; détection de langue côté client |
| **J7** | SEO | Loads exposent les données nécessaires (slug, date, `lang`) ; `lang` est déjà renvoyé par `+layout.server.ts` | `sitemap.xml` et métadonnées générés depuis ces données, `<svelte:head>` par page | Sitemap listant une page privée ou un brouillon ; `hreflang` calculé depuis autre chose que `lang` |

### 2.3.1 i18n : dictionnaires typés conservés

Les points suivants décrivent le mécanisme de traduction actuellement utilisé. Le paquet `svelte-i18n` est conservé dans les dépendances; aucune migration des composants vers ce paquet n'est prévue dans ce plan.

| Point | Décision | Conséquence opposable |
| --- | --- | --- |
| **Mécanisme utilisé** | **Dictionnaires typés** (`src/lib/i18n/fr.ts`, `en.ts`, `br.ts`, `types.ts`) | Le paquet `svelte-i18n` reste dans les dépendances; aucune migration de traduction n'est prévue ici |
| **Type de référence** | Le type `Dictionary` (`types.ts`) décrit la forme de `fr` et type `en`/`br` | La complétude `fr`/`en`/`br` reste garantie à la compilation : une clé oubliée dans `en.ts` casse `npm run check` |
| **Accès** | `getDict(lang)` + prop `t: Dictionary` dans les composants publics | Aucune chaîne localisée en dur ; aucune détection navigateur |
| **Source de la locale** | **Segment de route `[lang=lang]`** (`src/params/lang.ts`), repli **`fr`** | Une seule URL par langue, partageable, indexable ; `canonical` et `hreflang` calculables sans ambiguïté |
| **Détection navigateur** | **Interdite** (`getLocaleFromNavigator`, `Accept-Language`, cookie de langue) | SSR sur Workers et hydratation rendent **la même langue pour la même URL** |
| **`%lang%` de `src/app.html`** | **Conservé tel quel** (`transformPageChunk` dans `hooks.server.ts`) | Le `lang` est présent dans le HTML brut, avant hydratation |
| **Jonction SEO** | Les balises SEO restent dans le `<svelte:head>` de chaque page, alimentées par les dictionnaires | Aucune régression attendue ; `hreflang` `fr`/`en`/`br`/`x-default` inchangés |
| **Périmètre** | **Site public uniquement** | `src/routes/dashboard/**` et `src/routes/auth/**` restent en français |
| **Contrat d'API** | **Aucun changement** | `+layout.server.ts` renvoie déjà `{ lang }` ; `equipe/CONTRAT_API.md` reste inchangé |

## 3. Étapes

Chaque étape est livrable et testable seule, avec un maître d'œuvre unique. La numérotation continue celle de l'historique (annexe A) : les étapes **50 et 51** s'ajoutent après l'étape 49 et forment la **vague 0**, préalable bloquante (§3.1). **Il n'existe plus de vague 1 i18n** : les étapes 52 et 53 de la révision du 2026-11-18 sont **supprimées** (décision client du 2026-11-20), et les branchements publics **37, 38 et 39 reprennent leur place normale** dans l'ordre du §3.1, sans décalage. Les **étapes 52 à 57** sont les étapes du **durcissement RLS** issues de l'audit backend du 2026-11-20 (§9) ; elles s'ajoutent après l'étape 51 et ne rouvrent aucune étape publique. Aucune étape ne dépend d'un arbitrage : Q-2026-11-17-02 à -04 et **Q-A1 à Q-A9** sont tranchées (voir §0 et §9).

> **Règle de dépendance des étapes 50 et 51 :** les étapes **50 et 51** sont les **seules** étapes autorisées à modifier `package.json`, `pnpm-lock.yaml` et l'arbre installé. Aucune autre étape ne déplace ni n'ajoute un paquet — **y compris les étapes 52 à 57**, qui n'ajoutent aucune dépendance. Les étapes 50 et 51 doivent être terminées **avant** toute étape backend (36, 40, 41, 44, **52 à 57**) parce que le driver, l'adaptateur d'authentification et la ligne de base de tests en dépendent.

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

### Étape 36 : Durcir les règles de gestion d'événements

- **Livrable** : dans `src/lib/server/member/commands.ts` et `src/lib/member/permissions.ts`, un chef ne peut créer un événement qu'avec `visibility = 'interne'` et **exactement un** pupitre qu'il dirige ; il ne peut pas créer d'événement `public` ni `pupitre`, ni global, ni multi-pupitres. La secrétaire et l'admin conservent `public`/`interne`/`pupitre` et le multi-pupitres. `event.update` ne peut pas élargir la visibilité (un chef reste en `interne`) ni déplacer l'événement hors du périmètre du chef ; `event.delete` est autorisé pour un chef sur un événement mono-pupitre de son pupitre, refusé sur multi-pupitres ou global. Un test unitaire couvre les refus. **Cette étape est la moitié applicative de Q-A1/Q-A2/Q-A4 ; la moitié base (policies, `app.create_event`, `events_delete`) est portée par l'étape 52.**
- **Testable** : `event.create` par un chef avec `visibility: 'public'` ou `'pupitre'` renvoie 403 ; avec deux pupitres ou sans pupitre renvoie 403 ; avec `'interne'` et un pupitre qu'il dirige renvoie 200 ; `event.update` d'un événement de son pupitre vers `visibility: 'public'` renvoie 403 ; `event.delete` d'un événement mono-pupitre de son pupitre renvoie 200, d'un événement multi-pupitres renvoie 403 ; même appel par la secrétaire renvoie 200 ; `npm run test` passe.
- **Dépend de** : rien côté code ; **cohérence obligatoire avec l'étape 52** (la base doit appliquer la même règle, sinon le code et la RLS divergent).
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

- **Livrable** : suppression de `src/routes/public/[lang=lang]/...` (doublon historique, Q-2026-11-10-07) avec redirection des anciennes URLs vers `/[lang=lang]/...` ; `sitemap.xml` réel (pages publiques + articles et albums publiés, variantes `fr`/`en`/`br`, `hreflang`) ; `robots.txt` excluant `/dashboard`, `/auth`, `/api` ; correctifs 2 % : focus visible, libellés, contrastes, aucun défilement horizontal à 320 px, `prefers-reduced-motion` respecté. Aucune refonte visuelle. Aucune bibliothèque d’animation tierce n’est prévue ; les animations existantes sont en CSS/Tailwind et respectent `prefers-reduced-motion`.
- **Testable** : aucune route ne répond sous `/public/` ; une ancienne URL redirige en 301/308 ; le sitemap ne contient ni brouillon ni page privée ; navigation clavier complète sur les pages publiques ; `prefers-reduced-motion: reduce` supprime les transitions non essentielles (vérifié au clavier et en émulation) ; `pnpm run check && pnpm run lint && pnpm run build` passent.
- **Dépend de** : étapes 37 à 39 (étapes 37 à 39 terminées ; aucune dépendance à une écriture dans `AGENTS.md`).
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

### Étape 52 : `0006_rls_hardening` — lot « gestion des événements » (C1 à C4, Q-A1/Q-A2/Q-A4)

> **Pourquoi ce lot est le premier.** C1 (`created_by` dans `app.can_manage_event`) est la faille mère : elle rend inopérants C2, C3 et C4 et permet à un chef de rester gestionnaire après avoir élargi la visibilité ou ajouté un pupitre. Tant qu'elle existe, toute autre correction RLS sur les événements est contournable.

- **Livrable** : le fichier `drizzle/0006_rls_hardening.sql` (et son instantané `drizzle/meta/`) contient, pour le seul périmètre « événements », **écrit en SQL idempotent autant que possible** :
  1. **Réécriture de `app.can_manage_event(event_id)`** : la branche `OR e.created_by = app.current_profile_id()` est **supprimée**. Renvoie vrai si l'acteur est secrétaire/admin ; sinon vrai **uniquement** si l'événement cible **exactement un pupitre** et que `app.is_chef_of(pupitre)` est vrai. Aucun droit ne dérive du créateur (Q-A1). Perdre le statut de chef fait perdre le droit.
  2. **Fonction `app.create_event(...)` `SECURITY DEFINER`** : signature `(p_title text, p_description text, p_event_date date, p_event_type ..., p_is_poll boolean, p_visibility ..., p_pupitre_ids uuid[]) → uuid`. `SET search_path` **fixé et explicite** (jamais `public` seul), `REVOKE ALL ON FUNCTION ... FROM PUBLIC`, `GRANT EXECUTE ... TO bagad_app`. Contrôles **dans** la fonction : acteur lu depuis `app.profile_id`; un chef impose `p_visibility = 'interne'` et **exactement 1** pupitre qu'il dirige ; un secrétaire/admin accepte `public`/`interne`/`pupitre` et **0 à N** pupitres (0 = événement global). Insertion de l'événement **et** de ses lignes `event_pupitres` dans la **même transaction** — l'atomicité est la raison d'être de la fonction (Q-A2).
  3. **`events_insert`** : policy resserrée aux **rôles secrétaire/admin**. Un chef **n'insère jamais** directement dans `events` ; il passe par `app.create_event`.
  4. **`event_pupitres_insert`** : policy resserrée aux rôles secrétaire/admin (le chef obtient ses lignes via la fonction `SECURITY DEFINER`, pas via une policy propre). Cela ferme C3.
  5. **`events_update`** : `USING` **et** `WITH CHECK` fondés sur `app.can_manage_event(id)`, avec **interdiction d'élargir** : la visibilité ne peut pas devenir `public` ni `pupitre` par un chef, `created_by` et `is_poll` ne sont pas modifiables par un chef, et les lignes `event_pupitres` ne peuvent pas sortir du périmètre du chef (garde en `WITH CHECK` **et** trigger si le `WITH CHECK` seul ne peut pas exprimer la contrainte de ciblage — le choix est tranché à l'implémentation, la règle ne l'est pas). Cela ferme C4.
  6. **`events_delete`** : un chef supprime **uniquement** les événements **mono-pupitre de son pupitre** ; multi-pupitres et global : secrétaire/admin seulement (Q-A4). Aucun droit au simple créateur.
- **Testable** (SQL sur branche `test`, exécuté dans une **transaction annulée** à cette étape ; voir étape 54 pour l'application réelle) :
  - `app.can_manage_event` sur un événement créé par un chef mais **sans** son pupitre → faux ; sur son événement mono-pupitre → vrai ; sur un multi-pupitres → faux.
  - Chef insérant directement dans `events` → **refusé** par policy ; chef appelant `app.create_event` avec `interne` + 1 de ses pupitres → **accepté** ; avec `public`, `pupitre`, 0 pupitre, 2 pupitres ou un pupitre non dirigé → **refusé**.
  - Secrétaire/admin : `public`/`interne`/`pupitre`, 0 à N pupitres → accepté ; 0 pupitre = événement global correctement créé.
  - Update d'un événement mono-pupitre de son pupitre vers `public` → **refusé** ; ajout d'un second pupitre → **refusé** ; renommage sans changement de visibilité → accepté.
  - Delete mono-pupitre de son pupitre → accepté ; multi-pupitres → refusé ; secrétaire/admin → accepté.
  - `git status drizzle/` ne montre **que** le nouveau `0006` et son instantané ; `0000` à `0005` inchangés à l'octet.
- **Dépend de** : étapes **50 et 51** (environnement sain) ; cohérence avec l'**étape 36** (mêmes règles côté code).
- **Bloque** : **53** (même fichier), **54** (application), **55** (code aligné).
- **Responsable** : Backend (SQL + relecture croisée avec `commands.ts`).
- **Fichiers** : `drizzle/0006_rls_hardening.sql`, `drizzle/meta/*`, `docs/journal.md`.
- **Statut** : **PLANIFIÉE.** Aucune écriture n'a été faite par l'architecte ; la base `test` n'a reçu aucune modification.

### Étape 53 : `0006_rls_hardening` — lot « présences, annuaire et hygiène » (C5, C6, C8, P8, Q-A3/Q-A5/Q-A8)

- **Livrable** : le **même** fichier `0006_rls_hardening.sql` est complété (jamais appliqué avant l'étape 54) avec :
  1. **`app.can_view_presence(event_id)`** réécrite (Q-A3) : secrétaire/admin → vrai ; chef → vrai **uniquement** si l'événement cible **exactement un pupitre** et que ce pupitre est dirigé par lui. Un chef dont **un** pupitre participe à un événement **multi-pupitres** ne voit **pas** les présences nominatives. C5 mesuré (Bleuenn et Gwendal sur « Répétition bombarde et caisse claire ») doit disparaître.
  2. **`event_responses_select`** : la lecture nominative (`profile_id`, prénom, nom, statut) n'est autorisée qu'aux acteurs pour lesquels `app.can_view_presence(event_id)` est vrai. Un membre conserve la lecture de **sa propre** réponse et de ses agrégats, jamais celle des autres.
  3. **`app.member_directory`** (Q-A5, C8) : la vue joint `bureau_positions` pour renvoyer réellement `bureauPosition` (aujourd'hui toujours `null`, car la jointure manque), et **n'expose plus `is_chef`** dans son JSON.
  4. **`invitations`** (C6) : `REVOKE DELETE` sur `public.invitations` pour `bagad_app` (aucune policy `DELETE` n'existe ; l'annulation passe par `UPDATE cancelled_at`). Aucune suppression silencieuse à 0 ligne.
  5. **`playing_with_neon`** (P8, Q-A8) : `DROP TABLE` par migration. **Interdiction de la recréer en production.**
- **Testable** (SQL, sur `test`, transaction annulée ; application réelle à l'étape 54) :
  - Chef lisant les présences d'un événement mono-pupitre de son pupitre → **lignes visibles** ; même chef sur un événement multi-pupitres dont un de ses pupitres fait partie → **0 ligne** ; sur un événement global → **0 ligne**.
  - Membre : ne lit que sa propre ligne ; secrétaire et admin : toutes les lignes.
  - `app.member_directory` renvoie `bureauPosition` renseigné pour un profil qui a un titre, et **aucune clé `isChef`** (`select to_jsonb(t) ? 'isChef'` → faux).
  - `DELETE FROM invitations` par `bagad_app` → **refusé** (erreur de privilège), et non « 0 ligne sans erreur ».
  - `playing_with_neon` absente de `pg_tables` et de `information_schema` ; `0006` ne la recrée pas.
- **Dépend de** : étape **52** (même fichier, ordre des objets SQL).
- **Bloque** : **54**.
- **Responsable** : Backend.
- **Fichiers** : `drizzle/0006_rls_hardening.sql`, `drizzle/meta/*`, `docs/journal.md`.
- **Statut** : **PLANIFIÉE.**

### Étape 54 : Application de `0006_rls_hardening` sur Neon `test` et matrice SQL par rôle

- **Livrable** : `0006_rls_hardening` **appliquée une seule fois** sur la branche Neon `test`, dans l'ordre `0000` → `0006` ; `production` **non touchée**. Exécution de la **matrice complète de tests PostgreSQL par rôle** (§9.5) : membre, chef, secrétaire, admin ; chaque assertion nomme la règle et l'attendu autorisé/refusé. Les **16 événements existants** de `test` sont **laissés en l'état** — dont les **4 créés par des chefs en visibilité `pupitre`** : la migration ne réécrit aucune donnée (Q-A2, voir §9.7 question b).
- **Testable** : `select * from drizzle.__drizzle_migrations` (ou équivalent) montre `0006` appliquée ; rejouer la migration sur une base vierge donne le même état ; chaque ligne de la matrice §9.5 passe ; les 4 événements `pupitre` créés par des chefs sont **inchangés** (même `id`, même `visibility`, même `created_by`) ; aucune écriture sur `production` (`select` de contrôle sur la branche de production : aucune ligne de migration `0006`).
- **Dépend de** : étapes **52** et **53** (fichier complet).
- **Bloque** : **55** (le code doit viser des règles réellement en base), **57**.
- **Responsable** : Backend + testeur.
- **Fichiers** : `drizzle/0006_rls_hardening.sql` (application), `tests/rls.test.ts` (premières assertions), `docs/journal.md`.
- **Statut** : **PLANIFIÉE.** Application sur `test` uniquement ; `production` attend une validation explicite du client.

### Étape 55 : Alignement du backend sur `0006` (gestion d'événements, présences, instantané)

- **Livrable** :
  1. **`src/lib/server/member/commands.ts`** : `event.create` appelle `app.create_event(...)` pour **tous** les rôles (aucune insertion directe dans `events`) ; `event.update` refuse toute visibilité autre que `interne` pour un chef et tout changement de pupitre hors périmètre ; `event.delete` applique Q-A4.
  2. **`src/lib/member/permissions.ts`** : `canManageEvent` reste fondé sur le **pupitre** (aucun `createdBy`) ; `canViewPresenceDetail` passe de `event.pupitreIds.some(...)` à **`event.pupitreIds.length === 1 && isChefOf(...)`** — c'est l'écart C5 côté code, à corriger au même titre que la RLS (Q-A3 : correction **en base et côté backend**, pas un masquage d'interface).
  3. **`src/lib/server/member/snapshot.ts`** : `bureauPosition` provient de la jointure rétablie dans `app.member_directory` ; **aucun `isChef`** transmis ni dérivé dans l'instantané ; vérification qu'aucune réponse d'API n'expose `isChef` **indirectement** (instantané, trombinoscope, `/dashboard/pupitre/membres`).
  4. **`src/lib/server/invitations.ts`** : aucune tentative de `DELETE` sur `invitations` (« annulation » = `UPDATE cancelled_at`), conformément à C6.
  5. **`createEvent` / `updateEvent` / `deleteEvent`** de `equipe/CONTRAT_API.md` §11 restent des fonctions serveur ; elles **délèguent** à la fonction SQL, sans changer de signature HTTP.
- **Testable** : `event.create` par un chef en `interne` + son pupitre → 200 et **une seule** ligne `events` + **une** ligne `event_pupitres` ; appel direct qui contournerait la fonction → impossible (aucun chemin de code n'insère dans `events`) ; `canViewPresenceDetail` renvoie faux sur un multi-pupitres (test unitaire) ; l'instantané d'un membre avec titre de bureau renvoie un `bureauPosition` non nul ; `grep -R "isChef" src/lib/server/member src/lib/member` ne montre aucune exposition d'API ; `npm run check && npm run test` passent.
- **Dépend de** : étapes **54** (règles réellement en base), **36**.
- **Responsable** : Backend + Frontend en relecture du trombinoscope.
- **Fichiers** : `src/lib/server/member/commands.ts`, `src/lib/member/permissions.ts`, `src/lib/server/member/snapshot.ts`, `src/lib/server/invitations.ts`, `tests/guards.test.ts`, `tests/rls.test.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 56 : `0007_storage_quota_functions` — fonctions de quota absentes de la base (P7, Q-A7)

> **Pourquoi cette étape bloquait les uploads.** `src/lib/server/storage.ts:17` référence `0006_storage_quota_functions` et appelle `app.reserve_storage_bytes`, `app.finalize_storage_upload` et `app.release_storage_bytes` : **aucune de ces trois fonctions n'existe en base**. Aucun appelant aujourd'hui, mais tout branchement d'upload (étapes 41, 42, 49) casserait à la première écriture.

- **Livrable** : migration `drizzle/0007_storage_quota_functions.sql` créant **les trois fonctions** attendues par `src/lib/server/storage.ts`, avec `SECURITY DEFINER`, `search_path` fixé, `REVOKE ALL ... FROM PUBLIC`, `GRANT EXECUTE ... TO bagad_app` :
  1. `app.reserve_storage_bytes(bytes bigint)` : vérifie `public_bytes + private_bytes + reserved_bytes + bytes <= block_threshold_bytes` dans la **même transaction**, incrémente `reserved_bytes`, renvoie l'état ; échec fermé si le seuil est dépassé.
  2. `app.finalize_storage_upload(reserved_bytes bigint, actual_bytes bigint)` : `used += actual`, `reserved -= reserved`, `last_sync_at`/`updated_at` mis à jour.
  3. `app.release_storage_bytes(reserved_bytes bigint)` : `reserved -= reserved`, jamais négatif.
  - Mise à jour du commentaire/renvoi de `src/lib/server/storage.ts` pour pointer le **vrai** numéro de migration (`0007`, plus `0006`) ; aucune autre modification de comportement.
- **Testable** : `select proname from pg_proc where proname in ('reserve_storage_bytes','finalize_storage_upload','release_storage_bytes')` renvoie **3** lignes ; réservation au-delà du seuil → erreur et `reserved_bytes` inchangé ; réservation puis finalisation → `private_bytes`/`public_bytes` et `reserved_bytes` cohérents ; libération → `reserved_bytes` revient à sa valeur initiale ; deux réservations concurrentes ne dépassent pas le seuil (test de concurrence) ; `0006` toujours présente et non modifiée.
- **Dépend de** : étape **54** (ordre `0006` puis `0007`, Q-A7).
- **Bloque** : **41**, **42**, **49** (et, par transitivité, **47**).
- **Responsable** : Backend.
- **Fichiers** : `drizzle/0007_storage_quota_functions.sql`, `drizzle/meta/*`, `src/lib/server/storage.ts` (renvoi de migration uniquement), `tests/`.
- **Statut** : **PLANIFIÉE.** Aucune fonction de quota n'existe aujourd'hui en base : cette étape est **indispensable avant tout upload réel**.

### Étape 57 : Matrice de tests PostgreSQL par rôle et revue croisée code / RLS

- **Livrable** :
  1. `tests/rls.test.ts` couvre **l'intégralité de la matrice §9.5**, rôle par rôle, avec un attendu explicite autorisé/refusé par ligne ; chaque test nomme la règle (C1…C10) qu'il protège.
  2. **Test de non-régression de la faille mère** : retirer la réécriture de `app.can_manage_event` (ou réintroduire la branche `created_by` sur une copie de la base) fait échouer **au moins** le test « chef non gestionnaire sur événement multi-pupitres ». Le constat est documenté dans la revue.
  3. **Revue croisée** `commands.ts` / policies × `snapshot.ts` / vues : aucune règle appliquée d'un seul côté ; aucun `isChef`, aucune donnée nominative, aucun `bureauPositionId` exposé.
  4. **Preuve documentaire** : `AGENTS.md` §2 (**corrigé le 2026-11-25**) et `docs/database.md` (corrigé le 2026-11-21) nomment **`app.profile_id`**. L'étape **vérifie** l'absence de `app.current_user_id` / `app.user_id` sous `src/` et dans les deux documents ; aucune correction de document n'est demandée à un agent.
- **Testable** : `npm run test` passe et la matrice §9.5 est intégralement couverte (une règle retirée ⇒ un test rouge) ; `pnpm run check && pnpm run lint && pnpm run build` passent ; aucun `isChef` exposé hors des deux projections de page du §10 (`getPupitrePage`, `listAdminMembersPage`) ; `app.profile_id` est le **seul** nom de contexte utilisé sous `src/` (`grep` sur `app.current_user_id` et `app.user_id` : 0 occurrence hors commentaire) ; `production` n'a reçu **aucune** écriture.
- **Dépend de** : étapes **52** à **56**.
- **Responsable** : Testeur + Backend.
- **Fichiers** : `tests/rls.test.ts`, `tests/guards.test.ts`, `docs/journal.md`.
- **Statut** : **PLANIFIÉE.**

### 3.1 Ordre et parallélisme

| Vague | Étapes | Remarque |
| --- | --- | --- |
| **0** | **50, 51** | **Préalables bloquantes, dans cet ordre.** 50 : hydratation `--frozen-lockfile` puis `drizzle-orm`/`drizzle-kit`. 51 : retrait `@better-auth/infra`, `image-size` exact, resserrement `better-auth`, hygiène des verrous. Aucune étape backend ne démarre avant. |
| **1** | 36, 37, 40, 48, **52** | Indépendantes entre elles **après la vague 0** ; **52** (lot « événements » de `0006`) peut démarrer en parallèle. 40 débloque 41–43 et 49. 48 ne démarre qu'une fois le verrou sain (étapes 50/51). |
| 2 | 38, 39, 44, **53**, **54** | 38 porte sa migration (Q-2026-11-17-04 tranchée) ; 39 profite de 40 ; **53** (lot « présences/annuaire » de `0006`) complète le fichier, **54** l'applique sur `test` et exécute la matrice SQL — 54 **dépend** de 52 et 53. |
| 3 | 41, 42, 43, **55**, **56** | Même route d'upload pour 41 et 42, à livrer dans cet ordre (documents → album) ; 42 exige `image-size` (étape 51) ; 43 ne modifie aucun écran ; **55** aligne le code sur `0006` (dépend de 54) ; **56** livre `0007` et `storage.ts` — **41, 42 et 49 dépendent de 56**. |
| 4 | 45, 46, 49, **57** | 45 verrouille les règles et aligne l'invitation à 1 h ; 46 nettoie et finit l'interface ; 49 branche la photo de profil une fois R2 opérationnel, `image-size` installé et 56 livrée ; **57** consolide la matrice de tests par rôle et la revue croisée — après 52 à 56. |
| 5 | 47 | Après tout le reste, étapes 49 et 57 comprises |

> **Chantier du 2026-11-25 (étapes 58 à 73).** Il suit son propre ordre en **§10.4** et ne bloque aucune des vagues ci-dessus : il ne touche ni au schéma, ni aux migrations, ni aux packages. Les étapes 58 à 63 peuvent démarrer après la vague 0 ; l'étape 72 (retrait de l'instantané) est la seule à devoir attendre la fin du frontend.

> **Ordre imposé par l'audit du 2026-11-20 :** Q-A7 fixe **deux fichiers seulement** — `0006_rls_hardening` (rédigé par lots aux étapes **52** et **53**, **appliqué une seule fois** à l'étape **54**) puis `0007_storage_quota_functions` (étape **56**). **41, 42 et 49 ne doivent pas être livrées avant 56** : `src/lib/server/storage.ts` appelle aujourd'hui `app.reserve_storage_bytes`, `app.finalize_storage_upload` et `app.release_storage_bytes`, qui **n'existent pas en base**. Aucune étape 52 à 57 ne touche `production` : application d'abord sur Neon `test`, `production` seulement après validation explicite du client. Aucun agent ne modifie `0000` à `0005`.

## 4. Règles du projet

- N'écrire que dans les fichiers de son rôle ; l'architecte n'écrit que `equipe/PLAN.md`, `equipe/CONTRAT_API.md` et `docs/questions.md` ; les développeurs ne modifient jamais `equipe/`.
- Ne jamais inventer une règle métier absente des documents : si une information manque, écrire la question dans `docs/questions.md` et attendre.
- Lire `profiles.role` (ENUM `app_role`) et `profiles.account_status` ; jamais `user_metadata`, jamais un rôle ou un identifiant d'acteur envoyé par le navigateur.
- Chaque load, action et endpoint privé vérifie ses propres droits côté serveur ; le menu filtré et l'affichage conditionnel sont des aides d'interface.
- Toute opération protégée passe par `withUserContext` : transaction, `set_config('app.profile_id', ..., true)`, mêmes connexion et transaction pour toutes les requêtes.
- Aucun cache de requêtes Hyperdrive pour une lecture dépendante de l'identité ; le cache est réservé aux lectures publiques.
- Migrations additives uniquement sous `drizzle/` avec `drizzle/meta/` ; une migration appliquée n'est jamais modifiée ; vérification sur Neon `test` avant `production`. La montée de `drizzle-kit` (étape 50) n'autorise **aucune** réécriture d'instantané : génération d'essai sur **copie** du dossier, `git status drizzle/` vide à la fin. **`0000` à `0005` sont figées** : l'audit du 2026-11-20 crée `0006_rls_hardening` puis `0007_storage_quota_functions`, jamais l'inverse (Q-A7) ; `production` n'est touchée qu'après validation explicite.
- Dépendances : seul le **mainteneur** installe ; seul le verrou issu des **étapes 50 et 51** fait foi ; `pnpm install --frozen-lockfile` pour hydrater, jamais `pnpm install` libre ni `npm install` (`package-lock.json` est un artefact périmé qui référence `lucide-svelte`). Toute mise à niveau est ciblée, un paquet à la fois, avec contrôle du diff de verrou et `check`+`build`+`test` de part et d'autre.
- Aucun `pnpm.overrides` / `resolutions` n'est autorisé, en particulier sur `zod` : la coexistence `zod` 3 / `zod` 4 est neutralisée par `ssr.noExternal` dans `vite.config.ts`, dont la liste ne doit être modifiée qu'avec un `build` à l'appui.
- Aucun objet privé en bucket public, aucune URL signée, aucune clé R2 construite côté client ; tout objet privé passe par `/api/files/private/...` après guard.
- Quota global unique de 8 Go (alerte 7 Go, blocage 8 Go) : toute écriture R2 réserve, confirme ou libère le compteur ; aucune écriture sans réservation.
- Svelte 5 : runes uniquement ; interdits `export let`, `$:`, `on:click` (utiliser `onclick`), stores legacy pour l'état local ; Tailwind via les tokens du thème ; mobile first ; `prefers-reduced-motion` respecté. Aucune bibliothèque d’animation tierce ; les transitions restent en CSS/Tailwind.
- i18n : **dictionnaires typés maison** dans `src/lib/i18n/` (`getDict(lang)`), paquet `svelte-i18n` conservé dans les dépendances mais non utilisé par les composants ; jamais de chaîne localisée en dur ; espace adhérents et authentification en français.
- RLS : le contexte est **`app.profile_id`**, posé par `withUserContext` (`set_config('app.profile_id', ..., true)`) — **jamais** `app.current_user_id` ni `app.user_id` (Q-A9). Aucun droit ne dérive du créateur d'une ligne : la gestion d'un événement découle du **pupitre** (Q-A1). Toute création d'événement passe par `app.create_event(...)` ; `events_insert` est réservé à la secrétaire et à l'admin.
- Aucun secret committé ; `.env` ignoré, `.env.example` à jour ; clé REST OneSignal et clé Resend strictement serveur.
- Aucune nouvelle dépendance sans justification dans `docs/journal.md` et validation selon §7 ; aucun développeur n'installe un paquet de sa propre initiative.
- Hors périmètre absolu : paiement/cotisation en ligne, inscription libre, annuaire public, titres du bureau publics.
- Fin de tâche : `pnpm run check && pnpm run lint && pnpm run build && npm run test` ; schéma modifié ⇒ migration + `docs/database.md` (matrice RLS incluse) ; route ou flux modifié ⇒ `docs/architecture.md` ; entrée datée dans `docs/journal.md`.

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
| Q-2026-11-09-02 (contenus accueil) | **ouverte** | Validation bureau ; hors code. |
| Q-2026-11-09-03 (pistes audio) | **ouverte** | Lecteur laissé en état vide ; hors session. |
| Q-2026-11-10-01 à -06, -08 | **ouvertes** | Contenus éditoriaux (Formation, mascottes, photos, partenaires, coordonnées, expéditeur Resend) ; hors code, sauf l'expéditeur Resend qui doit être configuré à l'étape 47. |
| Q-2026-11-10-07 (route de contact historique) | **ouverte** | Traitée par l'étape 46 (suppression et redirection). |
| Q-2026-11-10-09 (agenda public provisoire) | **ouverte** | Résolue de fait par l'étape 37 : l'agenda public lit Neon ; le lieu vient de `events.location`. |
| Q-2026-11-10-10 (débordement navigation desktop) | **ouverte** | Correctif d'accessibilité des 2 % inclus dans l'étape 46. |
| Q-2026-11-11-01 (mentions légales) | **ouverte** | Contenu à fournir par le bureau ; hors code. |
| Q-2026-11-11-02 (mode démonstration) | périmée | L'espace adhérents a été rebranché sur le backend réel le 2026-11-15 ; aucune donnée fictive ni `localStorage` ne subsiste. |
| Q-2026-11-14-01 (modèle backend) | tranchée | `profiles` + `pg`/`node-postgres` ; environnements séparés (étape 47). |
| **Q-2026-11-17-02 à -04** | **tranchées le 2026-11-18** | Voir §0 : aucune étape n'est plus bloquée ; la photo de profil suit un calendrier en deux temps (étapes 43 puis 49) et la durée d'invitation est alignée à 1 heure dans l'étape 45. |
| **Q-A1 à Q-A9** (durcissement RLS) | **tranchées le 2026-11-20** | Voir §9 : appliquées par les étapes 52 à 57. Les sous-questions non tranchées sont listées en §9.7 et dans `docs/questions.md` ; elles ne bloquent aucune étape. |

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
| **C1** — `app.can_manage_event` conserve une branche `OR e.created_by = app.current_profile_id()` | Un chef gestionnaire par création garde la main sur un événement `public`/`interne`/multi-pupitres, et peut élargir la visibilité puis rester gestionnaire | **Étape 52** : branche supprimée, droit dérivé du pupitre ; test de non-régression dédié (étape 57) | Backend |
| **C5** — `app.can_view_presence` et `canViewPresenceDetail` accordent la présence à un chef dont **un** pupitre participe à un événement multi-pupitres | Lecture nominative complète des réponses par un chef non gestionnaire (mesuré sur `test`) | **Étapes 53 et 55** : règle « un seul pupitre et c'est le sien » en base **et** côté code ; tests mono/multi/sans pupitre | Backend + testeur |
| **C7** — `user`, `session`, `account`, `verification` hors RLS avec DML complet pour `bagad_app` | Compromission d'un accès base = lecture/écriture des sessions et comptes | **Risque accepté et documenté** (Q-A6) ; conditions opposables en §9.6 ; **pas** de rôle `bagad_auth` | Client + Backend |
| **C9** — trois noms pour un réglage (`app.profile_id` implémenté, `app.current_user_id` dans `AGENTS.md`, `app.user_id` dans `docs/database.md:65`) | Documentation inutilisable ; risque qu'un futur code lise le mauvais GUC (échec fermé aujourd'hui) | **LEVÉ** : `docs/database.md` corrigé le 2026-11-21 et `AGENTS.md` §2 corrigé le 2026-11-25 ; `app.profile_id` exclusivement (Q-A9). L'étape 57 **vérifie** l'absence des anciens noms. | Client (fait) |
| **P7** — `src/lib/server/storage.ts` appelle `app.reserve_storage_bytes`, `app.finalize_storage_upload` et `app.release_storage_bytes`, ** inexistantes en base** | Tout branchement d'upload (41, 42, 49) casse à la première écriture | **Étape 56** (`0007`), préalable obligatoire à 41/42/49 | Backend |
| **0006** est un fichier unique imposé par Q-A7 (deux migrations seulement) | Un lot volumineux appliqué d'un coup sur `test` | Rédaction par lots (52, 53), **application unique** à l'étape 54, tests SQL exécutés en transaction annulée avant application réelle ; `production` jamais touchée sans validation | Backend + testeur |

## 9. Audit RLS du 2026-11-20 — problèmes, corrections et tests

> **Livrable soumis à validation du client.** Audit **en lecture seule** : aucun fichier modifié, aucune migration générée, **aucune écriture en base**, `production` **jamais contactée**. Environnement audité : branche Neon **`test`**, **6 migrations** appliquées, **29 tables**, rôle **`bagad_app`** sans `SUPERUSER`, sans `BYPASSRLS`, sans rôle parent. Contexte **`app.profile_id`** correctement posé par `set_config(..., true)` dans `withUserContext` (`src/lib/db/index.ts:63-75`), **non survivant à un `ROLLBACK`**, **non falsifiable** depuis le navigateur (C10).

### 9.1 Décisions client appliquées (2026-11-20)

| Décision | Contenu appliqué | Étape |
| --- | --- | --- |
| **Q-A1/Q-A2** | Branche `created_by` retirée de `app.can_manage_event` ; le droit découle **du pupitre**. Création **atomique** par `app.create_event(..., p_pupitre_ids uuid[])` (`SECURITY DEFINER`, `search_path` fixé, `REVOKE PUBLIC`, `GRANT EXECUTE` à `bagad_app`). Chef : exactement 1 pupitre dirigé et **`visibility = 'interne'`** seulement. Secrétaire/admin : 0 à N pupitres, toutes visibilités (0 = global). `events_insert` limité à la secrétaire/admin — c'est la recommandation de l'audit (fonction seule + policy resserrée), retenue pour rester simple. | 52, 54 |
| **Q-A3** | Présences nominatives : chef = événements **mono-pupitre de son pupitre** uniquement ; multi-pupitres et sans pupitre = secrétaire/admin. Correction **en base et côté backend**, pas un masquage d'interface. | 53, 55 |
| **Q-A4** | Le chef **peut supprimer** les événements mono-pupitre de son pupitre ; multi-pupitres et global : secrétaire/admin. `events_delete` adaptée, cohérente avec `can_manage_event` (aucun droit au simple créateur). | 52 |
| **Q-A5** | `is_chef` **retiré** de `app.member_directory` ; vérification d'absence d'exposition indirecte par une API. | 53, 55 |
| **Q-A6** | Tables Better Auth hors RLS : **risque accepté et documenté**, pas de rôle `bagad_auth`. | 55, 57 |
| **Q-A7** | `0006_rls_hardening` **puis** `0007_storage_quota_functions` ; **jamais** de réécriture de `0000`–`0005` ; `production` jamais touchée sans validation explicite. | 52–56 |
| **Q-A8** | `playing_with_neon` supprimée par migration, **non recréée** en production. | 53 |
| **Q-A9** | `app.profile_id` exclusivement. `docs/database.md` corrigé le 2026-11-21 et `AGENTS.md` §2 corrigé le 2026-11-25 : les deux noms invalides (`app.current_user_id`, `app.user_id`) n'y figurent plus. L'étape 57 **vérifie** l'absence des anciens noms sous `src/` et dans les documents. | 57 (vérification) |

### 9.2 Problèmes confirmés (avec preuves)

| # | Problème | Preuve / effet | Correction |
| --- | --- | --- | --- |
| **C1** | `app.can_manage_event()` contient une branche `OR e.created_by = app.current_profile_id()` absente du contrat §12.1 | Un chef gestionnaire **par création** garde la main sur un événement `public`/`interne`/multi-pupitres | **52** : branche supprimée |
| **C2** | `events_insert` n'impose aucune contrainte de visibilité ni de ciblage | Un chef peut insérer `public`, donc un événement visible des anonymes | **52** : `events_insert` réservé secrétaire/admin ; chef via `app.create_event` |
| **C3** | `event_pupitres_insert` (`can_manage_event(event_id) AND is_chef_of(pupitre_id)`) combiné à C1 | Ajout d'un 2ᵉ pupitre possible tout en restant gestionnaire | **52** : insertion des pupitres réservée à la fonction et aux rôles secrétaire/admin |
| **C4** | `events_update` : `USING/WITH CHECK (can_manage_event(id))` sans borne sur `visibility`, `created_by`, `is_poll` | Élargissement possible de la visibilité | **52** : `WITH CHECK` resserré + trigger si nécessaire |
| **C5** | `app.can_view_presence()` accorde `true` à un chef dont un pupitre participe à un événement **multi-pupitres** qu'il ne gère pas (mesuré : Bleuenn et Gwendal sur « Répétition bombarde et caisse claire ») ; `event_responses_select` expose alors toute la liste nominative ; le code (`src/lib/member/permissions.ts:85-89`, `.some(...)`) fait de même | Écart **code et RLS** vis-à-vis de §12.1/§12.2 | **53** (base) + **55** (code) |
| **C6** | `GRANT DELETE ON public.invitations` sans policy `DELETE` | Suppression à 0 ligne **sans erreur** (l'annulation passe par `UPDATE cancelled_at`) | **53** : `REVOKE DELETE` |
| **C7** | `user`, `session`, `account`, `verification` : `relrowsecurity = false` et DML complet pour `bagad_app` ; 25 des 29 tables ont RLS | Sessions et comptes hors RLS | **Risque accepté** (Q-A6), conditions §9.6 |
| **C8** | `app.member_directory` ne joint pas `bureau_positions` → `bureauPosition` toujours `null` (`src/lib/server/member/snapshot.ts:226`) ; la vue expose `is_chef` dans son JSON alors que §12.3 l'interdit | Trombinoscope sans titre de bureau ; fuite de `isChef` | **53** (vue) + **55** (instantané, vérification d'API) |
| **C9** | Trois noms pour un réglage : `app.profile_id` implémenté, `app.current_user_id` dans `AGENTS.md` §2, `app.user_id` dans `docs/database.md:65` | Échec fermé, mais documentation inutilisable | **Q-A9** : `app.profile_id` seul ; doc corrigée par le client |
| **C10** | Conformité du contexte transactionnel vérifiée | Aucune fuite entre transactions : `set_config(..., true)` + `ROLLBACK` testés | Aucun changement |

### 9.3 Problèmes potentiels (consignés en risques, **aucune correction décidée**)

| # | Constat | Statut |
| --- | --- | --- |
| **P1** | Insertion `profiles` en connexion propriétaire (`src/lib/server/invitations.ts:138-149`) ; trigger `guard_profile_sensitive_columns` court-circuité pour `neondb_owner` | Risque documenté, non corrigé |
| **P2** | Consommation du jeton d'invitation **non atomique** (`accepted_at IS NULL` absent du `UPDATE`) | Risque de double consommation, non corrigé |
| **P3** | `app.profile_id_for_auth_user` (`SECURITY DEFINER`) appelée hors contexte | Risque documenté |
| **P4** | Unicité `(event_id, profile_id)` NULLS DISTINCT après anonymisation | Doublons possibles après anonymisation ; non corrigé |
| **P5** | `app.event_response_counts` ouvre les agrégats à tout lecteur (non appelée aujourd'hui) | Risque latent |
| **P6** | `activity_log_insert` permet à tout membre de forger une entrée (non appelée aujourd'hui) | Risque latent |
| **P7** | Fonctions de quota R2 absentes de la base (`src/lib/server/storage.ts:17` renvoie `0006_storage_quota_functions`) | **Corrigé par l'étape 56** |
| **P8** | `playing_with_neon` sans RLS | **Supprimée par l'étape 53** (Q-A8) |
| **P10** | `profiles_update` repose sur privilège colonne **et** trigger | Fragilité à documenter ; non corrigé |

> **P9 n'est pas listé** : l'audit ne fournit aucun constat pour ce numéro. Aucun problème n'est inventé pour le compléter.

### 9.4 Fichiers audités (lecture seule)

`drizzle/0002_rls_policies.sql`, `drizzle/0003_auth_profile_lookup.sql`, `drizzle/0005_bureau_title.sql`, `src/lib/db/index.ts`, `src/hooks.server.ts`, `src/lib/server/member/commands.ts`, `src/lib/server/member/snapshot.ts`, `src/lib/member/permissions.ts`, `src/lib/server/invitations.ts`, `src/lib/server/storage.ts`.

### 9.5 Matrice de tests PostgreSQL par rôle (à écrire, étapes 54 et 57)

Chaque ligne est une assertion **explicite** : rôle, action, attendu. Aucun test ne se contente de « ça passe ».

| # | Rôle | Action | Attendu |
| --- | --- | --- | --- |
| T01 | chef | crée un événement `interne`, 1 pupitre qu'il dirige, via `app.create_event` | **OK** (1 ligne `events`, 1 ligne `event_pupitres`) |
| T02 | chef | crée un événement `public` | **REFUSÉ** |
| T03 | chef | crée un événement `pupitre` | **REFUSÉ** |
| T04 | chef | crée avec un pupitre qu'il ne dirige pas | **REFUSÉ** |
| T05 | chef | crée sans pupitre (global) | **REFUSÉ** |
| T06 | chef | crée avec 2 pupitres | **REFUSÉ** |
| T07 | chef | insère directement dans `events` (sans la fonction) | **REFUSÉ** (policy) |
| T08 | chef | passe son événement mono-pupitre en `public` | **REFUSÉ** |
| T09 | chef | ajoute un 2ᵉ pupitre à son événement | **REFUSÉ** |
| T10 | chef | modifie un événement mono-pupitre de son pupitre (titre) | **OK** |
| T11 | chef | modifie un événement multi-pupitres dont un de ses pupitres fait partie | **REFUSÉ** |
| T12 | chef | supprime un événement mono-pupitre de son pupitre | **OK** |
| T13 | chef | supprime un événement multi-pupitres ou global | **REFUSÉ** |
| T14 | chef rétrogradé | même action que T10/T12 après perte du statut de chef | **REFUSÉ** |
| T15 | chef | lit les présences nominatives d'un événement mono-pupitre de son pupitre | **OK** |
| T16 | chef | lit les présences nominatives d'un événement multi-pupitres | **REFUSÉ** (0 ligne) |
| T17 | chef | lit les présences nominatives d'un événement sans pupitre | **REFUSÉ** |
| T18 | membre | lit les présences nominatives des autres | **REFUSÉ** ; sa propre réponse : **OK** |
| T19 | secrétaire | crée `public`/`interne`/`pupitre`, 0 à N pupitres | **OK** partout |
| T20 | secrétaire | crée un événement **global sans pupitre** | **OK** |
| T21 | secrétaire | modifie et supprime tout événement | **OK** |
| T22 | secrétaire | lit toutes les présences nominatives | **OK** |
| T23 | admin | mêmes droits que la secrétaire sur tous les cas ci-dessus | **OK** partout |
| T24 | membre | tente de créer, modifier ou supprimer un événement | **REFUSÉ** |
| T25 | tout rôle | `is_chef` absent du JSON de `app.member_directory` | **OK** (`to_jsonb(t) ? 'isChef'` = faux) |
| T26 | tout rôle | `bureauPosition` non nul pour un profil portant un titre | **OK** |
| T27 | `bagad_app` | `DELETE FROM invitations` | **REFUSÉ** (privilège) |
| T28 | `bagad_app` | `select` sur `playing_with_neon` | **Relation inexistante** |
| T29 | `bagad_app` | `app.reserve_storage_bytes` au-delà du seuil | **REFUSÉ**, `reserved_bytes` inchangé |
| T30 | `bagad_app` | réservation → finalisation → libération | **OK**, compteurs cohérents |
| T31 | sans contexte | lecture d'une table protégée par RLS | **0 ligne** |
| T32 | deux profils successifs | même connexion poolée | **Isolation** (aucune fuite) |

### 9.6 Conditions opposables du risque accepté (Q-A6 / C7)

Les tables Better Auth (`user`, `session`, `account`, `verification`) restent **hors RLS** ; ce risque est **accepté par le client** et n'autorise aucune dérive :

1. La connexion **`bagad_app`** n'est utilisée que **côté serveur** (Workers/Hyperdrive).
2. **Aucune connexion directe à Neon depuis le navigateur** ; aucun identifiant base dans le bundle client.
3. Les identifiants de base ne sont **jamais exposés** ni journalisés.
4. **Sessions, comptes et jetons ne sont jamais renvoyés** dans une réponse d'API (ni instantané, ni endpoint).
5. **Toutes les tables métier restent protégées par RLS** ; une nouvelle table métier sans policy est un défaut bloquant.

### 9.7 Questions ouvertes (non tranchées — ne pas décider à la place du client)

Ces points sont consignés dans `docs/questions.md` (section 2026-11-20).

| # | Question | État du plan |
| --- | --- | --- |
| **a** | Un chef peut-il créer un événement `interne` ? | **Déjà tranché oui** (Q-A1/Q-A2) — **ne pas rouvrir**. |
| **b** | Un chef peut-il modifier ses **4 événements existants** en visibilité `pupitre` sur `test` **sans changer la visibilité** ? | **Non tranché.** Les 16 événements de `test` (dont ces 4) ne sont **pas** modifiés par la migration. L'étape 54 vérifie seulement qu'ils restent inchangés. Tant que la question est ouverte, le comportement retenu est celui du `WITH CHECK` de l'étape 52 : un chef ne peut pas produire un état `pupitre` par `UPDATE` ; la question détermine si une exception transitoire est nécessaire. |
| **c** | `can_view_event` conserve la branche `created_by` : un chef garde-t-il la **lecture** d'un événement qu'il a créé mais ne gère plus ? | **Non tranché** ; la branche est **conservée** (Q-A1 demande explicitement de ne pas la modifier). Consigné, sans correction. |
| **d** | Un chef de **plusieurs pupitres** doit-il pouvoir créer un événement **multi-pupitres** ? | **Non tranché** ; aujourd'hui **non** (exactement 1 pupitre). Règle « un seul pupitre pour un chef » laissée en l'état. |
| **e** | La suppression par un chef sur son pupitre (Q-A4) s'applique-t-elle aux **événements à venir uniquement**, ou aussi aux événements passés ? | **Non tranché** ; aucune restriction temporelle n'est ajoutée par l'étape 52. |

## 10. Chantier du 2026-11-25 — chargement ciblé de l'espace privé (étapes 58 à 73)

> **Besoin client, mot pour mot :** « pourrais tu revoir entièrement la partie membre privée, et gagner en performance par exemple snapshot.ts dans bagadPenhars\src\lib\server\member — il faudrais faire des lectures serveur ciblées par page — agenda, documents, profils — avec des réponses contenant uniquement les champs requis seraient plus faciles à faire évoluer. Dans les deux cas, il faut conserver les guards serveur, la transaction avec app.profile_id et le RLS. »
>
> **Périmètre :** tout l'espace privé — membre, chef de pupitre, secrétaire, admin — **mêmes écrans, mêmes composants, mêmes parcours**. Seul le **chargement des données** change. **Aucune évolution de schéma, aucune migration, aucun nouveau package.**
>
> Cette section est **additive** : elle ne renumérote ni ne supprime les étapes 1 à 57. Les étapes 58 à 73 s'ajoutent après elles et ne bloquent pas les étapes déjà planifiées (50 à 57).

### 10.1 Décision d'architecture : un load ciblé par page, plus d'instantané

| Aujourd'hui | Cible | Raison |
| --- | --- | --- |
| `buildMemberSnapshot(tx, profileId, sections?)` construit **10 sections** et renvoie `MemberSnapshot` | Une fonction de lecture **par page** dans `src/lib/server/member/queries/`, chacune renvoyant **uniquement** le DTO de la page | Une page ne paie plus les requêtes des autres ; le DTO devient le contrat d'évolution de la page |
| `+layout.server.ts` charge l'instantané du layout et, pour `/dashboard/admin` ou une route inconnue, **toutes** les sections | Le layout ne charge que le **socle** (`getMemberShell` : profil + compteur de non-lus) ; chaque `+page.server.ts` charge sa page | Le layout est exécuté à **chaque** navigation : il ne doit rien coûter |
| `GET /api/member` renvoie l'instantané complet | **Supprimé** (aucun consommateur après l'étape 64) | Un endpoint qui renvoie tout annule le bénéfice des lectures ciblées |
| Chaque mutation (`/api/member/action`) renvoie `snapshot` | Chaque mutation renvoie `{ success: true, data }` **minimal** ; le client revalide la page via `invalidateAll()` | Plus de reconstruction complète après un RSVP ou une lecture de notification |
| `MemberStore.snapshot` unique | `MemberStore` conserve les **mêmes getters** (`member.events`, `member.profiles`, …) mais chaque navigation **remplace** le jeu de données par le DTO de la page ; le socle est conservé à part | Aucun composant n'est réécrit ; l'état ne peut plus contenir de données d'une autre page |
| `profiles`/`responses`/`pupitres` lus **sans filtre** (`select().from(...)`) | Requêtes bornées par la page, le profil et les droits | Le volume et la surface d'exposition diminuent |

**Interdits de ce chantier :**

- Réintroduire un « instantané complet », un cache mémoire de page ou un endpoint `GET /api/member`.
- Lire la base hors `withUserContext` : chaque fonction reçoit `tx` et s'exécute dans la transaction qui a posé `set_config('app.profile_id', ...)`.
- Faire confiance au rôle ou à l'identifiant fournis par le client : le `profileId` vient de `locals.profile` (session Better Auth), le rôle est relu **dans la transaction** par `getMemberShell`.
- Activer le cache de requêtes Hyperdrive sur une lecture privée.
- Modifier le **balisage**, les classes, les libellés ou les parcours des pages. **Seuls** les `+*.server.ts`, les services de `src/lib/member/services/`, le store, les types DTO et `src/lib/server/member/` changent ; si un écran change de **source** de données (ex. `AdminMembersPage` lit `member.adminMembers` au lieu de `member.profiles`), la ligne de `<script>` est ajustée, **jamais le template**.

### 10.2 Contexte de sécurité conservé (identique pour chaque page)

1. **Guard de layout** (`src/routes/dashboard/+layout.server.ts`) : session, `account_status` (`pending` → `/auth/pending`, `suspended` → connexion), base disponible → sinon 503. Inchangé dans son principe ; il ne renvoie plus que le socle.
2. **Guard de page** : chaque `+page.server.ts` privé reprend `locals.session`/`locals.profile`, et **la fonction de lecture relit le rôle et le statut dans la transaction** avant de répondre (défense en profondeur ; un layout ne protège pas un endpoint).
3. **Transaction et RLS** : `withUserContext(locals.db, profileId, (tx) => fn(tx, profileId, …))` — `app.profile_id` est le **seul** contexte (Q-A9) ; aucune requête hors transaction.
4. **Droits** : les règles de §12.1 (visibilité), §12.2 (présences nominatives), §12.3 (trombinoscope) et §4 (rôles) restent appliquées **en base et côté code**. Une page qui ne peut pas lire une donnée ne la reçoit pas : le masquage d'interface ne compte pas.
5. **Aucun cache** : `Cache-Control: private, no-store` sur tout endpoint privé restant ; pas de cache Hyperdrive.

### 10.3 Correspondance page → lecture serveur → champs exposés

Chaque ligne est un **contrat de page** : le load ne renvoie que ces champs (les DTO exacts sont au `CONTRAT_API.md` §7.10).

| Route privée | Fonction serveur | Données renvoyées (résumé) |
| --- | --- | --- |
| toutes (`+layout.server.ts`) | `getMemberShell` | `profile` (soi-même : id, prénom, nom, e-mail, rôle, statut, niveau, titre du bureau, pupitres **du profil courant** avec `isChef`, avatar, date d'adhésion), `unreadCount` |
| `/dashboard` | `getOverviewPage` | 10 prochains événements visibles + ma réponse + agrégats ; 3 dernières notifications avec **mon** état de lecture ; nombre de documents |
| `/dashboard/agenda` | `listAgendaEvents` | événements visibles (RLS) + ma réponse + agrégats + réponses nominatives **seulement** si §12.2 l'autorise |
| `/dashboard/agenda/[id]` | `getEventDetail` | événement complet + `createdBy` + audience minimale (id, prénom, nom, pupitres, niveau, avatar) alimentant la section `profiles` du store, + mes réponses + nominatif si autorisé |
| `/dashboard/agenda/nouveau`, `/dashboard/agenda/[id]/modifier`, `/dashboard/admin/agenda/new` | `getEventForEdit` | événement à éditer (mêmes champs que l'instantané actuel), ou `null` |
| `/dashboard/membres` | `listDirectoryProfiles` | trombinoscope **§12.3 uniquement** : id, prénom, nom, avatar/avatarUrl, pupitres, niveau, titre du bureau |
| `/dashboard/pupitre`, `/pupitre/membres`, `/pupitre/documents`, `/pupitre/notifications` | `getPupitrePage(tx, profileId, { pupitreId, section })` | pupitre, membres du périmètre, événements du périmètre, compteurs de documents, non-lus — **uniquement** la section demandée |
| `/dashboard/documents` | `listDocumentsPage` | documents actifs (id, titre, description, pupitre, nom de fichier, type MIME, taille, déposant, date) |
| `/dashboard/notifications`, `/dashboard/pupitre/notifications`, `/dashboard/admin/notifications` | `listNotificationsPage` | notifications visibles ; `readBy` **réduit à mon identifiant** ; destinataires/pupitres minimaux pour les rôles qui envoient |
| `/dashboard/profil` | `getProfilePage` | `profile` (soi-même) + préférences de notification |
| `/dashboard/securite`, `/dashboard/admin/permissions` | *(aucune)* | le socle suffit (`getMemberShell`) |
| `/dashboard/admin` | `getAdminOverviewPage` | compteurs : membres, invitations en attente, articles publiés/brouillons, non-lus, stockage |
| `/dashboard/admin/membres` | `listAdminMembersPage` | fiches d'administration (rôle, statut, niveau, pupitres + `isChef`, titre du bureau, e-mail) |
| `/dashboard/admin/invitations` | `listInvitationsPage` | invitations (statut, dates, pupitres, invitant) |
| `/dashboard/admin/articles`, `.../new`, `.../[id]/edit` | `listArticlesPage` | articles + **auteurs minimaux** (id, prénom, nom) |
| `/dashboard/admin/media` | `listMediaPage` | albums + photos + `storage` |
| `/dashboard/admin/settings` | `getSettingsPage` | réglages + `storage` |

**Règles de projection transverses :**

- Aucun `isChef` d'un **autre** profil ne sort, **sauf** par les deux projections qui en ont besoin aujourd'hui : `getPupitrePage` (liste des chefs) et `listAdminMembersPage` (édition). Jamais dans l'annuaire, l'agenda, le détail d'événement ou les notifications — point non tranché, voir §10.5.
- Aucun e-mail, téléphone, adresse, `authUserId`, `role`, `accountStatus` d'un autre profil dans le trombinoscope.
- Les valeurs déjà fabriquées par l'instantané pour l'annuaire (`email: ''`, `role: 'member'`, `accountStatus: 'active'`, `joinedAt: ''`) **disparaissent** : le DTO d'annuaire ne porte plus ces champs (voir §10.5, conflit C-2026-11-25-01).
- `readBy` d'une notification ne contient **jamais** l'identifiant d'un autre profil : uniquement `[profileId]` si lue, `[]` sinon.
- `contentMarkdown` n'est renvoyé que par `listArticlesPage`.

**Étapes backend (dev-backend).** Chacune est testable seule ; aucune ne touche au schéma.

### Étape 58 (B1) : socle de lecture ciblée et `getMemberShell`

- **Livrable** :
  1. `src/lib/server/member/queries/common.ts` — helpers partagés : `loadPupitreMaps(tx)`, conversions date, `readActor(tx, profileId)` (relit `profiles.role`, `account_status` et les pupitres **du profil courant**), `assertActive`.
  2. `src/lib/server/member/queries/shell.ts` — `getMemberShell(tx, profileId)` : `{ profile, unreadCount }`, 2 requêtes au plus (profil + comptage des non-lus).
  3. `src/lib/server/member/dto.ts` (ou `src/lib/member/dto.ts` si les types doivent être partagés — voir étape 64) : types de projection, **sans** importer le client.
- **Testable** : appel direct dans un script de vérification sous `withUserContext` → 2 requêtes, `profile.email` présent **uniquement** pour soi, `pupitres[].isChef` présent **uniquement** pour soi ; compte non actif → refus ; aucun `select()` sans `where` dans le fichier.
- **Dépend de** : Rien (le socle est indépendant des étapes 50 à 57).
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/queries/common.ts`, `queries/shell.ts`, types DTO.
- **Statut** : **PLANIFIÉE.**

### Étape 59 (B2) : lectures agenda, événement et présences

- **Livrable** :
  1. `queries/agenda.ts` — `listAgendaEvents(tx, profileId, { from?, to? })` : événements visibles selon RLS, ciblage des pupitres, `myResponse`, `responseSummary`.
  2. `queries/events.ts` — `getEventDetail(tx, profileId, eventId)` et `getEventForEdit(tx, profileId, eventId)`.
  3. Application de §12.2 **côté code** : la liste nominative n'est incluse que si l'acteur est secrétaire/admin, ou chef d'un événement **mono-pupitre de son pupitre** ; sinon seules ma réponse et les agrégats.
- **Testable** : matrice Q-A3 — chef mono-pupitre → nominatif ; chef sur multi-pupitres → agrégats seuls ; membre → sa réponse seule ; événement invisible → `null` (404 côté route). Comptage : agenda ≤ 5 requêtes, détail ≤ 6 (hors réponses nominatives, paginées à 1 requête).
- **Dépend de** : étape 58 ; étapes 52 à 55 pour la cohérence RLS (`can_view_presence`).
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/queries/agenda.ts`, `queries/events.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 60 (B3) : annuaire, trombinoscope et espace pupitre

- **Livrable** :
  1. `queries/directory.ts` — `listDirectoryProfiles(tx)` : lit `app.member_directory` (jamais `profiles` pour autrui), projette **strictement** §12.3, tri nom puis prénom ; ne fabrique aucune valeur.
  2. `getPupitrePage(tx, profileId, { pupitreId, section })` : `section = 'overview' | 'members' | 'documents' | 'notifications'`, chaque variante ne lit que ce qu'elle rend ; vérifie que le pupitre est dans le périmètre de l'acteur.
- **Testable** : aucun e-mail/role/accountStatus/`isChef` dans la sortie annuaire (assertion sur les clés du DTO) ; pupitre hors périmètre → refus `403` ; une variante ne renvoie que ses champs ; ≤ 4 requêtes par variante.
- **Dépend de** : étape 58 ; étape 53 pour `app.member_directory` (`bureau_title`, sans `is_chef`).
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/queries/directory.ts`, `queries/pupitre.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 61 (B4) : documents et notifications

- **Livrable** :
  1. `queries/documents.ts` — `listDocumentsPage(tx, profileId)` : documents `is_active`, compteurs par pupitre du périmètre.
  2. `queries/notifications.ts` — `listNotificationsPage(tx, profileId)` : notifications visibles, audience résolue côté serveur, `readBy` **réduit au profil courant**, destinataires/pupitres minimaux si l'acteur peut envoyer.
- **Testable** : `readBy` ne contient jamais un autre identifiant (jeu de deux profils) ; un membre ne reçoit pas les destinataires ; ≤ 3 requêtes pour les documents, ≤ 5 pour les notifications.
- **Dépend de** : étape 58.
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/queries/documents.ts`, `queries/notifications.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 62 (B5) : contenus et administration

- **Livrable** : `queries/articles.ts` (`listArticlesPage` + auteurs minimaux), `queries/media.ts` (`listMediaPage` + `storage`), `queries/invitations.ts` (`listInvitationsPage`), `queries/settings.ts` (`getSettingsPage`), `queries/adminMembers.ts` (`listAdminMembersPage`), `queries/adminOverview.ts` (`getAdminOverviewPage`). Chaque fonction vérifie le rôle dans la transaction.
- **Testable** : secrétaire → articles/médias/invitations ; admin → membres/réglages ; membre → refus sur chacune ; e-mail d'un tiers **absent** de `listAdminMembersPage` si le client tranche ainsi (question ouverte) ; comptage ≤ 4 requêtes par page.
- **Dépend de** : étapes 58 et 61 (helpers et projection notifications pour les compteurs).
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/queries/{articles,media,invitations,settings,adminMembers,adminOverview}.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 63 (B6) : profil, préférences et contexte de page

- **Livrable** : `queries/profile.ts` — `getProfilePage(tx, profileId)` : profil complet de soi-même + préférences de notification (1 requête chacune) ; `queries/context.ts` — `getPageContext(tx, profileId, page)` qui renvoie `{ role, accountStatus }` pour les pages qui n'ont besoin que du contrôle de rôle avant lecture (évite de dupliquer la relecture).
- **Testable** : 2 requêtes ; préférences d'un autre profil inaccessibles ; compte suspendu → refus même si la session existe encore.
- **Dépend de** : étape 58.
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/queries/profile.ts`, `queries/context.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 72 (B7) : retrait de `buildMemberSnapshot` et du champ `snapshot` des commandes

- **Livrable** :
  1. Suppression de `src/lib/server/member/snapshot.ts` et du type `MemberSnapshot` (ou réduction au seul type conservé, s'il est encore importé par un test).
  2. `src/lib/server/member/commands.ts` : `runMemberCommand` ne construit plus aucun instantané ; chaque branche renvoie `{ data }` minimal (entité créée/modifiée/supprimée et identifiants utiles). `MemberCommandError` inchangé.
  3. Suppression des imports `buildMemberSnapshot` résiduels.
- **Testable** : `grep -rn "buildMemberSnapshot\|MemberSnapshot" src/` → **0** occurrence ; `pnpm run check` passe ; les commandes renvoient toutes `{ success: true, data }` ; aucune requête de lecture globale déclenchée par une mutation (comptage).
- **Dépend de** : étapes **64 à 71** (toutes les pages et le store doivent d'abord être migrés).
- **Responsable** : Backend.
- **Fichiers** : `src/lib/server/member/snapshot.ts` (supprimé), `commands.ts`, `src/lib/member/types.ts` (nettoyage des types devenus inutiles, en accord avec l'étape 64).
- **Statut** : **PLANIFIÉE.** Étape de clôture : ne pas la démarrer avant que le frontend ne lise plus `data.snapshot`.

**Étapes frontend (dev-frontend).** Aucun template de page n'est modifié ; seules les sources de données changent.

### Étape 64 (F1) : DTO partagés, store par sections, type des mutations

- **Livrable** :
  1. `src/lib/member/dto.ts` — DTO de page (`MemberShell`, `OverviewPageData`, `AgendaPageData`, `EventDetailData`, `DirectoryPageData`, `PupitrePageData`, `DocumentsPageData`, `NotificationsPageData`, `ProfilePageData`, `ArticlesPageData`, `MediaPageData`, `InvitationsPageData`, `AdminMembersPageData`, `SettingsPageData`, `AdminOverviewPageData`, `CommandResult`), alignés sur `CONTRAT_API.md` §7.10.
  2. `src/lib/member/types.ts` — les types existants (`MemberEvent`, `MemberDocument`, …) restent, enrichis des champs de page (`myResponse`, `responseSummary`, `read`), et `MemberSnapshot` cesse d'être la racine du store.
  3. `src/lib/member/store.svelte.ts` — `shell = $state<MemberShell | null>(null)`, `page = $state<PageData | null>(null)` ; `applyShell(shell)` et `applyPage(pageData)` qui **remplacent** les données ; les getters (`profile`, `activeProfile`, `events`, `responses`, `profiles`, `documents`, `notifications`, `articles`, `albums`, `invitations`, `preferences`, `settings`) gardent **exactement** leur nom et leur type de retour ; `request()` n'applique plus de `snapshot`.
- **Testable** : aucun **template** de page modifié (`git diff` sur les `.svelte` : seules des lignes de `<script>` peuvent changer, aucun balisage) ; les getters renvoient `[]`/valeurs vides quand la page ne les a pas chargés ; `applyPage` ne conserve aucune donnée de la page précédente ; `member.profiles` est typé `DirectoryProfile[]` et `member.adminMembers` porte la fiche d'administration ; `pnpm run check` passe sur le store et les types.
- **Dépend de** : contrat §7.10 (types figés) ; peut démarrer en parallèle de l'étape 58.
- **Responsable** : Frontend.
- **Fichiers** : `src/lib/member/dto.ts`, `types.ts`, `store.svelte.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 65 (F2) : layout privé réduit au socle et passerelle de données

- **Livrable** :
  1. `src/routes/dashboard/+layout.server.ts` — guard inchangé, puis `getMemberShell` dans `withUserContext` ; suppression de `snapshotSectionsForRoute` et de l'appel à `buildMemberSnapshot`. Retour : `{ memberShell }`.
  2. `src/routes/dashboard/+layout.svelte` — `applyShell(data.memberShell)` au chargement et à chaque navigation ; un `$effect` sur `page.data.memberPage` de `$app/state` applique le DTO de la page quand il est présent. Aucun changement de rendu (`<MemberShell>` inchangé).
- **Testable** : chaque navigation déclenche **une** lecture de socle (2 requêtes) et **une** lecture de page ; une route sans `memberPage` (sécurité, permissions) fonctionne ; profil `pending`/`suspended` toujours redirigé ; `data.snapshot` n'existe plus.
- **Dépend de** : étapes 58 et 64.
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/dashboard/+layout.server.ts`, `src/routes/dashboard/+layout.svelte`.
- **Statut** : **PLANIFIÉE.**

### Étape 66 (F3) : pages tableau de bord et agenda

- **Livrable** : `+page.server.ts` de `/dashboard`, `/dashboard/agenda`, `/dashboard/agenda/[id]`, `/dashboard/agenda/nouveau`, `/dashboard/agenda/[id]/modifier` et `/dashboard/admin/agenda/new` ; chaque load renvoie `{ memberPage: { section, data } }` et appelle **une** fonction des étapes 58 à 63. Les mutations d'agenda et de RSVP n'attendent plus de `snapshot` : elles lisent `data` puis déclenchent `invalidateAll()`.
- **Testable** : les pages rendent les mêmes écrans (aucune modification de balisage ; seules les lignes de `<script>` de sélection de source peuvent changer) ; le nombre de requêtes par navigation est celui de §10.4 ; RSVP → une seule revalidation, compteur et cartes à jour ; événement invisible → 404.
- **Dépend de** : étapes 59, 64, 65.
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/dashboard/+page.server.ts`, `dashboard/agenda/**/+page.server.ts`, `dashboard/admin/agenda/new/+page.server.ts`, `src/lib/member/services/{events,responses}.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 67 (F4) : trombinoscope, espace pupitre et documents

- **Livrable** : loads de `/dashboard/membres`, `/dashboard/pupitre{,/membres,/documents,/notifications}`, `/dashboard/documents` ; services `members.ts`, `documents.ts` adaptés aux DTO (aucun changement de leurs signatures publiques ni des pages).
- **Testable** : la recherche et la sélection d'un membre fonctionnent ; un membre sans pupitre voit l'état vide ; les compteurs de documents par pupitre sont identiques à l'ancien écran ; aucune requête globale de profils.
- **Dépend de** : étapes 60, 61, 64, 65.
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/dashboard/{membres,pupitre,documents}/**/+page.server.ts`, `src/lib/member/services/{members,documents}.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 68 (F5) : notifications et profil

- **Livrable** : loads de `/dashboard/notifications`, `/dashboard/pupitre/notifications`, `/dashboard/admin/notifications`, `/dashboard/profil` ; services `notifications.ts` et `profiles.ts` adaptés ; marquage lu/non lu par `data` + `invalidateAll()`.
- **Testable** : badge de non-lus identique sur toutes les pages ; un membre ne voit que son état de lecture ; envoi admin/secrétaire/chef conforme à §12.5 ; profil et préférences enregistrés puis rechargés.
- **Dépend de** : étapes 61, 63, 64, 65.
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/dashboard/{notifications,profil}/**/+page.server.ts`, `dashboard/pupitre/notifications/+page.server.ts`, `dashboard/admin/notifications/+page.server.ts`, `src/lib/member/services/{notifications,profiles}.ts`.
- **Statut** : **PLANIFIÉE.**

### Étape 69 (F6) : pages d'administration (hors notifications)

- **Livrable** : loads de `/dashboard/admin` (vue d'ensemble), `/dashboard/admin/membres`, `/dashboard/admin/invitations`, `/dashboard/admin/articles{,/new,/[id]/edit}`, `/dashboard/admin/media`, `/dashboard/admin/settings`, `/dashboard/admin/permissions` ; services `articles.ts`, `albums.ts`, `invitations.ts`, `settings.ts`, `profiles.ts` adaptés.
- **Testable** : chaque page affiche les mêmes chiffres et listes ; `AdminMembersPage` lit `member.adminMembers` (même balisage, seule la ligne de script change) ; une invitation créée/relancée/annulée est visible après revalidation ; quota et stockage identiques ; aucun `contentMarkdown` hors articles ; rôle insuffisant → `AccessDenied` conservé.
- **Dépend de** : étapes 62, 64, 65.
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/dashboard/admin/**/+page.server.ts`, `src/lib/member/services/*`.
- **Statut** : **PLANIFIÉE.**

### Étape 70 (F7) : fin du store instantané et de `GET /api/member`

- **Livrable** :
  1. Suppression de `src/routes/api/member/+server.ts` (le `GET` complet) ; `src/routes/api/member/action/+server.ts` ne construit plus d'instantané et renvoie `{ success: true, data }` (ou l'erreur normalisée).
  2. `src/lib/member/README.md` mis à jour : plus de snapshot, un DTO par page, revalidation par `invalidateAll()`.
  3. Nettoyage des imports et des types morts côté client.
- **Testable** : `grep -rn "snapshot" src/routes src/lib/member` → 0 occurrence hors historique ; `POST /api/member/action` renvoie `data` et **jamais** `snapshot` ; aucune requête vers `/api/member` dans le code ; `pnpm run check`/`build` passent.
- **Dépend de** : étapes 66 à 69.
- **Responsable** : Frontend.
- **Fichiers** : `src/routes/api/member/**`, `src/lib/member/store.svelte.ts`, `src/lib/member/README.md`.
- **Statut** : **PLANIFIÉE.**

### Étape 71 (F8) : preuves de non-régression de l'interface

- **Livrable** : une fiche de preuve dans `docs/journal.md` (date, commit, méthode) : captures ou parcours des 18 routes privées, comparaison avant/après, liste des requêtes SQL par page et taille des réponses. Aucun fichier de page n'est modifié.
- **Testable** : chaque route listée en §10.3 rend le même contenu qu'avant (mêmes cartes, mêmes compteurs, mêmes états vides) ; au moins un parcours par rôle (membre, chef mono-pupitre, chef multi, secrétaire, admin) ; aucune erreur console ; `git diff` sur `src/lib/member/pages/` et `src/lib/components/dashboard/` ne contient **aucune modification de balisage** (uniquement, si nécessaire, des lignes de `<script>` de sélection de source).
- **Dépend de** : étapes 66 à 70.
- **Responsable** : Frontend + Testeur (lecture).
- **Fichiers** : `docs/journal.md`, captures hors dépôt.
- **Statut** : **PLANIFIÉE.**

### Étape 73 (F9) : tests des lectures ciblées et de l'exposition des champs

- **Livrable** : `tests/member-queries.test.ts` (ou équivalent) : pour chaque fonction des étapes 58 à 63, assertions sur **les clés** du DTO (aucun champ interdit), sur le comptage de requêtes (transaction factice/proxy) et sur les refus de rôle ; test dédié « aucun instantané complet » (grep + réponse de mutation).
- **Testable** : `npm run test` passe ; retirer un `where` de `listDocumentsPage` ou réintroduire `readBy` complet fait échouer un test ; `tests/i18n.test.ts` et `tests/invitation.test.ts` restent hors périmètre de cette étape (voir `docs/questions.md` 2026-11-25).
- **Dépend de** : étapes 58 à 72.
- **Responsable** : Testeur (+ Backend en lecture).
- **Fichiers** : `tests/member-queries.test.ts`.
- **Statut** : **PLANIFIÉE** — sous réserve de l'arbitrage sur les droits d'écriture `tests/**` (§10.5).

### 10.4 Ordre, parallélisme et preuves de performance

| Vague | Étapes | Remarque |
| --- | --- | --- |
| **A — socle** | 58 (B1), 64 (F1) | Types et socle figés d'abord ; 58 et 64 peuvent avancer en parallèle sur la base du contrat §7.10. |
| **B — lecture par page** | 59 (B2), 60 (B3), 61 (B4), 62 (B5), 63 (B6) | Backend en parallèle ; chaque fonction est testable seule. |
| **C — branchement** | 65 (F2) puis 66 (F3), 67 (F4), 68 (F5), 69 (F6) | Ordre imposé : socle, puis pages dans l'ordre agenda → annuaire/documents → notifications/profil → administration. |
| **D — clôture** | 70 (F7), 72 (B7), 71 (F8), 73 (F9) | On ne supprime l'instantané (B7) **qu'après** F7 ; les preuves et les tests ferment le chantier. |

**Cibles de requêtes par page** (à mesurer et consigner ; référence actuelle : 1 instantané = 12 requêtes minimum, plus une par section enfant, plus 3 lectures **non bornées** — `profiles`, `profile_pupitres`, `event_responses`) :

| Page | Cible | Page | Cible |
| --- | --- | --- | --- |
| socle (layout) | 2 | documents | 3 |
| vue d'ensemble | 6 | notifications | 5 |
| agenda | 5 | profil | 3 |
| détail événement | 6 | articles | 3 |
| annuaire | 4 | médias | 4 |
| pupitre (par section) | 4 | invitations / réglages | 3 |
| vue d'ensemble admin | 7 | membres admin | 4 |

**Preuves exigées** (à joindre à l'étape 71) :

1. Requêtes par page, comptées sur `test`, avant/après, avec la liste des tables lues.
2. Champs exposés par page, comparés au DTO (aucun champ interdit : e-mail d'autrui, `role`, `accountStatus`, `isChef` d'autrui, `authUserId`).
3. Absence d'instantané : `grep` = 0, `GET /api/member` inexistant, réponse de mutation sans `snapshot`.
4. Non-régression UI : 18 routes, 5 rôles, aucun diff dans les pages/composants.
5. Taille des réponses (avant/après) pour les pages les plus lourdes (notifications, agenda).

### 10.5 Points non tranchés et conflits détectés (consignés dans `docs/questions.md`)

| Réf. | Point | Impact sur le plan |
| --- | --- | --- |
| **Q-2026-11-25-01** | `isChef` d'un **autre** profil : encore transmis aujourd'hui (`snapshot.ts` lignes 209, 243, 271), **dérivé d'un `select` global de `profile_pupitres`** (ligne 183), alors que §12.3 et Q-A5 le déclarent strictement interne — et §12.3 interdit explicitement `/dashboard/pupitre/membres`, où l'écran affiche pourtant les chefs (`activeChefs`). L'écran `AdminMembersPage` en a besoin pour éditer. | **Aucune décision d'agent.** Le retrait casserait l'affichage des chefs : ce serait une **modification d'interface**, hors périmètre. Comportement par défaut du chantier : `isChef` d'autrui **n'est plus qu'une projection de page**, servie **uniquement** par `getPupitrePage` et `listAdminMembersPage` (jamais par l'annuaire, les notifications ou l'agenda), et **jamais déduite d'un `select` global** (`profile_pupitres` filtré). Si le client tranche le retrait total, il faudra une donnée dédiée (`pupitreChefs`) **et** une évolution d'écran, planifiée séparément. |
| **Q-2026-11-25-02** | Droits d'écriture sur `tests/**` : `tests/i18n.test.ts` et `tests/invitation.test.ts` sont **vides** (0 octet) et l'étape 73 suppose un auteur pour `tests/member-queries.test.ts`. | L'étape 73 est **planifiée mais non attribuable** tant que le Chef n'a pas confirmé l'attribution (Testeur, Backend ou Frontend). Aucune autre étape n'en dépend. |
| **Q-2026-11-25-03** | Tests vides existants : périmètre et échéance (i18n = parité des clés `fr`/`en`/`br` ; invitation = parcours 1 h, jeton, révocation). | Hors de ce chantier : ne pas les remplir « au passage ». Signalés pour arbitrage. |
| **C-2026-11-25-01** | L'instantané **fabrique** des valeurs pour l'annuaire (`email: ''`, `role: 'member'`, `accountStatus: 'active'`, `joinedAt: ''`, lignes 256-275) : cela contredit « aucune valeur inventée » (§12.3, §12.7). | Corrigé **de fait** par le DTO d'annuaire (étape 60), qui n'a plus ces champs ; aucun composant ne les lit. Consigné pour ne pas réintroduire le procédé. |
| **C-2026-11-25-02** | Le layout charge **toutes** les sections pour `/dashboard/admin` et pour toute route inconnue (`+layout.server.ts` lignes 52-83). | Supprimé à l'étape 65 ; chaque route admin a son propre load ciblé (étape 69). |
| **C-2026-11-25-03** | `GET /api/member` renvoie l'instantané complet, y compris hors navigation. | Supprimé aux étapes 70/72 ; aucun consommateur ne subsiste (vérifié par grep). |

### 10.6 Risques propres à ce chantier

| Risque | Impact | Parade | Porteur |
| --- | --- | --- | --- |
| Une page lit une donnée d'une autre section (ex. `EventDetailPage` a besoin des profils de l'audience) | Écran vide ou incomplet alors que le type compile | §10.3 liste ces dépendances ; chaque DTO de page les inclut explicitement ; l'étape 71 compare les 18 routes | Frontend |
| Revalidation après mutation (`invalidateAll`) ressentie comme un rechargement | Perte de la position de défilement ou d'un état local | Les pages ne conservent aucun état serveur ; vérifier les formulaires (brouillons locaux) à l'étape 71 ; repli : `applyPatch` limité au RSVP et au marquage lu | Frontend |
| `isChef` d'autrui retiré trop tôt | L'écran d'administration des membres ou l'espace pupitre n'affiche plus les chefs | Question Q-2026-11-25-01 ; repli documenté (`pupitreChefs`) ; aucun droit n'en dépend côté serveur | Backend + Frontend |
| DTO partiel qui « oublie » un champ lu par un composant | Régression silencieuse à l'écran | Test de clés par DTO (étape 73) + revue des composants ; les types partagés (étape 64) rendent l'oubli visible à `svelte-check` | Frontend |
| Fonction de lecture appelée hors transaction | Perte du RLS (lecture non filtrée ou erreur) | Signature imposée `(tx, profileId, …)` ; aucune fonction n'importe `db` ; revue de code | Backend |
| Coût du socle sur **chaque** navigation | 2 requêtes par navigation au lieu de 0 | Socle réduit au profil + compteur ; le compteur peut être dérivé du DTO de page quand la page charge déjà les notifications, sans requête supplémentaire | Backend |
| Suppression de `snapshot.ts` avant la fin de la migration | Application cassée entre deux commits | Étape 72 placée **après** l'étape 70 dans la vague D ; interdiction de la démarrer avant | Chef / Backend |

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

**Décisions client du 2026-11-18** (détail dans `docs/questions.md`) : Q-2026-11-17-02 option A (lien d'invitation 1 heure) ; Q-2026-11-17-03 deux temps (palette maintenant, photo personnelle quand R2 est branché → étapes 43 puis 49) ; Q-2026-11-17-04 option A (migration additive `category`, `image_url`, `image_alt`).

**Ajout du 2026-11-18 (2ᵉ passe) :** les étapes **50** et **51** ne reprennent aucune étape de l'annexe A ; elles constituent la **vague 0** (préalables de dépendances) issue de l'audit du mainteneur (`docs/mises-a-jour.md`). La numérotation des étapes 36 à 49 est **inchangée**.
