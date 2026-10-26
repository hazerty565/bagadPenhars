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
| **admin** | Tout : utilisateurs, rôles, contenus, notifications |
| **secrétaire** | Créer des dates d'agenda, articles, albums photo ; envoyer des notifications OneSignal à plusieurs pupitres ; inviter et valider des comptes |
| **chef de pupitre** | Créer des événements pour son pupitre ; envoyer des partitions PDF ; notifier son pupitre |
| **membre** | Consulter l'agenda et les documents, répondre aux événements, gérer son profil |
| **pending** | Compte créé mais pas encore validé : aucun accès à l'espace adhérents |

Règles :

- Le **rôle** (droits sur le site) est distinct du **titre du bureau** (président, trésorier, secrétaire…). Les titres sont honorifiques, cumulables, et ne donnent aucun droit.
- Un membre appartient à un ou plusieurs **pupitres** : bombarde, cornemuse, caisse claire, percussion.
- Les rôles se lisent toujours dans la base (table des profils), jamais dans les métadonnées de session.

## 2 bis. Décisions de visibilité

- Les membres ne voient pas la liste des autres membres.
- Les titres du bureau ne sont pas affichés publiquement.
- Les documents (partitions) sont visibles par tous les membres, tous pupitres confondus ; seuls le chef de pupitre (son pupitre), la secrétaire et l'admin les déposent.

## 3. Création de compte

Les comptes ne se créent pas librement :

1. Un admin ou une secrétaire envoie une **invitation par email** (nom, prénom, pupitre). Le pupitre n'est pas modifiable par l'invité.
2. L'invité ouvre le lien et **crée son mot de passe**. Sans mot de passe, aucun accès.
3. Le compte passe en **pending**.
4. Un admin ou une secrétaire **valide** : le compte devient **membre**.

## 4. Pages et fonctionnalités

### Public

- **Accueil / présentation** du bagad.
- **Agenda public** : représentations uniquement, en lecture seule.
- **Actualités** (articles).
- **Albums photo** (médias publics).
- **Contacts** : formulaire qui envoie un email. Pas d'annuaire des membres.

### Espace adhérents (connexion requise)

- **Connexion** et **Dashboard** avec profil de l'utilisateur.
- **Agenda privé** : répétitions et événements internes, en plus des représentations.
- **Réponse aux événements** : oui / non / ne sait pas, ou pas de réponse.
- **Sondages de répétition** : chaque membre répond présent / absent / ne sait pas ; un sondage crée automatiquement l'événement d'agenda correspondant.
- **Partitions / documents** : PDF déposés par les chefs de pupitre, visibles selon le pupitre.
- **Notifications** (OneSignal) : envoyées par la secrétaire (plusieurs pupitres) ou un chef de pupitre (son pupitre).

## 5. Contraintes

- **Stack** : SvelteKit 5 (runes), Tailwind, Motion, Supabase, OneSignal, hébergement Netlify.
- **Sécurité** : association privée, données personnelles de membres. RLS sur toutes les tables, validation des droits côté serveur.
- **Langue** : interface en français.
- **Usage** : surtout sur téléphone. Mobile first.
- **Maintenance** : un seul mainteneur. Préférer le simple au sophistiqué.

## 6. Hors périmètre (pour l'instant)

- Annuaire des membres, public ou interne : un membre ne voit pas les autres membres.
- Affichage public des titres du bureau.
- Paiement / cotisations en ligne.
- Inscription libre.

## 7. Questions ouvertes

À trancher avant d'implémenter les points concernés :

- Le site public doit-il être multilingue (fr / en / br) ou seulement en français ?
- Les notifications OneSignal : push navigateur uniquement, ou aussi email ?
- Les albums photo : stockés où (Supabase Storage, Google Drive) ?