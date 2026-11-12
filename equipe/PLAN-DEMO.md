# Plan — Espace membre en mode démonstration

> **Rôle : ARCHITECTE.** Ce document fait foi pour l'équipe jusqu'à validation.
> Il ne remplace pas `equipe/PLAN.md` (socle backend) : il ajoute une mission
> temporaire, strictement limitée au développement local.
>
> **État : en attente de validation du client.** Aucune ligne de code de cette
> mission ne doit être écrite avant l'accord explicite sur ce plan.

---

## 1. Besoin

Construire l'intégralité de l'espace membre du site Bagad Penhars avec des
données fictives, sans Neon, PostgreSQL ni aucune base de données, afin de
valider l'ergonomie, le design, la navigation et les fonctionnalités avant
l'intégration backend.

La partie publique est considérée comme figée à 98 %. Elle ne doit pas être
refaite ni modifiée, sauf si un composant partagé doit être corrigé pour un
défaut bloquant — et dans ce cas, uniquement après accord.

---

## 2. Décisions validées par le client le 2026-11-11

| Sujet                    | Décision                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portée du mode démo      | **Développement local uniquement** (`npm run dev`). Jamais dans un build de production.                                                                                       |
| Accès                    | **Sélecteur de profil permanent** ; `/dashboard` accessible directement.                                                                                                      |
| Persistance              | **localStorage** avec bouton de réinitialisation des données fictives.                                                                                                        |
| Photos des membres       | **Portraits illustrés fictifs** générés localement, aucune personne réelle.                                                                                                   |
| Périmètre                | **Tout le périmètre documenté** : agenda/RSVP, trombinoscope, profil, événements, documents, articles, médias, notifications, invitations, membres, réglages.                 |
| Éditeur d'articles       | **Milkdown**, comme prévu par `docs/Spec.md`.                                                                                                                                 |
| Gestion des comptes      | **Conforme aux docs** : secrétaire = invitations, activation, suspension, pupitres ; admin = en plus, rôles, réglages, suppression.                                           |
| Modification des profils | **Conforme aux docs** : chacun son profil ; secrétaire/admin modifient les pupitres des autres ; admin attribue les rôles ; photo modifiable par son propriétaire uniquement. |
| Statuts de compte        | **Quatre rôles actifs uniquement** (`member`, `chef_pupitre`, `secretaire`, `admin`) ; pas de parcours `pending`/`suspended` simulé.                                          |
| Trombinoscope            | **Nouvelle route `/dashboard/membres`**, ouverte à tous les membres actifs.                                                                                                   |
| Notifications            | **Centre de notifications + envoi simulé** selon le rôle, sans push réel.                                                                                                     |
| Documents / partitions   | **Liste + dépôt simulé**, sans upload réel.                                                                                                                                   |

---

## 3. Périmètre

### 3.1 Inclus

1. **Socle de démonstration** : mode, types, données fictives, session simulée,
   permissions, services de données, persistance locale, réinitialisation.
2. **Coquille du tableau de bord** : navigation latérale sur ordinateur, barre
   supérieure et navigation mobile, bandeau « Mode démonstration », sélecteur
   de profil, accès direct à `/dashboard`.
3. **Accueil du tableau de bord** : résumé adapté au rôle (prochains
   événements, réponses en attente, notifications non lues, raccourcis).
4. **Agenda membre** : liste, filtres (à venir/passés, type, visibilité,
   pupitre), détail, réponse présent/absent, verrouillage à la date de clôture.
5. **Gestion des événements** : création, modification, annulation,
   suppression selon les droits ; ciblage d'un ou plusieurs pupitres ;
   événements publics, internes et de pupitre ; sondages (`is_poll`).
6. **Trombinoscope** : `/dashboard/membres`, recherche, filtre par pupitre,
   fiche membre, champs autorisés uniquement.
7. **Profil** : modification de ses informations autorisées, choix d'avatar,
   préférences de notifications, lecture seule du rôle et des pupitres.
8. **Documents / partitions** : liste pour tous, dépôt simulé pour les rôles
   autorisés, téléchargement simulé, filtre par pupitre.
9. **Espace pupitre** : tableau de bord du chef, événements de ses pupitres,
   documents, membres, notifications.
10. **Articles** : liste, création, édition, brouillon/publication,
    prévisualisation, éditeur Milkdown, contenu Markdown.
11. **Médias / albums** : liste des albums, création/modification simulée,
    photos fictives ou déjà publiques, ordre et légendes.
