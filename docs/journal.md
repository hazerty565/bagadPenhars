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

## 2026-11-08

### Arbitrages client appliqués

- **Q-2026-11-08-01** : le driver reste `pg` + `drizzle-orm/node-postgres`
  au-dessus de Cloudflare Hyperdrive; `neon-serverless` est écarté. Un helper
  `withUserContext(profileId, callback)` ouvre la transaction, exécute
  `set_config('app.user_id', ..., true)` et les requêtes métier dans la même
  transaction, puis commit ou rollback.
- **Q-2026-11-08-02** : `storage_usage` reste une ligne globale unique; toutes
  les colonnes d'octets passent en `bigint` et `quota_bytes`,
  `alert_threshold_bytes`, `block_threshold_bytes`, `last_sync_at` sont
  ajoutés. `docs/media.md` est aligné.
- **Q-2026-11-08-03** : option B retenue — R2 + Cloudflare Image Resizing à la
  volée sur le domaine public; plus aucun téléversement dans Cloudflare Images.
  `docs/media.md` ne mentionne plus `imagedelivery.net` ni `CF_ACCOUNT_HASH`.
- **Q-2026-11-08-04** : bindings figés `R2_PUBLIC` / `R2_PRIVATE`; les objets
  privés passent par `/api/files/[...key]` après guard, sans URL signée.
  `docs/Structure.md` et `docs/database.md` sont alignés.
- **Q-2026-11-08-05** : ajout de `cancelled_at` (et `cancelled_by`) aux
  événements; état calculé `annule` / `clos` / `actif`.
- **Q-2026-11-08-06** : seuls le secrétaire et l'admin peuvent inviter; le
  mécanisme plugin `admin` Better Auth reste retenu, faute d'objection.
- **Q-2026-11-08-07** : notification à la création + rappel J-3 aux membres
  sans réponse via Scheduled Worker, selon `notification_preferences`.
- **Q-2026-11-08-08** : durées retenues (réponses anonymisées sans limite,
  `activity_log` 24 mois, contact 12 mois, invitations expirées 30 jours); purge
  désactivée par défaut.
- **Q-2026-11-08-09** : `supabase/` et `netlify/` sont conservés pour leurs
  migrations, puis déplacés dans `docs/Archive/`. Aucune donnée n'est supprimée.
- **Q-2026-11-07-02 / 03** : design de référence dans `src/autre`; icône PWA
  fournie plus tard dans `src/routes/public`; installation proposée après la
  connexion.

### État des dépendances

- `pnpm install` se bloque et `pnpm-lock.yaml` est désynchronisé de
  `package.json`; l'installation est reprise via npm en attendant la
  régénération du lockfile (étape 9 du plan).

## 2026-11-09

### Page d'accueil publique et header

- **Périmètre livré (branche `proto`)** : layout public
  `src/routes/(public)/[lang=lang]/`, header sticky, footer, lecteur audio
  flottant en état vide, et page d'accueil composée de `Hero`, `About`,
  `Pupitres`, `AgendaPreview`, `GalleryPreview`, `Join`.
- **Thème** : tokens Tailwind (`ivoire`, `marine`, `or`, `ink`, `sable`,
  `ardoise`) et polices Playfair Display + Inter chargées dans `src/app.html`.
- **i18n** : dictionnaires typés maison dans `src/lib/i18n/` (`fr`, `en`,
  `br`, `types`, `index`). `svelte-i18n` n'est pas installé ; voir la question
  ouverte Q-2026-11-09-01.
- **Routes** : `/` redirige en 307 vers `/fr` ; le paramètre `[lang=lang]`
  accepte `fr`, `en`, `br`. `hooks.server.ts` remplace `%lang%` dans
  `app.html`.
- **Liens internes** : utilisation de `resolve()` de `$app/paths` et de
  `PUBLIC_NAV` (identifiants de route SvelteKit) pour satisfaire
  `svelte/no-navigation-without-resolve`.
