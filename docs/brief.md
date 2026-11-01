# Brief : site Bagad Penhars

> Document de référence du besoin. À lire avant toute fonctionnalité.
> Si un point est flou ou manquant, ne pas deviner : l'écrire dans `docs/questions.md`.

## 1. Objectif

Un site pour l'association Bagad Penhars (Quimper) avec deux faces :

- **Site public** : présenter le bagad, ses représentations, ses actualités, permettre de le contacter.
- **Espace adhérents** (privé, sur invitation) : agenda des répétitions, réponses de présence, partitions, notifications.

Ordre de grandeur : environ 200 utilisateurs. Un site simple, fiable, facile à maintenir par une seule personne.

## 2. Utilisateurs et rôles

| Rôle | Droits |
|---|---|
| **admin** | Tout : utilisateurs, rôles, contenus, notifications ; inviter et valider les comptes |
| **secrétaire** | Gérer tous les événements, articles et albums photo ; envoyer des notifications OneSignal à plusieurs pupitres |
| **chef de pupitre** | Créer, modifier et supprimer les événements de son pupitre uniquement ; consulter l'agenda selon la visibilité ; envoyer des partitions PDF ; notifier son pupitre |
| **membre** | Consulter l'agenda et les documents, répondre aux événements, consulter le trombinoscope et gérer son profil |

Le statut du compte est indépendant du rôle applicatif :

| Statut | Signification |
|---|---|
| `pending` | Compte créé sur invitation, en attente d'activation |
| `active` | Compte autorisé à utiliser l'application selon son rôle |
| `suspended` | Compte temporairement désactivé sans suppression de ses données |

Règles :

- Le **rôle** (droits sur le site) est indépendant du **titre du bureau** (président, trésorier, secrétaire…). Aucun titre n'attribue automatiquement un rôle applicatif. Les titres sont honorifiques et cumulables ; le président et le trésorier n'ont aucun droit métier au titre de leur fonction.
- Les pupitres sont Bombarde, Caisse claire, Cornemuse et Percussion. Un membre Percussion appartient aussi à Caisse claire sans dupliquer l'affectation. Chaque pupitre a son propre chef, qui ne gère que ce pupitre.
- Les rôles se lisent toujours dans la base (table des profils), jamais dans les métadonnées de session.
- Les chefs sont indépendants et ne gèrent que les événements associés à leur pupitre ; leurs droits ne dépendent pas de l'auteur de l'événement. Un événement ciblant plusieurs pupitres ou tous les pupitres est exclusivement géré par la secrétaire ou l'admin.

## 2 bis. Décisions de visibilité

- Le trombinoscope est une fonctionnalité obligatoire de la V1, opérationnelle à la première mise en production et réservée aux membres actifs connectés. Il affiche le nom, le prénom, la photo de profil, les pupitres, le niveau musical et l'éventuelle fonction au bureau.
- Les membres ne voient pas les coordonnées privées des autres membres (téléphone, e-mail personnel, adresse postale ou autres données non autorisées). La fonction au bureau est informative et ne confère aucun droit.
- Les titres du bureau ne sont pas affichés publiquement.
- Les documents (partitions) sont visibles par tous les membres, tous pupitres confondus ; seuls le chef de pupitre (son pupitre), la secrétaire et l'admin les déposent.
- Les types d'événement sont `sortie`, `concert`, `fest-noz`, `festival`, `concours`, `gala`, `repetition`, `reunion` et `repas`. La visibilité (`public`, `interne` ou `pupitre`) est indépendante du type : une répétition peut avoir l'une des trois visibilités. Un chef crée un événement `pupitre` ciblé sur son pupitre ; les membres des autres pupitres ne le voient pas et ne peuvent pas y répondre.
- Supabase Storage sépare les fichiers publics (`bagad-public`) des photos de profil et documents privés (`bagad-private`). Les photos privées sont lisibles par les membres actifs ; chaque membre ne modifie que sa propre photo.

## 3. Création de compte

Les comptes ne se créent pas librement :

1. Un administrateur envoie une **invitation par e-mail** (nom, prénom, pupitre(s)). Le compte Auth est créé immédiatement avec `account_status = pending` et le rôle applicatif initial `member`. Le pupitre n'est pas modifiable par l'invité.
2. Dans l'heure, l'invité ouvre le lien Supabase Auth, confirme son adresse e-mail et **définit son mot de passe**.
3. La confirmation ne valide pas le compte : `account_status` reste `pending`, sans accès membre.
4. Un administrateur vérifie que l'adresse e-mail est confirmée puis **active manuellement** le compte : `account_status` devient `active`, le rôle reste indépendant.
5. Si le lien expire, l'administrateur peut renvoyer une invitation au compte Auth existant.

## 4. Pages et fonctionnalités

### Public

- **Accueil / présentation** du bagad.
- **Agenda public** : événements `public` en lecture seule.
- **Actualités** (articles).
- **Albums photo** (médias publics).
- **Contacts** : formulaire qui envoie un email. Aucun trombinoscope n'est public.
- **Référencement naturel (SEO)** : rendre les pages et contenus publics
  découvrables par les moteurs de recherche, avec des métadonnées adaptées et
  sans exposer ni faire indexer l'espace privé.

### Espace adhérents (connexion requise)

- **Connexion** et **Dashboard** avec profil de l'utilisateur.
- **Agenda** : événements `public` visibles par tous, événements `interne`
  visibles par tous les membres actifs, et événements `pupitre` visibles par
  les membres actifs des pupitres ciblés. Les membres concernés peuvent répondre.
- **Réponse aux événements** : présent / absent (ou pas de réponse).
- **Sondages de répétition** : chaque membre répond présent / absent ; le sondage est directement l'événement d'agenda.
- **Trombinoscope** : consultation des informations explicitement autorisées pour les membres actifs connectés.
- **Partitions / documents** : PDF déposés par les chefs de pupitre, visibles selon les règles de documents.
- **Notifications push** (OneSignal, première version uniquement) : envoyées par la secrétaire (plusieurs pupitres) ou un chef de pupitre (son pupitre).

## 5. Contraintes

- **Stack** : SvelteKit 5 (runes), Tailwind, Motion, Supabase, OneSignal, hébergement Netlify.
- **Sécurité** : association privée, données personnelles de membres. RLS sur toutes les tables, validation des droits côté serveur.
- **Langue** : site public disponible en français, anglais et breton (`fr`, `en`, `br`) ; espace adhérents et authentification en français.
- **Usage** : surtout sur téléphone. Mobile first.
- **Maintenance** : un seul mainteneur. Préférer le simple au sophistiqué.

## 6. Hors périmètre (pour l'instant)

- Annuaire public des membres et exposition publique des profils.
- Le trombinoscope interne est limité aux champs autorisés au §2 bis.
- Affichage public des titres du bureau.
- Paiement / cotisations en ligne.
- Inscription libre.