12. **Notifications** : boîte de réception, marquage lu/non lu, composeur
    simulé selon le rôle (chef = ses pupitres, secrétaire = plusieurs pupitres,
    admin = global).
13. **Administration** : membres, invitations, rôles, matrice des permissions,
    réglages, informations de sécurité et de session.
14. **Qualité** : responsive mobile-first, accessibilité, états vides, erreurs,
    confirmations, `prefers-reduced-motion`, tests unitaires, audit sécurité.

### 3.2 Exclu

- Toute connexion Neon, Drizzle, Hyperdrive, RLS, Better Auth réel ou lecture
  de `events`, `profiles`, etc. en base.
- Tout envoi réel d'e-mail (Resend), de notification push (OneSignal), de
  fichier (R2) ou de formulaire public.
- Tout upload binaire réel : les fichiers sont simulés (métadonnées + aperçu
  local), jamais envoyés.
- Les parcours `pending`, `suspended`, invitation réelle, mot de passe oublié
  et vérification d'e-mail.
- La PWA, le service worker et les notifications push.
- La modification de la partie publique, des dictionnaires i18n publics, du
  header/footer public, de l'agenda public et des médias publics.
- Le déploiement en production. Seul un commit et un push sur la branche
  `proto` sont demandés en fin de mission.
- Les fausses API présentées comme sécurisées.

### 3.3 Public figé

Aucun fichier sous `src/routes/(public)/`, `src/lib/i18n/`, `src/lib/data/`
(public), `src/lib/components/home/`, `src/lib/components/layout/` ou
`static/` (hors avatars de démo) n'est modifié par cette mission.

Les composants publics ne sont pas réutilisés dans le tableau de bord si cela
oblige à les modifier. Les tokens Tailwind (`marine`, `or`, `ivoire`, `ink`),
la typographie serif et les classes `container-page`, `eyebrow`, `btn-*` sont
en revanche partagés.

---

## 4. Architecture

### 4.1 Séparation des responsabilités

| Couche                 | Emplacement                                                                                                             | Responsabilité                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Composants d'interface | `src/lib/components/dashboard/`, `events/`, `members/`, `documents/`, `articles/`, `media/`, `notifications/`, `admin/` | Présentation, accessibilité, responsive. Aucune donnée fictive codée en dur dans le markup.                           |
| Données fictives       | `src/lib/demo/fixtures/`                                                                                                | Jeu de données déterministe, typé, sans données personnelles réelles.                                                 |
| Utilisateurs simulés   | `src/lib/demo/session.svelte.ts`                                                                                        | Profil actif, changement de rôle, persistance de la session.                                                          |
| Permissions            | `src/lib/demo/permissions.ts` + `src/lib/auth/permissions.ts`                                                           | Fonctions pures, réutilisables, évaluées avant chaque action.                                                         |
| Services de données    | `src/lib/demo/services/`                                                                                                | Lecture et mutations simulées, avec contrôle de permission. Interface identique à celle que devra exposer le backend. |
| État persistant        | `src/lib/demo/store.svelte.ts`                                                                                          | État réactif Svelte 5, localStorage versionné, réinitialisation.                                                      |
| Mode                   | `src/lib/demo/mode.ts`                                                                                                  | Détection `dev` uniquement, chargement dynamique, absence en production.                                              |
| Pages                  | `src/routes/dashboard/**`                                                                                               | Assemblage des composants et des services. Mêmes composants demain avec des `load`/actions Neon.                      |

### 4.2 Arborescence prévue

