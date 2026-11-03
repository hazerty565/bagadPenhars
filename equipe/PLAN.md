# Plan de réalisation — Bagad Penhars

## 1. Besoin reformulé

Réaliser un site mobile-first pour présenter le Bagad Penhars en français, anglais et breton, publier ses actualités, ses albums et son agenda public, et recevoir les messages par Netlify Forms. Fournir en français un espace adhérents sur invitation avec agenda, présences, partitions, trombinoscope, profils et notifications, ainsi que des outils d'administration, le tout protégé selon les rôles et les pupitres.

## 2. Décisions techniques

- **Langage et framework : TypeScript avec SvelteKit 5 (runes).** C'est la stack déjà retenue par le projet et elle couvre les pages publiques, les actions serveur et l'espace adhérents.
- **Interface : Tailwind CSS et Motion, mobile-first.** Ces choix suivent la stack et l'usage majoritairement sur téléphone ; les pages doivent rester accessibles et adaptées aux petits écrans.
- **Données et identité : Supabase Auth, PostgreSQL avec RLS et Supabase Storage.** Supabase est l'unique fournisseur de données ; l'accès doit être protégé en base et revérifié côté serveur.
- **Déploiement : Netlify.** Utiliser les fonctions et formulaires Netlify déjà prévus, notamment pour le contact.
- **Notifications : OneSignal, push uniquement en V1.** Les secrets restent côté serveur ; l'audience et les préférences sont vérifiées avant envoi.
- **Organisation : conserver les conventions présentes** — routes dans `src/routes/`, composants et logique partagés dans `src/lib/`, migrations dans `supabase/migrations/`, tests dans `tests/` et tests SQL de politiques dans `supabase/tests/`. Les responsabilités déjà identifiées dans `src/lib/auth/`, `src/lib/server/`, `src/lib/schemas/` et `src/lib/types/` évitent de mélanger accès aux données, règles métier et présentation.

## 3. Travail en étapes livrables

### Étape 1 — Socle Supabase et sécurité des données

Examiner la migration 005 et le schéma cible, configurer les environnements distincts de développement, preview et production sans secrets dans le dépôt, puis établir l'application reproductible des migrations sur une base vierge. Vérifier RLS sur toutes les tables et Storage, ainsi que les règles des buckets publics et privés.

**Livrable/test :** une base Supabase vierge peut être initialisée selon la procédure documentée ; des tests de politiques couvrent les accès anonyme, membre actif, chef, secrétaire et admin, y compris les refus et les objets privés. Ne pas supposer que la migration a déjà été appliquée sur un environnement partagé.

### Étape 2 — Authentification, sessions et autorisations serveur

Intégrer Supabase Auth SSR et les sessions dans le hook et les types serveur ; centraliser les rôles et guards. Protéger les layouts, actions, endpoints et téléchargements. Lire rôle et statut depuis les profils en base, jamais depuis des métadonnées fournies par le client.

**Livrable/test :** connexion, déconnexion et récupération/réinitialisation de mot de passe fonctionnent ; les parcours privés refusent anonymes, comptes `pending` et `suspended`, et les tests prouvent que les contrôles côté serveur s'appliquent même en appel direct.

### Étape 3 — Invitations, membres, profils et trombinoscope

Réaliser le cycle invitation par la secrétaire ou l'admin, confirmation d'adresse, définition du mot de passe et activation manuelle sans changement automatique du rôle. Permettre l'édition par un membre de ses propres champs autorisés ; réserver la gestion des pupitres à la secrétaire et à l'admin, et l'attribution des rôles supérieurs à l'admin. Livrer le trombinoscope V1 avec uniquement les champs autorisés et les avatars privés.

**Livrable/test :** tests du cycle invitation couvrant invitation expirée/renvoyée, adresse non confirmée et activation ; tests prouvant qu'un membre ne peut changer ni son rôle ni ses pupitres, lire les coordonnées privées d'autrui ou modifier l'avatar d'autrui. Seuls la secrétaire et l'admin peuvent suspendre ou supprimer un compte ; tester ces permissions et les suppressions de données associées. La vue et l'accès avatar sont prêts pour la première mise en production.

### Étape 4 — Site public, contenus éditoriaux et contact

Compléter les pages d'accueil, Bagad, Formation, Agenda, Médias, Partenaires et Articles avec les contenus validés par le bureau. Mettre en place les traductions publiques `fr`, `en`, `br`, les métadonnées SEO, URL canoniques, sitemap et robots.txt sans exposer de routes privées. Connecter le formulaire à Netlify Forms, sans pièces jointes.

**Livrable/test :** pages publiques utilisables sans compte et adaptées au mobile ; tests ou vérifications ciblées confirment les trois langues, l'absence de contenus non publiés dans les pages/sitemap, et l'envoi du formulaire avec confirmation.

### Étape 5 — Agenda, événements, présences et sondages

Implémenter agenda public et adhérent, création/modification/suppression selon le rôle et la cible, et réponses `present`/`absent`. Un sondage est un événement (`is_poll`), pas une ressource distincte. Garder `event_type` indépendant de `visibility`, avec les neuf types définis ; appliquer `Europe/Paris` et ne pas ajouter de récurrence en V1.

