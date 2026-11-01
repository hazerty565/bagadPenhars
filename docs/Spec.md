# Spécification développeur — Bagad Penhars

## 1. Objet

Ce document transforme le besoin produit en exigences vérifiables pour la
conception, l'implémentation et la revue du code. Il complète
[`docs/brief.md`](./docs/brief.md), qui reste la référence fonctionnelle.

La spécification décrit le comportement attendu, pas l'état actuel du code. Les
routes et migrations présentes dans le dépôt ne prouvent pas à elles seules
qu'une exigence est implémentée. Les points techniques non tranchés sont
signalés dans [`docs/questions.md`](./docs/questions.md).

## 2. Objectifs et périmètre

Le produit comprend :

- un site public pour présenter l'association, publier les actualités et les
  albums, annoncer les représentations et recevoir les demandes de contact ;
- un espace adhérents privé, accessible uniquement sur invitation, pour
  consulter l'agenda et le trombinoscope, les partitions, répondre aux
  événements, gérer son profil et recevoir des notifications ;
- des outils d'administration permettant aux rôles autorisés de gérer les
  comptes, les contenus, l'agenda et les notifications.

L'application est principalement utilisée sur téléphone et doit rester simple
à maintenir par une petite équipe.

Hors périmètre : inscription libre, annuaire public, publication publique des
titres du bureau, paiements ou cotisations en ligne. Le trombinoscope interne
est réservé aux membres actifs et limité aux informations autorisées.

## 3. Utilisateurs, rôles et autorisations

Le rôle applicatif détermine les permissions. Un titre au bureau
(président, trésorier, secrétaire, etc.) est une information distincte et ne
confère aucun droit à lui seul. L'attribution d'un titre ne modifie jamais
automatiquement le rôle applicatif : les deux sont gérés indépendamment. Le
président et le trésorier n'ont pas de droits métier liés à leur titre.

| Rôle           | Exigences                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `member`       | Consulte l'agenda, les documents et le trombinoscope autorisé; répond aux événements et gère son propre profil. |
| `chef_pupitre` | Droits d'un membre; gère les événements d'un seul pupitre, et les partitions/notifications de son périmètre. |
| `secretaire`   | Gère tous les événements, articles et albums; envoie des notifications aux pupitres autorisés. |
| `admin`        | Gère globalement les utilisateurs, invitations, rôles, contenus et notifications; valide les comptes. |

Le statut de compte est distinct du rôle applicatif :

| `account_status` | Effet |
|---|---|
| `pending` | Compte créé sur invitation, en attente d'activation ; aucun accès métier |
| `active` | Accès autorisé selon `app_role` |
| `suspended` | Accès métier révoqué temporairement, données conservées |

Principes obligatoires :

- L'association compte trois pupitres : bombarde, caisse claire et cornemuse.
  Percussion est conservé comme pupitre distinct, dont les membres appartiennent
  aussi à Caisse claire par une relation d'héritage explicite. Un membre peut
  avoir plusieurs affectations ; un chef ne gère qu'un seul pupitre.
- Toute autorisation est vérifiée côté serveur et dérivée du rôle et des
  pupitres fiables en base, jamais d'une valeur de rôle fournie par le client
  ou de métadonnées de session modifiables.
- Une action reçoit l'identité de l'acteur depuis la session vérifiée; elle ne
  fait pas confiance à un identifiant d'utilisateur soumis dans le formulaire.
- Les invitations et validations de comptes sont réservées à l'admin. La
  secrétaire gère tous les événements, sans obtenir pour autant les droits
  globaux de l'admin sur les autres ressources.
- Les chefs sont indépendants : chacun gère uniquement les événements de son
  pupitre unique, quel qu'en soit l'auteur. Les événements ciblant plusieurs
  pupitres ou tous les pupitres relèvent exclusivement de la secrétaire ou de
  l'admin.
- Le trombinoscope est une exigence V1 obligatoire, opérationnelle dès la
  première mise en production. Il est réservé aux membres actifs connectés et expose seulement
  le nom, le prénom, la photo, les pupitres, le niveau musical et l'éventuelle
  fonction au bureau. Les coordonnées privées restent inaccessibles. Les titres
  du bureau ne sont jamais publics et ne déterminent aucun droit. La vue
  dédiée, ses données associées et les photos doivent être accessibles dès la
  V1, y compris au moyen d'appels directs à Supabase soumis aux mêmes contrôles.