```text
src/lib/demo/
├── mode.ts                     # isDemoMode(), garde de développement
├── clock.ts                    # date de démonstration figée
├── types.ts                    # types miroirs de docs/database.md
├── fixtures/
│   ├── pupitres.ts
│   ├── profiles.ts
│   ├── events.ts
│   ├── responses.ts
│   ├── notifications.ts
│   ├── documents.ts
│   ├── articles.ts
│   ├── albums.ts
│   ├── invitations.ts
│   └── index.ts                # seed complet + contrôle d'intégrité
├── session.svelte.ts           # profil actif + changement de rôle
├── store.svelte.ts             # état réactif + localStorage + reset
├── permissions.ts              # matrice et helpers de portée
├── services/
│   ├── profiles.ts
│   ├── events.ts
│   ├── responses.ts
│   ├── documents.ts
│   ├── articles.ts
│   ├── albums.ts
│   ├── notifications.ts
│   ├── invitations.ts
│   ├── members.ts
│   └── index.ts
├── components/
│   ├── DemoBanner.svelte
│   ├── DemoRoleSwitcher.svelte
│   ├── DemoReset.svelte
│   └── DemoGuardNotice.svelte
└── README.md                   # avertissement : simulation, pas de sécurité

src/lib/components/dashboard/
├── DashboardShell.svelte
├── DashboardSidebar.svelte
├── DashboardTopbar.svelte
├── DashboardMobileNav.svelte
├── DashboardPageHeader.svelte
├── StatCard.svelte
├── DataTable.svelte
├── EmptyState.svelte
├── ConfirmDialog.svelte
├── FormField.svelte
└── RoleBadge.svelte

src/lib/components/events/       # EventCard, EventList, EventFilters,
                                 # EventForm, EventPresence, PresenceSummary
src/lib/components/members/      # MemberCard, MemberGrid, MemberFilters,
                                 # MemberProfile
src/lib/components/documents/    # FileCard, FileList, FileUpload, FileActions
src/lib/components/articles/     # ArticleList, ArticleForm, ArticlePreview
src/lib/components/media/        # AlbumGrid, AlbumForm, MediaGallery
src/lib/components/notifications/# NotificationList, NotificationCard,
                                 # NotificationForm, NotificationBell
src/lib/components/admin/        # MemberAdminTable, InvitationTable,
                                 # PermissionMatrix, SettingsForm
```

Les fichiers existants vides ou squelettiques (`src/lib/components/events/*`,
`members/*`, etc.) sont remplis plutôt que dupliqués, afin de respecter
`docs/Structure.md`.

### 4.3 Routes

```text
/dashboard                          Accueil adapté au rôle
/dashboard/agenda                   Agenda membre + RSVP + gestion selon droits
/dashboard/membres                  Trombinoscope (nouvelle route validée)
/dashboard/profil                   Profil et préférences
/dashboard/documents                Documents et partitions
/dashboard/notifications            Boîte de réception
/dashboard/pupitre                  Espace chef de pupitre
/dashboard/pupitre/documents        Dépôt et gestion des documents du pupitre
/dashboard/pupitre/membres          Membres du pupitre
/dashboard/pupitre/notifications    Notification de ses pupitres
/dashboard/admin                    Accueil administration
/dashboard/admin/membres            Gestion des membres
/dashboard/admin/invitations        Invitations
/dashboard/admin/permissions        Rôles et matrice des permissions
/dashboard/admin/agenda             Gestion globale des événements
/dashboard/admin/agenda/new         Création d'un événement
/dashboard/admin/articles           Articles
/dashboard/admin/articles/new       Nouvel article
/dashboard/admin/articles/[id]/edit Édition d'un article
/dashboard/admin/media              Albums et médias
/dashboard/admin/notifications      Notifications globales
/dashboard/admin/settings           Réglages
/dashboard/securite                 Session et informations de sécurité
```

La gestion des événements par un chef se fait dans `/dashboard/agenda` avec
des actions filtrées par ses pupitres, et non par une route `admin` à laquelle
il n'a pas droit. Les routes `admin/*` sont accessibles à la secrétaire et à
l'admin selon la matrice ; le nom du dossier ne vaut pas autorisation.

### 4.4 Mode démonstration et absence en production

- `src/lib/demo/mode.ts` expose `isDemoMode()` qui retourne uniquement
  `dev` (`$app/environment`). Aucune variable d'environnement, aucun cookie,
  aucune URL ne peut activer la démo dans un build.
- Tous les imports de `src/lib/demo/**` sont **dynamiques** et placés derrière
  `if (isDemoMode())`. En production, `dev === false`, la branche est éliminée
  par le compilateur et les chunks de démo ne sont pas produits.
- `src/routes/dashboard/+layout.ts` exporte `ssr = !dev` : la démo est rendue
  côté client (localStorage disponible), la production conserve le SSR.
- En production, `src/routes/dashboard/+layout.server.ts` ne renvoie aucun
  utilisateur de démo. Il garde le comportement réel : redirection vers
  `/auth/login` si aucune session valide.
- `src/hooks.server.ts` et `src/routes/api/auth/[...all]/+server.ts` importent
  `$lib/server/auth` et `$lib/db` **dynamiquement**, uniquement hors démo.
  `src/routes/auth/login/+page.server.ts` fait de même dans son action. But :
  permettre `npm run dev` sans `DATABASE_URL`, sans modifier le comportement
  de production.