**Livrable/test :** tests couvrant visibilité publique/interne/pupitre, ciblage unique des événements de chef, gestion indépendante de l'auteur, droits secrétaire/admin, réponses de leur propriétaire et refus hors pupitre. À la date passée de l'événement, celui-ci est clos et ses données peuvent être supprimées ; tester cette clôture et la suppression correspondante. Les membres des autres pupitres ne voient ni ne peuvent répondre à un événement ciblé.

### Étape 6 — Documents, albums et fichiers

Gérer les partitions PDF privées, accessibles en lecture à tous les membres actifs ; limiter le dépôt aux chefs dans leur périmètre, à la secrétaire et à l'admin. Gérer les albums avec prévisualisation et publication réservée à la secrétaire et à l'admin. Accepter les photos JPG/JPEG source jusqu'à 20 Mo, les convertir en WebP, refuser les vidéos et garder les avatars dans le bucket privé.

**Livrable/test :** tests d'accès direct aux fichiers, d'upload autorisé/refusé, de séparation public/privé et de publication des albums ; aucun document privé n'est téléchargeable par URL publique permanente.

### Étape 7 — Notifications et PWA

Intégrer les notifications push OneSignal, l'envoi automatique lors de la création d'un événement, les audiences et préférences membre (globales, événements et rappels). Déterminer et valider une configuration compatible entre le service worker de l'application et celui de OneSignal avant activation en production.

**Livrable/test :** tests d'audience et de préférences, clés exclusivement côté serveur, essais sur les navigateurs et plateformes ciblés. Le cache PWA ne contient que les ressources statiques et la page hors ligne ; aucune page privée ni requête Supabase n'est mise en cache.

### Étape 8 — Intégration, validation et mise en production

Relier les parcours complets, vérifier les paramètres Netlify/Supabase/OneSignal par environnement, compléter les tests et la documentation technique liée aux changements. Ne pas mettre en place de journal d'audit pour le moment ; les suppressions de comptes et de données associées suivent les décisions validées.

**Livrable/test :** parcours visiteur et adhérent vérifiés ; `check`, lint, build et tests du projet passent, ou les problèmes préexistants sont distingués ; déploiement de preview validé sans fuite de données privées ni secret dans le dépôt.

## 4. Règles à respecter

- Une information non fournie ou une décision encore ouverte ne se devine pas : la consigner et demander validation avant d'implémenter le comportement concerné.
- Distinguer strictement rôle applicatif (`member`, `chef_pupitre`, `secretaire`, `admin`) et statut (`pending`, `active`, `suspended`) ; aucun titre du bureau ne confère de droit.
- Vérifier chaque autorisation côté serveur et par RLS ; ne jamais faire confiance au rôle, à l'identifiant d'acteur, à l'audience ou au pupitre transmis par le client.
- Un chef peut diriger plusieurs pupitres, mais chaque pupitre a au plus un chef ; Percussion est indépendant de Caisse claire. Un chef ne cible qu'un seul pupitre qu'il dirige et peut gérer l'événement de ce pupitre quel qu'en soit l'auteur.
- Secrétaire et admin gèrent les événements globaux et multi-pupitres ; la secrétaire n'obtient pas les droits globaux de l'admin.
- Le trombinoscope est obligatoire dès la V1 et ne révèle que nom, prénom, photo, pupitres, niveau musical et éventuelle fonction au bureau ; jamais de coordonnées privées.
- Les membres actifs lisent toutes les partitions, mais les dépôts sont réservés aux rôles autorisés. Les fichiers privés ne sont jamais rendus publics pour simplifier leur accès.
- Un événement `public`, `interne` ou `pupitre` suit sa visibilité indépendamment de son type ; les événements `pupitre` sont invisibles et non répondables pour les autres pupitres.
- Aucun compte ne s'inscrit librement. La confirmation d'adresse ne vaut pas activation ; l'activation ne change pas le rôle. La secrétaire et l'admin peuvent inviter et activer.
- Le membre ne peut changer ni son rôle ni ses pupitres ; il ne peut modifier que sa propre réponse de présence, sans la supprimer directement. Les réponses peuvent être supprimées lors de la clôture d'un événement après sa date, ainsi qu'avec les données associées à la suspension ou à la suppression d'un compte.
- Seuls la secrétaire et l'admin peuvent suspendre ou supprimer un compte. Les réponses de présence et journaux liés au compte peuvent être supprimés ; aucun journal d'audit n'est à mettre en place pour le moment.
- Les contenus publics doivent être explicitement publiés et validés ; sitemap, référencement et médias publics ne comprennent jamais de données privées. Les titres du bureau ne sont jamais affichés publiquement.
- V1 : pas de récurrence d'événements, pas de vidéo, pas de paiement, pas d'inscription libre ; le contact relève de Netlify Forms.
- Préserver les données et le travail existants : ne jamais modifier une migration déjà appliquée ni écraser des changements non liés ; ajouter une migration si un environnement partagé nécessite une évolution.
- Garder les espaces privés hors cache PWA, ne jamais inclure de secret dans le client ou le dépôt, et maintenir la documentation directement liée au schéma et aux flux.

## 5. Critères de fin par étape

Les critères de fin sont indiqués sous chaque étape : chaque étape doit réussir ses tests ciblés et laisser son livrable utilisable avant de commencer l'étape dépendante. La livraison globale est terminée lorsque les huit étapes sont validées et que les contrôles `check`, lint, build et tests réussissent.