Les permissions détaillées sont précisées dans les exigences par ressource
ci-dessous. Le schéma Supabase prend en charge les états de compte séparés des rôles et
plusieurs affectations de pupitre par membre.

## 4. Exigences fonctionnelles

### 4.1 Site public

- **Accueil (`/`)** : page principale du site, qui présente le Bagad et
  oriente vers ses pages publiques et ses activités.
- **Page Bagad** : présenter l'histoire, les valeurs, les dates clés,
  l'effectif, les photos et les principaux événements ou palmarès. Le bureau
  valide les contenus avant publication.
- **Page Formation** : présenter les formations proposées pour chacun des
  instruments/pupitres : bombarde, caisse claire et cornemuse.
  Chaque instrument doit avoir une section identifiable avec les niveaux
  requis, le contenu des cours, les horaires, le lieu et les modalités de prêt
  d'instrument. Le bureau complète les informations manquantes.
- Afficher les représentations publiques en lecture seule.
- Publier les actualités et les albums photo explicitement destinés au public.
- Les articles contiennent un titre, un texte, une date et un auteur; les
  albums contiennent un titre, une description, une date, des légendes et
  l'ordre des photos. Une prévisualisation est requise avant publication.
- Proposer un formulaire de contact qui transmet le message par email.
- Optimiser le référencement naturel des pages publiques : chaque page dispose
  d'un titre et d'une description adaptés à son contenu et à sa langue; les
  URL canoniques et les métadonnées de partage sont cohérentes avec la page.
- Fournir un sitemap à jour qui ne référence que les pages publiques et les
  contenus publiés, ainsi qu'un `robots.txt` cohérent avec les règles
  d'indexation. Les pages d'authentification, l'espace adhérents et les routes
  privées ne doivent pas être indexés; `robots.txt` ne remplace jamais les
  contrôles d'accès.
- Ne jamais exposer les profils privés, les coordonnées des membres, les
  partitions privées ni les titres du bureau.
- Le site public est disponible en français, anglais et breton (`fr`, `en`,
  `br`). L'espace adhérents et les pages d'authentification sont en français
  uniquement.

**Critères d'acceptation des pages publiques :**

- La navigation permet d'atteindre l'accueil, la présentation du Bagad et la
  page Formation.
- La page Formation présente séparément les trois instruments/pupitres
  ci-dessus, avec un contenu éditorial fourni ou validé par l'association.
- Ces pages sont consultables sans compte et ne révèlent aucune information
  privée sur les membres ou les titres du bureau.
- Chaque page publique fournit des métadonnées SEO propres à sa langue; le
  sitemap ne contient que les URL publiques publiées et les pages privées
  restent exclues de l'indexation.

### 4.2 Invitations et validation des comptes

1. Seul un administrateur envoie une invitation, renseigne l'adresse e-mail,
   l'identité nécessaire et le ou les pupitres. Le compte Auth est créé
   immédiatement et le profil applicatif a `account_status = 'pending'` et le
   rôle indépendant `member`.
2. Dans l'heure, le destinataire ouvre le lien Supabase Auth, confirme son
   adresse e-mail et définit son mot de passe. Le lien ne donne pas accès au
   dashboard.
3. La confirmation e-mail ne valide pas le compte : il reste `pending` jusqu'à
   l'activation manuelle par un administrateur.
4. L'administrateur ne peut activer le compte que si l'adresse e-mail est
   confirmée; l'activation change le statut en `active`, sans attribuer le rôle.
5. Le pupitre attribué n'est pas modifiable par l'invité.
6. Le lien Auth expire après une heure. Si le lien expire, l'administrateur
   peut renvoyer une invitation au compte Auth existant sans créer un second
   compte. L'expiration doit être configurée côté Supabase Auth, pas seulement
   enregistrée dans la table applicative.