- Vérification obligatoire après `npm run build` : recherche du marqueur
  `__BAGAD_DEMO__` dans `.svelte-kit/output` et `build`. Le build échoue la
  revue si le marqueur est présent.
- Aucune route de démo n'est ajoutée sous `/demo` : le sélecteur et le bandeau
  vivent dans `/dashboard` et disparaissent en production.

### 4.5 Persistance

- Clé unique : `bagadpenhars.demo.v1`.
- État sérialisé : version, date de démonstration, profil actif, profils,
  événements, réponses, notifications, documents, articles, albums,
  invitations, préférences.
- Écriture après chaque mutation ; lecture au premier montage ; réinitialisation
  explicite avec confirmation.
- En cas de version inconnue, de JSON invalide ou de quota dépassé, l'état
  revient au seed et un message discret l'indique.
- Synchronisation entre onglets via l'événement `storage`.
- Aucune donnée réelle, aucun secret, aucun jeton dans le localStorage.

### 4.6 Date de démonstration

Pour éviter que la démo ne « pourrisse » (événements passés, RSVP verrouillés),
la date de référence est figée dans `src/lib/demo/clock.ts` :
`DEMO_TODAY = '2026-11-11'`. Tous les calculs « à venir / passé / verrouillé »
utilisent cette date et le fuseau `Europe/Paris`. L'interface indique
discrètement « Date de démonstration : 11 novembre 2026 ».

---

## 5. Données fictives

### 5.1 Volume et cohérence

- **24 membres** répartis sur les quatre pupitres, avec plusieurs membres
  multi-pupitres.
- **1 chef de pupitre dirigeant deux pupitres** (Bombarde et Cornemuse) pour
  démontrer la règle « un chef peut diriger plusieurs pupitres ».
- **1 secrétaire**, **1 administrateur**, **1 membre simple**, plus des profils
  de démonstration pour chaque pupitre.
- **14 événements** : publics, internes, de pupitre, multi-pupitres, passés,
  futurs, annulés, sondages (`is_poll`), neuf types représentés.
- **Réponses** : présent, absent et sans réponse, sur plusieurs événements et
  plusieurs membres, pour alimenter les compteurs.
- **8 notifications** : création d'événement, rappel, document, message
  d'administration, lues et non lues.
- **6 documents** PDF fictifs, répartis par pupitre.
- **4 articles** : 3 publiés, 1 brouillon.
- **3 albums** avec photos et légendes.
- **3 invitations** : en attente, acceptée, expirée.
- **Préférences de notifications** par profil.

Tous les noms, prénoms, adresses e-mail, niveaux et fonctions sont inventés.
Aucune donnée personnelle réelle, aucun numéro de téléphone réel, aucune
adresse postale de membre.

### 5.2 Types miroirs du modèle

Les types de `src/lib/demo/types.ts` reprennent les ENUM et les champs de
`docs/database.md` :

- `AppRole` : `member`, `chef_pupitre`, `secretaire`, `admin`.
- `AccountStatus` : uniquement `active` dans la démo.
- `EventType` : `sortie`, `concert`, `fest-noz`, `festival`, `concours`,
  `gala`, `repetition`, `reunion`, `repas`.
- `EventVisibility` : `public`, `interne`, `pupitre`.
- `ResponseStatus` : `present`, `absent`.
- `MusicianLevel` : `skolaj`, `bagadig`, `bagad`.
- Pupitres : `bombarde`, `cornemuse`, `caisse-claire`, `percussion`
  (identifiants alignés sur `src/lib/data/pupitres.ts`).

Les entités sont nommées comme les futures entités serveur afin que le
remplacement des services ne change pas les composants :

```ts
DemoProfile { id, firstName, lastName, email, role, accountStatus,
              level, bureauPosition, pupitres: { pupitreId, isChef }[],
              avatar, joinedAt }

DemoEvent { id, title, description, date, type, visibility, isPoll,
            status: 'active' | 'cancelled', pupitreIds, createdBy,
            location }

DemoResponse { eventId, profileId, status, updatedAt }

DemoNotification { id, title, body, createdAt, read, recipientIds,
                   audience, sentBy }

DemoDocument { id, title, description, pupitreId, fileName, mimeType,
               sizeBytes, uploadedBy, uploadedAt }

DemoArticle { id, title, slug, excerpt, contentMarkdown, status,
              authorId, publishedAt, updatedAt }

DemoAlbum { id, title, description, date, published, photos: DemoMedia[] }
DemoMedia { id, albumId, src, caption, order }

DemoInvitation { id, email, firstName, lastName, pupitreIds,
                 status: 'pending' | 'accepted' | 'expired' | 'cancelled',
                 sentAt, expiresAt, invitedBy }

DemoPreferences { profileId, global, reminders, events }
```