- **Contenus** : textes, coordonnées et réseaux repris du site officiel
  `https://bagad-penhars.com/` ; ils restent à reconfirmer par le bureau.
- **Galerie** : sélection provisoire de photographies réelles du dépôt
  (`IMG_0877`, `IMG_0880`, `IMG_0881`) en attendant les albums R2. Les
  légendes et textes alternatifs ont été ajustés après vérification visuelle
  des trois images (scène, grosse caisse, atelier de percussion).
- **Agenda** : `nextPublicEvents: []` assumé tant que la base publique n'est
  pas branchée ; aucun événement de démonstration n'est réutilisé.

### Corrections d'infrastructure rencontrées

- **Better Auth / Zod** : `better-auth@1.7.18` exige Zod 4 (`z.looseObject`)
  alors que le projet utilise Zod 3. Le bundle SSR laissait
  `import * as z from "zod"` et Node résolvait Zod 3. Ajout de
  `ssr.noExternal: ['better-auth', '@better-auth/core', 'zod']` dans
  `vite.config.ts`.
- **Variables d'environnement** : `BETTER_AUTH_SECRET` remplacé par
  `BETTER_AUTH_API_KEY`, seul nom présent dans `.env`. Création de
  `.env.example` (documentation des clés, sans valeurs) et ajout des fichiers
  `.env*` à `.prettierignore`.
- **Build local** : `src/lib/db/index.ts` lève une erreur si `DATABASE_URL`
  est absente à l'import ; le build doit être lancé avec les variables de
  `.env` chargées.

### Validation

- `npm run check` : 0 erreur, 1 avertissement préexistant
  (`src/routes/public/[lang=lang]/contact/+page.svelte`).
- `npm run build` : OK avec les variables de `.env`.
- ESLint et Prettier ciblés sur les fichiers créés/modifiés : OK.
- `npm run lint` global échoue toujours sur des fichiers préexistants non
  formatés (`.opencode/`, `docs/maquette_UI.md`, `drizzle/meta/`,
  `equipe/SYNTHESE.md`, `maquette/`, `scripts/`, `src/routes/public/...`) ;
  pas de formatage massif hors périmètre.

### Reste à faire

- Brancher `nextPublicEvents` sur Neon (étape agenda) et `galleryPhotos` sur
  les albums R2 (étape médias).
- Fournir des pistes audio réelles et les métadonnées du lecteur.
- Faire relire les textes breton et les mentions historiques par le bureau.
- Compléter les pages publiques internes (le bagad, formation, médias,
  partenaires, contact) actuellement à l'état d'ébauche.

## 2026-11-10

### Page Formation publique

- **Périmètre livré (branche `proto`)** :
  `src/routes/(public)/[lang=lang]/formation/+page.svelte`, jusqu'ici réduite à
  une ébauche, est remplacée par la page complète : hero avec mascotte,
  présentation des quatre pupitres (rôle, photo, texte pédagogique, repères),
  bloc « Informations pratiques » et appel à l'action vers le contact.
- **i18n** : clé `formation` ajoutée au contrat `Dictionary` et aux trois
  dictionnaires publics (`fr`, `en`, `br`). L'espace adhérents reste en
  français. Le contrat des pupitres expose désormais `paragraphs: string[]`
  (texte long, un paragraphe par entrée) et `photoAlt` en plus de `imageAlt`
  (mascotte).
- **Contenus** : les textes des quatre pupitres, l'introduction, les repères et
  les informations pratiques sont repris de la page Formation du site officiel
  `https://bagad-penhars.com/formation`. Le hero conserve son accroche d'origine
  (`lead`) et affiche le paragraphe de présentation officiel en second
  (`leadMore`), ce qui évite de remplacer une phrase déjà validée. Les coquilles
  de la source ont été corrigées (« tout âges » → « tous âges », « aprenants » →
  « apprenants », « cour d'essai » → « cours d'essai », double point final).
  Rien n'est inventé : les tarifs, horaires, lieu et niveaux sont ceux publiés
  par l'association, à reconfirmer avant mise en production
  (Q-2026-11-10-01).