Les paramètres Auth du projet hébergé et le modèle d'e-mail d'invitation
(contenu, lien et redirection) sont configurés dans le Dashboard Supabase.
La configuration locale du dépôt sert au développement et ne remplace pas
ce réglage Dashboard. Les opérations doivent être auditées lorsque le modèle
de données le permet.

### 4.3 Espace adhérents

- Toutes les pages et actions privées exigent une session valide et un rôle
  applicatif valide, et `account_status = 'active'`.
- Un compte `suspended` ne peut plus accéder aux données ni actions métier ;
  son profil et ses autres données sont conservés.
- Le dashboard montre les informations du profil connecté. Le trombinoscope
  distinct est accessible aux membres actifs et ne révèle aucun champ privé.
- Chaque membre ne modifie que son propre profil et sa propre réponse de
  présence.
- Le membre peut modifier ses propres informations de profil, à l'exception
  de son rôle et de ses pupitres. L'admin et la secrétaire peuvent
  modifier les pupitres; l'attribution des rôles applicatifs supérieurs reste
  réservée à l'admin.
- Seul l'admin peut inviter et approuver les comptes; il ne peut approuver un
  compte dont l'adresse e-mail n'est pas confirmée.
- Les champs de profil modifiables sont ceux du profil du membre, hors rôle et
  pupitres. Le changement de l'adresse email du compte doit suivre le flux
  sécurisé de Supabase Auth.
- Un membre peut demander la suppression de son compte. Les données
  personnelles sont supprimées ou anonymisées selon les obligations légales;
  les durées de conservation des présences et journaux d'audit restent à
  décider.

### 4.4 Agenda, présences et sondages

- L'agenda public expose uniquement les représentations sélectionnées pour
  publication; il est en lecture seule.
- L'agenda privé comprend les événements `interne`, visibles par tous les
  membres actifs, ainsi que les événements `pupitre` ciblés sur leurs pupitres.
  Les événements `public` sont visibles par tous.
- Les réponses possibles sont `present` ou `absent` (ou aucune réponse).
- L'identité de la personne qui répond vient de la session serveur.
- Un sondage est lui-même l'événement correspondant dans l'agenda; il est matérialisé
  directement dans la table `events` au moyen d'un champ `is_poll BOOLEAN NOT NULL DEFAULT FALSE`
  (la table `polls` est supprimée). Les réponses sont centralisées dans `event_responses`
  avec les statuts uniques `present` ou `absent`. L'admin et la secrétaire peuvent créer,
  modifier et supprimer tous les événements, y compris les sondages. Un chef peut
  gérer les événements de son unique pupitre, y compris ceux créés par un autre
  utilisateur. Il ne peut pas gérer d'événement multi-pupitres ou global.
- Chaque événement possède un `event_type` ENUM parmi `sortie`, `concert`,
  `fest-noz`, `festival`, `concours`, `gala`, `repetition`, `reunion` et
  `repas`, indépendant de `visibility`.
- Les niveaux de visibilité d'un événement (`visibility`) sont :
  - `public` : visible par tout le monde (public non connecté et membres connectés).
  - `interne` : visible par tous les membres connectés approuvés.
- `pupitre` : visible par les membres actifs des pupitres ciblés uniquement.
- Les membres actifs peuvent répondre aux événements publics et internes ;
  seuls les membres actifs des pupitres ciblés peuvent voir et répondre aux
  événements `pupitre`. Une répétition peut être publique, interne ou ciblée.
- Un chef crée toujours un événement avec la visibilité `pupitre`, ciblé sur
  son unique pupitre ; les membres des autres pupitres ne le voient pas et ne
  peuvent pas y répondre. Il peut gérer un événement de son pupitre même s'il
  n'en est pas l'auteur. L'admin
  et la secrétaire peuvent créer les événements internes communs, notamment
  les repas et répétitions générales privées, ainsi que les événements destinés
  à l'agenda public.
- La création et la modification d'événements respectent le rôle et le
  périmètre du pupitre; leur visibilité publique est explicite, jamais
  implicite.
- Le fuseau de référence est `Europe/Paris`; les changements d'heure sont
  gérés automatiquement. Aucune gestion des événements récurrents n'est
  incluse en V1.

### 4.5 Documents et médias

- Les partitions sont des PDF privés, accessibles à tous les membres approuvés,
  quel que soit leur pupitre.