### 5.3 Avatars

- 24 portraits **illustrés** (style vectoriel plat, pas de photoreportage),
  stockés dans `static/demo/avatars/`.
- Aucun visage réel, aucune image générée à partir d'une personne existante.
- Chaque profil référence un fichier ; le trombinoscope affiche la variante
  vignette, la fiche affiche la variante détaillée.
- Le membre peut choisir un autre avatar dans une galerie fictive ; il ne peut
  pas modifier celui d'un autre.

### 5.4 Contenus des albums

Les albums de démonstration réutilisent uniquement des photographies déjà
publiques du site (`static/`) ou des visuels illustrés. Aucune nouvelle photo
de personne réelle n'est ajoutée. Les légendes restent descriptives et ne
nomment personne.

---

## 6. Rôles, permissions et règles métier

### 6.1 Matrice

| Action                              | member                   | chef_pupitre                                   | secretaire         | admin  |
| ----------------------------------- | ------------------------ | ---------------------------------------------- | ------------------ | ------ |
| Voir l'agenda selon visibilité      | oui                      | oui                                            | oui                | oui    |
| Répondre présent/absent             | oui, événements visibles | oui                                            | oui                | oui    |
| Créer/modifier/annuler un événement | non                      | ses pupitres uniquement, un seul pupitre cible | tous               | tous   |
| Supprimer un événement              | non                      | non (archivage/annulation)                     | oui                | oui    |
| Voir les présences                  | oui, agrégées            | ses pupitres                                   | tous               | tous   |
| Consulter le trombinoscope          | oui                      | oui                                            | oui                | oui    |
| Modifier son profil                 | oui                      | oui                                            | oui                | oui    |
| Modifier les pupitres d'un autre    | non                      | non                                            | oui                | oui    |
| Attribuer un rôle                   | non                      | non                                            | non                | oui    |
| Déposer un document                 | non                      | ses pupitres                                   | tous               | tous   |
| Lire tous les documents             | oui                      | oui                                            | oui                | oui    |
| Gérer les articles                  | non                      | non                                            | oui                | oui    |
| Gérer les albums                    | non                      | non                                            | oui                | oui    |
| Notifier                            | non                      | ses pupitres                                   | plusieurs pupitres | global |
| Inviter / activer / suspendre       | non                      | non                                            | oui                | oui    |
| Gérer les rôles et réglages         | non                      | non                                            | non                | oui    |
| Voir la matrice des permissions     | non                      | non                                            | lecture            | oui    |

### 6.2 Règles de portée

- Un chef ne voit et ne gère que les événements dont **un seul** pupitre cible
  est un pupitre qu'il dirige. Il ne peut pas créer ni modifier un événement
  multi-pupitres ou global.
- Un membre ne voit un événement `pupitre` que si l'un de ses pupitres est
  ciblé. Il voit tous les événements `interne` et `public`.
- Un membre peut répondre aux événements `public` et `interne` visibles et aux
  événements `pupitre` de ses pupitres.
- Une réponse est modifiable jusqu'à la fin de la date de l'événement, puis
  verrouillée à minuit `Europe/Paris` le lendemain. Elle n'est jamais retirée
  par le membre. L'annulation ou la clôture conserve les réponses en lecture
  seule.
- La secrétaire gère tous les événements et tous les pupitres, mais ne
  attribue pas les rôles et ne modifie pas les réglages globaux.
- L'admin dispose de toutes les fonctions d'administration.
- Les titres du bureau sont informatifs et ne donnent aucun droit.

### 6.3 Contrôle des permissions

- Les mêmes fonctions de permission sont utilisées par l'interface (afficher,
  désactiver, masquer) **et** par les services de démonstration (refuser une
  mutation). Masquer un bouton ne suffit jamais.
- Chaque service lève une erreur explicite `DemoPermissionError` si l'action
  n'est pas autorisée ; l'interface affiche un message et ne modifie rien.
- **Aucune revendication de sécurité** : le README de `src/lib/demo/` et le
  bandeau indiquent que tout s'exécute dans le navigateur, que les données sont
  fictives et que les futurs guards serveur resteront seuls autoritaires.
- Aucun appel `fetch` vers une fausse API d'authentification ou
  d'autorisation. Aucun service ne prétend vérifier un rôle côté serveur.

