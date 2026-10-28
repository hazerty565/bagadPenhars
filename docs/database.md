# Base de données : schéma, rôles et RLS

> Source de vérité : les migrations `supabase/migrations/NNN_*.sql`.
> Ce document les résume. Toute modification du schéma met à jour ce fichier **dans le même commit**.

Le schéma officiel est versionné sous `supabase/migrations/` (la première migration
étant `001_initial_schema.sql`). L'ancien dossier `migrations/` est obsolète et ne
doit plus être utilisé.

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

| Rôle | Niveau |
|---|---|
| pending | 0 |
| member | 1 |
| chef_pupitre | 2 |
| secretaire | 3 |
| admin | 4 |

Un niveau plus haut englobe les droits des niveaux plus bas. Si un droit ne suit pas cette échelle, tester le rôle explicitement plutôt que le niveau.

## 3. Fonctions d'aide

Elles sont `security definer` avec `search_path` vide, pour **éviter la récursion RLS** sur `profiles` (déjà rencontrée sur ce projet).

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

## 4. Tables

| Table | Rôle |
|---|---|
| `profiles` | Un profil par utilisateur (`id` = `auth.users.id`), nom, prénom, pseudo, date de naissance, téléphone, `musician_level`, `costume_complete`, `role` |
| `pupitres` | bombarde, cornemuse, caisse claire, percussion |
| `profile_pupitres` | Liaison membre ↔ pupitres (plusieurs possibles) |
| `bureau_positions` | Titres du bureau historisés (honorifiques, aucun droit) |
| `member_loans` | Suivi simplifié des prêts de matériel et costumes par adhérent |
| `invitations` | Invitation envoyée : email, nom, prénom, auteur, validité 7 jours |
| `invitation_pupitres` | Pupitres attribués à l'invité |
| `event_series` | Séries récurrentes (règle `rrule`) |
| `events` | Représentations, répétitions et sondages (`is_poll`), avec `visibility` |
| `event_pupitres` | Liaison événement ↔ pupitres ciblés (quand `visibility = 'pupitre'`) |
| `event_responses` | Réponse d'un membre à un événement ou sondage (`present` / `absent`) |
| `documents` | Partitions PDF, rattachées à un pupitre |
| `articles` | Actualités, avec `published` |
| `albums`, `media` | Albums photo et médias |
| `notification_preferences` | Préférences push globales, événements et rappels par membre |
| `notification_log` | Trace des envois OneSignal |
| `audit_log` | Journal d'audit des actions sensibles |
| `account_deletion_requests` | Demandes de suppression de compte, avec suivi de traitement |

## 5. Matrice des droits

L = lecture, E = écriture (créer / modifier / supprimer), « soi » = ses propres lignes, « pup. » = son ou ses pupitres.

| Table | Visiteur | Membre | Chef de pupitre | Secrétaire | Admin |
|---|---|---|---|---|---|
| `profiles` | – | L/E soi | L/E soi | L tous | L/E tous |
| `pupitres` | L | L | L | L | L/E |
| `profile_pupitres` | – | L soi | L pup. | L/E | L/E |
| `bureau_positions` | – | L soi | L soi | L/E | L/E |
| `member_loans` | – | L soi | L pup. | L/E | L/E |
| `invitations` | – | – | – | L/E | L/E |
| `invitation_pupitres` | – | – | – | L/E | L/E |
| `events` | L si `public` | L si `public`, `interne`, ou son pupitre | L idem membre; + E pour son pup. | L/E tous | L/E tous |
| `event_pupitres` | – | L si événement accessible | L si événement accessible | L/E | L/E |
| `event_responses` | – | L/E soi | L pup. | L tous, E présences | L tous, E présences |
| `documents` | – | L tous | L tous, E son pup. | L/E tous | L/E tous |
| `articles` | L si `published` | L si `published` | L si `published` | L/E tous | L/E tous |
| `albums`, `media` | L si public | L | L | L/E | L/E |
| `notification_preferences` | – | L/E soi | L/E soi | L/E soi | L/E soi |
| `account_deletion_requests` | – | Créer/L soi | Créer/L soi | L/E traitement | L/E traitement |
| `notification_log` | – | – | L soi | L soi | L tous |
| `audit_log` | – | – | – | – | L |

Les écritures de `notification_log` et `audit_log` passent uniquement par le serveur (`service_role`) : aucune policy d'écriture pour les rôles `anon` et `authenticated`.

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

create policy "events: écriture secrétaire+"
on public.events for all
to authenticated
using ((select public.my_role_level()) >= 3)
with check ((select public.my_role_level()) >= 3);

