# Base de données : schéma, rôles et RLS

> Source de vérité : les migrations `supabase/migrations/NNN_*.sql`.  
> Ce document les résume. Toute modification du schéma met à jour ce fichier **dans le même commit**.

Le schéma de départ est défini intégralement par
`supabase/migrations/005_bagadPenhars_final.sql`. C'est une migration autonome
destinée à un projet Supabase vierge. Les migrations historiques 001–004 sont
archivées dans `supabase/deprecated_migrations/` et ne doivent pas être appliquées.
Un projet ayant déjà exécuté ces anciennes migrations nécessite une stratégie de
réconciliation distincte avant tout déploiement.

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
| `invitations`               | Invitation envoyée : email, nom, prénom, auteur, validité 7 jours                                                                                   |
| `invitation_pupitres`       | Pupitres attribués à l'invité                                                                                                                       |
| `event_series`              | Séries récurrentes (règle `rrule`)                                                                                                                  |
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


| Table                       | Visiteur         | Membre                                   | Chef de pupitre                  | Secrétaire          | Admin               |
| --------------------------- | ---------------- | ---------------------------------------- | -------------------------------- | ------------------- | ------------------- |
| `profiles`                  | –                | L/E soi (champs autorisés)               | L/E soi (champs autorisés)       | L tous              | L/E champs autorisés |
| `pupitres`                  | L                | L                                        | L                                | L                   | L/E                 |
| `profile_pupitres`          | –                | L soi                                    | L pup.                           | L/E                 | L/E                 |
| `bureau_positions`          | –                | L soi                                    | L soi                            | L/E                 | L/E                 |
| `member_loans`              | –                | L soi                                    | L pup.                           | L/E                 | L/E                 |
| `invitations`               | –                | –                                        | –                                | L/E                 | L/E                 |
| `invitation_pupitres`       | –                | –                                        | –                                | L/E                 | L/E                 |
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
  if (select public.my_role_level()) < 4 then
    raise exception 'Réservé aux administrateurs';
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
  if (select public.my_role_level()) < 3 then
    raise exception 'Réservé à la secrétaire et à l''admin';
  end if;

  update public.profiles set role = 'member'
  where id = target and role = 'pending';
end;
$$;

revoke execute on function public.approve_member(uuid) from anon, public;
grant execute on function public.approve_member(uuid) to authenticated;
```

> `approve_member` ne peut attribuer **que** le rôle `member`, et uniquement depuis `pending`. `update_member_status` (niveau musical, costume) suit le même modèle avec un garde `>= 3`.

## 7. Création de compte et trigger d'invitation

1. Un admin ou une secrétaire crée une ligne dans `invitations` (email, nom, prénom) et y associe un ou plusieurs pupitres dans `invitation_pupitres`, puis déclenche l'invitation côté serveur (`auth.admin.inviteUserByEmail`).
2. **Unicité garantie en base** : un email ne peut avoir qu'une seule invitation non consommée à la fois. L'index partiel ne représente pas à lui seul la validité temporelle de 7 jours : le serveur doit invalider les invitations expirées avant d'en créer une nouvelle.
  ```sql
   create unique index idx_invitations_email_active
   on public.invitations (lower(email))
   where used_at is null;
  ```

   Si l'invitation a expiré ou a déjà été utilisée, le serveur **invalide d'abord l'ancienne ligne** (`used_at = now()`), puis crée une nouvelle invitation et renvoie le mail. L'index unique partiel garantit l'unicité même en cas d'erreur applicative.
3. Un trigger `after insert` sur `auth.users` :
  - Sélectionne et verrouille la ligne d'invitation retenue (`FOR UPDATE`) afin que deux inscriptions concurrentes ne puissent pas consommer la même invitation.
  - La validation, la création du profil, la copie des pupitres et le marquage `used_at` doivent appartenir à la même transaction ; toute erreur annule l'ensemble.
  - Vérifie la présence d'une invitation valide pour `new.email` (`used_at is null` et `created_at > now() - interval '7 days'`). Si aucune invitation valide n'existe, lève une exception (`raise exception 'Invitation invalide ou expirée'`).
  - Crée le profil dans `public.profiles` (`id = new.id`, `role = 'pending'`).
  - Associe l'utilisateur à ses pupitres dans `public.profile_pupitres` en copiant ceux de `invitation_pupitres`.
  - Marque l'invitation comme utilisée (`used_at = now()`).
4. L'invité crée son mot de passe. Il reste `pending`, sans accès à l'espace adhérents.
5. Un admin ou une secrétaire passe le profil à `member` via `approve_member`.

## 8. Storage

> **Règle V1** : aucun avatar n'est téléversé (affichage des initiales du prénom et nom). Le bucket `bagad-avatars` est exclu de la V1 pour éviter tout stockage inutile.


| Bucket             | Accès                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `bagad-partitions` | **Privé** ; lecture : tous les membres approuvés (tous pupitres) ; écriture : chef de pupitre (son pup.), secrétaire+ |
| `bagad-medias`     | **Privé** ; lecture selon l'accès à l'album lié ; écriture : secrétaire+                                              |


Chaque bucket a ses policies sur `storage.objects`, avec la même rigueur que les tables. Les fichiers de partition sont rangés sous le slug du pupitre : la policy d'écriture du chef vérifie le dossier racine du fichier. La migration 005 définit explicitement les policies `SELECT`, `INSERT`, `UPDATE` et `DELETE`, en revalidant le bucket et le pupitre lors d'un déplacement ou renommage.

```sql
-- Exemple : lecture des partitions par tout membre approuvé
create policy "partitions: lecture membres"
on storage.objects for select
to authenticated
using (
  bucket_id = 'bagad-partitions'
  and (select public.my_role_level()) >= 1
);