---

## 7. Expérience utilisateur

### 7.1 Coquille

- **Ordinateur** : barre latérale fixe avec le logo, le profil actif, les
  sections autorisées, un lien de retour au site public.
- **Mobile** : barre supérieure compacte, menu déroulant accessible, navigation
  inférieure pour les quatre entrées principales.
- **Bandeau de démonstration** : visible en permanence, texte court,
  bouton « Changer de profil », bouton « Réinitialiser ».
- **Sélecteur de profil** : liste des profils de démonstration avec rôle,
  pupitres et avatar ; le changement actualise immédiatement les menus, les
  pages et les actions.
- **Thème** : marine, or, ivoire, encre ; titres serif ; filets et ornements
  discrets ; pas de cartes génériques « design IA ».
- **Accessibilité** : focus visible, contrastes WCAG AA, labels, `aria-current`,
  navigation clavier, `prefers-reduced-motion`.

### 7.2 Écrans et comportements attendus

| Écran            | Contenu                                                                          | Interactions                                                   |
| ---------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Accueil          | Salutation, prochains événements, réponses manquantes, notifications, raccourcis | Navigation, ouverture d'un événement                           |
| Agenda           | Filtres, liste groupée, badges de visibilité/type, état de réponse               | Répondre, modifier sa réponse, gérer un événement selon droits |
| Détail événement | Date, type, visibilité, pupitres, description, présences                         | RSVP, édition, annulation, suppression admin                   |
| Trombinoscope    | Grille, recherche, filtre pupitre, fiche                                         | Ouvrir une fiche, voir les champs autorisés                    |
| Profil           | Identité, pupitres, niveau, fonction, avatar, préférences                        | Modifier, enregistrer, annuler, changer d'avatar               |
| Documents        | Liste, filtre, badges pupitre, taille                                            | Télécharger (simulé), déposer (si autorisé)                    |
| Articles         | Liste, statut, auteur, date                                                      | Créer, éditer, prévisualiser, publier/dépublier                |
| Médias           | Albums, photos, légendes                                                         | Créer/modifier un album, ajouter une photo fictive             |
| Notifications    | Liste lue/non lue, filtres                                                       | Marquer lu, tout marquer lu, composer un envoi simulé          |
| Pupitre          | Résumé, événements, documents, membres                                           | Gérer son périmètre                                            |
| Admin membres    | Tableau, filtres, statut, pupitres                                               | Inviter, activer, suspendre, modifier pupitres, rôle (admin)   |
| Invitations      | Liste, états, expiration                                                         | Inviter, renvoyer, annuler                                     |
| Permissions      | Matrice et explication                                                           | Lecture seule                                                  |
| Réglages         | Informations association, notifications, stockage simulé                         | Enregistrer (admin)                                            |
| Sécurité         | Profil actif, rôle, portée, garanties de la démo                                 | Réinitialiser la démo                                          |

### 7.3 États et retours

- Chargement simulé court et discret pour les mutations.
- Succès : toast ou message inline.
- Refus : message explicite, aucune donnée modifiée.
- Confirmations avant suppression, annulation, réinitialisation.
- États vides : texte utile et action pertinente.
- Formulaires : validation côté client avec messages en français, champs
  obligatoires signalés, conservation des valeurs en cas d'erreur.

---

## 8. Sécurité et confidentialité

1. **Aucune donnée réelle** : noms, e-mails, téléphones, adresses et photos
   sont fictifs ; les visuels sont illustrés ou déjà publics.
2. **Séparation stricte** : la démo n'existe qu'en développement ; le code de
   démonstration n'est pas chargé en production et aucun cookie ni variable
   d'environnement ne peut l'activer.
3. **Pas de fausse API** : les services de démonstration sont des modules
   client clairement nommés ; ils ne simulent pas une API sécurisée et ne
   contournent aucun futur guard serveur.
4. **Permissions centralisées** : une seule source de vérité pour les droits,
   utilisée par l'UI et les services ; les contrôles sont testés.
5. **Pas de secrets** : aucune clé, aucun jeton, aucune chaîne de connexion
   dans le code ou le localStorage.
6. **XSS** : le contenu Markdown des articles est rendu avec un rendu sûr
   (Milkdown pour l'édition, texte échappé pour l'aperçu) ; pas de
   `{@html}` sur une saisie utilisateur non assainie.
7. **LocalStorage** : limité aux données fictives, versionné, réinitialisable,
   sans information sensible.