- **Photos** : chaque pupitre reçoit la photographie du site officiel, servie
  depuis `static/` — `Formation_bombarde.webp` (cours de bombarde),
  `IMG_0874.webp` (practice chanters), `IMG_0881.webp` (practice pads),
  `IMG_0880.webp` (grosse caisse). Le mapping est centralisé dans
  `PUPITRE_PHOTOS` (`src/lib/data/site.ts`). Les dimensions réelles sont
  déclarées pour éviter tout décalage de mise en page ; chaque photo est
  cadrée en 4/3 (`object-cover`) et l'ordre texte/photo s'inverse d'un pupitre
  à l'autre sur desktop.
- **Mascottes** : les quatre mascottes fournies par l'association
  (`static/mascotte_1.svg` à `mascotte_4.svg`, silhouettes vectorielles
  1772 × 1772) illustrent un pupitre chacune — `mascotte_2` bombarde,
  `mascotte_3` cornemuse, `mascotte_4` caisse claire, `mascotte_1` percussion.
  Leur fond blanc est neutralisé avec `mix-blend-mode: multiply` pour qu'elles
  se fondent dans l'ivoire du hero et le blanc des sections, sans détourage.
  Dans les articles, chaque mascotte accompagne le titre de son pupitre
  (56–64 px). Le SVG d'hermine dessiné plus tôt dans la session a été remplacé
  par ces quatre fichiers.
- **Image de hero** : le hero réunit les quatre mascottes sur une image unique,
  `static/mascottes-groupe.svg` (1000 × 900), composée à partir des quatre
  fichiers sources : fond blanc retiré, silhouettes recadrées sur leur boîte
  réelle, normalisées en hauteur et posées sur deux rangs avec une ligne de sol
  commune. Le fichier est autonome (aucune référence externe) et pèse 75 Ko.
  Le mapping est déclaré dans `MASCOTS_GROUP` (`src/lib/data/site.ts`).
- **Métadonnées** : titre, description, `canonical`, `hreflang` `fr`/`en`/`br`/
  `x-default` et Open Graph renseignés depuis le dictionnaire de la langue
  courante.
- **Sitemap** : `/formation` n'y est pas ajouté. `src/routes/sitemap.xml/+server.ts`
  renvoie encore un `urlset` vide pour toutes les routes ; la question est
  globale et sera traitée en une fois, pas route par route.
