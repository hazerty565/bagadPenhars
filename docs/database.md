# Base de données : Neon, Better Auth et accès aux données

> **Plateforme cible validée le 2026-11-05 :** Neon PostgreSQL + Better Auth +
> Cloudflare Pages + Cloudflare R2.

## 1. Environnement Neon

La base PostgreSQL s'appelle `bagadpenhars`. Elle contient deux branches :

| Branche Neon | Usage                                 | Cloudflare                            |
| ------------ | ------------------------------------- | ------------------------------------- |
| `test`       | Développement local, tests et preview | Preview et environnement local        |
| `production` | Données de production                 | Branch Cloudflare Pages de production |

| Contexte              | Connexion                                                    | Secrets                                            |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Développement local   | `.env` avec `DATABASE_URL` direct vers Neon `test`, via `pg` | Fichier local ignoré par Git                       |
| Cloudflare Preview    | Hyperdrive `bagad-dev` vers Neon `test`                      | Secrets configurés dans l'environnement Preview    |
| Cloudflare Production | Hyperdrive `bagad-prod` vers Neon `production`               | Secrets configurés dans l'environnement Production |

Cette matrice décrit la cible de déploiement. Les configurations Hyperdrive et
les secrets doivent être créés dans Cloudflare pour chaque environnement; ni
leurs identifiants ni leurs valeurs ne sont conservés dans le dépôt.
Les chaînes de connexion et secrets ne sont jamais committés. `.env` est
réservé au développement local; un éventuel `.env.production` reste un fichier
local et n'est pas chargé par le déploiement Cloudflare. Les connexions
Cloudflare transitent par Hyperdrive, avec Drizzle comme ORM et **`pg` +
`drizzle-orm/node-postgres`** comme driver (décision Q-2026-11-08-01). Le
driver `drizzle-orm/neon-serverless` n'est pas utilisé, car le WebSocket Neon
n'est pas destiné à fonctionner au-dessus d'Hyperdrive.

## 2. Principes

1. Les rôles et statuts sont lus dans `profiles.role` et
   `profiles.account_status`, jamais dans les métadonnées Better Auth ou le
   navigateur.
   La colonne `profiles.role` utilise l'ENUM PostgreSQL conservé `app_role`;
   `app_role` désigne donc le type des valeurs, pas une colonne distincte.
2. Chaque lecture, modification, téléchargement et suppression sensible est
   autorisée côté serveur avant accès aux données, puis limitée par RLS
   PostgreSQL sur les tables sensibles.
3. Une migration PostgreSQL appliquée ne doit jamais être modifiée; toute
   correction passe par une nouvelle migration additive.
4. Drizzle génère les migrations versionnées sous `drizzle/`, avec les
   métadonnées dans `drizzle/meta/`. La migration initiale doit être nommée de
   façon reproductible par Drizzle. Une migration appliquée n'est jamais modifiée; toute correction
   passe par une nouvelle migration additive.
5. Les migrations sont vérifiées sur `test` avant application sur `production`.
6. Les identifiants SQL restent en anglais et en `snake_case`.

### Défense en profondeur : guards, RLS et Hyperdrive

- Better Auth est l'autorité pour l'identité et les sessions. Après validation
  de la session, SvelteKit charge le profil; `profiles.role` et
  `profiles.account_status` restent les seules autorités métier des rôles et
  statuts.
- Chaque route, action et endpoint sensible applique un guard SvelteKit avant
  l'opération. Le filtrage du menu est une aide d'interface uniquement.
- Les tables contenant des données privées ou des opérations sensibles
  activent RLS avec des politiques explicites pour les opérations nécessaires.
  Les requêtes anonymes ou sans contexte ne doivent pas obtenir de données
  privées.
- Toute opération protégée utilise une transaction. Avant la première requête
  métier, elle établit le contexte d'identité avec un réglage local à la
  transaction, par exemple `select set_config('app.user_id', $1, true)`.
  L'identifiant provient de la session Better Auth validée; il ne vient jamais
  du formulaire ou d'un en-tête client. Toutes les requêtes de l'opération
  utilisent la même transaction et la même connexion. Le paramètre `true`
  évite de laisser un contexte d'utilisateur sur une connexion remise au pool.
- Les politiques RLS lisent ce contexte et résolvent le rôle/statut depuis les
  tables métier; elles ne font pas confiance à un rôle soumis par le client.
- Le rôle PostgreSQL runtime ne doit pas être propriétaire des tables ni
  disposer de `BYPASSRLS`. Les règles doivent être vérifiées avec le rôle
  réellement utilisé par l'application.
- Hyperdrive assure le pooling des connexions. Le cache de requêtes, s'il est
  activé, est réservé aux lectures explicitement publiques et indépendantes de
  l'identité. Les lectures protégées par RLS ne doivent jamais être servies
  depuis un cache partagé entre utilisateurs.
- Vérifier les scénarios sans contexte, membre A puis membre B sur une
  connexion réutilisée, et tentatives d'accès aux lignes d'un autre profil.

## 3. Modèle métier conservé

Les tables conceptuelles suivantes restent valides; leur implémentation Better
Auth/Neon peut ajouter les tables d'identité requises par la bibliothèque.