8. **Production inchangée** : les guards, hooks et routes d'authentification
   conservent leur comportement ; seuls leurs imports sont rendus dynamiques
   pour ne pas charger Neon en démo.

---

## 9. Dépendances

- **Milkdown** (éditeur demandé par le client et prévu par `docs/Spec.md`) :
  installation justifiée dans `docs/journal.md`. Composant isolé, chargé
  uniquement côté client, pour ne pas peser sur le rendu serveur.
- Aucune autre dépendance. Les avatars sont des SVG locaux, les dates sont
  manipulées avec `Intl`/`Date`, les formulaires avec Svelte 5.

Si Milkdown s'avère incompatible avec Svelte 5 ou le build, l'équipe s'arrête
et signale la mesure au client ; elle ne remplace pas silencieusement l'éditeur
par un composant différent.

---

## 10. Tests et validation

### 10.1 Tests unitaires

- `tests/demo/permissions.test.ts` : matrice complète, portée des chefs,
  multi-pupitres, secrétaire/admin, refus des membres.
- `tests/demo/rsvp.test.ts` : verrouillage à minuit `Europe/Paris`, pas de
  retrait, conservation après annulation, changement de date.
- `tests/demo/store.test.ts` : seed, mutations, persistance, version inconnue,
  reset, absence de données réelles.
- `tests/demo/fixtures.test.ts` : intégrité référentielle, identifiants
  uniques, quatre pupitres, tous les rôles, toutes les visibilités, réponses
  valides.
- `tests/demo/mode.test.ts` : `isDemoMode()` vrai en développement, faux en
  production ; aucun marqueur de démo dans le build.

Les tests existants sont conservés. Les échecs préexistants non liés sont
signalés, pas masqués.

### 10.2 Parcours par rôle (testeur)

1. **Membre** : dashboard, agenda filtré, RSVP, trombinoscope, documents,
   profil, notifications ; aucun menu d'administration ; aucune action de
   gestion d'événement.
2. **Chef (Bombarde + Cornemuse)** : tout le membre + gestion des événements de
   ses deux pupitres, dépôt de documents, notification de ses pupitres ; refus
   sur Caisse claire et Percussion ; refus des événements multi-pupitres.
3. **Secrétaire** : tous les événements, documents, articles, albums,
   notifications multi-pupitres, invitations, activation/suspension,
   modification des pupitres ; pas d'attribution de rôle ni de réglages
   globaux.
4. **Admin** : tout + rôles, réglages, suppression, matrice des permissions.

Chaque parcours est vérifié sur ordinateur et mobile, avec rechargement de page
pour contrôler la persistance, puis réinitialisation.

### 10.3 Validations techniques