create policy "events: écriture chef de pupitre sur son pupitre"
on public.events for all
to authenticated
using (
  (select public.my_role_level()) = 2
  and visibility = 'pupitre'
  and exists (
    select 1 from public.event_pupitres ep
    where ep.event_id = events.id
    and ep.pupitre_id in (select public.my_pupitre_ids())
  )
)
with check (
  (select public.my_role_level()) = 2
  and visibility = 'pupitre'
  and exists (
    select 1 from public.event_pupitres ep
    where ep.event_id = events.id
    and ep.pupitre_id in (select public.my_pupitre_ids())
  )
);
```

### Réponses aux événements et sondages (`event_responses`)

```sql
alter table public.event_responses enable row level security;

-- Lecture : soi-même, secrétaire/admin, ou chef pour les événements de son pupitre
create policy "responses: lecture soi, chef et secretaire"
on public.event_responses for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select public.my_role_level()) >= 3
  or (
    (select public.my_role_level()) = 2
    and exists (
      select 1 from public.event_pupitres ep
      where ep.event_id = event_responses.event_id
      and ep.pupitre_id in (select public.my_pupitre_ids())
    )
  )
);

-- Insertion : le membre enregistre sa propre réponse
create policy "responses: insertion soi"
on public.event_responses for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.my_role_level()) >= 1
);

-- Modification : le membre modifie sa réponse, ou la secrétaire/admin pointe les présences réelles
create policy "responses: modification soi ou secretaire"
on public.event_responses for update
to authenticated
using (
  (profile_id = (select auth.uid()) and (select public.my_role_level()) >= 1)
  or (select public.my_role_level()) >= 3
)
with check (
  (profile_id = (select auth.uid()) and (select public.my_role_level()) >= 1)
  or (select public.my_role_level()) >= 3
);
```

### Profils : protéger la colonne `role`, `musician_level` et `costume_complete`

Un membre peut modifier ses informations personnelles (`first_name`, `last_name`, `phone`, `nickname`, `birthdate`), mais **pas son rôle, son niveau, ni la validation de son costume**.

```sql
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, nickname, birthdate) on public.profiles to authenticated;
```

Le changement de rôle passe par une fonction réservée à l'admin (niveau 4), et la modification du niveau / statut costume par une fonction réservée à la secrétaire ou à l'admin (niveau >= 3 : `update_member_status`).

## 7. Création de compte et trigger d'invitation

1. Un admin ou une secrétaire crée une ligne dans `invitations` (email, nom, prénom) et y associe un ou plusieurs pupitres dans `invitation_pupitres`, puis déclenche l'invitation côté serveur (`auth.admin.inviteUserByEmail`).
2. Un trigger `after insert` sur `auth.users` :
   - Vérifie la présence d'une invitation valide pour `new.email` (`used_at is null` et `created_at > now() - interval '7 days'`). Si aucune invitation valide n'existe, lève une exception (`raise exception 'Invitation invalide ou expirée'`).
   - Crée le profil dans `public.profiles` (`id = new.id`, `role = 'pending'`).
   - Associe l'utilisateur à ses pupitres dans `public.profile_pupitres` en copiant ceux de `invitation_pupitres`.
   - Marque l'invitation comme utilisée (`used_at = now()`).
3. L'invité crée son mot de passe. Il reste `pending`, sans accès à l'espace adhérents.
4. Un admin ou une secrétaire passe le profil à `member`.

## 8. Storage

> **Règle V1** : aucun avatar n'est téléversé (affichage des initiales du prénom et nom). Le bucket `bagad-avatars` est exclu de la V1 pour éviter tout stockage inutile.

| Bucket | Accès |
|---|---|
| `bagad-partitions` | **Privé** ; lecture : tous les membres approuvés (tous pupitres) ; écriture : chef de pupitre (son pup.), secrétaire+ |
| `bagad-medias` | Lecture publique ; écriture : secrétaire+ |

Chaque bucket a ses policies sur `storage.objects`, avec la même rigueur que les tables.

## 9. Migrations

- Dossier `supabase/migrations/`, fichiers numérotés et horodatés (`NNN_*.sql`).
- Une migration = un sujet (ex. `006_events_rls.sql`).
- Chaque `create table` est suivi, **dans la même migration**, de `enable row level security` et de ses policies.
- Clés étrangères avec `on delete cascade` explicite sur les tables enfants (`event_pupitres`, `event_responses`, `profile_pupitres`) et `on delete restrict` sur les tables de référence (`pupitres`).
- Jamais d'édition manuelle en production sans migration correspondante.

## 10. Checklist : ajouter une table

- [ ] `enable row level security`
- [ ] Policies de lecture et d'écriture écrites explicitement (scinder `select`, `insert`, `update` si les droits diffèrent)
- [ ] Encapsuler les fonctions RLS dans `(select public.my_role_level())` pour l'optimisation InitPlan
- [ ] Table publique : filtre sur une colonne (`published`, `visibility`)
- [ ] Index sur les colonnes utilisées dans les policies :
  ```sql
  create index idx_profiles_role on public.profiles(role);
  create index idx_profile_pupitres on public.profile_pupitres(profile_id, pupitre_id);
  create index idx_event_pupitres on public.event_pupitres(event_id, pupitre_id);
  create index idx_events_lookup on public.events(visibility, is_poll);
  create index idx_event_responses on public.event_responses(event_id, profile_id);
  create index idx_invitations_email on public.invitations(email);
  ```
- [ ] `(select auth.uid())` plutôt que `auth.uid()` nu (meilleures performances)
- [ ] Ligne ajoutée dans la matrice (§5) et dans la liste des tables (§4)
- [ ] Test ci-dessous ajouté

## 11. Tester les policies

Pour chaque table, vérifier au minimum :

```sql
-- Visiteur
set local role anon;
select count(*) from public.events;        -- uniquement les représentations publiques
insert into public.events (...) values (...);  -- doit échouer