- **Validation** : `npm run check` 0 erreur, 1 avertissement préexistant
  (`contact/+page.svelte`) ; Prettier et ESLint ciblés OK ; `npm run build` OK ;
  rendu vérifié en `fr`, `en` et `br` (quatre pupitres, photos chargées,
  quatre points pratiques) ; aucun débordement horizontal mesuré à 375 px.
  Lighthouse sur `/fr/formation` : SEO 100, bonnes pratiques 100,
  accessibilité 96 (contrastes des petits textes secondaires, identiques à
  l'accueil).

### Page Partenaires publique

- **Périmètre livré (branche `proto`)** :
  `src/routes/(public)/[lang=lang]/partenaires/+page.svelte` passe de page vide à
  page complète : hero (accroche, appel à l'aide vers le contact, lien d'ancre),
  section « Rejoignez le Bagad » (investissements de l'association, déductions
  fiscales 66 % particuliers / 60 % professionnels, remerciements) et grille des
  quatre logos partenaires.
- **Contenus** : textes repris de `https://bagad-penhars.com/partenaires`
  (accroche « Le Bagad Penhars vit grâce à l'énergie… », investissements, dons,
  déductions, remerciements, bouton « Aidez-nous » → `/contact`). La page
  officielle étant une SPA Vue, l'URL directe renvoie une 404 : le contenu a été
  relevé depuis `/` après navigation client.
- **Données** : `src/lib/data/partenaires.ts` remplace le tableau fictif par
  `PARTNERS` typé (`id`, `name`, `logo`, `width`, `height`, `url`), dans l'ordre
  officiel : Quimper, Département du Finistère, Mederien Penhars, Fenêtres de
  toit 29 (dénomination normalisée depuis « fenetres detoit 29 »). Les logos
  sont ceux de `static/logos/` ; leurs dimensions réelles (404 × 144, 451 × 658,
  225 × 225, 400 × 137) sont déclarées pour réserver la place avant chargement.
- **Logos** : rendu homogène quelle que soit l'orientation du fichier — bloc de
  hauteur fixe (`h-24`) et `object-contain`, donc le logo du Département, très
  vertical, n'est ni rogné ni écrasé. Logos décoratifs (`alt=""`) ; le nom
  visible sous le logo sert de nom accessible du lien, complété par un
  `sr-only` « — nouvel onglet ». Liens externes en
  `target="_blank" rel="noopener noreferrer"`.
- **i18n** : bloc `partners` ajouté au contrat `Dictionary` et aux trois
  dictionnaires (`meta`, `eyebrow`, `title`, `lead`, `cta`, `support`,
  `logos`). Les noms des partenaires restent en français dans les trois langues
  (dénominations officielles).
- **Métadonnées** : titre, description, `canonical`, `hreflang`
  `fr`/`en`/`br`/`x-default` et Open Graph.
- **Validation** : `npm run check` 0 erreur, 1 avertissement préexistant
  (`contact/+page.svelte`) ; rendu vérifié en `fr`, `en` et `br` (h1, deux h2,
  quatre logos chargés avec leurs dimensions intrinsèques, liens corrects) ;
  aucun débordement horizontal mesuré à 375 px.
- **Documentation** : `docs/partenaire.md` réécrit — il décrivait un format de
  données (`nom`, `logo`, `lien`) qui n'existait pas dans le code.

### Dépendance icônes : `@lucide/svelte` et logos de réseaux sociaux

- **Changement de paquet** : `lucide-svelte@1.0.1` est remplacé par
  `@lucide/svelte@1.71.0` (paquet officiel actuel ; l'ancien nom est déprécié).
  Les onze fichiers de `src/lib` et `src/routes` qui importaient
  `lucide-svelte` utilisent désormais `@lucide/svelte` ; aucune icône n'a changé
  de nom. `src/autre/` (maquette de référence, exclue du build, du `tsconfig` et
  d'ESLint) conserve ses imports d'origine et n'est pas concerné.
- **SSR** : `@lucide/svelte` v1 publie des composants `.svelte`. Sans
  `noExternal`, le rendu serveur échoue avec
  `Unknown file extension ".svelte"` ; le paquet est donc ajouté à
  `ssr.noExternal` dans `vite.config.ts`. Le serveur de développement doit être
  redémarré après ce changement (Vite réoptimise ses dépendances).
- **Réseaux sociaux** : `SocialIcon.svelte` n'embarque plus de tracé maison ; il
  affiche les fichiers fournis par l'association, `static/Facebook_icon.svg` et
  `static/instagram_icon.svg` (marques en couleur, `alt=""` car le lien porte
  déjà son nom accessible). Le header et le footer passent une taille explicite
  (18 px sur desktop, 16 px dans le menu mobile) et n'utilisent plus de couleur
  de texte pour teinter l'icône.
- **Verrouillage** : `pnpm-lock.yaml` mis à jour (`pnpm` est le gestionnaire de
  référence du dépôt) ; `package-lock.json`, déjà désynchronisé avant cette
  tâche (conflit de pair `zod` 3/4 entre `@better-auth/infra` et le projet), n'a
  pas été régénéré. `pnpm-workspace.yaml` reçoit une exception
  `minimumReleaseAge` pour `@lucide/svelte@1.71.0`.

### Page Contact publique

- **Périmètre livré (branche `proto`)** :
  `src/routes/(public)/[lang=lang]/contact/+page.svelte` remplace l'ébauche par
  une page complète : hero éditorial, formulaire accessible, encart de
  coordonnées et carte OpenStreetMap. Aucune donnée du formulaire n'est stockée
  en base : le message part par courriel.
- **i18n** : clé `contact` ajoutée au contrat `Dictionary` et aux trois
  dictionnaires (`fr`, `en`, `br`), y compris les libellés des sujets et les
  messages d'erreur. Les cinq sujets (`adhesion`, `information`,
  `partenariat`, `prestation`, `autre`) sont définis une seule fois dans
  `src/lib/types.ts` (`CONTACT_SUBJECTS`) et postés en valeurs stables : le
  schéma Zod et l'action serveur ne dépendent donc jamais d'un libellé traduit.
- **Schéma et tests** : `contact/schema.ts` (Zod : nom, prénom, courriel,
  sujet, message de 10 à 5000 caractères, champs rognés) partagé par le
  navigateur et le serveur ; `contact.test.ts` couvre le message valide, le
  rognage, le courriel invalide, le sujet inconnu et les champs vides ou remplis
  d'espaces (6 tests).
- **Turnstile** : le widget est rendu explicitement (`render: 'explicit'`) parce
  que la navigation interne de SvelteKit ne rejoue pas le scan automatique du
  script. Le jeton vit dans un champ caché, est remis à zéro après un échec
  (un jeton est à usage unique) et le bouton reste désactivé tant qu'il manque.
  `$lib/server/turnstile.ts` vérifie le jeton auprès de Cloudflare et **échoue
  de manière fermée** : secret absent, jeton manquant, réponse ambiguë ou réseau
  injoignable refusent l'envoi, avec un repli affiché vers l'adresse électronique
  de l'association. La clé secrète ne quitte jamais le serveur ; le `load` ne
  transmet que la clé publique.
- **Envoi** : ordre volontaire — validation des champs, vérification Turnstile,
  message à l'association (avec `replyTo` de l'expéditeur pour répondre
  directement), puis accusé de réception. Si l'envoi à l'association échoue,
  aucun accusé n'est envoyé ; un échec de l'accusé n'est pas bloquant. Le
  message HTML est échappé avant insertion dans le courriel.
- **Erreurs** : l'action renvoie des codes (`invalid`, `captcha`, `send`,
  `unavailable`) et la page les traduit ; les messages Zod ne sont jamais
  affichés bruts. Un message localisé est posé par champ (`fieldError`), avec
  `aria-invalid` et `aria-describedby`. Les valeurs saisies sont renvoyées en
  cas d'échec pour ne pas perdre le texte.