- `npm run check`
- `npm run lint`
- `npm run build` (avec `DATABASE_URL` chargée, comme aujourd'hui)
- `npx vitest run tests/demo`
- Recherche du marqueur `__BAGAD_DEMO__` dans le build de production :
  absent.
- Vérification que la partie publique est inchangée (`git diff` limité aux
  fichiers de la mission).

### 10.4 Documentation

- `docs/architecture.md` : section « Mode démonstration » et routes.
- `docs/Structure.md` : ajout de `/dashboard/membres` et des composants.
- `docs/journal.md` : entrée datée (décisions, dépendance Milkdown, pièges,
  validations).
- `docs/questions.md` : décisions du 2026-11-11.
- `equipe/PLAN-DEMO.md` : ce plan.
- `equipe/TESTS-DEMO.md` : rapport du testeur.
- `equipe/AUDIT-DEMO.md` : rapport de l'auditeur sécurité.

---

## 11. Étapes de réalisation

| #   | Étape                                                                            | Maître d'œuvre      | Critère de fin                                                             |
| --- | -------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------- |
| 0   | Validation du plan                                                               | Client + architecte | Accord explicite ; aucune ligne de code avant.                             |
| 1   | Socle démo : types, fixtures, date, store, session, permissions, services, tests | Développeur données | Seed intègre, store persistant, reset, tests permissions/RSVP/store verts. |
| 2   | Coquille : shell, navigation, bandeau, sélecteur, reset, routes vides protégées  | Développeur UI      | Toutes les routes existent ; menus adaptés au rôle ; mobile/desktop.       |
| 3   | Agenda + RSVP + gestion des événements                                           | UI + données        | Parcours membre, chef, secrétaire, admin ; verrouillage correct.           |
| 4   | Trombinoscope + filtres + fiche                                                  | UI + données        | Tous les champs autorisés, aucun champ privé.                              |
| 5   | Profil + préférences + avatar                                                    | UI + données        | Modification persistante, rôle/pupitres en lecture seule.                  |
| 6   | Documents + espace pupitre                                                       | UI + données        | Dépôt simulé, portée des chefs, lecture pour tous.                         |
| 7   | Articles + Milkdown + aperçu                                                     | UI                  | Création/édition/publi, Markdown conservé, build OK.                       |
| 8   | Médias / albums                                                                  | UI + données        | Albums, photos, ordre, légendes, persistance.                              |
| 9   | Notifications                                                                    | UI + données        | Boîte, lu/non lu, composeur selon portée.                                  |
| 10  | Administration : membres, invitations, rôles, permissions, réglages, sécurité    | UI + données        | Matrice respectée, refus explicites.                                       |
| 11  | Finitions : responsive, accessibilité, états vides/erreurs, reduced motion       | UI                  | Contrôles clavier, contrastes, aucun débordement.                          |
| 12  | QA complète + audit sécurité + corrections                                       | Testeur + sécurité  | `TESTS-DEMO.md` et `AUDIT-DEMO.md` sans blocage.                           |
| 13  | Documentation, validations finales, commit et push `proto`                       | Architecte + UI     | `check`/`lint`/`build` OK, absence prod vérifiée, commit poussé.           |

---

## 12. Critères d'acceptation

1. L'espace membre est parcourable **sans base de données** et sans variable
   `DATABASE_URL`, en `npm run dev`.
2. Les quatre rôles disposent de menus, pages et actions conformes à la
   matrice ; les actions interdites sont refusées par les services, pas
   seulement masquées.
3. Le changement de profil met à jour immédiatement l'interface et les droits.
4. Les modifications persistent après rechargement et se réinitialisent
   proprement.
5. Chaque module du périmètre est utilisable : agenda/RSVP, trombinoscope,
   profil, documents, articles, médias, notifications, administration.
6. Aucune donnée personnelle réelle, aucune fausse API sécurisée, aucun
   contournement des futurs guards serveur.
7. Le code de démonstration est absent du build de production.
8. La partie publique est inchangée.
9. `npm run check`, `npm run lint`, `npm run build` passent ; les tests de démo
   passent ; les échecs préexistants sont documentés.
10. La documentation est à jour et le commit est poussé sur `proto`.

---

## 13. Risques et points d'attention

| Risque                                           | Mesure                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Milkdown incompatible avec Svelte 5 ou le build  | Composant client-only isolé, test de build ; arrêt et arbitrage client si blocage.              |
| Code de démo présent dans le build               | Imports dynamiques derrière `dev`, `ssr = !dev`, recherche du marqueur `__BAGAD_DEMO__`.        |
| `hooks.server.ts` charge Neon en démo            | Imports dynamiques de `auth`/`db` hors démo, test sans `DATABASE_URL`.                          |
| localStorage indisponible ou plein               | Repli mémoire + message, reset, aucune image en base64.                                         |
| Démo qui « pourrit » avec le temps               | Date de référence figée `2026-11-11`, affichée dans l'interface.                                |
| Duplication avec les squelettes existants        | Remplir les fichiers prévus par `docs/Structure.md`, pas de nouvelles arborescences parallèles. |
| Fuite de données réelles via les photos d'albums | Visuels illustrés ou photos déjà publiques uniquement, légendes sans noms.                      |
| Régression de la partie publique                 | Périmètre de fichiers strict, `git diff` contrôlé, aucun changement i18n public.                |

---

## 14. Points ouverts

Aucun point bloquant après les décisions du 2026-11-11. Les choix restants sont
des choix d'implémentation que l'équipe peut trancher sans nouvelle validation
client :

- nombre exact de visuels d'avatars et style graphique ;
- noms et profils des 24 membres fictifs ;
- contenu exact des articles et albums de démonstration ;
- version de Milkdown et plugins retenus ;
- forme des toasts et des confirmations.

Ils seront consignés dans `docs/journal.md` au moment de leur mise en œuvre.

---

## 15. Validation demandée

Le client est invité à valider :

1. le périmètre inclus/exclu du §3 ;
2. l'architecture et la séparation des couches du §4 ;
3. les règles de rôle et de portée du §6 ;
4. la stratégie d'absence en production du §4.4 ;
5. les critères d'acceptation du §12.

**Tant que cette validation n'est pas donnée, aucune modification de code n'est
engagée.**
