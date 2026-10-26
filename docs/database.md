# Base de données : schéma, rôles et RLS

> Source de vérité : les migrations `supabase/migrations/NNN_*.sql`.
> Ce document les résume. Toute modification du schéma met à jour ce fichier **dans le même commit**.

Le dépôt ne contient pas encore le dossier `supabase/migrations/`. La migration
présente sous `migrations/` est historique et dépend d'un schéma
d'authentification différent; elle n'est pas prête à être appliquée à Supabase.
Créer et valider les migrations Supabase avant d'utiliser ce schéma en
développement ou en production.

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
create type event_visibility as enum ('public', 'members', 'pupitre');
create type response_status as enum ('yes', 'no', 'maybe');
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
| `profiles` | Un profil par utilisateur (`id` = `auth.users.id`), nom, prénom, `role` |
| `pupitres` | bombarde, cornemuse, caisse claire, percussion |
| `profile_pupitres` | Liaison membre ↔ pupitres (plusieurs possibles) |
| `bureau_positions` | Titres du bureau historisés (honorifiques, aucun droit) |
| `invitations` | Invitation envoyée : email, nom, prénom, pupitre, auteur |
| `event_series` | Séries récurrentes (règle `rrule`) |
| `events` | Représentations et répétitions, avec `visibility` et `pupitre_id` |
| `event_responses` | Réponse d'un membre à un événement (`yes` / `no` / `maybe`) |
| `polls`, `poll_responses` | Sondages de répétition ; un sondage crée l'événement d'agenda |
| `documents` | Partitions PDF, rattachées à un pupitre |
| `articles` | Actualités, avec `published` |
| `albums`, `media` | Albums photo et médias |
| `notification_log` | Trace des envois OneSignal |
| `audit_log` | Journal d'audit des actions sensibles |

## 5. Matrice des droits

L = lecture, E = écriture (créer / modifier / supprimer), « soi » = ses propres lignes, « pup. » = son ou ses pupitres.

| Table | Visiteur | Membre | Chef de pupitre | Secrétaire | Admin |
|---|---|---|---|---|---|
| `profiles` | – | L/E soi | L/E soi | L tous | L/E tous |
| `pupitres` | L | L | L | L | L/E |
| `profile_pupitres` | – | L soi | L pup. | L/E | L/E |
| `bureau_positions` | – | L soi | L soi | L/E | L/E |
| `invitations` | – | – | – | L/E | L/E |
| `events` | L si `public` | L `public`, `members`, son pup. | + E pour son pup. | L/E tous | L/E tous |
| `event_responses` | – | L/E soi | L pup. | L tous | L tous |
| `polls` | – | L | L, E pour son pup. | L/E | L/E |
| `poll_responses` | – | L/E soi | L pup. | L tous | L tous |
| `documents` | – | L tous | L tous, E son pup. | L/E tous | L/E tous |
| `articles` | L si `published` | L si `published` | L si `published` | L/E tous | L/E tous |
| `albums`, `media` | L si public | L | L | L/E | L/E |
| `notification_log` | – | – | L soi | L soi | L tous |
| `audit_log` | – | – | – | – | L |

Les écritures de `notification_log` et `audit_log` passent uniquement par le serveur (`service_role`) : aucune policy d'écriture pour les rôles `anon` et `authenticated`.

## 6. Policies : modèles à suivre

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
using (public.my_role_level() >= 3);

create policy "articles: écriture secrétaire+"
on public.articles for all
to authenticated
using (public.my_role_level() >= 3)
with check (public.my_role_level() >= 3);
```

### Table mixte public / privé (`events`)

```sql
alter table public.events enable row level security;

create policy "events: représentations publiques"
on public.events for select
to anon, authenticated
using (visibility = 'public');

create policy "events: membres"
on public.events for select
to authenticated
using (
  public.my_role_level() >= 1
  and (
    visibility = 'members'
    or (visibility = 'pupitre' and pupitre_id in (select public.my_pupitre_ids()))
  )
);

create policy "events: écriture secrétaire+"
on public.events for all
to authenticated
using (public.my_role_level() >= 3)
with check (public.my_role_level() >= 3);

create policy "events: écriture chef de pupitre sur son pupitre"
on public.events for all
to authenticated
using (
  public.my_role_level() = 2
  and visibility = 'pupitre'
  and pupitre_id in (select public.my_pupitre_ids())
)
with check (
  public.my_role_level() = 2
  and visibility = 'pupitre'
  and pupitre_id in (select public.my_pupitre_ids())
);
```

### Lignes personnelles (`event_responses`)

```sql
create policy "responses: lecture et écriture de soi"
on public.event_responses for all
to authenticated
using (profile_id = (select auth.uid()) and public.my_role_level() >= 1)
with check (profile_id = (select auth.uid()) and public.my_role_level() >= 1);
```

### Profils : protéger la colonne `role`

Un membre peut modifier son profil, **pas son rôle**.

```sql
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, avatar_path, phone) on public.profiles to authenticated;
```

Le changement de rôle passe par une policy ou une fonction réservée à l'admin (niveau 4), jamais par un `update` libre.

## 7. Création de compte

1. Un admin ou une secrétaire crée une ligne dans `invitations` (email, nom, prénom, pupitre) puis déclenche l'invitation côté serveur (`auth.admin.inviteUserByEmail`).
2. Un trigger sur `auth.users` crée le profil en `pending` et lit le nom et le pupitre dans **`invitations`** (jamais dans `user_metadata`).
3. L'invité crée son mot de passe. Il reste `pending`, sans accès à l'espace adhérents.
4. Un admin ou une secrétaire passe le profil à `member`.

## 8. Storage

| Bucket | Accès |
|---|---|
| `bagad-avatars` | Lecture : membres ; écriture : propriétaire dans son dossier (`<uid>/…`) |
| `bagad-partitions` | **Privé** ; lecture : tous les membres (tous pupitres) ; écriture : chef de pupitre (son pup.), secrétaire+ |
| `bagad-medias` | Lecture publique ; écriture : secrétaire+ |

Chaque bucket a ses policies sur `storage.objects`, avec la même rigueur que les tables.

## 9. Migrations

- Dossier `supabase/migrations/`, fichiers numérotés et horodatés.
- Une migration = un sujet (ex. `006_events_rls.sql`).
- Chaque `create table` est suivi, **dans la même migration**, de `enable row level security` et de ses policies.
- Jamais d'édition manuelle en production sans migration correspondante.

## 10. Checklist : ajouter une table

- [ ] `enable row level security`
- [ ] Policies de lecture et d'écriture écrites explicitement
- [ ] Table publique : filtre sur une colonne (`published`, `visibility`)
- [ ] Index sur les colonnes utilisées dans les policies (`profile_id`, `pupitre_id`)
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
select count(*) from public.events;        -- publiques + members + son pupitre
update public.profiles set role = 'admin' where id = '<uuid-membre>';  -- doit échouer
```

Un test par rôle et par table sensible. Une policy non testée est considérée comme absente.

## 12. Décisions

- **Pas d'annuaire** : un membre ne voit pas la liste des autres membres. `profiles` n'est lisible que par son propriétaire et par la secrétaire / l'admin. Un chef de pupitre voit les réponses de son pupitre via `event_responses` et `profile_pupitres` (nom et réponse uniquement), sans accès au reste des profils.
- **Titres du bureau non publics** : aucune policy de lecture pour `anon`. Un membre ne voit que ses propres titres.
- **Documents partagés entre pupitres** : tous les membres lisent tous les documents ; seul le chef de pupitre (son pupitre), la secrétaire et l'admin peuvent écrire.