| Table                       | Rôle                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `profiles`                  | Statut, rôle, identité publique et données privées du membre |
| `pupitres`                  | Bombarde, Caisse claire, Cornemuse, Percussion               |
| `profile_pupitres`          | Affectation membre/pupitre et responsabilité `is_chef`       |
| `bureau_positions`          | Titre honorifique sans droit applicatif                      |
| `invitations`               | Invitation, expiration, auteur et état de consommation       |
| `invitation_pupitres`       | Pupitres pré-attribués à l'invité                            |
| `events`                    | Événements, sondages, type et visibilité indépendants        |
| `event_pupitres`            | Ciblage des événements de pupitre                            |
| `event_responses`           | Réponse présent/absent                                       |
| `documents`                 | Métadonnées des partitions stockées dans R2                  |
| `articles`                  | Contenus éditoriaux publiés ou brouillons                    |
| `albums`                    | Collections de médias publics                                |
| `media`                     | Métadonnées des médias stockés dans R2                       |
| `notification_preferences`  | Préférences de notifications par membre                      |
| `notification_log`          | Historique d'envoi                                           |
| `member_loans`              | Prêts de matériel ou costumes                                |
| `account_deletion_requests` | Demande et traitement de suppression                         |

ENUMs métier :

```sql
account_status: pending, active, suspended
app_role: member, chef_pupitre, secretaire, admin
event_type: sortie, concert, fest-noz, festival, concours, gala, repetition, reunion, repas
event_visibility: public, interne, pupitre
response_status: present, absent
musician_level: skolaj, bagadig, bagad
```

## 4. Better Auth

Better Auth peut maintenir ses propres tables (`user`, `session`, `account`,
`verification`, selon sa configuration). Les identifiants Better Auth sont liés
au profil métier par une clé stable. Le champ d'e-mail vérifié et le statut du
compte ne sont jamais lus depuis des métadonnées modifiables côté client.

- Seule l'application serveur crée les utilisateurs invités.
- Le lien Better Auth expire selon la durée validée dans les questions produit.
- `pending` empêche tout accès métier jusqu'à activation manuelle par la
  secrétaire ou l'admin.
- La suspension révoque les sessions et droits sans supprimer les données ni
  les réponses aux événements.
- Lorsqu'un membre demande la suppression de son compte, son statut passe
  immédiatement à `suspended` et l'administrateur traite la demande. Les données
  personnelles, photos de profil et associations avec les pupitres sont
  supprimées; les réponses conservées à des fins historiques sont anonymisées.
  Les données soumises à une obligation légale sont conservées séparément avec
  un accès restreint. La demande est clôturée après traitement et notification
  au membre. Aucune purge automatique irréversible n'est activée avant
  validation des durées de conservation par l'association.

Les réponses conservées après suppression d'un compte sont anonymisées :
`event_responses.profile_id` doit donc pouvoir devenir nullable avec une
référence `ON DELETE SET NULL`, plutôt que d'effacer la réponse en cascade.
Les règles et la fenêtre de modification des réponses sont détaillées dans
[`event.md`](./event.md) et [`Spec.md`](./Spec.md).

## 5. Cloudflare R2

R2 contient les objets binaires dans deux buckets distincts :

| Bucket          | Contenu                                                |
| --------------- | ------------------------------------------------------ |
| `bagad-public`  | Médias publiés et autres objets explicitement publics  |
| `bagad-private` | Profils, documents, albums privés et fichiers réservés |

La capacité opérationnelle globale est **8 Go**, les deux buckets étant
additionnés dans le même quota. Une alerte administrateur est déclenchée à
**7 Go**; à **8 Go**, les nouveaux téléversements sont bloqués côté serveur.

La table `storage_usage` est une **ligne unique globale** (décision
Q-2026-11-08-02) : `public_bytes`, `private_bytes`, `reserved_bytes`,
`quota_bytes`, `alert_threshold_bytes`, `block_threshold_bytes`,
`last_sync_at` et `updated_at`. Toutes les colonnes d'octets sont en `bigint`
(un `integer` déborde dès 2 Go). Le volume utilisé vaut
`public_bytes + private_bytes`. Chaque réservation, confirmation, suppression
et remplacement met à jour le compteur. Les réservations évitent les dépassements
pendant les uploads simultanés; les suppressions et remplacements restent
atomiques dans la mesure permise par les opérations R2. Une synchronisation
périodique réconcilie les compteurs Neon avec le contenu réel des deux buckets.

- Neon conserve le nom de clé, la taille, le type MIME et les métadonnées.
- Les objets du bucket public ont uniquement une URL publique tant qu'ils restent
  publiés. Les variantes d'affichage sont produites à la volée par Cloudflare
  Image Resizing (Q-2026-11-08-03).
- Les objets privés sont servis par `/api/files/[...key]` après contrôle serveur
  (Q-2026-11-08-04) ; aucune URL signée n'est générée par le binding R2.
- Aucun objet privé n'est placé dans un répertoire public.

## 6. Matrice de droits

La matrice de base reste celle du brief. Les guards et les politiques RLS
doivent tous deux la faire respecter :

| Rôle           | Comptes                     | Événements                     | Contenus        | Documents                      | Notifications         |
| -------------- | --------------------------- | ------------------------------ | --------------- | ------------------------------ | --------------------- |
| `member`       | Profil propre               | Lire/répondre selon visibilité | Lire le public  | Lire tous les documents actifs | Préférences propres   |
| `chef_pupitre` | Aucun                       | Gérer ses pupitres             | Aucun           | Déposer pour ses pupitres      | Notifier ses pupitres |
| `secretaire`   | Inviter, activer, suspendre | Tous les événements            | Articles/albums | Tous les documents autorisés   | Plusieurs pupitres    |
| `admin`        | Tous                        | Tous                           | Tous            | Tous                           | Tous                  |
