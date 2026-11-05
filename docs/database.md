# Base de données : Neon, Better Auth et accès aux données

> **Plateforme cible validée le 2026-11-05 :** Neon PostgreSQL + Better Auth +
> Cloudflare Pages + Cloudflare R2. Tout schéma, migration ou mécanisme Supabase
> est **OBSOLÈTE — ne plus prendre en compte**.

## 1. Environnement Neon

La base PostgreSQL s'appelle `bagadpenhars`. Elle contient deux branches :

| Branche Neon | Usage | Cloudflare |
|---|---|---|
| `test` | Développement local, tests et preview | Preview et environnement local |
| `production` | Données de production | Branch Cloudflare Pages de production |

Les chaînes de connexion ne sont jamais committées. Une chaîne spécifique à
la branche est injectée dans les variables d'environnement du runtime
Cloudflare. Les connexions PostgreSQL transitent par Cloudflare Hyperdrive,
avec Drizzle comme ORM et le driver Neon adapté au runtime Cloudflare.

## 2. Principes

1. Les rôles et statuts sont lus dans `profiles.role` et
   `profiles.account_status`, jamais dans les métadonnées Better Auth ou le
   navigateur.
   La colonne `profiles.role` utilise l'ENUM PostgreSQL conservé `app_role`;
   `app_role` désigne donc le type des valeurs, pas une colonne distincte.
2. Chaque lecture, modification, téléchargement et suppression sensible est
   autorisée côté serveur avant accès aux données.
3. Une migration PostgreSQL appliquée ne doit jamais être modifiée; toute
   correction passe par une nouvelle migration additive.
4. Drizzle génère les migrations versionnées sous `drizzle/`, avec les
   métadonnées dans `drizzle/meta/`. La migration initiale doit être nommée de
   façon reproductible par Drizzle et ne contenait aucune migration Supabase
   historique. Une migration appliquée n'est jamais modifiée; toute correction
   passe par une nouvelle migration additive.
5. Les migrations sont vérifiées sur `test` avant application sur `production`.
6. Les identifiants SQL restent en anglais et en `snake_case`.

## 3. Modèle métier conservé

Les tables conceptuelles suivantes restent valides; leur implémentation Better
Auth/Neon peut ajouter les tables d'identité requises par la bibliothèque.

| Table | Rôle |
|---|---|
| `profiles` | Statut, rôle, identité publique et données privées du membre |
| `pupitres` | Bombarde, Caisse claire, Cornemuse, Percussion |
| `profile_pupitres` | Affectation membre/pupitre et responsabilité `is_chef` |
| `bureau_positions` | Titre honorifique sans droit applicatif |
| `invitations` | Invitation, expiration, auteur et état de consommation |
| `invitation_pupitres` | Pupitres pré-attribués à l'invité |
| `events` | Événements, sondages, type et visibilité indépendants |
| `event_pupitres` | Ciblage des événements de pupitre |
| `event_responses` | Réponse présent/absent |
| `documents` | Métadonnées des partitions stockées dans R2 |
| `articles` | Contenus éditoriaux publiés ou brouillons |
| `albums` | Collections de médias publics |
| `media` | Métadonnées des médias stockés dans R2 |
| `notification_preferences` | Préférences de notifications par membre |
| `notification_log` | Historique d'envoi |
| `member_loans` | Prêts de matériel ou costumes |
| `account_deletion_requests` | Demande et traitement de suppression |

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
- La suspension révoque les sessions et droits sans supprimer les données.
- La suppression, réservée à la secrétaire et à l'admin, supprime ou anonymise
  les données associées conformément aux décisions validées.

## 5. Cloudflare R2

R2 contient les objets binaires dans deux buckets distincts :

| Bucket | Contenu |
|---|---|
| `bagad-public` | Médias publiés et autres objets explicitement publics |
| `bagad-private` | Profils, documents, albums privés et fichiers réservés |

La capacité opérationnelle globale est **8 Go**, les deux buckets étant
additionnés dans le même quota. Une alerte administrateur est déclenchée à
**7 Go**; à **8 Go**, les nouveaux téléversements sont bloqués côté serveur.

La table `storage_usage` conserve `public_bytes`, `private_bytes`,
`reserved_bytes` et `updated_at`. Chaque réservation, confirmation, suppression
et remplacement met à jour le compteur. Les réservations évitent les dépassements
pendant les uploads simultanés; les suppressions et remplacements restent
atomiques dans la mesure permise par les opérations R2. Une synchronisation
périodique réconcilie les compteurs Neon avec le contenu réel des deux buckets.

- Neon conserve le nom de clé, la taille, le type MIME et les métadonnées.
- Les objets du bucket public ont uniquement une URL publique tant qu'ils restent
  publiés.
- Les objets privés sont servis par un endpoint SvelteKit servant de garde.
- Les URLs signées temporaires sont privilégiées si le workflow Better Auth/
  Cloudflare le permet.
- Aucun objet privé n'est placé dans un répertoire public.

## 6. Matrice de droits

La matrice de base reste celle du brief :

| Rôle | Comptes | Événements | Contenus | Documents | Notifications |
|---|---|---|---|---|---|
| `member` | Profil propre | Lire/répondre selon visibilité | Lire le public | Lire tous les documents actifs | Préférences propres |
| `chef_pupitre` | Aucun | Gérer ses pupitres | Aucun | Déposer pour ses pupitres | Notifier ses pupitres |
| `secretaire` | Inviter, activer, suspendre | Tous les événements | Articles/albums | Tous les documents autorisés | Plusieurs pupitres |
| `admin` | Tous | Tous | Tous | Tous | Tous |

## 7. Références obsolètes

Les migrations, policies, buckets et imports Supabase antérieurs ne sont pas
des sources de vérité. Toute documentation historique mentionnant Supabase doit
être conservée uniquement comme **NOTICE d'obsolescence**, et aucune migration
historique ne doit être appliquée à Neon.