- **Carte** : `src/lib/components/shared/Map.svelte` charge Leaflet à la demande
  dans `onMount` (jamais en SSR), affiche les tuiles OpenStreetMap avec
  l'attribution obligatoire, un marqueur or/marine en `divIcon`, respecte
  `prefers-reduced-motion` et propose trois liens externes pour ouvrir le lieu
  dans OpenStreetMap, Google Maps (lien universel `google.com/maps/search/?api=1`,
  identique sur mobile et sur le web) ou Apple Maps (`maps.apple.com`, utilisé
  par iOS et macOS). Le
  marqueur est placé d'après le géocodage Nominatim de « 6 Avenue des Oiseaux,
  29000 Quimper » (47,9920253 / −4,1209120, zoom 16) — à reconfirmer
  (Q-2026-11-10-05).
- **Dépendances** : `leaflet@1.9.4` et `@types/leaflet@1.9.22` (types
  uniquement en développement). Aucune autre dépendance ajoutée.
- **Thème** : nouveau token `danger: '#9B2F26'` dans `tailwind.config.js`, pour
  les messages d'erreur (contraste ~6:1 sur blanc et sur ivoire). Il n'existait
  aucun rouge dans la palette.
- **Pièges rencontrés** :
  - Leaflet est pré-bundlé par Vite en UMD : le namespace importé n'expose que
    `default`, pas les exports nommés. Le composant passe donc par
    `leaflet.default ?? leaflet`.
  - Les clés Turnstile de `.env` sont des clés de production limitées au domaine
    `bagad-penhars.com` : sur `localhost`, `render` ne produit aucun iframe et
    `error-callback` déclenche le repli. Le chemin de rendu a été vérifié avec la
    clé de test `1x00000000000000000000AA`. À traiter en Q-2026-11-10-06.
  - `CONTACT_EMAIL` (`@gmail.com`) ne peut pas servir d'expéditeur Resend : une
    variable `CONTACT_FROM` a été ajoutée (`.env.example`), avec repli sur
    `CONTACT_EMAIL`. Toujours en Q-2026-11-10-06.
