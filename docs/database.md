# Base de données : schéma, rôles et RLS

> Source de vérité : les migrations `supabase/migrations/NNN_*.sql`.  
> Ce document les résume. Toute modification du schéma met à jour ce fichier **dans le même commit**.

Le schéma de départ est défini intégralement par
`supabase/migrations/005_bagadPenhars_final.sql`. C'est une migration autonome
destinée à un projet Supabase vierge. Les migrations historiques 001–004 sont
archivées dans `supabase/deprecated_migrations/` et ne doivent pas être appliquées.
Un projet ayant déjà exécuté ces anciennes migrations nécessite une stratégie de
réconciliation distincte avant tout déploiement.

Les décisions métier validées le 1 novembre 2026 ci-dessous décrivent la cible
fonctionnelle à documenter. Elles ne sont pas toutes implémentées dans la
migration 005. Cette migration reste la source de vérité du schéma actuellement
versionné ; aucune nouvelle migration ne doit être écrite avant revue de
l'architecture SQL et de la compatibilité des données existantes.

## 1. Principes

1. **RLS activée sur toutes les tables du schéma `public`, sans exception**, y compris les tables publiques (agenda, articles). Une table publique a une policy de lecture explicite, filtrée sur une colonne (`visibility`, `published`).
2. Sans policy, personne n'a accès : c'est le point de départ.
3. Jamais de `using (true)` sans commentaire qui justifie.
4. Les rôles se lisent dans `public.profiles.role`, **jamais** dans `user_metadata` (modifiable par l'utilisateur).
5. La clé `service_role` n'est utilisée que côté serveur (`+server.ts`, `+page.server.ts`), jamais exposée au client.
6. Une migration appliquée n'est jamais modifiée : on en ajoute une nouvelle.
7. Identifiants SQL en anglais, `snake_case`, pluriel pour les tables.

## 2. Types

```sql
create type app_role as enum ('pending', 'member', 'chef_pupitre', 'secretaire', 'admin');
create type event_visibility as enum ('public', 'pupitre', 'interne');
create type response_status as enum ('present', 'absent');
create type musician_level as enum ('skolaj', 'bagadig', 'bagad');
```

La migration 005 utilise l'ordre `public`, `pupitre`, `interne` pour
`event_visibility`. La cible validée conserve ces trois valeurs (l'ordre
souhaité dans la définition cible est `public`, `interne`, `pupitre`). Les types
d'événement sont distincts de cette visibilité ; leur référentiel cible est
décrit au §12.

Niveaux utilisés par `my_role_level()` :


| Rôle          | Niveau |
| ------------- | ------ |
| pending       | 0      |
| member        | 1      |
| chef\_pupitre | 2      |
| secretaire    | 3      |
| admin         | 4      |


Un niveau plus haut englobe les droits des niveaux plus bas. Si un droit ne suit pas cette échelle, tester le rôle explicitement plutôt que le niveau.

## 3. Fonctions d'aide

Elles sont `security definer` avec `search_path` vide, pour **éviter la récursion RLS** sur `profiles` (déjà rencontrée sur ce projet) et empêcher toute attaque par détournement de `search_path` (search\_path hijacking).

```sql
create function public.my_role_level() returns int
language sql stable security definer set search_path = '' as $$
  select case p.role
    when 'pending' then 0 when 'member' then 1 when 'chef_pupitre' then 2
    when 'secretaire' then 3 when 'admin' then 4 end
  from public.profiles p
  where p.id = (select auth.uid())
$$;

create function public.my_pupitre_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select pp.pupitre_id from public.profile_pupitres pp
  where pp.profile_id = (select auth.uid())
$$;
```

Un utilisateur sans profil obtient `null` : toute comparaison `>= n` est fausse, donc refus.

La migration 005 ajoute `can_access_event(uuid)` et
`can_manage_pupitre_event(uuid)`, fonctions `security definer` à
`search_path` vide utilisées par les policies des événements et de leurs
liaisons pour vérifier les audiences sans récursion RLS. Les chefs gèrent leurs
événements ciblés via les RPC atomiques `create_pupitre_event`,
`update_pupitre_event` et `delete_pupitre_event`.

## 4. Tables


| Table                       | Rôle                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                  | Un profil par utilisateur (`id` = `auth.users.id`), nom, prénom, pseudo, date de naissance, téléphone, `musician_level`, `costume_complete`, `role` |
| `pupitres`                  | bombarde, cornemuse, caisse claire, percussion                                                                                                      |
| `profile_pupitres`          | Liaison membre ↔ pupitres (plusieurs possibles)                                                                                                     |
| `bureau_positions`          | Titres du bureau historisés (honorifiques, aucun droit)                                                                                             |
| `member_loans`              | Suivi simplifié des prêts de matériel et costumes par adhérent                                                                                      |
| `invitations`               | Invitation envoyée : email, nom, prénom, auteur ; lien Supabase Auth valable 1 heure                                                                |
| `invitation_pupitres`       | Pupitres attribués à l'invité                                                                                                                       |
| `events`                    | Représentations, répétitions et sondages (`is_poll`), avec `visibility`                                                                             |
| `event_pupitres`            | Liaison événement ↔ pupitres ciblés (quand `visibility = 'pupitre'`)                                                                                |
| `event_responses`           | Réponse d'un membre à un événement ou sondage (`present` / `absent`)                                                                                |
| `documents`                 | Partitions PDF, rattachées à un pupitre                                                                                                             |
| `articles`                  | Actualités, avec `published`                                                                                                                        |
| `albums`, `media`           | Albums photo et médias                                                                                                                              |
| `notification_preferences`  | Préférences push globales, événements et rappels par membre                                                                                         |
| `notification_log`          | Trace des envois OneSignal                                                                                                                          |
| `activity_log`              | Journal applicatif des actions (trace interne, sans valeur probante, ne constitue pas une piste d'audit légale)                                     |
| `account_deletion_requests` | Demandes de suppression de compte, avec suivi de traitement                                                                                         |


> **Note** : le schéma initial crée `activity_log` comme simple trace applicative, pas comme piste d'audit au sens légal.

## 5. Matrice des droits

L = lecture, E = écriture (créer / modifier / supprimer), « soi » = ses propres lignes, « pup. » = son ou ses pupitres.

La matrice et les exemples RLS des §5–7 décrivent l'état de la migration 005.
Le trombinoscope et ses autorisations restent à implémenter ; les décisions
cibles correspondantes sont précisées au §12.

| Table                       | Visiteur         | Membre                                   | Chef de pupitre                  | Secrétaire          | Admin               |
| --------------------------- | ---------------- | ---------------------------------------- | -------------------------------- | ------------------- | ------------------- |
| `profiles`                  | –                | L/E soi (champs autorisés)               | L/E soi (champs autorisés)       | L tous              | L/E champs autorisés |
| `pupitres`                  | L                | L                                        | L                                | L                   | L/E                 |
| `profile_pupitres`          | –                | L soi                                    | L pup.                           | L/E                 | L/E                 |
| `bureau_positions`          | –                | L soi                                    | L soi                            | L/E                 | L/E                 |
| `member_loans`              | –                | L soi                                    | L pup.                           | L/E                 | L/E                 |
| `invitations`               | –                | –                                        | –                                | –                   | L/E                 |
| `invitation_pupitres`       | –                | –                                        | –                                | –                   | L/E                 |
| `events`                    | L si `public`    | L public/interne + événements de ses pupitres | L idem membre ; E événements de ses pupitres | L/E tous | L/E tous |
| `event_pupitres`            | –                | L si événement accessible                | L si événement accessible        | L/E                 | L/E                 |
| `event_responses`           | –                | L/E sa réponse si accès à l'événement ; aucune suppression | L réponses selon l'accès à l'événement | L/E toutes | L/E toutes |
| `documents`                 | –                | L tous                                   | L tous, E son pup.               | L/E tous            | L/E tous            |
| `articles`                  | L si `published` | L si `published`                         | L si `published`                 | L/E tous            | L/E tous            |
| `albums`, `media`           | L si public      | L                                        | L                                | L/E                 | L/E                 |
| `notification_preferences`  | –                | L/E soi                                  | L/E soi                          | L/E soi             | L/E soi             |
| `account_deletion_requests` | –                | Créer/L soi                              | Créer/L soi                      | L/E traitement      | L/E traitement      |
| `notification_log`          | –                | –                                        | L soi                            | L soi               | L tous              |
| `activity_log`              | –                | –                                        | –                                | –                   | L                   |


Les écritures de `notification_log` et `activity_log` passent uniquement par le serveur (`service_role`) : aucune policy d'écriture pour les rôles `anon` et `authenticated`.

Les colonnes de rôle et de statut musical ne sont pas modifiables directement
par les clients : l'approbation et le changement de rôle passent par les RPC
autorisées. La suppression d'un profil passe par le traitement serveur de
Supabase Auth.

**Règles métier des événements :** seuls les secrétaires/admins peuvent gérer tous les événements. Un chef de pupitre peut créer, modifier et supprimer uniquement des événements de visibilité `pupitre`, ciblant exclusivement un ou plusieurs pupitres qui lui sont attribués. Les membres ordinaires ne créent, ne modifient et ne suppriment aucun événement. Les visiteurs anonymes ne voient que les événements `public`.

## 6. Policies : modèles à suivre

> **Règle de performance d'expert** : toujours encapsuler les appels de fonctions de rôle sous forme de sous-requête scalaire `(select public.my_role_level())`. Cela permet à l'optimiseur de requêtes PostgreSQL de l'évaluer une seule fois pour toute la requête (InitPlan) plutôt que tuple par tuple (SubPlan).

### Table publique filtrée (`articles`)

```sql
alter table public.articles enable row level security;

create policy "articles: lecture publique des publiés"
on public.articles for select
to anon, authenticated
using (published = true);

create policy "articles: lecture complète secrétaire+"
on public.articles for select
to authenticated
using ((select public.my_role_level()) >= 3);

create policy "articles: écriture secrétaire+"
on public.articles for all
to authenticated
using ((select public.my_role_level()) >= 3)
with check ((select public.my_role_level()) >= 3);
```

### Table mixte public / privé (`events`)

```sql
alter table public.events enable row level security;

-- 1. Événements publics : consultables par tous (visiteurs et membres connectés)
create policy "events: représentations publiques"
on public.events for select
to anon, authenticated
using (visibility = 'public');

-- 2. Événements internes : consultables par tous les membres connectés approuvés
create policy "events: lecture interne membres"
on public.events for select
to authenticated
using (
  visibility = 'interne'
  and (select public.my_role_level()) >= 1
);

-- 3. Événements par pupitre : uniquement les membres du/des pupitre(s) ciblés, ou secrétaire/admin
create policy "events: lecture pupitre ciblé"
on public.events for select
to authenticated
using (
  visibility = 'pupitre'
  and (
    (select public.my_role_level()) >= 3
    or (
      (select public.my_role_level()) >= 1
      and exists (
        select 1 from public.event_pupitres ep
        where ep.event_id = events.id
        and ep.pupitre_id in (select public.my_pupitre_ids())
      )
    )
  )
);

create policy "events: gestion secrétaire et admin"
on public.events for all
to authenticated
using ((select public.my_role_level()) >= 3)
with check ((select public.my_role_level()) >= 3);

-- Les RPC create_pupitre_event, update_pupitre_event et
-- delete_pupitre_event appliquent ces contrôles atomiquement pour les chefs.
-- Ne jamais considérer l'interface comme une frontière de sécurité.
```

### Réponses aux événements et sondages (`event_responses`)

Depuis la migration 005, un membre ne lit et ne modifie que sa propre réponse
pour un événement auquel il a accès. Un chef de pupitre lit les réponses des
événements auxquels son pupitre a accès, sans pouvoir modifier les réponses
d'autrui. La vue `event_response_details` lui fournit seulement le nom, l'ID
de l'événement et le statut des réponses autorisées; elle ne donne pas accès
aux autres champs de profil. La secrétaire et l'admin peuvent lire et modifier
toutes les réponses. Les colonnes `event_id` et `profile_id` ne sont pas
modifiables par les clients, et aucune suppression directe n'est autorisée.

```sql
alter table public.event_responses enable row level security;

-- can_access_event() vérifie la visibilité sans provoquer de récursion RLS.
create policy "event_responses: lecture selon rôle et accès"
on public.event_responses for select
to authenticated
using (
  (select public.my_role_level()) >= 3
  or (
    (select public.my_role_level()) = 2
    and (select public.can_access_event(event_id))
  )
  or (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
    and (select public.can_access_event(event_id))
  )
);

-- Le membre crée sa propre réponse uniquement pour un événement auquel il a accès.
create policy "event_responses: insertion personnelle autorisée"
on public.event_responses for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.my_role_level()) >= 1
  and (select public.can_access_event(event_id))
);

create policy "event_responses: modification personnelle ou secrétaire et admin"
on public.event_responses for update
to authenticated
using (
  (select public.my_role_level()) >= 3
  or (
    profile_id = (select auth.uid())
    and (select public.my_role_level()) >= 1
    and (select public.can_access_event(event_id))
  )
)
with check (
  (
    (select public.my_role_level()) >= 3
    or (
      profile_id = (select auth.uid())
      and (select public.my_role_level()) >= 1
      and (select public.can_access_event(event_id))
    )
  )
  and response_status in ('present', 'absent')
);

revoke update on table public.event_responses from public, anon, authenticated;
revoke update (id, event_id, profile_id, status, created_at, updated_at)
  on table public.event_responses from public, anon, authenticated;
grant update (status) on table public.event_responses to authenticated;
revoke delete on table public.event_responses from public, anon, authenticated;
```

> **Aucune policy `delete`, volontairement** : un membre ne supprime pas sa réponse, il la modifie entre `present` et `absent`, même au dernier moment. Les réponses ne disparaissent qu'avec la suppression effective du compte (cf. §9). Les réponses ne sont jamais visibles par `anon`, même pour un événement public.
>
> La migration 005 applique les privilèges de colonnes ci-dessus : seul `status` peut être modifié directement, ce qui protège les identifiants de la réponse.

### Profils : protéger la colonne `role`, `musician_level` et `costume_complete`

Un membre peut modifier ses informations personnelles (`first_name`, `last_name`, `phone`, `nickname`, `birthdate`), mais **pas son rôle, son niveau, ni la validation de son costume**.

```sql
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, nickname, birthdate) on public.profiles to authenticated;
```

Le changement de rôle passe par une fonction réservée à l'admin (niveau 4), et la modification du niveau / statut costume par une fonction réservée à la secrétaire ou à l'admin (niveau &gt;= 3 : `update_member_status`).

### Fonctions de modification de rôle : modèle standard Supabase

Toutes les fonctions `security definer` qui modifient des données suivent le même modèle que `my_role_level()` : `set search_path = ''` (sinon un attaquant peut détourner la résolution des noms vers ses propres objets), objets toujours qualifiés en `public.`, vérification du rôle **à l'intérieur** de la fonction, et permissions `execute` explicites.

```sql
create function public.set_profile_role(target uuid, new_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select public.my_role_level()), -1) <> 4 then
    raise exception 'Réservé aux administrateurs';
  end if;

  if new_role <> 'pending' and not exists (
    select 1 from auth.users u
    where u.id = target and u.email_confirmed_at is not null
  ) then
    raise exception 'Adresse e-mail non confirmée';
  end if;

  update public.profiles set role = new_role where id = target;
end;
$$;

revoke execute on function public.set_profile_role(uuid, public.app_role) from anon, public;
grant execute on function public.set_profile_role(uuid, public.app_role) to authenticated;
```

```sql
create function public.approve_member(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((select public.my_role_level()), -1) <> 4 then
    raise exception 'Réservé aux administrateurs';
  end if;

  if not exists (
    select 1 from auth.users u
    where u.id = target and u.email_confirmed_at is not null
  ) then
    raise exception 'Adresse e-mail non confirmée';
  end if;

  update public.profiles set role = 'member'
  where id = target and role = 'pending';
end;
$$;

revoke execute on function public.approve_member(uuid) from anon, public;
grant execute on function public.approve_member(uuid) to authenticated;
```

> `approve_member` ne peut attribuer **que** le rôle `member`, uniquement depuis `pending` et après confirmation de l'adresse e-mail. `set_profile_role` bloque également l'attribution de tout rôle actif à une adresse non confirmée. `update_member_status` (niveau musical, costume) suit le même modèle avec un garde `>= 3`.

## 7. Création de compte et trigger d'invitation

La cible validée réserve la création des invitations à l'administrateur.
L'inscription libre est désactivée. Le parcours attendu est le suivant :

1. L'administrateur crée une invitation (adresse e-mail et informations du futur membre), associe un ou plusieurs pupitres dans `invitation_pupitres`, puis déclenche l'invitation côté serveur (`auth.admin.inviteUserByEmail`). Le compte est créé immédiatement dans Supabase Auth.
2. **Unicité garantie en base** : un email ne peut avoir qu'une seule invitation non consommée à la fois. Le lien Supabase Auth expire après une heure (`auth.email.otp_expiry = 3600` dans la configuration locale ; la configuration du projet hébergé doit correspondre). Avant un renvoi, le serveur invalide l'ancienne ligne et renvoie une invitation au compte Auth existant.
  ```sql
   create unique index idx_invitations_email_active
   on public.invitations (lower(email))
   where used_at is null;
  ```

   L'index unique partiel garantit l'unicité même en cas d'erreur applicative. Le renvoi ne doit pas créer un deuxième compte Auth pour la même adresse.
3. Un trigger `after insert` sur `auth.users` :
  - Sélectionne et verrouille la ligne d'invitation retenue (`FOR UPDATE`) afin que deux inscriptions concurrentes ne puissent pas consommer la même invitation.
  - La validation, la création du profil, la copie des pupitres et le marquage `used_at` doivent appartenir à la même transaction ; toute erreur annule l'ensemble.
  - Vérifie la présence d'une invitation valide pour `new.email` (`used_at is null` et `created_at > now() - interval '1 hour'`). Si aucune invitation valide n'existe, lève une exception (`raise exception 'Invitation invalide ou expirée'`).
  - Crée le profil dans `public.profiles` (`id = new.id`, `role = 'pending'`).
  - Associe l'utilisateur à ses pupitres dans `public.profile_pupitres` en copiant ceux de `invitation_pupitres`.
  - Marque l'invitation comme utilisée (`used_at = now()`).
4. Le membre ouvre le lien Supabase Auth dans l'heure, confirme son adresse e-mail et définit son mot de passe. La confirmation ne change pas le rôle : le profil reste `pending`, sans accès de membre actif.
5. Un administrateur valide manuellement le profil via une fonction d'approbation ; celle-ci vérifie dans `auth.users` que `email_confirmed_at` est renseigné avant le passage de `pending` à `member`.

Le délai d'une heure est appliqué au lien Auth et au contrôle de validité de
l'invitation en base. La policy RLS, la fonction d'approbation et le contrôle
de `email_confirmed_at` de la migration 005 réservent les opérations à l'admin.
Le renvoi d'un lien expiré doit être effectué par l'admin sur le compte Auth
existant et testé avec Supabase Auth.

## 8. Storage

La migration 005 configure deux buckets distincts :

| Bucket | Visibilité | Organisation | Accès |
|---|---|---|---|
| `bagad-public` | `public = true` | `articles/`, `albums/`, `events/`, `documents/` | Lecture sans connexion ; ajout/modification/suppression selon le rôle éditorial. Seuls des fichiers réellement publiables peuvent y être déposés. |
| `bagad-private` | `public = false` | `profiles/{profile_id}/avatar.webp`, `documents/` | Lecture authentifiée par les policies RLS ; avatar lisible par les membres actifs, documents selon leur droit d'accès. Aucun accès public permanent. |

Les partitions et autres documents internes sont rangés sous
`documents/{pupitre_slug}/...`. Les fichiers d'albums non publics restent dans
le bucket privé sous `documents/albums/{album_id}/...` et ne sont lisibles que
par les membres actifs autorisés. Les images d'albums publics utilisent
`albums/{album_id}/...` dans `bagad-public`. Les politiques vérifient le rôle,
le chemin et, pour les ressources reliées à une ligne métier, l'association au
document ou à l'album. Les politiques `INSERT`, `UPDATE` et `DELETE` vérifient
également l'ancien et le nouveau chemin lors d'un déplacement.

Les photos de profil sont converties en WebP et enregistrées à un chemin
déterministe `profiles/{profile_id}/avatar.webp` dans `bagad-private`. Un membre
actif peut lire les avatars de tous les membres actifs et modifier uniquement
le sien ; l'administrateur dispose des droits nécessaires à leur gestion. Les
droits de Storage ne permettent pas de lire ou modifier les autres champs du
profil. Le trombinoscope utilise un accès authentifié ou une URL signée courte
pour afficher ces photos.

Les objets du bucket privé ne doivent jamais être servis via une URL publique
permanente. Les documents et les photos privées sont téléchargés via une
requête authentifiée RLS ou une URL signée créée après vérification des droits.
Le bucket public est réellement public : toute personne connaissant une URL
peut lire l'objet, indépendamment des policies `SELECT`. Il ne doit donc
contenir que des ressources prévues pour être publiques. Les policies restent
obligatoires pour contrôler les uploads, modifications, suppressions et
l'énumération des objets.

La migration 005 active des policies `SELECT`, `INSERT`, `UPDATE` et `DELETE`
sur les deux buckets. Le helper `can_read_profile_avatar(text)` vérifie que
l'appelant et le profil cible sont actifs ; `can_manage_profile_avatar(text)`
limite les modifications à la personne propriétaire ou à l'administrateur.

## 9. Migrations

- Dossier `supabase/migrations/`, fichiers numérotés et horodatés (`NNN_*.sql`).
- Une migration = un sujet (ex. `006_events_rls.sql`).
- Chaque `create table` est suivi, **dans la même migration**, de `enable row level security` et de ses policies.
- Clés étrangères avec `on delete cascade` explicite sur les tables enfants (`event_pupitres`, `event_responses`, `profile_pupitres`) et `on delete restrict` sur les tables de référence (`pupitres`).
- **Décision RGPD (`event_responses.profile_id` → `profiles`) : `on delete cascade`.** Les réponses d'un membre disparaissent avec son compte lors d'une suppression. L'historique de présence des membres supprimés n'est **pas** conservé ; les stats de présence passées en tiendront compte. Si un jour des statistiques intemporelles deviennent nécessaires, il faudra décider explicitement d'une stratégie d'anonymisation.
- **Suppression de compte :** un utilisateur peut demander la suppression de son propre compte ; l'admin peut également la déclencher côté serveur. Un rôle ne repasse jamais automatiquement à `pending`. Le traitement serveur doit supprimer l'identité Auth et le profil de manière cohérente, et conserver la demande de suppression si elle doit servir de trace de traitement : `account_deletion_requests` ne doit donc pas être supprimée en cascade avec `profiles`. Elle doit contenir un instantané minimal des informations d'identité nécessaires au suivi, sans conserver plus de données personnelles que nécessaire. Définir explicitement les règles de conservation et d'accès à cet instantané.
- Jamais d'édition manuelle en production sans migration correspondante.
- Le renommage d'un objet existant (ex. `audit_log` → `activity_log`) passe par une **nouvelle migration** : `alter table ... rename` + recréation des policies, index et grants liés.

## 10. Checklist : ajouter une table

- [ ] `enable row level security`
- [ ] Policies de lecture et d'écriture écrites explicitement (scinder `select`, `insert`, `update` si les droits diffèrent)
- [ ] Encapsuler les fonctions RLS dans `(select public.my_role_level())` pour l'optimisation InitPlan
- [ ] Table publique : filtre sur une colonne (`published`, `visibility`)
- [ ] Index sur les colonnes utilisées dans les policies :
  ```sql
  create index profiles_role_idx on public.profiles(role);
  create index events_visibility_start_at_idx
    on public.events(visibility, start_at);
  create index event_responses_profile_event_idx
    on public.event_responses(profile_id, event_id);
  create unique index invitations_email_active_unique
    on public.invitations (lower(email)) where used_at is null;
  ```
- Les index déjà couverts par la clé primaire ou une contrainte `UNIQUE` ne sont
  pas recréés. La migration 005 ne contient que les index nécessaires au
  schéma neuf; les index historiques redondants ne sont pas repris.
- [ ] `(select auth.uid())` plutôt que `auth.uid()` nu (meilleures performances)
- [ ] Fonctions `security definer` : `set search_path = ''`, objets qualifiés, garde de rôle interne, `grant execute` explicite
- [ ] Choix `on delete` de chaque FK explicité (cascade / restrict / set null) selon les décisions RGPD
- [ ] Ligne ajoutée dans la matrice (§5) et dans la liste des tables (§4)
- [ ] Test ci-dessous ajouté

## 11. Tester les policies

Pour chaque table, vérifier au minimum :

```sql
-- Visiteur
set local role anon;
select count(*) from public.events;        -- uniquement les représentations publiques
insert into public.events (...) values (...);  -- doit échouer

-- Membre approuvé
set local role authenticated;
set local request.jwt.claims = '{"sub": "<uuid-membre>"}';
select count(*) from public.events;        -- public + interne + pupitres auxquels il appartient
select count(*) from public.event_responses; -- uniquement ses réponses; jamais anon
update public.profiles set role = 'admin' where id = '<uuid-membre>';  -- doit échouer
delete from public.event_responses where profile_id = '<uuid-membre>';  -- doit échouer (aucune policy delete)
-- anon lit les médias de bagad-public, mais jamais un objet de bagad-private.
-- Un membre actif lit les avatars des membres actifs et ses documents autorisés.
-- Un membre actif ne peut ni remplacer ni supprimer l'avatar d'un autre membre.
-- Un compte pending ne peut accéder à aucun objet de bagad-private.
-- Secrétaire/admin peuvent gérer les objets selon les chemins Storage autorisés.
-- Tenter une réponse à un événement de pupitre étranger doit échouer.
-- Tenter de modifier profile_id/event_id sur sa réponse doit échouer.
-- Tenter de lire la réponse d'un autre membre doit échouer.
-- Le chef lit les réponses des événements accessibles à son pupitre,
-- mais ne peut pas modifier la réponse d'un autre membre.
-- Secrétaire/admin peuvent lire et modifier toutes les réponses, sans les supprimer.
```

Un test par rôle et par table sensible. Une policy non testée est considérée comme absente.

## 12. Décisions

- **Trombinoscope privé** : les membres actifs connectés peuvent consulter le trombinoscope, quel que soit leur rôle. Une vue SQL dédiée n'expose que le nom, le prénom, la photo de profil, les pupitres, le niveau musical et la fonction éventuelle au bureau. Les coordonnées privées (téléphone, e-mail personnel, adresse postale et autres champs non autorisés) ne sont jamais exposées. La lecture de cette vue ne donne aucun droit de lecture sur les profils complets. Les droits RLS des profils, des tables de liaison de pupitres et des données de niveau doivent être vérifiés séparément.
- **Titres du bureau non publics** : aucune policy de lecture pour `anon`. Un membre actif peut voir la fonction de présentation exposée dans le trombinoscope ; cela n'accorde aucun droit applicatif supplémentaire.
- **Événements et visibilité (`public`, `interne`, `pupitre`)** :
  - `public` : événement visible par les visiteurs non connectés et les membres ; les réponses restent privées et sont visibles par leur auteur, les chefs ayant accès à l'événement et la secrétaire/admin.
  - `interne` : événement visible par tous les membres connectés approuvés; les réponses sont visibles par leur auteur, les chefs ayant accès à l'événement et la secrétaire/admin.
  - `pupitre` : événement visible uniquement par les membres des pupitres ciblés et par la secrétaire/admin. Les réponses sont visibles par leur auteur, les chefs ayant accès à l'événement et la secrétaire/admin. Un chef peut créer, consulter, modifier et supprimer tout événement associé à son ou ses pupitres, indépendamment de son auteur ; il ne peut gérer ni un événement global ni les événements d'autres pupitres. La secrétaire et l'admin gèrent tous les événements. Un membre ordinaire ne crée, ne modifie et ne supprime aucun événement.
- **Type d'événement distinct de sa visibilité** : ajouter le champ `event_type` à `events` et un référentiel maîtrisé `event_types` (relation et compatibilité à valider). Catégories initiales : répétition, concert, sortie, festival, fest-noz, concours, réunion, assemblée générale, gala et repas. La visibilité est choisie explicitement ; le type ne la détermine pas.
- **Pupitres** : la cible métier comporte Bombarde, Caisse claire et Cornemuse, avec un chef indépendant par pupitre. La migration 005 contient aussi Percussion ; la stratégie de compatibilité et le traitement des données liées à ce pupitre restent à valider.
- **Événements récurrents** : aucune gestion des récurrences en V1. La table `event_series`, la colonne `events.series_id` et tous les objets exclusivement liés aux récurrences sont supprimés de la migration 005 et du schéma cible.
- **Invitations et activation** : seul l'admin crée les invitations avec `inviteUserByEmail()` et les comptes Auth. Le lien Supabase Auth expire après une heure. Le trigger crée le profil applicatif en `pending`. La confirmation de l'adresse e-mail ne valide pas le membre ; l'admin approuve manuellement et la fonction d'approbation vérifie `auth.users.email_confirmed_at` avant de passer à `member`. Un compte non confirmé ou `pending` ne reçoit pas les droits d'un membre actif. Si le lien expire, l'admin peut renvoyer une invitation au compte Auth existant, sans créer un doublon.
- **Expiration Auth** : le lien d'invitation a une validité d'une heure (`auth.email.otp_expiry = 3600` dans la configuration locale et dans le projet Supabase hébergé). Le renvoi pour un compte Auth déjà créé doit être testé.
- **Réponses de présence** : seules les valeurs `present` et `absent` sont admises. Le membre peut modifier sa propre réponse à tout moment avant l'événement. Il ne peut pas supprimer sa réponse individuellement, ni répondre à un événement auquel il n'a pas accès. Un visiteur public ne voit jamais les réponses.
- **Affectations des chefs** : un profil `chef_pupitre` doit avoir au moins un pupitre attribué ; un pupitre peut temporairement ne pas avoir de chef. Le chef ne peut gérer que ses pupitres.
- **Documents partagés entre pupitres** : tous les membres lisent tous les documents ; seul le chef de pupitre (son pupitre), la secrétaire et l'admin peuvent écrire.
- **Réponses jamais supprimées individuellement** : un membre modifie sa réponse au fil du temps (présent → absent le jour même par exemple) ; la suppression n'intervient qu'à la suppression du compte (RGPD).
- **`activity_log` (ex-`audit_log`)** : trace applicative interne, sans valeur probante ; elle n'est **pas** une piste d'audit au sens légal et ne doit pas être présentée comme telle.

### 12.1. Cible SQL à valider avant migration

Les éléments de cette sous-section documentent les changements approuvés, mais
ne décrivent pas le schéma déjà appliqué. La revue préalable devra notamment :

- définir le type `event_visibility` cible (`public`, `interne`, `pupitre`) sans
  confondre type et visibilité ;
- ajouter le champ `event_type` à `events` et décider du schéma du référentiel
  maîtrisé `event_types` auquel il se rapporte ;
- conserver la relation `event_pupitres` pour associer un événement `pupitre` à
  un ou plusieurs pupitres et interdire aux chefs la gestion d'événements
  globaux ou d'autres pupitres ;
- définir une vue dédiée au trombinoscope, limitée aux colonnes autorisées et
  lisible uniquement par les membres actifs. La vue ne doit pas contourner les
  droits RLS des profils et des tables associées ; le stockage des photos reste
  à concevoir en cohérence avec la politique de stockage privée ;
- faire évoluer les RPC de création, modification et suppression afin de
  vérifier les pupitres autorisés côté serveur/SQL, sans dépendre de l'auteur
  de l'événement ;
- tester le renvoi d'une invitation Auth expirée au compte existant, sans
  créer de doublon ;
- vérifier la compatibilité des quatre pupitres de la migration 005 avec la
  cible métier de trois pupitres.

Définition cible de la visibilité (référence documentaire, pas une migration à
appliquer telle quelle) :

```sql
CREATE TYPE public.event_visibility AS ENUM (
    'public',
    'interne',
    'pupitre'
);
```

La validation des policies et RPC devra couvrir au minimum les cas suivants :
un chef bombarde modifie/supprime un événement bombarde créé par un tiers, mais
ne gère pas un événement caisse claire ; un membre consulte le trombinoscope sans
accéder aux coordonnées privées ; `anon` ne lit que les événements publics ;
les membres voient les événements internes et ceux de leurs pupitres ; un chef
ne crée pas d'événement global ; la secrétaire gère tous les événements ; un
compte non confirmé ne peut pas être approuvé ; la confirmation seule ne change
pas le statut `pending`.

## 13. Schéma initial consolidé (migration 005)

- `notification_preferences` conserve les préférences OneSignal de chaque membre : activation globale, notifications d'événements et rappels de sondage. Les abonnements d'appareils restent gérés par OneSignal.
- `account_deletion_requests` enregistre les demandes de suppression de compte. L'utilisateur peut demander la suppression de son compte et l'admin peut également la déclencher ; aucun compte n'est automatiquement rétrogradé à `pending`. À la suppression effective (côté serveur, via `auth.admin.deleteUser` avec `service_role`), le `on delete cascade` sur `event_responses.profile_id` efface les réponses du membre. La demande doit conserver son instantané minimal d'identité et son statut de traitement après suppression du profil ; elle ne doit donc pas dépendre d'une FK en cascade vers `profiles`.
- `articles.summary` et `articles.image_url` conservent les capacités éditoriales présentes dans l'ancien schéma. Le corps de l'article cible reste dans `articles.content`.
- Les fonctions `approve_member(uuid)` (admin uniquement, adresse e-mail confirmée, attribution du rôle `member` uniquement) et `set_profile_role(uuid, app_role)` (admin uniquement) sont les voies prévues pour modifier le rôle applicatif. Elles suivent le modèle standard Supabase du §6 (`security definer`, `search_path = ''`, garde de rôle interne, `grant execute` explicite).
- Les buckets Storage sont `bagad-public` (public, images et documents publiés) et `bagad-private` (privé, photos de profil, partitions et médias non publics). Voir §8 pour les chemins et les règles RLS.
- Les photos JPG/JPEG sources jusqu'à 20 Mo sont converties côté serveur en WebP avant stockage. Les avatars sont stockés sous `profiles/{profile_id}/avatar.webp` dans le bucket privé.
- Le formulaire de contact reste géré par Netlify Forms : aucune table `contact` n'est créée dans le nouveau schéma.

- `musician_level` catégorise le niveau musical du membre : `skolaj` (École de musique), `bagadig`, `bagad`.
- `profiles` contient `nickname`, `birthdate`, `musician_level` et `costume_complete`.
- `member_loans` permet un suivi nominatif simplifié des équipements et costumes prêtés aux membres (`materiel` ou `costume`), avec dates d'emprunt et de retour.
- Seuls les administrateurs et secrétaires peuvent enregistrer des prêts ou modifier le niveau/costume via `update_member_status`.
- Crée `activity_log` comme journal applicatif (sans données historiques à migrer dans une base neuve).
- Restreint la lecture des réponses aux événements accessibles : le membre ne voit que sa propre réponse; le chef voit les réponses des événements accessibles à son pupitre; la secrétaire et l'admin voient toutes les réponses.
- Ajoute `event_response_details`, vue minimale qui donne aux chefs les noms et statuts nécessaires sans ouvrir les profils.
- Restreint l'ajout et la modification des réponses aux événements accessibles et à l'identité authentifiée. Seul `status` est modifiable; les réponses ne peuvent pas être supprimées individuellement.
- Les chefs créent, modifient et suppriment leurs événements ciblés via les RPC atomiques `create_pupitre_event`, `update_pupitre_event` et `delete_pupitre_event`.
- Corrige le contrôle d'accès de `update_member_status()` pour refuser explicitement un appelant sans profil, puis restreint son exécution à `authenticated`.
- Configure les buckets et policies Storage, les index utiles et les pupitres initiaux.

Les fichiers `supabase/deprecated_migrations/` et l'export DrawSQL conservé dans
`docs/` sont des références uniquement : le CLI Supabase ne doit exécuter que les
fichiers SQL présents dans `supabase/migrations/`.
