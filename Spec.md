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
  consulter l'agenda et les partitions, répondre aux événements, gérer son
  profil et recevoir des notifications ;
- des outils d'administration permettant aux rôles autorisés de gérer les
  comptes, les contenus, l'agenda et les notifications.

L'application est principalement utilisée sur téléphone et doit rester simple
à maintenir par une petite équipe.

Hors périmètre : inscription libre, annuaire des membres (y compris interne),
publication des titres du bureau, paiements ou cotisations en ligne.

## 3. Utilisateurs, rôles et autorisations

Le rôle applicatif détermine les permissions. Un titre au bureau
(président, trésorier, secrétaire, etc.) est une information distincte et ne
confère aucun droit à lui seul.

| Rôle           | Exigences                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pending`      | Peut terminer la création de son compte et consulter le parcours d'attente; aucun accès à l'espace adhérents.               |
| `member`       | Consulte l'agenda et les documents; répond aux événements; gère son propre profil. Ne voit pas la liste des autres membres. |
| `chef_pupitre` | Droits d'un membre; gère les événements, partitions et notifications de son ou ses pupitres autorisés.                      |
| `secretaire`   | Crée les dates d'agenda, articles et albums; invite et valide les comptes; envoie des notifications aux pupitres autorisés. |
| `admin`        | Gère globalement les utilisateurs, rôles, contenus et notifications.                                                        |

Principes obligatoires :

- Un membre peut appartenir à un ou plusieurs pupitres : bombarde, cornemuse,
  caisse claire et percussion.
- Toute autorisation est vérifiée côté serveur et dérivée du rôle et des
  pupitres fiables en base, jamais d'une valeur de rôle fournie par le client
  ou de métadonnées de session modifiables.
- Une action reçoit l'identité de l'acteur depuis la session vérifiée; elle ne
  fait pas confiance à un identifiant d'utilisateur soumis dans le formulaire.
- La secrétaire et les chefs ne peuvent agir que dans le périmètre accordé par
  leur rôle et leurs pupitres. Toute opération globale est réservée à l'admin,
  sauf décision explicite dans le brief.
- Aucun écran ou endpoint ne fournit d'annuaire des membres. Les titres du
  bureau ne sont pas visibles publiquement.

La matrice détaillée des permissions par ressource et l'articulation entre
secrétariat, pupitres multiples et rôles actuellement définis dans le schéma
restent à confirmer dans `docs/questions.md`.

## 4. Exigences fonctionnelles

### 4.1 Site public

- **Accueil (`/`)** : page principale du site, qui présente le Bagad et
  oriente vers ses pages publiques et ses activités.
- **Page Bagad** : présenter le Bagad, son identité, son histoire et son
  activité. Les éléments précis à publier sont à confirmer dans
  `docs/questions.md`.
- **Page Formation** : présenter les formations proposées pour chacun des
  instruments/pupitres : bombarde, cornemuse, caisse claire et percussion.
  Chaque instrument doit avoir une section identifiable et son propre contenu;
  ne pas inventer les détails pédagogiques manquants.
- Afficher les représentations publiques en lecture seule.
- Publier les actualités et les albums photo explicitement destinés au public.
- Proposer un formulaire de contact qui transmet le message par email.
- Ne jamais exposer les profils privés, les coordonnées des membres, les
  partitions privées ni les titres du bureau.
- La langue du site public reste à décider. Ne pas ajouter ou retirer une
  langue sans décision consignée dans `docs/questions.md`.

**Critères d'acceptation des pages publiques :**

- La navigation permet d'atteindre l'accueil, la présentation du Bagad et la
  page Formation.
- La page Formation présente séparément les quatre instruments/pupitres
  ci-dessus, avec un contenu éditorial fourni ou validé par l'association.
- Ces pages sont consultables sans compte et ne révèlent aucune information
  privée sur les membres ou les titres du bureau.

### 4.2 Invitations et validation des comptes

1. Une personne autorisée envoie une invitation par email en renseignant
   l'identité nécessaire et le ou les pupitres.
2. Le lien permet à son destinataire de définir un mot de passe; il ne donne
   pas accès au dashboard avant cette étape et la validation requise.
3. Le compte est créé avec le rôle `pending`.
4. Un admin ou une secrétaire valide le compte, qui obtient le rôle `member`.
5. Le pupitre attribué n'est pas modifiable par l'invité.
6. Une invitation doit être à usage unique, expirer et ne pas stocker son
   secret en clair.

Le détail de l'expiration, de la révocation et du renvoi d'invitation doit être
défini lors de l'implémentation. Les opérations doivent être auditées lorsque
le modèle de données le permet.

### 4.3 Espace adhérents

- Toutes les pages et actions privées exigent une session valide et un rôle
  approuvé.
- Le dashboard montre les informations du profil connecté, sans exposer une
  liste de membres.
- Chaque membre ne modifie que son propre profil et sa propre réponse de
  présence.
- Les rôles et pupitres sont modifiés uniquement par les actions
  d'administration autorisées.

### 4.4 Agenda, présences et sondages

- L'agenda public expose uniquement les représentations sélectionnées pour
  publication; il est en lecture seule.
- L'agenda privé comprend les répétitions et événements internes ainsi que les
  représentations.
- Les réponses possibles sont présent, absent, ne sait pas ou aucune réponse.
- L'identité de la personne qui répond vient de la session serveur.
- Les sondages de répétition permettent de recueillir la disponibilité des
  membres et créent l'événement d'agenda correspondant selon le flux métier
  défini par le produit.
- La création et la modification d'événements respectent le rôle et le
  périmètre du pupitre; leur visibilité publique est explicite, jamais
  implicite.

### 4.5 Documents et médias

- Les partitions sont des PDF privés, accessibles à tous les membres approuvés
  selon le brief actuel, quel que soit leur pupitre.
- Le dépôt d'une partition est réservé aux chefs de pupitre pour leur
  périmètre, à la secrétaire et à l'admin.
- Les fichiers ne sont pas servis depuis une URL publique non protégée.
  L'accès au téléchargement vérifie l'identité et les autorisations côté
  serveur avant de lire le stockage.
- Les photos et albums destinés au public sont explicitement publiés; les
  fichiers non publics restent protégés.
- Tous les fichiers sont stockés dans Supabase Storage, dans des buckets
  privés ou publics uniquement selon les règles de visibilité décidées. Les
  policies de `storage.objects` font partie de la livraison.

### 4.6 Notifications

- La secrétaire peut notifier plusieurs pupitres, selon les droits accordés.
- Un chef de pupitre ne peut notifier que son périmètre.
- L'admin peut gérer globalement les notifications.
- OneSignal est le fournisseur prévu; sa clé REST reste exclusivement côté
  serveur.
- Le canal (push seul ou push et email), les préférences d'abonnement et les
  règles de ciblage restent à confirmer avant l'implémentation.

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

- Svelte 5 : utiliser `$state`, `$derived`, `$effect` et `$props`; ne pas
  introduire `export let`, `$:` ou `on:click`.
- Interface en français, mobile first, accessible au clavier et avec focus
  visible; respecter `prefers-reduced-motion`.
- Utiliser les composants, schémas de validation et conventions déjà présents
  lorsque ceux-ci sont compatibles avec le brief.
- Garder les accès base, stockage, emails et services tiers dans des modules
  serveur.
- Toute évolution de schéma se fait par une nouvelle migration; une migration
  déjà appliquée ne se modifie pas.
- Toute modification du manifest ou du service worker doit être répercutée
  dans `docs/Pwa.MD` (nom actuel du fichier dans le dépôt).
- Les accès métier utilisent exclusivement Supabase; Netlify est réservé à
  l'hébergement et OneSignal aux notifications push.
- Documenter les décisions et écarts au brief au lieu de masquer un état
  incomplet derrière une implémentation partielle.

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
   `docs/Pwa.MD`) sont mis à jour;
8. les vérifications `npm run check`, `npm run lint` et `npm run build`
   passent, ou les échecs préexistants et non liés sont signalés clairement.

## 8. Questions de conception

Les décisions suivantes ne doivent pas être supposées par les développeurs :

- les détails d'intégration Supabase SSR et de renouvellement de session;
- les policies RLS précises et leur couverture des buckets Supabase Storage;
- langue(s) du site public;
- canaux et règles de consentement des notifications;
- matrice exacte des droits de la secrétaire et des comptes ayant plusieurs
  pupitres.

Consigner toute nouvelle ambiguïté ou décision dans
[`docs/questions.md`](./docs/questions.md), puis synchroniser cette
spécification une fois la décision prise.

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
- La seule migration métier est `migrations/001_initial_schema.sql`. Elle
  référence les tables de Better Auth et n'active pas RLS.
- Au moment de cette lecture, il n'y a pas de dossier `supabase/`, de
  migration Supabase, de fichier `.env.example` ni de dépendance Supabase dans
  `package.json`. Le dépôt contient encore Better Auth, `pg`, Kysely et
  Netlify Blobs.
- `src/routes/` comprend des écrans d'agenda, d'articles, d'invitations,
  d'administration, de documents et de notifications. Il n'y a pas de routes
  dédiées aux sondages dans l'arborescence lue.
- La présence de tests dans certains répertoires ne signifie pas que tous les
  scénarios produit ou les règles d'autorisation sont couverts.

Le périmètre demandé est la cible Supabase décrite plus haut. Le développeur
doit confirmer cet état avec le dépôt au début de l'implémentation et ne pas
appliquer la migration historique comme schéma Supabase.

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
- Avant toute importation, faire confirmer s'il existe des données ou comptes
  à conserver. Ne jamais supprimer ni importer de données sans décision.

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
anonymes et les comptes `pending`; les tests démontrent les refus et accès
autorisés.

### Étape C — Invitations, profils et membres

- Mettre en place les invitations email à usage unique, expirantes et dont le
  jeton n'est stocké qu'empreinté.
- Créer le profil `pending` après acceptation; l'invité ne choisit ni son rôle
  ni ses pupitres.
- Permettre aux rôles autorisés d'approuver un compte selon les décisions de
  `docs/questions.md`.
- Permettre à un membre de modifier uniquement les champs autorisés de son
  propre profil; ne pas créer d'annuaire.
- Journaliser les changements de rôle et les actions d'administration sans
  enregistrer de secrets.

**Livrable :** tests du cycle invitation → mot de passe → attente → approbation,
incluant jeton invalide, expiré, déjà utilisé et email non concordant.

### Étape D — Agenda, présences et sondages

- Servir au public uniquement les événements explicitement publiés et
  autorisés; l'agenda public est en lecture seule.
- Servir l'agenda privé seulement aux membres approuvés.
- Implémenter création, modification et suppression d'événement selon les
  rôles et périmètres décidés.
- Enregistrer au plus une réponse par membre et événement. L'identité du
  répondant vient de la session; la réponse est modifiable ou supprimable
  uniquement par son propriétaire.
- Implémenter le flux de sondage et sa création d'événement liée après
  clarification des règles métier.
- Valider les dates, fuseaux horaires, heures de fin et événements récurrents.

**Livrable :** tests de visibilité public/privé, permissions par rôle,
propriété des réponses et cas de dates invalides.

### Étape E — Articles, médias, documents et contact

- Séparer contenu brouillon et publié; le public ne lit que le contenu publié.
- Stocker les fichiers dans les buckets Supabase prévus; contrôler type,
  taille, nom et droits avant écriture.
- Servir les partitions depuis un bucket privé avec autorisation serveur et
  RLS; ne jamais exposer une URL publique pour un document privé.
- Publier les albums et médias uniquement après action d'un rôle autorisé.
- Protéger le formulaire de contact contre les entrées invalides et les envois
  abusifs; envoyer uniquement aux destinataires approuvés.

**Livrable :** tests de brouillon/publication, accès aux objets Storage selon
les droits, refus d'upload non autorisé et validation du formulaire.

### Étape F — Notifications, PWA et livraison

- Intégrer OneSignal côté serveur pour l'envoi; les identifiants d'application
  et clés REST ne sont jamais inclus côté client.
- Appliquer les audiences autorisées à chaque envoi; ne pas faire confiance
  aux identifiants de pupitre ou de destinataire soumis par le navigateur.
- Concilier le worker de la PWA avec le worker OneSignal avant activation des
  notifications en production.
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
  présentation et trouver la formation correspondant à chacun des quatre
  instruments/pupitres.
- Je ne peux jamais lire les profils, réponses, invitations ni partitions
  privées.
- Un contenu brouillon ou non public n'est ni rendu dans la page ni récupérable
  par un appel direct aux données ou au Storage.

### Membre

- En tant que membre approuvé, je consulte mon espace, les événements et les
  documents autorisés.
- Je crée ou modifie ma propre réponse de présence sans pouvoir répondre à la
  place d'une autre personne.
- Je modifie mon profil sans pouvoir changer mon rôle ni mes pupitres.
- En tant que compte `pending`, j'accède uniquement au parcours d'attente et
  aux actions nécessaires à l'activation du compte.

### Chef de pupitre

- En tant que chef, je gère uniquement les événements, partitions et
  notifications de mes pupitres, dans les limites validées.
- Une requête directe visant un autre pupitre est refusée, même si l'interface
  masque cette action.

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

Les questions listées dans [`docs/questions.md`](./docs/questions.md) sont des
entrées de travail. Pour chacune, le responsable produit consigne la réponse,
la date et les conséquences sur cette spécification. Le développeur ne met
pas en production le comportement correspondant avant décision.