- Le dépôt d'une partition est réservé aux chefs de pupitre pour leur
  périmètre, à la secrétaire et à l'admin.
- Les fichiers ne sont pas servis depuis une URL publique non protégée.
  L'accès au téléchargement vérifie l'identité et les autorisations côté
  serveur avant de lire le stockage.
- Les photos et albums destinés au public sont explicitement publiés; les
  fichiers non publics restent protégés.
- La photo de profil figure dans le trombinoscope V1 obligatoire dès la
  première mise en production, réservé aux membres actifs.
  Elle est stockée dans `bagad-private/profiles/{profile_id}/avatar.webp`.
  Tout membre actif peut la lire; seul son propriétaire peut la modifier,
  administrateurs inclus. Les photos téléversées au
  format JPG/JPEG, jusqu'à 20 Mo par fichier source, sont converties au format
  WebP avant stockage. Les vidéos ne sont pas acceptées.
- L'admin et la secrétaire peuvent publier et supprimer les albums. Une demande
  de retrait d'une photo est traitée rapidement par un responsable habilité;
  les médias d'albums publics sont servis publiquement depuis
  `bagad-public/albums/{album_id}/`. Les médias non publics restent dans
  `bagad-private/documents/albums/{album_id}/`.
- `bagad-public` est configuré avec `public = true` pour `articles/`, `albums/`,
  `events/` et `documents/`; ne jamais y placer de fichier non publié. `bagad-private`
  est configuré avec `public = false` pour les photos de profil et documents
  internes. Les policies de `storage.objects` contrôlent l'accès et les
  opérations d'écriture. Les fichiers privés sont servis par accès authentifié
  ou URL signée courte, jamais par URL publique permanente.

### 4.6 Notifications

- La secrétaire peut notifier plusieurs pupitres, selon les droits accordés.
- Un chef de pupitre ne peut notifier que son périmètre.
- L'admin peut gérer globalement les notifications.
- OneSignal est le fournisseur prévu; sa clé REST reste exclusivement côté
  serveur.
- La première version utilise les notifications push OneSignal uniquement.
  L'arrivée d'un nouvel événement déclenche une notification automatique.
- L'audience des notifications push de sondage dépend de sa portée :
  - Sondage ciblé par pupitre : seuls les membres du ou des pupitres ciblés sont notifiés.
  - Sondage interne commun : tous les membres du Bagad sont notifiés.
  - Sondage public : tous les membres du Bagad sont notifiés.
  - Seuls les membres ayant activé les notifications push sur leur appareil et n'ayant pas désactivé la préférence correspondante reçoivent le push.
- Chaque membre peut configurer les notifications globalement, pour les
  rappels et pour les événements, et choisir de recevoir un rappel lorsqu'il
  n'a pas répondu au sondage d'un événement.

### 4.7 Contact

- Le formulaire public utilise Netlify Forms pour recevoir les soumissions;
  la configuration Netlify existe déjà et l'adresse officielle de destination
  est configurée hors du code. Les responsables du bureau consultent et
  traitent manuellement les soumissions dans le dashboard Netlify.
- Les pièces jointes sont interdites et une confirmation est envoyée à
  l'expéditeur. Le branchement du formulaire côté application reste une tâche
  d'implémentation.

## 5. Exigences de sécurité et de confidentialité

- Activer et définir une politique RLS sur chaque table de données, y compris
  celles qui contiennent des données destinées au public. Les politiques
  publiques doivent filtrer explicitement les contenus publiés ou visibles.
- Ne pas utiliser une politique générale autorisant tout accès sans justification
  documentée et revue.
- Valider et normaliser les entrées côté serveur; appliquer les schémas de
  validation du projet.
- Vérifier les permissions à chaque requête sensible, y compris les actions de
  formulaire, les endpoints API et les téléchargements.
- Protéger les secrets dans les variables d'environnement serveur. Ne jamais
  les exposer dans le bundle client, les logs ou les exemples versionnés.
- Ne mettre en cache côté PWA que les ressources statiques et la page hors
  ligne; exclure les réponses privées et les pages de l'espace adhérents.