-- Membre
set local role authenticated;
set local request.jwt.claims = '{"sub": "<uuid-membre>"}';
select count(*) from public.events;        -- publiques + membres + tous les événements par pupitre
update public.profiles set role = 'admin' where id = '<uuid-membre>';  -- doit échouer
```

Un test par rôle et par table sensible. Une policy non testée est considérée comme absente.

## 12. Décisions

- **Pas d'annuaire** : un membre ne voit pas la liste des autres membres. `profiles` n'est lisible que par son propriétaire et par la secrétaire / l'admin. Un chef de pupitre voit les réponses de son pupitre via `event_responses` et `profile_pupitres` (nom et réponse uniquement), sans accès au reste des profils.
- **Titres du bureau non publics** : aucune policy de lecture pour `anon`. Un membre ne voit que ses propres titres.
- **Événements et visibilité (`public`, `interne`, `pupitre`)** :
  - `public` : visible par tous (visiteurs non connectés et membres).
  - `interne` : visible par tous les membres connectés approuvés.
  - `pupitre` : visible **uniquement** par les membres du ou des pupitres ciblés (ainsi que la secrétaire et l'admin). Un chef de pupitre ne crée et ne gère que les événements de son ou ses pupitres.
- **Documents partagés entre pupitres** : tous les membres lisent tous les documents ; seul le chef de pupitre (son pupitre), la secrétaire et l'admin peuvent écrire.

## 13. Compléments de la migration 002

- `notification_preferences` conserve les préférences OneSignal de chaque membre : activation globale, notifications d'événements et rappels de sondage. Les abonnements d'appareils restent gérés par OneSignal.
- `account_deletion_requests` enregistre les demandes de suppression de compte. Les durées de conservation et les règles finales d'anonymisation restent à définir.
- `articles.summary` et `articles.image_url` conservent les capacités éditoriales présentes dans l'ancien schéma. Le corps de l'article cible reste dans `articles.content`.
- Les fonctions `approve_member(uuid)` (secrétaire/admin, attribution du rôle `member` uniquement) et `set_profile_role(uuid, app_role)` (admin uniquement) sont les voies prévues pour modifier le rôle applicatif.
- Les buckets Storage sont `bagad-partitions` (privé, PDF, lecture par tous les membres approuvés) et `bagad-medias` (public, WebP, écriture secrétaire/admin). Les fichiers de partition sont rangés sous le slug du pupitre.
- Les photos JPG/JPEG sources jusqu'à 20 Mo doivent être converties côté serveur en WebP avant stockage dans `bagad-medias`. La migration configure le bucket de sortie, mais ne réalise pas elle-même la conversion.
- Le formulaire de contact reste géré par Netlify Forms : aucune table `contact` n'est créée dans le nouveau schéma.

## 14. Compléments de la migration 004

- `musician_level` catégorise le niveau musical du membre : `skolaj` (École de musique), `bagadig`, `bagad`.
- `profiles` s'enrichit de `nickname`, `birthdate`, `musician_level` et `costume_complete`.
- `member_loans` permet un suivi nominatif simplifié des équipements et costumes prêtés aux membres (`materiel` ou `costume`), avec dates d'emprunt et de retour.
- Seuls les administrateurs et secrétaires peuvent enregistrer des prêts ou modifier le niveau/costume via `update_member_status`.