- **Coordonnées affichées** : Espace Chaptal, 6 avenue des Oiseaux, 29000 Quimper,
  courriel de l'association, et trois plages horaires — mardi 17 h – 21 h,
  vendredi 20 h – 22 h 30 et samedi 15 h – 17 h 30 (le vendredi corrigé et le
  samedi ajouté sur demande le 2026-11-10, dans les trois langues). Elles
  restent à confirmer (Q-2026-11-10-05).
- **Documentation** : `docs/architecture.md` décrit la route `/contact`, son
  `load`, son action et la carte ; `docs/questions.md` reçoit Q-2026-11-10-05
  (coordonnées, horaires, marqueur), -06 (expéditeur Resend et clés Turnstile)
  et -07 (route vestige).
- **Vérifications** : `npm run check` 0 erreur, 0 avertissement ; test Vitest du
  schéma OK ; Prettier et ESLint ciblés OK. Rendu contrôlé sur
  `/fr/contact`, `/en/contact` et `/br/contact` : 200, titres et contenus
  corrects, carte opérationnelle (18 tuiles chargées, 1 marqueur, 480 px en
  desktop / 320 px en mobile), aucun débordement horizontal à 375 px. Action
  testée en direct : champs vides → `invalid` + erreurs par champ ; message
  valide sans jeton → `captcha`. L'envoi Resend de bout en bout n'a pas été
  exercé, pour ne pas émettre de vrais courriels.

### Page Bagad publique

- **Périmètre livré (branche `proto`)** :
  `src/routes/(public)/[lang=lang]/bagad/+page.svelte`, jusqu'ici vide, est
  remplacée par une page complète : hero éditorial suivi de la photographie de
  groupe, section « Notre histoire » avec l'année de création en exergue,
  section « Notre mission » avec une photographie de scène et trois repères
  chiffrés, bandeau marine d'appel à l'adhésion. `+page.server.ts` reste
  inchangé (il ne renvoie rien ; la langue vient du layout).
- **Contenus** : textes repris de la page Bagad du site officiel
  `https://bagad-penhars.com/bagad` (histoire, mission, invitation à rejoindre),
  avec les appels à l'action de la même page. Rien n'est inventé : les repères
  chiffrés (4 instruments enseignés, 25+ musiciens actifs, 100+ concerts et
  festivals) sont ceux publiés par l'association et restent à confirmer
  (Q-2026-11-10-08).
- **Ancienneté** : la page n'affiche que `1985` (lu depuis `site.foundedYear`)
  et « Année de création ». Le site officiel annonce à la fois « 40+ ans
  d'expérience » et « 40 années d'existence », incohérent avec une création en
  1985 (41 ans en 2026) : aucun nombre d'années n'est donc affiché en dur. La
  question est posée (Q-2026-11-10-08).
- **Photographies** : `static/groupe_bagad.webp` (1436 × 957) en ouverture,
  `static/couple_joueur.webp` (2048 × 1365) pour la mission ; les deux étaient
  déjà dans le dépôt. Dimensions réelles déclarées, cadre doré décalé identique
  aux pages Formation, légende sous chaque image, texte alternatif descriptif
  (les personnes et les instruments sont nommés). La photographie de groupe
  porte le filigrane du photographe : l'accord et le crédit restent à valider
  (Q-2026-11-10-08).
