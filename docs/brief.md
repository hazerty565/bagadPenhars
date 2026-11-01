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
| **chef de pupitre** | Créer, consulter, modifier et supprimer les événements associés à son ou ses pupitres ; envoyer des partitions PDF ; notifier son pupitre |
| **membre** | Consulter l'agenda et les documents, répondre aux événements, consulter le trombinoscope et gérer son profil |
| **pending** | Compte créé mais pas encore validé : aucun accès à l'espace adhérents |

Règles :

- Le **rôle** (droits sur le site) est indépendant du **titre du bureau** (président, trésorier, secrétaire…). Aucun titre n'attribue automatiquement un rôle applicatif. Les titres sont honorifiques et cumulables ; le président et le trésorier n'ont aucun droit métier au titre de leur fonction.
- L'association compte trois **pupitres** : bombarde, caisse claire et cornemuse. Un membre ou un chef peut être associé à un ou plusieurs pupitres.
- Les rôles se lisent toujours dans la base (table des profils), jamais dans les métadonnées de session.
- Chaque pupitre a son propre chef. Les chefs sont indépendants et ne gèrent que les événements associés à leurs pupitres ; leurs droits ne dépendent pas de l'auteur de l'événement.

## 2 bis. Décisions de visibilité

- Le trombinoscope est réservé aux membres actifs connectés. Il affiche le nom, le prénom, la photo de profil, les pupitres, le niveau musical et l'éventuelle fonction au bureau.
- Les membres ne voient pas les coordonnées privées des autres membres (téléphone, e-mail personnel, adresse postale ou autres données non autorisées). La fonction au bureau est informative et ne confère aucun droit.
- Les titres du bureau ne sont pas affichés publiquement.
- Les documents (partitions) sont visibles par tous les membres, tous pupitres confondus ; seuls le chef de pupitre (son pupitre), la secrétaire et l'admin les déposent.
- Les événements ont un type indépendant de leur visibilité (`public`, `interne` ou `pupitre`). La visibilité est choisie explicitement ; un événement `pupitre` est visible par les membres des pupitres ciblés, la secrétaire et l'admin.
- Supabase Storage sépare les fichiers publics (`bagad-public`) des photos de profil et documents privés (`bagad-private`). Les photos privées sont lisibles par les membres actifs ; chaque membre ne modifie que sa propre photo.

## 3. Création de compte

Les comptes ne se créent pas librement :

1. Un administrateur envoie une **invitation par e-mail** (nom, prénom, pupitre(s)). Le compte Auth est créé immédiatement et le profil applicatif passe en **pending**. Le pupitre n'est pas modifiable par l'invité.
2. Dans l'heure, l'invité ouvre le lien Supabase Auth, confirme son adresse e-mail et **définit son mot de passe**.
3. La confirmation ne valide pas le compte : le profil reste en **pending**, sans accès membre.
4. Un administrateur vérifie que l'adresse e-mail est confirmée puis **valide manuellement** le compte : le statut devient **member**.
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
- **Agenda privé** : événements `interne` et événements `pupitre` accessibles au membre, en plus des événements `public`.
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
