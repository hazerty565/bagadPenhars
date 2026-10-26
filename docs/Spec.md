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

- Présenter le Bagad et ses activités.
- Afficher les représentations publiques en lecture seule.
- Publier les actualités et les albums photo explicitement destinés au public.
- Proposer un formulaire de contact qui transmet le message par email.
- Ne jamais exposer les profils privés, les coordonnées des membres, les
  partitions privées ni les titres du bureau.
- La langue du site public reste à décider. Ne pas ajouter ou retirer une
  langue sans décision consignée dans `docs/questions.md`.

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
- Le fournisseur et les règles de conservation du stockage médias doivent
  être décidés avant de coder le flux correspondant.

### 4.6 Notifications

- La secrétaire peut notifier plusieurs pupitres, selon les droits accordés.
- Un chef de pupitre ne peut notifier que son périmètre.
- L'admin peut gérer globalement les notifications.
- Toute clé de service ou clé REST reste exclusivement côté serveur.
- Le canal (push seul ou push et email), les préférences d'abonnement et le
  fournisseur doivent être confirmés avant l'implémentation.

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
- canaux de notification;
- matrice exacte des droits de la secrétaire et des comptes ayant plusieurs
  pupitres.

Consigner toute nouvelle ambiguïté ou décision dans
[`docs/questions.md`](./docs/questions.md), puis synchroniser cette
spécification une fois la décision prise.