- **i18n** : clé `bagad` ajoutée au contrat `Dictionary` et aux trois
  dictionnaires publics (`fr`, `en`, `br`). Aucune chaîne d'interface en dur
  dans la page. Les textes bretons sont à relire par un locuteur natif.
- **Métadonnées** : titre, description, `canonical`, `hreflang` `fr`/`en`/`br`/
  `x-default` et Open Graph renseignés depuis le dictionnaire de la langue
  courante.
- **Validation** : `npm run check` 0 erreur, 0 avertissement ; Prettier OK ;
  rendu vérifié en `fr`, `en` et `br` (trois h2, deux photographies chargées,
  quatre liens internes) ; aucun débordement horizontal mesuré à 375 px.

### Lint : Prettier global et erreurs ESLint préexistantes

- **Constat** : la CI (`.github/workflows`, `pnpm run lint` = `prettier --check . &&
eslint .`) échouait sur **18 fichiers** mal formatés et **8 erreurs ESLint**,
  tous antérieurs aux pages livrées dans cette session. Deux fichiers touchés
  aujourd'hui en faisaient partie (`docs/maquette_UI.md`,
  `src/lib/server/email.ts`) : ils n'avaient jamais été passés à Prettier.
- **Piège de vérification** : `npx prettier --check
"src/routes/(public)/[lang=lang]/contact/+page.svelte"` ne vérifie **rien** —
  Prettier traite `[lang=lang]` comme une classe de caractères glob et ne trouve
  aucun fichier, sans erreur. Les contrôles « Prettier OK » des tâches
  précédentes portaient donc sur des chemins silencieusement ignorés. Toujours
  lancer `npx prettier --check .` (ou échapper les crochets).
- **Correction Prettier** : `npx prettier --write .` sur les 18 fichiers
  (markdown d'équipe et d'agents, `drizzle/meta/0000_snapshot.json`, scripts,
  `src/lib/db/schema.ts`, pages `+error` et route vestige `src/routes/public/`).
- **Correction ESLint** :
  - pages `+error.svelte` (racine et publique) : la prop `error` est interdite
    par `svelte/valid-prop-names-in-kit-pages` ; elles lisent désormais
    `page.status` et `page.error` depuis `$app/state` ;
  - `scripts/**/*.js` : override ESLint qui autorise `require()` (scripts
    d'exploitation CommonJS exécutés par `node`), et suppression d'un import
    `execSync` inutilisé dans `scripts/reset-agenda.js` ;
  - `maquette/**` ajouté aux `ignores` : c'est une maquette de référence hors
    application, non compilée, que le service de types ne résout pas ;
  - route vestige `src/routes/public/[lang=lang]/contact/` : suppression du bloc
    `<script>` mort (`handleSubmit` jamais appelé). La suppression complète du
    dossier reste en attente de validation (Q-2026-11-10-07).
- **Validation** : `npx prettier --check .` OK, `npx eslint .` OK,
  `npm run check` 0 erreur / 0 avertissement, `npm run build` OK.

### Reste à faire

- Faire reconfirmer par le bureau les informations pratiques reprises du site
  officiel (niveaux, lieu, horaires, tarifs) et valider la mascotte.
- Faire confirmer par le bureau la liste des partenaires, leurs liens et
  l'orthographe « Fenêtres de toit 29 », ainsi que l'autorisation d'usage de
  chaque logo (Q-2026-11-10-04).
- Déposer les photographies `Formation_*.webp` manquantes : seule
  `Formation_bombarde.webp` est présente, les trois autres pupitres utilisent
  pour l'instant `IMG_0874.webp`, `IMG_0881.webp` et `IMG_0880.webp`.
- Faire relire les textes bretons par un locuteur natif.
- Faire valider les chiffres, les photographies et le crédit photo de la page
  Bagad (Q-2026-11-10-08).
- Traiter le sitemap globalement (toutes les routes publiques, toutes langues).