- Limiter les données personnelles collectées à ce qui est utile au service.
- Prévoir une traçabilité des opérations administratives sensibles sans écrire
  de secrets ni de données excessives dans les journaux.

## 6. Contraintes techniques et conventions

La cible déclarée dans `AGENTS.md` et `docs/brief.md` est SvelteKit 5 avec
runes, Tailwind, Motion, Supabase, OneSignal et hébergement Netlify. Avant une
nouvelle intégration, vérifier cette cible face aux dépendances et à
l'implémentation présentes : le dépôt peut contenir des choix antérieurs ou
incomplets. Ne pas changer de fournisseur ni ajouter de service sans décision
dans `docs/questions.md`.

- Svelte 5 : utiliser exclusivement les runes (`$state`, `$derived`, `$effect`, `$props`). Ne pas introduire `export let`, `$:`, `on:click` (utiliser `onclick`), ni de stores Svelte legacy pour l'état local.
- Formulaires et mutations : privilégier les actions SvelteKit (`+page.server.ts`) avec progressive enhancement (`use:enhance`), validation serveur systématique (schémas Zod/Standard Schema) et retours typés (`fail`, `success`).
- Supabase SSR : intégration canonique via `@supabase/ssr` dans `src/hooks.server.ts` :
  - Client serveur initialisé avec gestion complète des cookies (`getAll` / `setAll`).
  - Helper `safeGetSession()` pour valider le JWT et charger l'utilisateur.
  - Résolution du profil et des rôles en base (`public.profiles`) attachés à `event.locals.profile` et `event.locals.role`.
  - Guards centralisés dans `src/lib/auth/guards.ts` appliqués dans `+layout.server.ts` ou `+page.server.ts`.
  - La clé `service_role` est strictement confinée dans `src/lib/server/` pour les opérations administratives (`auth.admin`, logs d'audit).
- Typage strict : génération et utilisation systématique des types Supabase (`Database`) via le CLI Supabase pour un typage de bout en bout.
- Tailwind CSS : respect strict des tokens de thème du projet (couleurs, rayons, espacements). Approche mobile-first systématique (`sm:`, `md:`, `lg:`), focus rings visibles pour l'accessibilité clavier (`focus-visible:ring-2`), et gestion du mouvement réduit (`motion-reduce:`).
- Interface : en français, mobile-first, conforme aux critères d'accessibilité (labels explicites, contrastes WCAG AA).
- Dépendances & nettoyage : suppression immédiate des paquets et fichiers obsolètes (Better Auth, Kysely, pg, Netlify Blobs) afin de débloquer la CI (`check`, `lint`, `build`).
- Données métier : entièrement gérées dans Supabase. Netlify sert uniquement à l'hébergement et aux Netlify Forms (contact); OneSignal aux notifications push.
- Évolution du schéma : uniquement via de nouvelles migrations `supabase/migrations/NNN_*.sql`. Chaque migration active RLS et pose des policies explicites.
- Environnements : séparation stricte de dev, preview et production. Aucun secret committé.
- Fuseau horaire : `Europe/Paris` avec gestion automatique des décalages été/hiver.
- PWA : service worker restreint aux assets statiques du build et à `/offline`. Aucune page privée ni requête Supabase en cache. Modification consignée dans `docs/pwa.md`.

## 7. Critères d'acceptation transversaux

Une fonctionnalité est livrable lorsque :

1. son comportement correspond aux règles de ce document et à `docs/brief.md`;
2. les rôles autorisés peuvent l'utiliser et les rôles non autorisés en sont
   refusés côté serveur;
3. les données privées ne sont pas révélées par les routes, les réponses API,
   le stockage public, les caches ou les journaux;
4. les formulaires invalides retournent une erreur explicite et ne modifient
   pas les données;
5. l'interface fonctionne sur mobile et reste accessible;
6. les tests couvrent les cas normaux, les refus d'accès et les entrées
   invalides pertinents;
7. les documents concernés (`docs/architecture.md`, `docs/database.md`,
   `docs/pwa.md`) sont mis à jour;
8. les vérifications `npm run check`, `npm run lint` et `npm run build`
   passent, ou les échecs préexistants et non liés sont signalés clairement.

## 8. Décisions à compléter

Les décisions validées dans [`docs/questions.md`](./docs/questions.md) sont
appliquées dans cette spécification. Les questions complémentaires qui restent
ouvertes sont identifiées dans ce fichier et doivent être tranchées avant les
fonctions concernées : durées de conservation des présences et journaux d'audit,
ainsi que les modalités du traitement des demandes de suppression de compte.
Les soumissions de contact sont traitées manuellement dans le dashboard
Netlify; leur intégration dans l'application est une tâche d'implémentation.

## 9. État du dépôt à la préparation

Cette section est un relevé de départ pour le développeur, pas une validation
fonctionnelle :

- Le dépôt contient déjà des pages SvelteKit pour le site public, l'agenda,
  les articles, les médias, l'authentification, les invitations et le
  dashboard. Certains chemins n'ont qu'une partie du flux serveur ou une
  coquille de page; vérifier chaque parcours avant de le considérer terminé.
- Des fichiers fondamentaux sont vides, notamment `src/hooks.server.ts`,
  `src/lib/auth/guards.ts`, `src/lib/auth/roles.ts`,
  `src/lib/server/auth.ts`, `src/lib/server/db.ts`,
  `src/lib/server/blobs.ts` et plusieurs modules `src/lib/server/data/`.
- Le schéma Supabase de départ est consolidé dans
  `supabase/migrations/005_bagadPenhars_final.sql`; les migrations 001–004
  sont archivées sous `supabase/deprecated_migrations/` et ne doivent pas être
  appliquées.
- Au moment de cette lecture, il n'y a pas de dossier `supabase/`, de
  migration Supabase, de fichier `.env.example` ni de dépendance Supabase dans
  `package.json`. Le dépôt contient encore Better Auth, `pg`, Kysely et
  Netlify Blobs.
- `src/routes/` comprend des écrans d'agenda, d'articles, d'invitations,
  d'administration, de documents et de notifications. Il n'y a pas de routes
  dédiées aux sondages dans l'arborescence lue.
- La présence de tests dans certains répertoires ne signifie pas que tous les
  scénarios produit ou les règles d'autorisation sont couverts.

Le schéma 005 est prévu pour une base Supabase vierge. Un projet ayant déjà
appliqué les migrations historiques doit faire l'objet d'une réconciliation
dédiée avant déploiement.

## 10. Plan de réalisation recommandé

L'ordre ci-dessous exprime les dépendances techniques. Une étape qui dépend
d'une réponse inscrite dans `docs/questions.md` ne commence qu'après décision.

### Étape A — Socle Supabase

- Définir les environnements de développement, preview et production sans
  partager de secrets entre eux.
- Ajouter la configuration Supabase nécessaire à SvelteKit SSR et documenter
  les noms de variables sans valeurs réelles.
- Ajouter la structure de migrations Supabase et un processus reproductible
  pour les appliquer.
- Établir un nouveau schéma basé sur `auth.users`; définir les tables métier,
  les contraintes, les index, les fonctions et les policies RLS.
- Définir les buckets Storage et leurs policies; aucun bucket privé ne doit
  être rendu public pour simplifier les téléchargements.
- Écrire des tests de policies dans `supabase/tests/` pour accès anonyme,
  membre, chef de pupitre, secrétaire et administrateur selon la matrice
  approuvée.
- La base démarre vierge; aucune migration historique de comptes ou de données
  n'est prévue. Ne pas appliquer le schéma historique Better Auth comme schéma
  Supabase.

**Livrable :** installation locale documentée, migrations applicables à une
base Supabase neuve, RLS activée sur chaque table et Storage, tests de policies
passants.

### Étape B — Identité et autorisations

- Intégrer Supabase Auth dans le hook serveur et les types `event.locals`.
- Charger le profil et le rôle depuis la base; ne jamais dériver les droits de
  `user_metadata`.
- Implémenter les guards et centraliser les vérifications de rôle et de
  pupitre.
- Protéger layouts, actions, routes API et fichiers; un contrôle visuel dans
  Svelte ne constitue jamais une autorisation.
- Implémenter connexion, déconnexion, récupération et réinitialisation de
  mot de passe; prendre en compte les erreurs et les sessions expirées.

**Livrable :** chaque parcours privé refuse côté serveur les utilisateurs
anonymes et les comptes `pending` ou `suspended`; les tests démontrent les
refus et accès autorisés.

### Étape C — Invitations, profils et membres

- Mettre en place les invitations email à usage unique, expirantes après une
  heure et dont le jeton n'est stocké qu'empreinté. Seul l'admin peut inviter;
  le compte Auth et le profil avec `account_status = pending` et `app_role =
  member` sont créés immédiatement.
- L'invité confirme son adresse et définit son mot de passe dans l'heure.
  La confirmation ne valide pas le compte et l'invité ne choisit ni son rôle ni
  ses pupitres.
- Seul l'admin peut activer un compte; l'activation vérifie que l'adresse
  e-mail est confirmée et change uniquement `account_status` en `active`.
- Permettre à un membre de modifier uniquement les champs de son propre profil
  hors rôle et pupitres; le changement d'adresse email suit le flux Supabase
  Auth. Le trombinoscope réservé aux membres actifs expose uniquement les champs
  autorisés par le brief, sans ouvrir l'accès aux profils complets.
- Journaliser les changements de rôle et les actions d'administration sans
  enregistrer de secrets.

**Livrable :** tests du cycle invitation → mot de passe → attente → approbation,
incluant adresse e-mail non confirmée, jeton invalide, expiré, déjà utilisé et
adresse non concordante.

### Étape D — Agenda, présences et sondages

- Servir au public uniquement les événements explicitement publiés et
  autorisés; l'agenda public est en lecture seule.
- Servir l'agenda privé seulement aux comptes `active`.
- Implémenter création, modification et suppression d'événement selon les
  rôles et périmètres décidés.
- Enregistrer au plus une réponse par membre et événement. L'identité du
  répondant vient de la session; la réponse est modifiable ou supprimable
  uniquement par son propriétaire.
- Implémenter les sondages directement dans la table `events` avec `is_poll: boolean`
  et enregistrer les réponses dans `event_responses` avec le statut strict `present` ou `absent`
  (type `response_status`), sans table `polls` distincte ni étape de validation préalable.
  L'admin et la secrétaire peuvent les créer, modifier et supprimer dans les audiences publique
  ou privée; un chef a ces droits uniquement pour les événements de son pupitre unique.
- Utiliser l'ENUM `event_type` avec les neuf valeurs définies, et enregistrer
  indépendamment la visibilité `public`, `interne` ou `pupitre`.
- Valider les dates, fuseaux horaires et heures de fin. La première version ne
  comporte aucune structure SQL ni aucun comportement de récurrence.

**Livrable :** tests de visibilité public/privé, permissions par rôle,
propriété des réponses et cas de dates invalides.

### Étape E — Articles, médias, documents et contact

- Séparer contenu brouillon et publié; le public ne lit que le contenu publié.
- Stocker les fichiers dans les buckets Supabase prévus; contrôler type,
  taille, nom et droits avant écriture.
- N'accepter aucune vidéo. Limiter chaque fichier photo source JPG/JPEG à
  20 Mo et le convertir en WebP avant stockage. Le trombinoscope V1 est
  obligatoire et opérationnel à la première mise en production. La photo de
  profil affichée y est stockée dans
  `bagad-private/profiles/{profile_id}/avatar.webp`, accessible aux membres
  actifs; seul son propriétaire peut la modifier, administrateurs inclus.
- Configurer `bagad-public` (`public = true`) pour les médias publiés et
  `bagad-private` (`public = false`) pour les avatars et documents privés.
  Les fichiers privés sont servis via accès authentifié ou URL signée courte,
  jamais par URL publique permanente.
- Servir les partitions depuis un bucket privé avec autorisation serveur et
  RLS; ne jamais exposer une URL publique pour un document privé.
- Publier les albums et médias uniquement après action d'un rôle autorisé.
- Prévoir la prévisualisation avant publication; seuls l'admin et la secrétaire
  publient ou suppriment un album.
- Connecter le formulaire public à la configuration Netlify déjà présente et
  vérifier le parcours de soumission, la confirmation à l'expéditeur et la
  réception des messages dans le dashboard pour traitement manuel. Ne pas
  reconfigurer Netlify ni accepter de pièces jointes.

**Livrable :** tests de brouillon/publication, accès aux objets Storage selon
les droits, refus d'upload non autorisé et validation du formulaire.

### Étape F — Notifications, PWA et livraison

- Intégrer OneSignal côté serveur pour l'envoi; les identifiants d'application
  et clés REST ne sont jamais inclus côté client.
- Appliquer les audiences autorisées à chaque envoi; ne pas faire confiance
  aux identifiants de pupitre ou de destinataire soumis par le navigateur.
- Pour la première version, envoyer des notifications push uniquement et
  déclencher une notification automatique lors de la création d'un nouvel
  événement. Respecter les préférences globales, de rappels et d'événements,
  y compris le choix de rappel en l'absence de réponse au sondage.
- Concilier le worker de la PWA avec le worker OneSignal avant activation des
  notifications en production.
- Valider la compatibilité des navigateurs et plateformes cibles avant la mise
  en production.
- Le cache PWA ne contient que les fichiers statiques et `/offline`; aucune
  requête Supabase ou page adhérent n'est mise en cache.
- Compléter tests, observabilité d'erreurs, variables Netlify et guide de
  déploiement.

**Livrable :** notifications testées sur navigateurs ciblés et appareils
mobiles, parcours hors-ligne sans fuite de données privées, CI verte.

## 11. User stories et critères d'acceptation

### Visiteur

- En tant que visiteur, je consulte les pages et événements destinés au public
  sans créer de compte.
- Je peux consulter la page d'accueil, découvrir le Bagad sur sa page de
  présentation et trouver la formation correspondant à chacun des trois
  instruments/pupitres.
- Je ne peux jamais lire les profils, réponses, invitations ni partitions
  privées.
- Un contenu brouillon ou non public n'est ni rendu dans la page ni récupérable
  par un appel direct aux données ou au Storage.

### Membre

- En tant que membre approuvé, je consulte mon espace, les événements et les
  documents autorisés.
- Je consulte le trombinoscope V1 et uniquement ses champs autorisés, sans accéder
  aux coordonnées privées ni au profil complet des autres membres.
- Je crée ou modifie ma propre réponse de présence sans pouvoir répondre à la
  place d'une autre personne.
- Je modifie uniquement les champs de mon profil autorisés par la décision
  produit; je ne peux jamais changer mon rôle ni mon pupitre.
- En tant que compte `pending` ou `suspended`, je ne peux accéder aux données
  ni aux actions métier réservées aux comptes actifs.

### Chef de pupitre

- En tant que chef, je ne gère que les événements, partitions et notifications
  de mon unique pupitre.
- Je peux modifier/supprimer un événement de mon pupitre même si je ne l'ai pas
  créé ; une requête directe visant un autre pupitre, un événement
  multi-pupitres ou global est refusée.

### Secrétaire et administrateur

- La secrétaire gère les fonctions listées dans le brief, sans recevoir des
  droits implicites d'admin.
- L'administrateur gère les opérations globales.
- Tout changement de rôle, approbation ou envoi de notification est vérifié
  côté serveur et tracé selon les règles de journalisation.

## 12. Définition de terminé

Une livraison développeur doit fournir :

1. une implémentation conforme aux exigences décidées, sans comportements
   inventés pour les questions ouvertes;
2. les migrations et policies RLS nécessaires, avec tests de policies;
3. des tests des cas heureux, des entrées invalides, des refus d'accès et des
   cas de confidentialité concernés;
4. une interface française, mobile first et accessible, conforme aux règles
   Svelte 5 et Tailwind de `AGENTS.md`;
5. les documents de conception mis à jour en cas de changement de route,
   schéma, visibilité, stockage ou notification;
6. les vérifications `npm run check`, `npm run lint` et `npm run build`
   exécutées. Les erreurs préexistantes doivent être distinguées des erreurs
   introduites par le changement.

## 13. Questions bloquantes

Les questions encore ouvertes dans [`docs/questions.md`](./docs/questions.md)
sont des entrées de travail. Pour chacune, le responsable produit consigne la
réponse, la date et les conséquences sur cette spécification. Le développeur
ne met pas en production le comportement correspondant avant décision.