-- Exemple : écriture limitée au dossier du pupitre du chef, ou secrétaire+
create policy "partitions: écriture chef (son pupitre) et secrétaire+"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'bagad-partitions'
  and (
    (select public.my_role_level()) >= 3
    or (
      (select public.my_role_level()) = 2
      and exists (
        select 1
        from public.pupitres p
        where p.slug = (storage.foldername(name))[1]
          and p.id in (select public.my_pupitre_ids())
      )
    )
  )
);
```

La migration 005 applique ce contrôle à partir du slug du dossier et de
`my_pupitre_ids()` ; elle n'ajoute pas de fonction `pupitre_slug_from_ids()`.
Les deux buckets restent privés. Pour afficher les fichiers, le client doit
demander une URL signée : la policy Storage vérifie que le média est lié à un
album public ou accessible au membre connecté. Un bucket public contournerait
les règles `albums.is_public` et exposerait aussi les objets d'albums privés.

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
-- Tenter une réponse à un événement de pupitre étranger doit échouer.
-- Tenter de modifier profile_id/event_id sur sa réponse doit échouer.
-- Tenter de lire la réponse d'un autre membre doit échouer.
-- Le chef lit les réponses des événements accessibles à son pupitre,
-- mais ne peut pas modifier la réponse d'un autre membre.
-- Secrétaire/admin peuvent lire et modifier toutes les réponses, sans les supprimer.
```

Un test par rôle et par table sensible. Une policy non testée est considérée comme absente.

## 12. Décisions

- **Pas d'annuaire** : un membre ne voit pas la liste des autres membres. `profiles` n'est lisible que par son propriétaire et par la secrétaire / l'admin. Un chef de pupitre voit les réponses des événements auxquels son pupitre a accès via `event_responses` et `profile_pupitres` (nom et réponse uniquement), sans accès au reste des profils. Un membre ne voit que ses propres réponses.
- **Titres du bureau non publics** : aucune policy de lecture pour `anon`. Un membre ne voit que ses propres titres.
- **Événements et visibilité (`public`, `interne`, `pupitre`)** :
  - `public` : événement visible par les visiteurs non connectés et les membres ; les réponses restent privées et sont visibles par leur auteur, les chefs ayant accès à l'événement et la secrétaire/admin.
  - `interne` : événement visible par tous les membres connectés approuvés; les réponses sont visibles par leur auteur, les chefs ayant accès à l'événement et la secrétaire/admin.
  - `pupitre` : événement visible uniquement par les membres des pupitres ciblés et par la secrétaire/admin. Les réponses sont visibles par leur auteur, les chefs ayant accès à l'événement et la secrétaire/admin. Un chef de pupitre ne crée, ne modifie et ne supprime que des événements de visibilité `pupitre` pour les pupitres qui lui sont attribués.
- **Réponses de présence** : seules les valeurs `present` et `absent` sont admises. Le membre peut modifier sa propre réponse à tout moment avant l'événement. Il ne peut pas supprimer sa réponse individuellement, ni répondre à un événement auquel il n'a pas accès. Un visiteur public ne voit jamais les réponses.
- **Affectations des chefs** : un profil `chef_pupitre` doit avoir au moins un pupitre attribué ; un pupitre peut temporairement ne pas avoir de chef. Le chef ne peut gérer que ses pupitres.
- **Documents partagés entre pupitres** : tous les membres lisent tous les documents ; seul le chef de pupitre (son pupitre), la secrétaire et l'admin peuvent écrire.
- **Réponses jamais supprimées individuellement** : un membre modifie sa réponse au fil du temps (présent → absent le jour même par exemple) ; la suppression n'intervient qu'à la suppression du compte (RGPD).
- **`activity_log` (ex-`audit_log`)** : trace applicative interne, sans valeur probante ; elle n'est **pas** une piste d'audit au sens légal et ne doit pas être présentée comme telle.

## 13. Schéma initial consolidé (migration 005)

- `notification_preferences` conserve les préférences OneSignal de chaque membre : activation globale, notifications d'événements et rappels de sondage. Les abonnements d'appareils restent gérés par OneSignal.
- `account_deletion_requests` enregistre les demandes de suppression de compte. L'utilisateur peut demander la suppression de son compte et l'admin peut également la déclencher ; aucun compte n'est automatiquement rétrogradé à `pending`. À la suppression effective (côté serveur, via `auth.admin.deleteUser` avec `service_role`), le `on delete cascade` sur `event_responses.profile_id` efface les réponses du membre. La demande doit conserver son instantané minimal d'identité et son statut de traitement après suppression du profil ; elle ne doit donc pas dépendre d'une FK en cascade vers `profiles`.
- `articles.summary` et `articles.image_url` conservent les capacités éditoriales présentes dans l'ancien schéma. Le corps de l'article cible reste dans `articles.content`.
- Les fonctions `approve_member(uuid)` (secrétaire/admin, attribution du rôle `member` uniquement) et `set_profile_role(uuid, app_role)` (admin uniquement) sont les voies prévues pour modifier le rôle applicatif. Elles suivent le modèle standard Supabase du §6 (`security definer`, `search_path = ''`, garde de rôle interne, `grant execute` explicite).
- Les buckets Storage sont `bagad-partitions` (privé, PDF, lecture par tous les membres approuvés) et `bagad-medias` (privé, WebP, lecture selon l'accès à l'album, écriture secrétaire/admin). Les médias doivent être servis avec des URL signées ; les fichiers de partition sont rangés sous le slug du pupitre.
- Les photos JPG/JPEG sources jusqu'à 20 Mo doivent être converties côté serveur en WebP avant stockage dans `bagad-medias`. La migration configure le bucket de sortie, mais ne réalise pas elle-même la conversion.
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
