# Contrat d'API — Site Bagad Penhars

> Rôle : ARCHITECTE. Contrat entre le développeur backend et le développeur frontend.
> Établi le **2026-11-08** à partir de `AGENTS.md`, `docs/brief.md`, `docs/Spec.md`,
> `docs/Spec_UI.md`, `docs/architecture.md`, `docs/database.md`, `docs/pwa.md`,
> `docs/event.md`, `docs/media.md`, `docs/questions.md`, `equipe/BESOINS.md`,
> `equipe/PLAN.md` et de l'état réel des routes sous `src/routes/`.
>
> Ce document ne remplace ni `docs/Spec.md` (référence fonctionnelle) ni
> `equipe/PLAN.md` (plan d'exécution). En cas de contradiction, `docs/Spec.md` et
> les décisions de `docs/questions.md` prévalent ; les points non tranchés sont
> marqués **À CONFIRMER** et renvoient à la question ouverte correspondante.
>
> Aucune question `Q-2026-11-08-01` à `Q-2026-11-08-09` n'est tranchée ici.
>
> **Mise à jour du 2026-11-18** : les décisions client Q-2026-11-17-01 à -04
> (détail dans `docs/questions.md` et `equipe/PLAN.md` §0) sont intégrées. Elles
> ne changent que : le type `TrombinoscopeEntry` et `PublicArticle` (§3), la
> durée d'invitation (§5.5, §9.6), l'affichage des champs éditoriaux (§6.3), la
> photo de profil et son repli sur la palette (§7.3, §7.7, §7.10, §12.3), les
> colonnes d'article (§12.7). Aucune autre signature n'est modifiée.
>
> **Mise à jour du 2026-11-25 — chargement ciblé de l'espace privé.** Le client
> demande de supprimer `buildMemberSnapshot` et les réponses « instantané
> complet » au profit de **lectures serveur ciblées par page**. Le présent
> contrat ajoute : §3.1 (DTO de page), §7.11 (un load par page, remplaçant les
> réponses de §7.1 à §7.6 et des `load` de §8 et §9), §7.12 (forme des retours
> de mutation, suppression de `GET /api/member`) et §11.1 (fonctions de lecture
> exposées par le backend). **Aucune évolution de schéma ; aucun endpoint
> public ; aucune action de formulaire renommée ; aucune modification d'écran.**
> Les guards de §2.7 et le contexte RLS `app.profile_id` (§11, §12.8) restent
> inchangés et s'appliquent à **chaque** lecture ciblée.

---

## 1. Objet et périmètre

Le contrat couvre :

1. les **actions SvelteKit** (`POST /chemin?/nomAction`) utilisées par les formulaires ;
2. les **endpoints JSON** (`+server.ts`) utilisés par les appels programmatiques ;
3. les **chargements de page** (`+page.server.ts`, `+layout.server.ts`) qui alimentent l'interface ;
4. les **fonctions serveur partagées** que le backend expose au reste du serveur (contexte RLS, stockage, notifications).

Il ne couvre pas le code interne des composants Svelte, ni les détails d'implémentation Drizzle au-delà des noms de colonnes nécessaires au mapping.

---

## 2. Conventions

### 2.1 Familles d'interfaces

| Famille              | Méthode                        | Forme d'entrée                                     | Forme de sortie                                 |
| -------------------- | ------------------------------ | -------------------------------------------------- | ----------------------------------------------- |
| Action de formulaire | `POST /chemin?/nomAction`      | `FormData` (ou JSON si `use:enhance` personnalisé) | `success` ou `fail` SvelteKit                   |
| Endpoint JSON        | `GET`/`POST`/`DELETE /api/...` | JSON ou binaire                                    | `ApiSuccess<T>` / `ApiErrorBody`                |
| Chargement de page   | `GET /chemin` (load)           | paramètres d'URL                                   | objet de données brut, ou `error(status, body)` |
| Fonction serveur     | appel direct                   | paramètres typés                                   | valeur typée ou `GuardError`                    |

### 2.2 Enveloppes

**Succès d'action** — `return { success: true, data, message? }` ; SvelteKit répond `200`.

**Échec d'action** — `return fail(status, { success: false, error: { code, message, status, fields? } })`.

**Succès d'endpoint** — `json({ success: true, data }, { status: 200 })`.

**Échec d'endpoint** — `json({ success: false, error: { code, message, status, fields? } }, { status })`.

**Erreur de load** — `throw error(status, { code, message })` ; le frontend affiche `+error.svelte`.

Les types existants `src/lib/types.ts` (`ApiSuccess`, `ApiError`, `PaginatedResponse`) sont la référence. `ApiError.status` est dupliqué dans le corps pour les clients qui ne lisent pas le statut HTTP.

### 2.3 Nommage et types

- **API** : `camelCase` pour tous les champs et paramètres.
- **SQL** : `snake_case` en anglais, jamais exposé tel quel au frontend.
- **Identifiants** : UUID sous forme de chaîne.
- **Dates civiles d'événement** : `YYYY-MM-DD` (type SQL `DATE`), jamais d'heure.
- **Horodatages** : chaîne ISO 8601 UTC (`createdAt`, `updatedAt`, `expiresAt`).
- **Booléens** : `true`/`false`, jamais `"true"`/`"1"` dans les réponses JSON.
- **Tableaux** : `pupitreIds: string[]`, jamais un seul identifiant déguisé en tableau.

Mapping de référence :

| API (camelCase)  | SQL (snake_case)                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `firstName`      | `first_name`                                                                                 |
| `lastName`       | `last_name`                                                                                  |
| `authUserId`     | `auth_user_id`                                                                               |
| `accountStatus`  | `account_status`                                                                             |
| `emailConfirmed` | `email_confirmed`                                                                            |
| `musicianLevel`  | `musician_level`                                                                             |
| `bureauPosition` | `bureau_positions.title`                                                                     |
| `avatarUrl`      | `avatar_url`                                                                                 |
| `eventDate`      | `event_date`                                                                                 |
| `eventType`      | `event_type`                                                                                 |
| `isPoll`         | `is_poll`                                                                                    |
| `cancelledAt`    | `cancelled_at`                                                                               |
| `pupitreIds`     | `event_pupitres.pupitre_id`, `invitation_pupitres.pupitre_id`, `profile_pupitres.pupitre_id` |
| `isPublished`    | `is_published`                                                                               |
| `publishedAt`    | `published_at`                                                                               |
| `fileKey`        | `file_key`                                                                                   |
| `mimeType`       | `mime_type`                                                                                  |
| `sizeBytes`      | `size` (documents, media) ou `*_bytes` (storage_usage)                                       |
| `createdAt`      | `created_at`                                                                                 |
| `updatedAt`      | `updated_at`                                                                                 |

### 2.4 Codes d'erreur

Codes produits par les guards (`src/lib/auth/guards.ts`) :

| Code                    | Statut | Sens                                        |
| ----------------------- | ------ | ------------------------------------------- |
| `unauthenticated`       | 401    | Aucune session Better Auth valide.          |
| `account_pending`       | 403    | Compte créé mais non activé.                |
| `account_suspended`     | 403    | Compte suspendu.                            |
| `no_role`               | 403    | Profil sans rôle applicatif.                |
| `insufficient_role`     | 403    | Rôle insuffisant pour l'action.             |
| `forbidden_own_profile` | 403    | Tentative de modifier le profil d'un autre. |
| `not_chef_of_pupitre`   | 403    | L'acteur n'est pas chef du pupitre visé.    |

Codes applicatifs complémentaires :

| Code                  | Statut | Sens                                                        |
| --------------------- | ------ | ----------------------------------------------------------- |
| `validation_error`    | 400    | Entrée invalide ; `fields` contient les messages par champ. |
| `invalid_credentials` | 401    | E-mail ou mot de passe incorrect.                           |
| `not_found`           | 404    | Ressource absente ou non visible.                           |
| `conflict`            | 409    | Doublon (slug, e-mail, réponse déjà verrouillée).           |
| `rsvp_locked`         | 409    | Réponse verrouillée après minuit `Europe/Paris`.            |
| `event_cancelled`     | 409    | Événement annulé, écriture refusée.                         |
| `quota_exceeded`      | 507    | Quota global R2 atteint.                                    |
| `file_too_large`      | 413    | Fichier au-delà de la limite.                               |
| `unsupported_type`    | 415    | Type MIME ou signature refusés.                             |
| `turnstile_failed`    | 400    | Jeton Turnstile absent ou invalide.                         |
| `email_failed`        | 502    | Resend n'a pas accepté l'envoi.                             |
| `rate_limited`        | 429    | Trop de tentatives.                                         |
| `internal_error`      | 500    | Erreur serveur non exposée.                                 |

**Erreurs standard** : tout endpoint gardé peut renvoyer `unauthenticated`, `account_pending`, `account_suspended`, `no_role`, `insufficient_role` et `internal_error`. Toute action de formulaire peut renvoyer `validation_error`. Les blocs ci-dessous ne listent que les erreurs **spécifiques**.

### 2.5 Dates et fuseau

- `eventDate` est une date civile (`2026-11-07`), sans heure.
- L'état d'un événement et le verrouillage RSVP se calculent avec le jour courant de `Europe/Paris` :
  `(now() AT TIME ZONE 'Europe/Paris')::date`.
- Un événement daté du `2026-11-07` est ouvert jusqu'au `2026-11-07` inclus ; il est clos à partir du `2026-11-08 00:00` `Europe/Paris`.
- Aucun calcul de clôture ne doit être fait uniquement côté client : le serveur revérifie toujours.

### 2.6 Pagination et tri

- Paramètres : `page` (entier ≥ 1, défaut 1), `pageSize` (entier 1–100, défaut 20).
- Réponse paginée : `PaginatedResponse<T>` (`items`, `total`, `page`, `pageSize`).
- Tri par défaut : date croissante pour les événements à venir, date décroissante pour les archives et les journaux ; nom croissant (`lastName`, `firstName`) pour le trombinoscope.

### 2.7 Gardes

Les gardes sont appliqués **côté serveur** dans chaque load, action et endpoint :

- `requireAuth(locals)` : session + compte `active` + rôle non nul.
- `requireRole(locals, 'secretaire')` : secrétaire ou admin (hiérarchie).
- `requireRole(locals, 'admin')` : admin uniquement.
- `requirePupitreChef(locals, pupitres, pupitreName)` : chef du pupitre visé.
- `requireOwnProfile(locals, profileId)` : profil de l'acteur uniquement.

Le menu filtré et l'affichage conditionnel ne sont **jamais** des contrôles d'accès.

---

## 3. Types partagés (DTO)

```ts
export type AppRole = 'member' | 'chef_pupitre' | 'secretaire' | 'admin';
export type AccountStatus = 'pending' | 'active' | 'suspended';
export type MusicianLevel = 'skolaj' | 'bagadig' | 'bagad';
export type EventType =
	| 'sortie'
	| 'concert'
	| 'fest-noz'
	| 'festival'
	| 'concours'
	| 'gala'
	| 'repetition'
	| 'reunion'
	| 'repas';
export type EventVisibility = 'public' | 'interne' | 'pupitre';
export type EventState = 'actif' | 'clos' | 'annule';
export type ResponseStatus = 'present' | 'absent';

export interface Pupitre {
	id: string;
	name: 'Bombarde' | 'Caisse claire' | 'Cornemuse' | 'Percussion';
}

export interface SessionProfile {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: AppRole;
	accountStatus: AccountStatus;
	musicianLevel: MusicianLevel | null;
	/** URL servie par `/api/files/private/...` ; `null` = aucune photo déposée. */
	avatarUrl: string | null;
	/** Identifiant de palette 1 à 12 ; affiché tant que `avatarUrl` est vide. */
	avatar: number;
	pupitres: Array<Pupitre & { isChef: boolean }>;
}

export interface PublicEvent {
	id: string;
	title: string;
	description: string | null;
	eventDate: string; // YYYY-MM-DD
	eventType: EventType;
	isPoll: boolean;
	state: EventState;
}

export interface MemberEvent extends PublicEvent {
	visibility: EventVisibility;
	pupitres: Pupitre[];
	myResponse: ResponseStatus | null;
	canRespond: boolean;
	canManage: boolean;
	/** Agrégats réservés aux gestionnaires — À CONFIRMER (voir §13). */
	responseSummary?: { present: number; absent: number };
}

export interface TrombinoscopeEntry {
	id: string;
	firstName: string;
	lastName: string;
	/** `null` = pas de photo déposée : le client affiche la palette `avatar`. */
	avatarUrl: string | null;
	/** Palette illustrée 1 à 12, toujours renseignée (repli). */
	avatar: number;
	pupitres: Pupitre[];
	musicianLevel: MusicianLevel | null;
	bureauPosition: string | null;
}

export interface DocumentSummary {
	id: string;
	title: string;
	description: string | null;
	fileName: string;
	mimeType: 'application/pdf';
	sizeBytes: number;
	pupitre: Pupitre | null;
	uploadedBy: { id: string; firstName: string; lastName: string };
	createdAt: string;
	downloadUrl: string; // /api/files/private/documents/...
}

export interface PublicArticleSummary {
	id: string;
	title: string;
	slug: string;
	publishedAt: string;
	author: { firstName: string; lastName: string };
	/** `null` = non renseigné : la catégorie n'est pas affichée. */
	category: string | null;
	/** `null` = pas d'illustration : aucun bloc image n'est rendu. */
	imageUrl: string | null;
	imageAlt: string | null;
}

export interface PublicArticle extends PublicArticleSummary {
	content: string; // Markdown
}

export interface PublicPhoto {
	id: string;
	caption: string | null;
	sortOrder: number;
	thumbnailUrl: string; // 400x400 WebP
	fullUrl: string; // 2000x2000 WebP
}

export interface PublicAlbum {
	id: string;
	title: string;
	description: string | null;
	albumDate: string | null; // À CONFIRMER : colonne absente du schéma actuel
	photos: PublicPhoto[];
}

export interface StorageUsage {
	usedBytes: number;
	publicBytes: number;
	privateBytes: number;
	reservedBytes: number;
	quotaBytes: number;
	alertThresholdBytes: number;
	blockThresholdBytes: number;
	availableBytes: number;
	level: 'ok' | 'warning' | 'critical' | 'blocked';
	lastSyncAt: string | null;
}

export interface InvitationSummary {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	pupitres: Pupitre[];
	expiresAt: string;
	acceptedAt: string | null;
	emailConfirmed: boolean;
	status: 'pending' | 'expired' | 'accepted' | 'revoked';
}

export interface MemberAdminSummary {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: AppRole;
	accountStatus: AccountStatus;
	emailConfirmed: boolean;
	pupitres: Array<Pupitre & { isChef: boolean }>;
	createdAt: string;
}

export interface NotificationPreferences {
	eventsEnabled: boolean;
	remindersEnabled: boolean;
	noResponseReminderEnabled: boolean;
}

export interface NotificationLogEntry {
	id: string;
	type: string;
	title: string;
	content: string;
	sentAt: string;
	status: string;
	recipientProfileId: string | null;
}
```

### 3.1 DTO de page — chargement ciblé (2026-11-25)

**Deux enveloppes seulement**, et un DTO par page. Le nom des champs est celui
**réellement lu par les composants** (`src/lib/member/types.ts` : `date`, `type`,
`status`, `pupitreIds`, `location`…), et non les noms idéalisés `eventDate` /
`state` du §3 : l'interface est inchangée, aucun composant n'est réécrit. Voir
§13 point 23.

```ts
export type PageSection =
	| 'overview'
	| 'agenda'
	| 'event'
	| 'eventForm'
	| 'directory'
	| 'pupitre'
	| 'documents'
	| 'notifications'
	| 'profile'
	| 'articles'
	| 'media'
	| 'invitations'
	| 'adminMembers'
	| 'settings'
	| 'adminOverview';

/** `+layout.server.ts` — socle chargé à chaque navigation. */
export interface MemberShell {
	/** Profil de la session uniquement : jamais celui d'un autre membre. */
	profile: MemberProfile;
	unreadCount: number;
}

/** `+page.server.ts` — une seule section par page. */
export interface MemberPageEnvelope<S extends PageSection = PageSection, D = unknown> {
	memberPage: { section: S; data: D };
}
```

**Types de page.** Ils réutilisent les types de `src/lib/member/types.ts`
(`MemberProfile`, `MemberEvent`, `MemberDocument`, `MemberNotification`,
`MemberArticle`, `MemberAlbum`, `MemberInvitation`, `MemberPreferences`,
`MemberSettings`) et n'ajoutent que ce que la page doit calculer côté serveur.

```ts
/** Projection d'annuaire : §12.3 uniquement, aucune valeur fabriquée. */
export interface DirectoryProfile {
	id: string;
	firstName: string;
	lastName: string;
	avatar: number;
	avatarUrl: string | null;
	pupitres: Array<{ pupitreId: MemberPupitreId }>;
	level: MemberLevel;
	bureauPosition: string | null;
}

/** Membre de l'espace pupitre : seule projection qui porte `isChef` (affichage des chefs). */
export interface PupitreMember extends Omit<DirectoryProfile, 'pupitres'> {
	pupitres: Array<{ pupitreId: MemberPupitreId; isChef: boolean }>;
}

/** Événement enrichi pour une page (agenda, vue d'ensemble, détail). */
export interface MemberEventPageItem extends MemberEvent {
	myResponse: MemberResponseStatus | null;
	responseSummary: { present: number; absent: number; total: number };
}

export interface OverviewPageData {
	events: MemberEventPageItem[]; // 10 prochains visibles
	notifications: MemberNotification[]; // 3 dernières, readBy = soi
	documentsCount: number;
}

export interface AgendaPageData {
	events: MemberEventPageItem[];
}

export interface EventDetailPageData {
	event: MemberEventPageItem;
	/** Alimente la section `profiles` du store (nécessaire à `eventAudience`). */
	profiles: DirectoryProfile[];
	responses: MemberResponse[];
}

export interface EventFormPageData {
	event: MemberEvent | null;
}

export interface PupitrePageData {
	pupitre: { id: MemberPupitreId; name: string };
	members?: PupitreMember[];
	events?: MemberEventPageItem[];
	documentsCount?: number;
	unreadCount?: number;
}

export interface DocumentsPageData {
	documents: MemberDocument[];
	documentsCountByPupitre: Record<MemberPupitreId, number>;
}

export interface NotificationsPageData {
	notifications: MemberNotification[];
	/** Uniquement pour les rôles qui envoient (§8.5, §9.7). */
	recipients?: DirectoryProfile[];
	pupitres?: Array<{ id: MemberPupitreId; name: string }>;
}

export interface ProfilePageData {
	profile: MemberProfile;
	preferences: MemberPreferences | null;
}

export interface ArticlesPageData {
	articles: MemberArticle[];
	authors: DirectoryProfile[];
}

export interface MediaPageData {
	albums: MemberAlbum[];
	storage: StorageUsage;
}

export interface InvitationsPageData {
	invitations: MemberInvitation[];
}

export interface AdminMembersPageData {
	members: MemberAdminSummary[];
}

export interface SettingsPageData {
	settings: MemberSettings;
}

export interface AdminOverviewPageData {
	membersCount: number;
	pendingInvitationsCount: number;
	publishedArticlesCount: number;
	draftArticlesCount: number;
	unreadCount: number;
	storageUsedBytes: number;
}

/** Retour d'une commande : jamais d'instantané, jamais de lecture globale. */
export type CommandResult =
	| { kind: 'event'; event: MemberEvent }
	| { kind: 'response'; response: MemberResponse }
	| { kind: 'document'; document: MemberDocument }
	| { kind: 'article'; article: MemberArticle }
	| { kind: 'album'; album: MemberAlbum }
	| { kind: 'invitation'; invitation: MemberInvitation }
	| { kind: 'profile'; profile: MemberProfile }
	| { kind: 'notification'; notificationIds: string[] }
	| { kind: 'settings'; settings: MemberSettings }
	| {
			kind: 'deleted';
			entity: 'event' | 'document' | 'article' | 'album' | 'photo' | 'invitation';
			id: string;
	  };
```

> `MemberProfile` conserve `pupitres: MemberProfilePupitre[]` **pour le profil
> courant** (nécessaire aux aides d'interface `chefPupitreIds` / `isChefOf`) ;
> `DirectoryProfile` n'expose **jamais** `email`, `role`, `accountStatus`,
> `joinedAt` ni `isChef` (§12.3, Q-A5). L'affichage des chefs par
> `/dashboard/pupitre*` et l'édition par `/dashboard/admin/membres` restent
> servis par leurs projections dédiées (voir §13 point 21).
>
> **Conséquence sur le store** (`src/lib/member/store.svelte.ts`) : le getter
> `member.profiles` devient `DirectoryProfile[]`, et la page d'administration des
> membres lit une **section distincte** `member.adminMembers`
> (`MemberAdminSummary[]`). Aucun balisage ne change ; seules les lignes de
> `<script>` qui choisissent la source de données peuvent être ajustées.
> `MemberAdminSummary` (§3) est étendu, pour l'écran existant, de
> `musicianLevel`, `bureauPosition` et `bureauPositionId` (ce dernier n'est
> jamais exposé hors de `listAdminMembersPage`, il sert à l'édition du titre).
> `DirectoryProfile` ne porte que des champs affichables : une valeur absente est
> `null`, jamais `''` ni une valeur inventée.

---

## 4. Matrice des gardes et des droits

| Opération                                             | `member`                 | `chef_pupitre`                                      | `secretaire`       | `admin` |
| ----------------------------------------------------- | ------------------------ | ---------------------------------------------------- | ------------------ | ------- |
| Lire l'agenda public                                  | oui (anonyme aussi)      | oui                                                  | oui                | oui     |
| Lire l'agenda privé (`interne` + `pupitre` autorisés) | oui                      | oui                                                  | oui                | oui     |
| Répondre à un événement visible                       | oui                      | oui                                                  | oui                | oui     |
| Consulter le trombinoscope                            | oui                      | oui                                                  | oui                | oui     |
| Lire les documents actifs                             | oui                      | oui                                                  | oui                | oui     |
| Déposer un document                                   | non                      | ses pupitres dirigés                                 | tous               | tous    |
| Gérer un événement                                    | non                      | événement mono-pupitre de l'un de ses pupitres       | tous               | tous    |
| Créer un événement                                    | non                      | `interne`, **exactement 1** pupitre dirigé | `public`/`interne`/`pupitre`, 0 à N pupitres | idem secrétaire |
| Supprimer un événement                                | non                      | **mono-pupitre de son pupitre** | tous           | tous    |
| Lire les présences nominatives                        | non (sa propre réponse)  | **mono-pupitre de son pupitre** | tous           | tous    |
| Gérer articles / albums                               | non                      | non                          | oui                | oui     |
| Envoyer une notification                              | non                      | son pupitre                  | plusieurs pupitres | global  |
| Inviter / activer / suspendre                         | non                      | non                          | oui                | oui     |
| Modifier un rôle applicatif                           | non                      | non                          | non                | oui     |
| Modifier les pupitres d'un membre                     | non                      | non                          | oui                | oui     |
| Modifier son propre profil                            | oui (hors rôle/pupitres) | oui                          | oui                | oui     |

---

## 5. Authentification et compte

### 5.1 `POST|GET /api/auth/[...all]` — handler Better Auth

- **État** : existe (`src/routes/api/auth/[...all]/+server.ts`).
- **Garde** : Better Auth.
- **Sous-chemins utilisés** : `/api/auth/sign-in/email`, `/api/auth/sign-out`, `/api/auth/get-session`, `/api/auth/forget-password`, `/api/auth/reset-password`, `/api/auth/verify-email`, `/api/auth/send-verification-email`.
- **Entrée / succès / erreurs** : définis par Better Auth, pas par ce contrat. Le frontend ne doit pas réimplémenter les formes de réponse ; il appelle ces sous-chemins via le SDK ou `fetch` et traite `Set-Cookie`.
- **Règles** : la session et l'identité viennent de Better Auth ; les rôles et statuts métier sont relus dans `profiles.role` / `profiles.account_status` par `hooks.server.ts`. Aucun rôle n'est lu dans `user_metadata`.

### 5.2 `POST /auth/login?/login`

- **État** : existe (`src/routes/auth/login/+page.server.ts`), à aligner sur l'enveloppe.
- **Garde** : aucune ; si `locals.profile` et `locals.accountStatus === 'active'`, redirection vers `/dashboard`.
- **Entrée** : `email: string`, `password: string`.
- **Succès** : `200 { success: true, data: { redirectTo: '/dashboard' } }`.
- **Erreurs** : `400 validation_error` (e-mail invalide ou mot de passe < 6), `401 invalid_credentials`.
- **Règles** : message d'erreur identique pour e-mail inconnu et mot de passe faux. Après connexion, un compte `pending` est redirigé vers `/auth/pending` ; un compte `suspended` reçoit `account_suspended`. La session est un cookie HTTP-only géré par Better Auth.

### 5.3 `POST /auth/logout?/logout`

- **État** : page `+page.svelte` existe, action à créer.
- **Garde** : session valide.
- **Entrée** : aucune.
- **Succès** : `200 { success: true, data: { redirectTo: '/' } }`.
- **Erreurs** : `unauthenticated`.
- **Règles** : invalide la session Better Auth et supprime le cookie. Aucun cache de page privée ne doit rester accessible après déconnexion.

### 5.4 `POST /auth/reset-password?/requestReset`

- **État** : existe (`src/routes/auth/reset-password/+page.server.ts`).
- **Garde** : aucune.
- **Entrée** : `email: string`.
- **Succès** : `200 { success: true, message: 'Si ce compte existe, un lien de réinitialisation a été envoyé.' }`.
- **Erreurs** : `400 validation_error` ; `429 rate_limited`.
- **Règles** : ne jamais révéler l'existence de l'adresse. Le lien est envoyé par Resend via Better Auth et expire selon la configuration Better Auth (1 h pour l'invitation ; durée de réinitialisation à confirmer dans la configuration). Le formulaire `auth/forgot-password` doit appeler cette action ou être fusionné avec elle — **À CONFIRMER** (doublon de page, §13).

### 5.5 `POST /dashboard/admin/invitations?/invite` — canonique

- **État** : logique existante sous `src/routes/auth/invitation/+page.server.ts` (action `invite`), à déplacer vers la route d'administration. **À CONFIRMER** : route canonique (voir §13).
- **Garde** : `requireRole(locals, 'secretaire')` (secrétaire ou admin).
- **Entrée** : `email: string`, `firstName: string`, `lastName: string`, `pupitreIds: string[]` (au moins un pupitre).
- **Succès** : `200 { success: true, data: { invitationId: string, email: string, expiresAt: string } }`.
- **Erreurs** : `400 validation_error`, `409 conflict` (e-mail déjà utilisé), `502 email_failed`.
- **Règles** :
  - Le compte Auth est créé immédiatement ; le profil reçoit `account_status = 'pending'` et `role = 'member'`. Le rôle n'est jamais choisi par l'inviteur à cette étape.
  - Le jeton est aléatoire, stocké **empreinté** (SHA-256), à usage unique, expire après **1 heure** (Q-2026-11-17-02, option A du 2026-11-18). La même durée est configurée côté Better Auth : elle ne doit pas exister seulement dans la table `invitations` (`docs/Spec.md` §4.2 point 6).
  - L'e-mail est envoyé par Resend ; le lien mène à l'acceptation (5.6).
  - Le pupitre attribué n'est pas modifiable par l'invité.
  - L'action est journalisée dans `activity_log` sans secret.
  - **Dépendance bloquante : Q-2026-11-08-06** pour le mécanisme exact de création du compte Better Auth.

### 5.6 `GET /auth/invitation/accept?token=...&email=...` et `POST /auth/invitation/accept?/accept`

- **État** : à créer (le commentaire de `auth/invitation/+page.server.ts` cite `/auth/invitation/accept`, mais aucune route n'existe).
- **Garde** : aucune (le jeton fait foi).
- **Entrée (load)** : `token: string`, `email: string`.
- **Succès (load)** : `{ valid: true, email: string, firstName: string, lastName: string }` ou `{ valid: false, reason: 'invalid' | 'expired' | 'used' | 'mismatch' }`.
- **Entrée (action)** : `token: string`, `email: string`, `password: string`, `confirmPassword: string`.
- **Succès (action)** : `200 { success: true, data: { redirectTo: '/auth/pending' } }`.
- **Erreurs** : `400 validation_error` (mot de passe trop court, confirmation différente), `409 conflict` (jeton expiré, consommé, adresse non concordante).
- **Règles** : l'acceptation confirme l'e-mail et définit le mot de passe, mais **ne change pas** `account_status` : le compte reste `pending` jusqu'à activation manuelle. Le jeton est marqué consommé (`accepted_at`). Aucun accès au dashboard n'est accordé. **Dépendance : Q-2026-11-08-06.**

---

## 6. Site public

Les pages publiques sont localisées par `[lang=lang]` avec `lang ∈ { fr, en, br }` (`src/params/lang.ts`). L'espace adhérents et l'authentification restent en français.

### 6.1 `GET /[lang=lang]` — accueil (load)

- **Garde** : publique.
- **Entrée** : `lang`.
- **Succès** : `{ nextPublicEvents: PublicEvent[]; galleryPhotos: PublicPhoto[]; pupitres: Pupitre[] }`.
- **Erreurs** : `404 not_found` si la langue n'est pas supportée.
- **Règles** : `nextPublicEvents` contient au plus **2** événements `public` à venir, triés par date croissante ; `galleryPhotos` contient **3** photos publiques distinctes choisies au hasard (ou toutes si moins de 3), sélection fournie au rendu initial et conservée pendant l'hydratation. Aucun événement `interne` ou `pupitre`, aucun document privé.

### 6.2 `GET /[lang=lang]/agenda` — agenda public (load)

- **Garde** : publique.
- **Entrée** : `lang`.
- **Succès** : `{ events: PublicEvent[] }`.
- **Erreurs** : `404 not_found`.
- **Règles** : uniquement `visibility = 'public'`, en lecture seule. Aucun formulaire RSVP sur cette page (F4). L'action `?/rsvp` existante sur cette route est un **écart à corriger** : elle doit être déplacée vers `/dashboard/agenda?/rsvp` (§7.2) ou supprimée.

### 6.3 `GET /[lang=lang]/articles` et `GET /[lang=lang]/articles/[slug]` (loads)

- **Garde** : publique.
- **Entrée** : `lang` ; `slug` pour le détail.
- **Succès (liste)** : `{ articles: PublicArticleSummary[] }` triés par `publishedAt` décroissant.
- **Succès (détail)** : `{ article: PublicArticle }`.
- **Erreurs** : `404 not_found` si l'article n'existe pas ou n'est pas publié.
- **Règles** : seuls les articles `is_published = true` sont lisibles publiquement. Un brouillon n'est ni rendu ni récupérable par un appel direct. Le contenu est du Markdown. `category`, `imageUrl` et `imageAlt` proviennent des colonnes nullables `articles.category`, `articles.image_url` et `articles.image_alt` (Q-2026-11-17-04, option A du 2026-11-18) : **une valeur vide n'est jamais affichée** et aucune valeur de remplacement n'est inventée.

### 6.4 `GET /[lang=lang]/media` (load)

- **Garde** : publique.
- **Entrée** : `lang`.
- **Succès** : `{ albums: PublicAlbum[] }` triés par `albumDate` décroissante puis titre.
- **Erreurs** : `404 not_found`.
- **Règles** : seuls les albums `is_published = true` et leurs médias publics sont exposés. Les objets proviennent de `bagad-public/albums/{albumId}/`. Les légendes et l'ordre sont requis (F6) ; les colonnes `caption`, `sortOrder`, `albumDate` sont **absentes du schéma actuel** et doivent être ajoutées par migration (voir §13).

### 6.5 `GET /[lang=lang]/contact` (load) et `POST /[lang=lang]/contact?/submit`

- **État** : page et schéma existent ; load et action à créer.
- **Garde** : publique.
- **Entrée (load)** : `lang` ; succès : `{ turnstileSiteKey: string }` (clé **publique** uniquement, jamais la clé secrète).
- **Entrée (action)** : `name: string`, `email: string`, `message: string`, `turnstileToken: string`.
- **Succès (action)** : `200 { success: true, message: 'Votre message a été envoyé.' }`.
- **Erreurs** : `400 validation_error`, `400 turnstile_failed`, `502 email_failed`.
- **Règles** :
  - Turnstile est vérifié **côté serveur** avant tout envoi.
  - Resend envoie à l'adresse `CONTACT_EMAIL` (attendu : `bagadpenhars@gmail.com`).
  - L'accusé de réception n'est envoyé à l'expéditeur **qu'après** succès de l'envoi à l'association. En cas d'échec de l'envoi principal, aucun accusé de succès n'est envoyé.
  - Aucune pièce jointe. L'adresse de réception et la clé Resend ne sont jamais exposées au navigateur.
  - **Q-2026-11-06-05** est déjà tranchée sur le destinataire et l'accusé ; le choix action vs endpoint est un choix de contrat (action `submit`, cohérent avec le reste du site).

### 6.6 `GET /sitemap.xml`, `GET /robots.txt`

- **État** : `sitemap.xml/+server.ts` existe (réponse vide) ; `robots.txt` statique à vérifier.
- **Garde** : publique.
- **Succès** : XML pour le sitemap ; texte pour `robots.txt`.
- **Règles** : le sitemap ne contient que les pages publiques et les contenus publiés, avec les variantes de langue. `robots.txt` exclut `/dashboard`, `/auth` et `/api`. `robots.txt` ne remplace jamais un guard.

### 6.7 `GET /[lang=lang]/bagad`, `/formation`, `/partenaires`

- **État** : pages Svelte existent ; pas de load serveur pour `formation` et `partenaires` (données statiques `src/lib/data/`).
- **Garde** : publique.
- **Succès** : contenu éditorial et données statiques ; aucun appel privé.
- **Règles** : la page Formation présente les quatre pupitres avec niveaux, cours, horaires, lieu et prêt d'instrument ; la page Partenaires lit `src/lib/data/partenaires.ts`. Aucun titre du bureau, aucune coordonnée de membre.

---

## 7. Espace adhérents

Toutes les routes de cette section exigent `requireAuth(locals)` : session valide, `account_status = 'active'`, rôle non nul.

> **Chargement ciblé (2026-11-25).** Les `load` décrits en §7.1 à §7.6 sont
> **remplacés** par §7.11 : un load par page, un DTO par page, plus d'instantané.
> Les **actions** et **endpoints** de mutation conservent leur entrée ; leur
> retour suit §7.12. Les gardes, la transaction `withUserContext` et le RLS de
> §2.7 et §12.8 restent inchangés.

### 7.1 `GET /dashboard` (load)

- **Garde** : `requireAuth`.
- **Entrée** : aucune.
- **Succès** : `{ profile: SessionProfile; nextEvents: MemberEvent[] }`.
- **Erreurs** : standard.
- **Règles** : `nextEvents` applique la visibilité de §12.1. Aucune donnée d'un autre membre.

### 7.2 `GET /dashboard/agenda` (load) et `POST /dashboard/agenda?/rsvp`

- **Garde** : `requireAuth`.
- **Entrée (load)** : `from?: string` (`YYYY-MM-DD`), `to?: string`, `page?`, `pageSize?`.
- **Succès (load)** : `{ events: MemberEvent[] }` ou `PaginatedResponse<MemberEvent>`.
- **Entrée (action)** : `eventId: string`, `status: 'present' | 'absent'`.
- **Succès (action)** : `200 { success: true, data: { eventId: string, status: 'present' | 'absent', updatedAt: string } }`.
- **Erreurs spécifiques** : `404 not_found` (événement invisible ou inexistant), `409 rsvp_locked`, `409 event_cancelled`, `403 insufficient_role` (non membre du pupitre ciblé).
- **Règles** :
  - L'identité du répondant vient de la session ; `profileId` n'est **jamais** un paramètre d'entrée.
  - Une seule réponse par couple (`event_id`, `profile_id`) ; la modification écrase la précédente, sans historique.
  - La réponse est modifiable pendant toute la date de l'événement, puis verrouillée à **00 h 00 `Europe/Paris`** le lendemain. Elle n'est jamais retirable par le membre.
  - Après annulation ou clôture, la réponse reste lisible mais aucune écriture n'est acceptée.
  - Un membre ne peut répondre qu'aux événements qu'il voit : `public`, `interne`, ou `pupitre` ciblé sur l'un de ses pupitres.
  - `is_poll` ne change pas l'API : un sondage est un événement avec `isPoll = true` et les mêmes réponses `present`/`absent`.
  - **Dépendances** : étape 15 (`cancelled_at`, Q-2026-11-08-05) et étape 11 (transaction RLS, Q-2026-11-08-01).

### 7.3 `GET /dashboard/trombinoscope` (load)

- **État** : **route à créer** (aucune route `trombinoscope` sous `src/routes/`). **À CONFIRMER** : emplacement exact, `dashboard/trombinoscope` ou `dashboard/membres` (§13).
- **Garde** : `requireAuth`.
- **Entrée** : `page?`, `pageSize?`, `query?` (nom/prénom).
- **Succès** : `PaginatedResponse<TrombinoscopeEntry>` ou `{ members: TrombinoscopeEntry[] }`.
- **Erreurs** : standard.
- **Règles** :
  - Réservé aux membres actifs connectés ; jamais public.
  - Champs exposés **uniquement** : `firstName`, `lastName`, `avatarUrl`, `avatar` (palette 1–12), `pupitres[{id,name}]`, `musicianLevel`, `bureauPosition`.
  - Champs **interdits** : `phone`, `email`, `address`, `role`, `accountStatus`, `authUserId`, `createdAt`, `updatedAt`, `bureauPositionId`, `isChef` (non prévu par le brief).
  - Affichage : si `avatarUrl` est renseigné, la photo est affichée ; s'il est `null` (état livré, Q-2026-11-17-03 premier temps), le portrait illustré `avatar` est affiché.
  - La photo est servie par `/api/files/private/profiles/{profileId}/avatar.{ext}` après guard ; aucun membre, même admin, ne peut remplacer la photo d'un autre.
  - Les titres du bureau ne sont jamais publics.

### 7.4 `GET /dashboard/documents` (load)

- **Garde** : `requireAuth`.
- **Entrée** : `pupitreId?`, `query?`.
- **Succès** : `{ documents: DocumentSummary[] }`.
- **Erreurs** : standard.
- **Règles** : tous les membres actifs lisent tous les documents actifs, tous pupitres confondus. Le téléchargement passe par `/api/files/...` (§10), jamais par une URL publique permanente.

### 7.5 `GET /dashboard/notifications` (load) et `POST /dashboard/notifications?/update`

- **Garde** : `requireAuth`.
- **Entrée (load)** : aucune.
- **Succès (load)** : `{ preferences: NotificationPreferences }`.
- **Entrée (action)** : `eventsEnabled: boolean`, `remindersEnabled: boolean`, `noResponseReminderEnabled: boolean`.
- **Succès (action)** : `200 { success: true, data: { preferences: NotificationPreferences } }`.
- **Erreurs** : `400 validation_error`.
- **Règles** : chaque membre ne modifie que ses propres préférences. L'abonnement push OneSignal est géré côté client par le SDK ; le serveur ne reçoit **jamais** un `playerId` ou un `externalId` comme audience. Les préférences sont respectées à l'envoi (§12.5).

### 7.6 `GET /dashboard/profil` (load) et `POST /dashboard/profil?/update`

- **Garde** : `requireAuth` + `requireOwnProfile`.
- **Entrée (load)** : aucune.
- **Succès (load)** : `{ profile: SessionProfile }`.
- **Entrée (action)** : `firstName: string`, `lastName: string`, `phone?: string`, `address?: string`, `musicianLevel?: 'skolaj' | 'bagadig' | 'bagad'`.
- **Succès (action)** : `200 { success: true, data: { profile: SessionProfile } }`.
- **Erreurs** : `400 validation_error`, `403 forbidden_own_profile`.
- **Règles** :
  - Le membre ne peut modifier ni `role`, ni ses pupitres, ni `accountStatus`, ni `emailConfirmed`, ni `authUserId`. Toute tentative renvoie `403`.
  - Le changement d'adresse e-mail passe par le flux Better Auth, pas par cette action.
  - `bureauPositionId` est réservé à l'administration — **À CONFIRMER** (§13), car le brief le qualifie de titre honorifique sans droit.
  - Le schéma actuel `profileSchema` (`fullName`, `phone`) doit être remplacé par les champs ci-dessus.

### 7.7 `POST /api/member/upload` — `kind = "avatar"` (mise à jour du 2026-11-18)

- **État** : à créer par l'**étape 49** (second temps de Q-2026-11-17-03, après branchement de R2). L'étape 43 ne livre aucun écran et n'ouvre pas cet endpoint : `profiles.avatar_url` reste `null` jusque-là.
- **Garde** : `requireAuth` + `requireOwnProfile` + `canChangeAvatar` (identité issue de la session, jamais du `FormData`).
- **Entrée** : `multipart/form-data` avec `kind = "avatar"` et `file: File` (JPG/JPEG/PNG/WebP).
- **Succès** : `200 { success: true, data: { snapshot: MemberSnapshot, result: { avatarUrl: string, avatar: number } } }`.
- **Erreurs** : `403 forbidden_own_profile`, `403 account_suspended`, `413 file_too_large` (> 15 Mo), `415 unsupported_type` (type MIME, magic number ou dimensions > 6000 × 6000), `507 quota_exceeded`.
- **Règles** :
  - 15 Mo max, 6000 × 6000 max, contrôles faits côté serveur **avant** toute écriture R2 (type MIME + magic numbers + en-tête de dimensions).
  - **Aucune conversion serveur** : l'original est stocké tel quel (Q-2026-11-08-03, `sharp` interdit sur Workers) ; les variantes 400 × 400 et 2000 × 2000 sont produites à la diffusion par Cloudflare Image Resizing.
  - Clé `private/profiles/{profileId}/avatar.{ext}` dans `R2_PRIVATE` ; l'ancienne clé est supprimée en cas de remplacement.
  - `profiles.avatar_url` reçoit l'URL servie par `/api/files/private/profiles/{profileId}/avatar.{ext}` (jamais une URL publique permanente, jamais une clé R2 côté client).
  - Quota : réservation, puis confirmation de la taille réelle ; libération en cas d'échec.
  - La palette `profiles.avatar` (1–12) est conservée : elle reste le repli affiché tant que `avatar_url` est vide.
  - `MemberSnapshot` (instantané de `GET /api/member` / `POST /api/member/action`) expose `avatarUrl: string | null` sur le profil courant **et** sur les entrées de l'annuaire ; la vue `app.member_directory` fournit déjà la colonne, aucune migration n'est requise.
  - Les `kind = "document"` (étape 41) et `kind = "albumPhoto"` (étape 42) partagent cette route et la même enveloppe ; les actions `?/upload` de §8.2 et §9.4 sont remplacées par cet endpoint.

### 7.8 `GET /dashboard/securite` (load) et `POST /dashboard/securite?/changePassword`

- **Garde** : `requireAuth`.
- **Entrée (action)** : `currentPassword: string`, `newPassword: string`, `confirmPassword: string`.
- **Succès** : `200 { success: true, message: 'Mot de passe modifié.' }`.
- **Erreurs** : `400 validation_error` (mots de passe différents, longueur), `401 invalid_credentials`.
- **Règles** : vérification du mot de passe actuel via Better Auth ; le changement invalide les autres sessions si Better Auth le permet. Aucun mot de passe n'est journalisé.

### 7.9 `POST /dashboard/profil?/requestDeletion`

- **État** : à créer.
- **Garde** : `requireAuth` + `requireOwnProfile`.
- **Entrée** : `confirmation: string` (saisie de l'e-mail ou `SUPPRIMER`), `reason?: string`.
- **Succès** : `200 { success: true, data: { requestId: string, status: 'pending' } }`.
- **Erreurs** : `400 validation_error`, `409 conflict` (demande déjà en cours).
- **Règles** : la demande passe **immédiatement** `account_status` à `suspended` et crée une ligne `account_deletion_requests`. L'administrateur traite la demande : suppression des données personnelles, de l'avatar et des affectations de pupitre, anonymisation des réponses conservées (`event_responses.profile_id = NULL`), clôture et notification. Aucune purge automatique irréversible (Q-2026-11-08-08).

### 7.10 `POST /api/member/action` — action `profile.avatar.remove` (mise à jour du 2026-11-18)

- **État** : à créer par l'**étape 49**, en même temps que §7.7.
- **Garde** : `requireAuth` + `requireOwnProfile` + `canChangeAvatar`.
- **Entrée** :
  ```json
  {
    "action": "profile.avatar.remove",
    "payload": {}
  }
  ```
- **Succès** :
  ```json
  {
    "success": true,
    "data": { "kind": "profile", "profile": "MemberProfile" }
  }
  ```
- **Erreurs** : `403 forbidden_own_profile`, `403 account_suspended`, `404 not_found` si aucune photo n'est déposée.
- **Règles** : supprime l'objet `private/profiles/{profileId}/avatar.{ext}` de `R2_PRIVATE`, remet `profiles.avatar_url` à `NULL`, libère le quota et réaffiche le portrait illustré `avatar` (1–12), qui n'est **pas** modifié. L'action `profile.avatar` (palette 1–12) reste inchangée et demeure la seule commande de changement de portrait illustré.

### 7.11 Chargement ciblé par page — remplace l'instantané (2026-11-25)

**Principe.** `buildMemberSnapshot` est supprimé. Le layout ne charge que le
**socle** ; chaque page charge **sa** lecture, dans sa propre transaction RLS.

- **Enveloppes** : layout → `{ memberShell: MemberShell }` ; page →
  `{ memberPage: { section, data } }` (§3.1).
- **Garde commune à toutes les lignes** : `requireAuth(locals)` — session,
  `account_status = 'active'`, rôle non nul ; `pending` → `/auth/pending`,
  `suspended` → `/auth/login?error=suspended` ; base absente → `503`.
  La fonction de lecture **relit** rôle et statut dans la transaction.
- **Transaction** : `withUserContext(locals.db, profileId, (tx) => fn(tx, profileId, …))`,
  `app.profile_id` seul contexte (Q-A9). **Aucun cache Hyperdrive.**
- **Erreurs standard** (non répétées ci-dessous) : `303` redirection (session,
  statut), `503 database_unavailable`, `403 insufficient_role`,
  `404 not_found` (ressource invisible ou inexistante — ne pas révéler son
  existence).
- **Aucune de ces réponses ne contient** : `email`/`phone`/`address`/`role`/
  `accountStatus` d'un autre profil, `authUserId`, un identifiant de session.
  **Deux exceptions, explicites** : `AdminMembersPageData` (gestion des membres,
  rôles `secretaire`/`admin`, e-mail et statut nécessaires à l'activation) et
  `isChef` d'un autre profil, uniquement dans `getPupitrePage` et
  `listAdminMembersPage` (§10.5 du plan, §13 point 21).

| Load (`+*.server.ts`) | Fonction (§11.1) | `memberPage.section` et `data` | Rôle minimum | Erreurs spécifiques |
| --- | --- | --- | --- | --- |
| `GET /dashboard` — **layout** | `getMemberShell` | enveloppe `memberShell` : `{ profile, unreadCount }` | `member` | — |
| `GET /dashboard` | `getOverviewPage` | `overview` : `OverviewPageData` | `member` | — |
| `GET /dashboard/agenda` | `listAgendaEvents` | `agenda` : `AgendaPageData` | `member` | — |
| `GET /dashboard/agenda/[id]` | `getEventDetail` | `event` : `EventDetailPageData` | `member` | `404` événement invisible |
| `GET /dashboard/agenda/nouveau` | `getPageContext` | aucune section (le socle suffit) | `chef_pupitre` | `403` |
| `GET /dashboard/agenda/[id]/modifier` | `getEventForEdit` | `eventForm` : `EventFormPageData` | `chef_pupitre` (périmètre) / `secretaire` | `404`, `403 not_chef_of_pupitre` |
| `GET /dashboard/admin/agenda/new` | `getPageContext` | aucune section | `secretaire` | `403` |
| `GET /dashboard/membres` | `listDirectoryProfiles` | `directory` : `{ profiles: DirectoryProfile[] }` | `member` | — |
| `GET /dashboard/pupitre` | `getPupitrePage` (`section: 'overview'`) | `pupitre` : `PupitrePageData` | `chef_pupitre` | `403 not_chef_of_pupitre` |
| `GET /dashboard/pupitre/membres` | `getPupitrePage` (`section: 'members'`) | `pupitre` : `{ pupitre, members }` | `chef_pupitre` | `403` |
| `GET /dashboard/pupitre/documents` | `getPupitrePage` (`section: 'documents'`) | `pupitre` : `{ pupitre, documentsCount }` | `chef_pupitre` | `403` |
| `GET /dashboard/pupitre/notifications` | `getPupitrePage` (`section: 'notifications'`) | `pupitre` : `{ pupitre, unreadCount }` | `chef_pupitre` | `403` |
| `GET /dashboard/documents` | `listDocumentsPage` | `documents` : `DocumentsPageData` | `member` | — |
| `GET /dashboard/notifications` | `listNotificationsPage` | `notifications` : `NotificationsPageData` | `member` | — |
| `GET /dashboard/profil` | `getProfilePage` | `profile` : `ProfilePageData` | `member` | — |
| `GET /dashboard/securite` | *(aucune)* | aucune section (le socle suffit) | `member` | — |
| `GET /dashboard/admin` | `getAdminOverviewPage` | `adminOverview` : `AdminOverviewPageData` | `secretaire` | `403` |
| `GET /dashboard/admin/membres` | `listAdminMembersPage` | `adminMembers` : `AdminMembersPageData` | `secretaire` | `403` |
| `GET /dashboard/admin/invitations` | `listInvitationsPage` | `invitations` : `InvitationsPageData` | `secretaire` | `403` |
| `GET /dashboard/admin/articles` et `.../new`, `.../[id]/edit` | `listArticlesPage` | `articles` : `ArticlesPageData` | `secretaire` | `403` ; `404` édition d'un article absent |
| `GET /dashboard/admin/notifications` | `listNotificationsPage` | `notifications` : `NotificationsPageData` (avec `recipients`) | `secretaire` | `403` |
| `GET /dashboard/admin/media` | `listMediaPage` | `media` : `MediaPageData` | `secretaire` | `403` |
| `GET /dashboard/admin/settings` | `getSettingsPage` | `settings` : `SettingsPageData` | `admin` | `403` |
| `GET /dashboard/admin/permissions` | *(aucune)* | aucune section (le socle suffit) | `admin` | `403` |

**Règles de page :**

- **Agenda / détail** : `event` et `profiles` respectent §12.1 et §12.2. La
  liste nominative (`responses` avec `profileId` d'autrui) n'est incluse que
  pour la secrétaire/admin, ou pour un chef sur un événement **mono-pupitre de
  son pupitre** (Q-A3).
- **Annuaire** : `DirectoryProfile` uniquement (§12.3) ; tri `lastName` puis
  `firstName`. Aucune valeur fabriquée (`null` explicite, jamais `''`).
- **Pupitre** : `getPupitrePage` vérifie que `pupitreId` appartient aux pupitres
  dirigés (ou que l'acteur est secrétaire/admin) avant toute lecture.
- **Notifications** : `readBy` = `[profileId]` si lue, `[]` sinon. `recipients`
  n'est présent que pour `secretaire`/`admin` (et pour un chef, limité à ses
  pupitres).
- **Articles** : `contentMarkdown` n'est renvoyé que par cette page.
- **Sécurité / permissions** : aucun chargement supplémentaire ; le socle
  contient le profil et le rôle nécessaires.

### 7.12 `POST /api/member/action` — retours de mutation sans instantané (2026-11-25)

- **État** : remplace la forme « `snapshot` + `result` » de toutes les actions
  de l'espace adhérents. Les **noms** d'action et leurs entrées (`payload`) sont
  inchangés ; seul le retour change.
- **Garde** : `requireAuth` + vérification de rôle **par commande**
  (`runMemberCommand`), transaction `withUserContext`.
- **Entrée** : `{ action: string, payload?: unknown }` (inchangée).
- **Succès** : `200 { success: true, data: CommandResult }` — voir §3.1.
  Le client ne fait **aucune** hypothèse sur `data` : il revalide la page
  courante (`invalidateAll()`) et le load ciblé renvoie l'état à jour.
  `data` sert au message et à la navigation (ex. `kind: 'deleted'`).
- **Erreurs** : `400 invalid_payload`, `401 unauthenticated`, `403 insufficient_role`
  / `not_chef_of_pupitre` / `account_suspended`, `404 not_found`,
  `409 conflict` / `rsvp_locked` / `event_cancelled`, `413 file_too_large`,
  `415 unsupported_type`, `507 quota_exceeded`, `502 email_failed`.
- **Rôle minimum** : dépend de la commande (inchangé, §4).
- **Suppression** : `GET /api/member` (instantané complet) est **supprimé**.
  Aucune route ne renvoie plus `MemberSnapshot`.
- **Interdit** : reconstruire l'instantané après une mutation ; une commande ne
  déclenche **aucune** lecture globale (`profiles`, `event_responses`,
  `profile_pupitres` sans filtre).

---

## 8. Espace chef de pupitre

### 8.1 `GET /dashboard/pupitre/documents` (load)

- **Garde** : `requireRole(locals, 'chef_pupitre')` + périmètre des pupitres dirigés.
- **Entrée** : `pupitreId?`.
- **Succès** : `{ documents: DocumentSummary[]; pupitres: Pupitre[] }` (uniquement les pupitres dont l'acteur est chef).
- **Erreurs** : `403 not_chef_of_pupitre` si `pupitreId` hors périmètre.
- **Règles** : un chef ne voit que les documents de ses pupitres ; la secrétaire et l'admin voient tout.

### 8.2 `POST /dashboard/pupitre/documents?/upload`

- **Garde** : `requireRole(locals, 'chef_pupitre')` + `requirePupitreChef`.
- **Entrée** : `multipart/form-data` avec `title: string`, `description?: string`, `pupitreId: string`, `file: File` (PDF uniquement).
- **Succès** : `200 { success: true, data: { document: DocumentSummary } }`.
- **Erreurs** : `403 not_chef_of_pupitre`, `413 file_too_large` (> 20 Mo), `415 unsupported_type` (non PDF, vidéo refusée), `507 quota_exceeded`.
- **Règles** : dépôt réservé au chef de son pupitre, à la secrétaire et à l'admin ; clé `bagad-private/documents/{documentId}/{uuid}.pdf` ; quota réservé/confirmé/libéré.

### 8.3 `POST /dashboard/pupitre/documents?/deactivate`

- **Garde** : `requireRole(locals, 'chef_pupitre')` + `requirePupitreChef`.
- **Entrée** : `documentId: string`.
- **Succès** : `200 { success: true, data: { documentId: string, isActive: false } }`.
- **Erreurs** : `404 not_found`, `403 not_chef_of_pupitre`.
- **Règles** : désactivation logique (`is_active = false`), pas de suppression physique immédiate ; le quota est libéré selon la politique de conservation.

### 8.4 `GET /dashboard/pupitre/membres` (load)

- **État** : route existante (`+page.server.ts` vide).
- **Garde** : `requireRole(locals, 'chef_pupitre')`.
- **Succès** : `{ members: TrombinoscopeEntry[] }` limité aux pupitres dirigés.
- **Règles** : mêmes champs autorisés que le trombinoscope (§7.3) ; aucune coordonnée privée. **À CONFIRMER** : cette route est-elle le trombinoscope du chef ou une vue distincte (§13) ?

### 8.5 `POST /dashboard/pupitre/notifications?/send`

- **Garde** : `requireRole(locals, 'chef_pupitre')` + `requirePupitreChef`.
- **Entrée** : `title: string`, `body: string`, `pupitreIds: string[]` (uniquement ses pupitres).
- **Succès** : `200 { success: true, data: { sent: number, logIds: string[] } }`.
- **Erreurs** : `403 not_chef_of_pupitre`, `502 email_failed` (si canal e-mail), `429 rate_limited`.
- **Règles** : audience résolue côté serveur depuis `profile_pupitres` ; le chef ne peut cibler que les pupitres dont `is_chef = true`. Aucun identifiant de destinataire soumis par le navigateur.

---

## 9. Administration

Sauf mention contraire, les routes de cette section exigent `requireRole(locals, 'secretaire')` (secrétaire ou admin) ; les opérations réservées à l'admin sont marquées.

### 9.1 `GET /dashboard/admin` (load)

- **Garde** : `requireRole(locals, 'secretaire')`.
- **Succès** : `{ counts: { members: number; pendingInvitations: number; upcomingEvents: number }; storage: StorageUsage }`.
- **Règles** : aucune donnée nominative au-delà de ce que la page affiche.

### 9.2 Agenda — `GET /dashboard/admin/agenda`, `POST .../agenda/new?/create`, `POST .../agenda?/update|cancel|delete`

- **Garde** : `requireRole(locals, 'secretaire')` ; pour un chef, `requireRole(locals, 'chef_pupitre')` + `requirePupitreChef` et **visibilité `interne` imposée**.
- **Entrée `create`** : `title: string`, `description?: string`, `eventDate: string` (`YYYY-MM-DD`), `eventType: EventType`, `visibility: 'public' | 'interne' | 'pupitre'`, `isPoll: boolean`, `pupitreIds?: string[]`.
- **Entrée `update`** : `eventId: string` + les champs modifiables ci-dessus (tous optionnels).
- **Entrée `cancel`** : `eventId: string`, `reason?: string`.
- **Entrée `delete`** : `eventId: string`.
- **Succès `create`** : `200 { success: true, data: { event: MemberEvent } }`.
- **Succès `update`** : `200 { success: true, data: { event: MemberEvent } }`.
- **Succès `cancel`** : `200 { success: true, data: { eventId: string, state: 'annule', cancelledAt: string } }`.
- **Succès `delete`** : `200 { success: true, data: { eventId: string } }`.
- **Erreurs** : `400 validation_error` (date non civile, type inconnu), `403 insufficient_role`, `403 not_chef_of_pupitre`, `404 not_found`, `409 conflict` (récurrence non supportée).
- **Règles** :
  - Un chef crée toujours `visibility = 'interne'` avec **exactement un** pupitre parmi ceux qu'il dirige. Il ne peut jamais créer un événement `public`, `pupitre`, multi-pupitres ou global (**Q-A1/Q-A2**, 2026-11-20 — la visibilité `pupitre` imposée à un chef est **abandonnée**).
  - Un chef **ne peut pas élargir** la visibilité par `update` (elle reste `interne`) ni modifier `createdBy` ou `isPoll` ; il ne peut pas faire sortir l'événement de son périmètre.
  - Un chef **supprime** uniquement un événement **mono-pupitre de son pupitre** ; multi-pupitres et global : secrétaire/admin (**Q-A4**).
  - La secrétaire et l'admin peuvent créer `public`, `interne` ou `pupitre`, avec zéro, un ou plusieurs pupitres. Zéro pupitre = événement global (`public` ou `interne`).
  - **Aucun endpoint dédié à la création** n'est ajouté : l'action `create` délègue à la fonction SQL atomique `app.create_event(...)`, qui insère l'événement et ses pupitres dans la même transaction. La forme HTTP (`Entrée`/`Succès`/`Erreurs` ci-dessus) est **inchangée**.
  - `eventType` est indépendant de `visibility`.
  - Aucune récurrence en V1.
  - L'annulation ne supprime aucune réponse ; elle les passe en lecture seule. **Dépendance : Q-2026-11-08-05** (`cancelled_at`).
  - Le schéma actuel `agendaSchema` (`date: datetime`, `location`) est **obsolète** : la date doit être `YYYY-MM-DD` et `location` n'existe pas dans `events`. À remplacer.

### 9.3 Articles — `GET /dashboard/admin/articles`, `POST .../articles/new?/create`, `POST .../articles/[id]/edit?/update`, `POST .../articles?/publish|unpublish|delete`

- **Garde** : `requireRole(locals, 'secretaire')`.
- **Entrée `create` / `update`** : `title: string`, `slug: string`, `content: string` (Markdown), `isPublished?: boolean`.
- **Entrée `publish` / `unpublish` / `delete`** : `articleId: string`.
- **Succès `create`** : `200 { success: true, data: { article: PublicArticle } }`.
- **Succès `update`** : `200 { success: true, data: { article: PublicArticle } }`.
- **Succès `publish`** : `200 { success: true, data: { articleId: string, isPublished: true, publishedAt: string } }`.
- **Succès `unpublish`** : `200 { success: true, data: { articleId: string, isPublished: false } }`.
- **Succès `delete`** : `200 { success: true, data: { articleId: string } }`.
- **Erreurs** : `400 validation_error`, `409 conflict` (slug déjà pris), `404 not_found`.
- **Règles** : contenu Markdown conservé ; prévisualisation avant publication ; le public ne lit que `is_published = true` ; `published_at` est renseigné à la première publication.

### 9.4 Médias et quota — `GET /dashboard/admin/media`, `POST .../media?/upload|delete`

- **Garde** : `requireRole(locals, 'secretaire')` ; l'écran de quota est visible par secrétaire et admin.
- **Entrée (load)** : `page?`, `pageSize?`, `albumId?`.
- **Succès (load)** : `{ media: Array<{ id: string; title: string; fileKey: string; mimeType: string; sizeBytes: number; isPublic: boolean; albumId: string | null; createdAt: string }>; storage: StorageUsage }`.
- **Entrée `upload`** : `multipart/form-data` avec `title: string`, `description?: string`, `albumId?: string`, `isPublic: boolean`, `file: File`.
- **Entrée `delete`** : `mediaId: string`.
- **Succès `upload`** : `200 { success: true, data: { mediaId: string; fileKey: string; sizeBytes: number; storage: StorageUsage } }`.
- **Succès `delete`** : `200 { success: true, data: { mediaId: string; storage: StorageUsage } }`.
- **Erreurs** : `413 file_too_large`, `415 unsupported_type`, `507 quota_exceeded`, `404 not_found`.
- **Règles** : images JPG/JPEG/PNG/WebP ≤ 15 Mo et ≤ 6000 × 6000, sortie WebP ≤ 2000 × 2000 qualité 82, métadonnées supprimées ; OGG ≤ 30 Mo ; PDF ≤ 20 Mo ; vidéo refusée. Le quota est global (8 Go, alerte 7 Go, blocage 8 Go). Les objets publics vont dans `bagad-public/albums/{albumId}/`, les privés dans `bagad-private/`. **Dépendances : Q-2026-11-08-02** (modèle de quota) et **Q-2026-11-08-03** (pipeline images).

### 9.5 Membres — `GET /dashboard/admin/membres`, `POST .../membres?/activate|suspend|changeRole|setPupitres`

- **Garde** : `requireRole(locals, 'secretaire')` ; `changeRole` exige `requireRole(locals, 'admin')`.
- **Entrée (load)** : `query?`, `role?`, `accountStatus?`, `page?`, `pageSize?`.
- **Succès (load)** : `PaginatedResponse<MemberAdminSummary>`.
- **Entrée `activate` / `suspend`** : `profileId: string`.
- **Entrée `changeRole`** : `profileId: string`, `role: AppRole`.
- **Entrée `setPupitres`** : `profileId: string`, `pupitreIds: string[]`, `chefPupitreIds?: string[]`.
- **Succès** : `200 { success: true, data: { member: MemberAdminSummary } }`.
- **Erreurs** : `403 insufficient_role`, `409 conflict` (activation d'un e-mail non confirmé), `404 not_found`, `400 validation_error` (rôle inconnu, pupitre inconnu).
- **Règles** :
  - L'activation n'est possible que si `email_confirmed = true` ; elle change uniquement `account_status` en `active`, jamais le rôle.
  - La suspension conserve les données et les réponses ; elle révoque les sessions si Better Auth le permet.
  - Seul l'admin change un rôle applicatif ; secrétaire et admin peuvent modifier les pupitres.
  - Toute action est journalisée dans `activity_log` sans secret.

### 9.6 Invitations — `GET /dashboard/admin/invitations`, `POST .../invitations?/invite|resend|revoke`

- **Garde** : `requireRole(locals, 'secretaire')`.
- **Entrée (load)** : `status?`, `page?`, `pageSize?`.
- **Succès (load)** : `PaginatedResponse<InvitationSummary>`.
- **Entrée `invite`** : voir §5.5.
- **Entrée `resend`** : `invitationId: string`.
- **Entrée `revoke`** : `invitationId: string`.
- **Succès `resend`** : `200 { success: true, data: { invitationId: string; expiresAt: string } }`.
- **Succès `revoke`** : `200 { success: true, data: { invitationId: string; status: 'revoked' } }`.
- **Erreurs** : `404 not_found`, `409 conflict` (invitation déjà acceptée), `502 email_failed`.
- **Règles** : un renvoi crée un nouveau jeton expirant après **1 heure** (Q-2026-11-17-02) et invalide l'ancien, sans créer un second compte Auth. La révocation supprime ou invalide l'invitation — **À CONFIRMER** : le schéma `invitations` n'a pas de colonne `revoked_at` (§13). **Dépendance : Q-2026-11-08-06.**

### 9.7 Notifications — `GET /dashboard/admin/notifications`, `POST .../notifications?/send`

- **Garde** : `requireRole(locals, 'secretaire')` ; l'audience globale est réservée à l'admin.
- **Entrée (load)** : `page?`, `pageSize?`.
- **Succès (load)** : `{ history: PaginatedResponse<NotificationLogEntry>; pupitres: Pupitre[] }`.
- **Entrée `send`** : `title: string`, `body: string`, `audience: 'all' | 'pupitres'`, `pupitreIds?: string[]`.
- **Succès** : `200 { success: true, data: { sent: number; logIds: string[] } }`.
- **Erreurs** : `403 insufficient_role` (audience globale par un non-admin), `400 validation_error`, `429 rate_limited`.
- **Règles** : voir §12.5. La secrétaire peut cibler plusieurs pupitres ; l'admin peut cibler tous ; le chef utilise §8.5. Le navigateur ne fournit jamais la liste des destinataires.

### 9.8 `GET /dashboard/admin/permissions` et `GET /dashboard/admin/settings`

- **État** : deux pages existent (`permissions` avec `settingsSchema` `siteName`/`supportEmail`, `settings` sans load). **À CONFIRMER** : la route `permissions` ne correspond pas à son schéma ; faut-il une page de réglages distincte de la gestion des permissions ? (§13).
- **Garde** : `requireRole(locals, 'admin')`.
- **Entrée (load)** : aucune.
- **Succès** : `{ siteName: string; supportEmail: string }` ou `{ roles: ... }` selon l'arbitrage.
- **Règles** : ne pas implémenter par supposition ; la gestion des rôles passe par §9.5 `changeRole`.

---

## 10. Fichiers et stockage

### 10.1 `GET /api/files/[...key]`

- **État** : route existe (`src/routes/api/files/[...key]/+server.ts`), vide ; à implémenter.
- **Garde** :
  - clé `public/...` : publique, aucun guard ;
  - clé `private/...` : `requireAuth` + contrôle de visibilité (propriétaire pour l'avatar, membre actif pour un document, rôle autorisé pour un média privé).
- **Entrée** : `key` = `public|private/...` (premier segment = bucket logique, reste = clé R2).
- **Succès** : flux binaire `200` avec `Content-Type`, `Content-Length`.
- **Erreurs** : `401 unauthenticated`, `403 insufficient_role`, `404 not_found` (ne pas révéler l'existence d'un objet privé).
- **Règles** :
  - Aucun objet privé n'a d'URL publique permanente.
  - `Cache-Control: private, no-store` pour les objets privés ; cache public autorisé pour `public/...`.
  - **Q-2026-11-08-04** : la cible est un service par endpoint après guard, sans URL signée ; les noms de bindings cibles sont `R2_PUBLIC` / `R2_PRIVATE`.
  - Clés canoniques : `private/profiles/{profileId}/avatar.{ext}`, `private/documents/{documentId}/{uuid}.pdf`, `public/albums/{albumId}/{uuid}.{ext}`, `private/albums/{albumId}/{uuid}.{ext}`.
  - `docs/media.md` utilise aussi `public/events/{eventId}/...` ; cette variante est une **contradiction documentaire** (E13) à harmoniser, pas une seconde convention.

### 10.2 `GET /api/storage/usage`

- **État** : à créer ; **À CONFIRMER** : endpoint dédié ou donnée du load `/dashboard/admin/media` (§13).
- **Garde** : `requireRole(locals, 'secretaire')`.
- **Succès** : `{ storage: StorageUsage }`.
- **Erreurs** : standard.
- **Règles** : `availableBytes = blockThresholdBytes - usedBytes - reservedBytes` ; `level` = `ok` / `warning` / `critical` (≥ alerte) / `blocked` (≥ blocage).

### 10.3 `POST /api/sync-storage`

- **État** : mentionné par `docs/media.md`, non implémenté. **À CONFIRMER** : optionnel, réservé admin, ou tâche planifiée uniquement (§13).
- **Garde** : `requireRole(locals, 'admin')`.
- **Entrée** : aucune.
- **Succès** : `{ storage: StorageUsage; corrected: boolean }`.
- **Erreurs** : `429 rate_limited`, `502 email_failed` n'est pas applicable ; `500 internal_error`.
- **Règles** : réconciliation R2 ↔ Neon, écart > 1 % corrigé, `last_sync_at` mis à jour.

---

## 11. Contrat interne serveur (fonctions partagées)

Ces fonctions ne sont pas des endpoints HTTP ; elles fixent l'interface entre modules serveur.

| Fonction                  | Signature cible                                                            | Règles                                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `withUserContext`         | `(db: DB, profileId: string, cb: (tx) => Promise<T>) => Promise<T>` | Ouvre une transaction, exécute **`set_config('app.profile_id', ..., true)`** — **seul** réglage de contexte admis, **jamais** `app.current_user_id` ni `app.user_id` — puis `cb`. Le rôle n'est **pas** passé en paramètre : les policies le lisent depuis `profiles.role` par `app.profile_id`. Contexte local à la transaction (aucune fuite entre requêtes, y compris après `ROLLBACK`). **Q-2026-11-08-01**, **Q-A9** (audit du 2026-11-20). |
| `reserveStorage`          | `(bytes: number) => Promise<{ reserved: boolean; usage: StorageUsage }>`   | Vérifie `used + reserved + bytes <= blockThreshold`; sinon `quota_exceeded`.                                                                                                        |
| `finalizeUpload`          | `(reservedBytes: number, actualBytes: number) => Promise<StorageUsage>`    | `used += actual`, `reserved -= reserved`.                                                                                                                                           |
| `releaseReservation`      | `(reservedBytes: number) => Promise<StorageUsage>`                         | `reserved -= reserved` en cas d'échec.                                                                                                                                              |
| `listEvents`              | `(actor, options?) => Promise<MemberEvent[]>`                              | Applique la visibilité §12.1.                                                                                                                                                       |
| `getEventById`            | `(eventId: string) => Promise<EventWithPupitres \| null>`                  | Inclut les pupitres ciblés.                                                                                                                                                         |
| `createEvent`             | `(actor, data) => Promise<Event>`                                          | Guard en amont **et** délégation à la fonction SQL **`app.create_event(..., p_pupitre_ids uuid[])`** (`SECURITY DEFINER`) : l'événement et ses pupitres sont insérés **dans la même transaction**. Chef : **exactement 1** pupitre qu'il dirige et `visibility = 'interne'` **seulement** ; secrétaire/admin : `public`/`interne`/`pupitre` et **0 à N** pupitres (0 = global). Aucune insertion directe dans `events` par un chef. **Q-A1/Q-A2** (2026-11-20). |
| `updateEvent`             | `(actor, eventId, data) => Promise<Event>`                                 | Guard en amont ; remplace les pupitres si `pupitreIds` fourni. Un chef **ne peut pas élargir** la visibilité (il reste en `interne`) ni faire sortir l'événement de son périmètre ; `created_by` et `is_poll` ne sont pas modifiables par un chef. **Q-A1/Q-A2**. |
| `cancelEvent`             | `(actor, eventId, reason?) => Promise<Event>`                              | Renseigne `cancelled_at` ; ne supprime aucune réponse. **Q-2026-11-08-05**.                                                                                                         |
| `deleteEvent`             | `(actor, eventId) => Promise<void>`                                        | Un chef supprime **uniquement** un événement **mono-pupitre de son pupitre** ; multi-pupitres et global : secrétaire/admin. Aucun droit dérivé du seul statut de créateur. Les réponses suivent la politique de conservation. **Q-A4** (2026-11-20). |
| `upsertResponse`          | `(actor, { eventId, profileId, status }) => Promise<EventResponse>`        | `profileId` doit égaler `actor.profileId` ; vérifie l'état `actif` et la visibilité.                                                                                                |
| `getProfileWithPupitres`  | `(profileId) => Promise<SessionProfile \| null>`                           | Inclut `isChef`.                                                                                                                                                                    |
| `updateOwnProfile`        | `(profileId, updates) => Promise<Profile>`                                 | Champs limités à `first_name`, `last_name`, `phone`, `address`, `musician_level`.                                                                                                   |
| `activateProfile`         | `(profileId) => Promise<Profile>`                                          | Vérifie `email_confirmed` en amont.                                                                                                                                                 |
| `suspendProfile`          | `(profileId) => Promise<Profile>`                                          | Conserve les données.                                                                                                                                                               |
| `createInvitation`        | `(data) => Promise<Invitation>`                                            | Jeton empreinté, TTL 1 h.                                                                                                                                                           |
| `validateInvitation`      | `(token, email) => Promise<Invitation \| null>`                            | Refuse expiré, consommé, adresse non concordante.                                                                                                                                   |
| `markInvitationAccepted`  | `(invitationId) => Promise<Invitation>`                                    | Renseigne `accepted_at`.                                                                                                                                                            |
| `uploadObject`            | `(bindings, bucket, key, body, mimeType) => Promise<R2ObjectMetadata>`     | Bucket `public` ou `private`.                                                                                                                                                       |
| `getObject`               | `(bindings, bucket, key) => Promise<{ body, mimeType } \| null>`           | Lecture après guard.                                                                                                                                                                |
| `deleteObject`            | `(bindings, bucket, key) => Promise<void>`                                 | Suppression R2.                                                                                                                                                                     |
| `sendPushNotification`    | `({ playerIds, title, message, url? }) => Promise<unknown>`                | **Ne doit pas être appelée avec des `playerIds` fournis par le navigateur** ; l'audience est résolue côté serveur.                                                                  |
| `resolveAudience`         | `(role, actorPupitreIds, requestedPupitreIds) => string[]`                 | Admin = global ; secrétaire = plusieurs ; chef = ses pupitres ; membre = refusé.                                                                                                    |
| `sendEmail`               | `({ to, subject, html, text? }) => Promise<ResendResult>`                  | Clé Resend serveur uniquement.                                                                                                                                                      |
| `sendInvitationEmail`     | `(to, invitationLink) => Promise<ResendResult>`                            | Lien 1 h.                                                                                                                                                                           |
| `sendPasswordResetEmail`  | `(to, resetLink) => Promise<ResendResult>`                                 | Lien Better Auth.                                                                                                                                                                   |
| `sendContactConfirmation` | `(to) => Promise<ResendResult>`                                            | Après succès de l'envoi principal.                                                                                                                                                  |

### 11.1 Fonctions de lecture ciblée (2026-11-25)

Toutes ces fonctions reçoivent `tx` (transaction ouverte par `withUserContext`),
`profileId` (issu de `locals.profile`, jamais du client) et n'importent jamais
`db`. Chacune **relit** `profiles.role` et `profiles.account_status` dans `tx`
avant de répondre. Elles remplacent `buildMemberSnapshot`, **supprimé**.

Conventions d'erreur : pas d'erreur HTTP ici ; elles renvoient `null`
(ressource invisible) ou lèvent `MemberQueryError(code)` avec
`PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`,
`NOT_CHEF_OF_PUPITRE`. Le `+*.server.ts` traduit en `403`/`404`.

#### getMemberShell
- **Fichier** : `src/lib/server/member/queries/shell.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `MemberShell` — `{ profile: MemberProfile; unreadCount: number }` ; `profile.pupitres[].isChef` **uniquement** pour ce profil.
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`
- **Rôle minimum** : `member` (compte actif)

#### getPageContext
- **Fichier** : `src/lib/server/member/queries/context.ts`
- **Paramètres** : `(tx, profileId: string, minRole: AppRole)`
- **Retour** : `{ role: AppRole; accountStatus: AccountStatus }`
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`
- **Rôle minimum** : `minRole`

#### getOverviewPage
- **Fichier** : `src/lib/server/member/queries/overview.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `OverviewPageData` — 10 prochains événements visibles (`MemberEventPageItem`), 3 dernières notifications (`readBy` = soi), nombre de documents
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`
- **Rôle minimum** : `member`

#### listAgendaEvents
- **Fichier** : `src/lib/server/member/queries/agenda.ts`
- **Paramètres** : `(tx, profileId: string, filters?: { from?: string; to?: string })`
- **Retour** : `AgendaPageData` — événements visibles (RLS), `myResponse`, `responseSummary`
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`
- **Rôle minimum** : `member`

#### getEventDetail
- **Fichier** : `src/lib/server/member/queries/events.ts`
- **Paramètres** : `(tx, profileId: string, eventId: string)`
- **Retour** : `EventDetailPageData | null` — `event`, `profiles` (audience minimale, `DirectoryProfile`), `responses` (ma réponse ; nominatif seulement si §12.2 l'autorise)
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE` ; `null` = invisible/inexistant
- **Rôle minimum** : `member`

#### getEventForEdit
- **Fichier** : `src/lib/server/member/queries/events.ts`
- **Paramètres** : `(tx, profileId: string, eventId: string)`
- **Retour** : `EventFormPageData | null`
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`, `NOT_CHEF_OF_PUPITRE`
- **Rôle minimum** : `chef_pupitre` (événement mono-pupitre de son périmètre) ou `secretaire`/`admin`

#### listDirectoryProfiles
- **Fichier** : `src/lib/server/member/queries/directory.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `{ profiles: DirectoryProfile[] }` — §12.3 uniquement, aucune `isChef`, aucune valeur fabriquée
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`
- **Rôle minimum** : `member`

#### getPupitrePage
- **Fichier** : `src/lib/server/member/queries/pupitre.ts`
- **Paramètres** : `(tx, profileId: string, input: { pupitreId: string; section: 'overview' | 'members' | 'documents' | 'notifications' })`
- **Retour** : `PupitrePageData` — une seule section renseignée ; `members` typés `PupitreMember` (seule projection portant `isChef`, pour l'affichage des chefs)
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `NOT_CHEF_OF_PUPITRE`
- **Rôle minimum** : `chef_pupitre` (pupitre dirigé) ; `secretaire`/`admin` pour tout pupitre
- **Note** : seule fonction, avec `listAdminMembersPage`, qui expose `isChef` d'un autre profil (affichage des chefs, édition) — §13 point 21.

#### listDocumentsPage
- **Fichier** : `src/lib/server/member/queries/documents.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `DocumentsPageData` — documents actifs + compteurs par pupitre
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`
- **Rôle minimum** : `member`

#### listNotificationsPage
- **Fichier** : `src/lib/server/member/queries/notifications.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `NotificationsPageData` — `readBy` réduit à `[profileId]`/`[]` ; `recipients`/`pupitres` seulement pour les rôles qui envoient
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`
- **Rôle minimum** : `member`

#### getProfilePage
- **Fichier** : `src/lib/server/member/queries/profile.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `ProfilePageData` — `profile` (soi-même), `preferences` (`null` si aucune ligne)
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`
- **Rôle minimum** : `member`

#### listArticlesPage
- **Fichier** : `src/lib/server/member/queries/articles.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `ArticlesPageData` — articles + `authors` minimaux (`DirectoryProfile`)
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`
- **Rôle minimum** : `secretaire`

#### listMediaPage
- **Fichier** : `src/lib/server/member/queries/media.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `MediaPageData` — albums + photos + `storage`
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`
- **Rôle minimum** : `secretaire`

#### listInvitationsPage
- **Fichier** : `src/lib/server/member/queries/invitations.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `InvitationsPageData`
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`
- **Rôle minimum** : `secretaire`

#### listAdminMembersPage
- **Fichier** : `src/lib/server/member/queries/adminMembers.ts`
- **Paramètres** : `(tx, profileId: string, filters?: { query?: string; role?: AppRole; accountStatus?: AccountStatus })`
- **Retour** : `AdminMembersPageData` — `MemberAdminSummary[]` (rôle, statut, niveau, pupitres + `isChef`, titre et `bureauPositionId` pour l'édition)
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`
- **Rôle minimum** : `secretaire`

#### getSettingsPage
- **Fichier** : `src/lib/server/member/queries/settings.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `SettingsPageData` — réglages + `storage`
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`
- **Rôle minimum** : `admin`

#### getAdminOverviewPage
- **Fichier** : `src/lib/server/member/queries/adminOverview.ts`
- **Paramètres** : `(tx, profileId: string)`
- **Retour** : `AdminOverviewPageData` — compteurs seulement
- **Erreurs** : `PROFILE_NOT_FOUND`, `ACCOUNT_INACTIVE`, `INSUFFICIENT_ROLE`
- **Rôle minimum** : `secretaire`

#### runMemberCommand (forme révisée)
- **Fichier** : `src/lib/server/member/commands.ts`
- **Paramètres** : `(tx, actor, action: string, payload: unknown)`
- **Retour** : `CommandResult` — **jamais** d'instantané, **jamais** de lecture globale
- **Erreurs** : `MemberCommandError` (inchangée : statut + `code`)
- **Rôle minimum** : par commande (§4)

---

## 12. Règles métier transverses

### 12.1 Visibilité et gestion des événements

La **visibilité** détermine qui peut consulter et à qui répondre. Elle ne donne
pas, à elle seule, un droit de modification ou de suppression.

| `visibility` | Visiteur anonyme | Membre actif |
| ------------ | ---------------- | ------------ |
| `public`     | lecture          | lecture + RSVP |
| `interne`    | interdit         | lecture + RSVP |
| `pupitre`    | interdit         | lecture + RSVP si l'un de ses pupitres est ciblé |

Les droits de gestion sont indépendants de cette matrice de lecture :

- **Chef de pupitre :** peut gérer un événement ciblant exactement un seul
  pupitre dont il est chef, quel que soit le créateur. Il ne peut gérer ni un
  événement multi-pupitres ni un événement global (aucun pupitre). Le droit
  découle exclusivement de `profile_pupitres.is_chef` ; il n'existe aucun
  droit lié à `created_by`. La perte du statut de chef retire ce droit
  (**Q-A1**, 2026-11-20).
- **Création par un chef :** exactement un pupitre qu'il dirige et
  `visibility = 'interne'`. Il ne peut créer ni événement `public`, ni
  événement `pupitre`, ni événement multi-pupitres ou global (**Q-A2**).
- **Modification par un chef :** il ne peut changer ni la visibilité, ni le
  pupitre ciblé, ni `created_by`, ni `is_poll`. Il ne peut pas élargir la
  portée d'un événement ou le déplacer hors de son périmètre. Les événements
  historiques `pupitre` créés par des chefs restent soumis à la question
  ouverte 1 de `docs/questions.md` ; ne pas créer d'exception non validée.
- **Suppression par un chef :** autorisée pour un événement mono-pupitre de
  l'un de ses pupitres ; multi-pupitres et global sont réservés à la secrétaire
  et à l'admin (**Q-A4**). La suppression entraîne la suppression en cascade
  des réponses associées, conformément à la décision M03 du 2026-11-21.
- **Secrétaire et admin :** gestion de tous les événements, y compris
  multi-pupitres et globaux. Ils peuvent créer avec `public`, `interne` ou
  `pupitre`, et cibler zéro à N pupitres ; zéro pupitre signifie global.
- **Membre :** aucune action de création, modification, annulation ou
  suppression.
- La création passe par la fonction SQL atomique
  `app.create_event(..., p_pupitre_ids uuid[])` ; aucun rôle applicatif ne
  contourne cette fonction par une insertion directe dans `events`.
- `event_type` (`sortie`, `concert`, `fest-noz`, `festival`,
  `concours`, `gala`, `repetition`, `reunion`, `repas`) est indépendant
  de `visibility`.
- Les événements n'ont pas d'heure et ne sont pas récurrents en V1.

### 12.2 RSVP

- Statuts autorisés : `present`, `absent`. Aucune autre valeur.
- Une seule réponse par couple (`event_id`, `profile_id`), contrainte d'unicité.
- L'identité du répondant vient de la session ; `profileId` n'est jamais un paramètre client.
- Modifiable pendant la date de l'événement, jusqu'à **23 h 59 min 59 s** `Europe/Paris` ; verrouillée à **00 h 00** le lendemain.
- Jamais retirable par le membre ; pas d'historique, seule la dernière réponse est conservée.
- Après annulation (`cancelled_at` renseigné) ou clôture (date dépassée), lecture seule ; aucune suppression.
- La suspension du compte ne supprime pas les réponses ; la suppression du compte les anonymise (`profile_id = NULL`).
- Un sondage est un événement `is_poll = true` ; mêmes réponses, pas de table `polls`.
- **Visibilité nominative des réponses — tranchée le 2026-11-20 (Q-A3).** La liste nominative (qui a répondu, avec quel statut) est réservée :
  - **secrétaire et admin** : tous les événements, y compris multi-pupitres et globaux ;
  - **chef de pupitre** : **uniquement** les événements ciblant **exactement un** pupitre qu'il dirige. Un chef dont **un** pupitre participe à un événement **multi-pupitres**, ou un événement **global sans pupitre**, **ne voit pas** la liste nominative ;
  - **membre** : jamais celle des autres ; il lit **sa propre** réponse et les **agrégats** (`responseSummary`, `isPoll`).
  La règle est appliquée **en base** (policies de `event_responses`) **et** côté serveur — un masquage d'interface ne vaut pas protection. Les agrégats restent lisibles selon §12.1.

### 12.3 Trombinoscope

- Accès : membres **actifs connectés** uniquement, jamais public.
- Champs autorisés : `firstName`, `lastName`, `avatarUrl`, `avatar` (palette 1–12), `pupitres[{id,name}]`, `musicianLevel`, `bureauPosition`.
- Champs interdits : `phone`, `email`, `address`, `role`, `accountStatus`, `authUserId`, `createdAt`, `updatedAt`, `bureauPositionId`, `isChef`.
- **`bureauPosition`** est une **chaîne d'affichage** (titre du bureau), lue par jointure sur `bureau_positions`. Elle n'expose **jamais** `bureauPositionId`, ni aucune clé technique. Un profil sans titre reçoit `null` (jamais `undefined`, jamais une valeur inventée). **L'audit du 2026-11-20 (C8)** a constaté que la jointure manquait — `bureauPosition` valait toujours `null` : la correction est portée par la migration de durcissement RLS, pas par une nouvelle règle.
- **`isChef` est strictement interne** : il n'apparaît ni dans la vue annuaire, ni dans le trombinoscope, ni dans l'instantané adhérent, ni dans aucun champ indirect (objet `pupitres`, JSON agrégé, `/dashboard/pupitre/membres`). Il ne sert qu'aux vérifications serveur (**Q-A5**, audit du 2026-11-20).
- La fonction au bureau est informative et ne confère aucun droit ; les titres ne sont jamais publics.
- Photo : `bagad-private/profiles/{profileId}/avatar.{ext}`, servie après guard ; seul le propriétaire peut la remplacer, admin inclus. Tant que `avatar_url` est vide — état livré, Q-2026-11-17-03 premier temps, puis après `profile.avatar.remove` — le portrait illustré `avatar` est affiché.
- Tri : `lastName`, puis `firstName`.

### 12.4 R2, fichiers et quota

- Buckets : `bagad-public` (objets explicitement publiés) et `bagad-private` (profils, documents, albums privés).
- Quota **global** : 8 Go pour les deux buckets additionnés ; alerte à 7 Go ; blocage des nouveaux uploads à 8 Go.
- Table `storage_usage` : `public_bytes`, `private_bytes`, `reserved_bytes`, `quota_bytes`, `alert_threshold_bytes`, `block_threshold_bytes`, `last_sync_at`, `updated_at` (colonnes `bigint`). **Q-2026-11-08-02**.
- Réservation avant upload, confirmation après, libération en cas d'échec ; mises à jour atomiques ou reproduites côté serveur.
- **Préalable obligatoire (audit du 2026-11-20, P7)** : les fonctions de quota ne sont **pas** encore en base. Aucun upload ne se branche avant que `app.reserve_storage_bytes`, `app.finalize_storage_upload` et `app.release_storage_bytes` existent (migration `0007_storage_quota_functions`). Vérification du seuil **dans la transaction** de réservation, jamais par une lecture préalable séparée.
- Images : JPG/JPEG/PNG/WebP ≤ 15 Mo, ≤ 6000 × 6000, sortie affichée WebP ≤ 2000 × 2000 qualité 82, métadonnées supprimées ; variantes 400 × 400 (qualité 75, `cover`) et 2000 × 2000 (qualité 82, `contain`). Les variantes sont produites **à la diffusion** par Cloudflare Image Resizing : l'original est stocké tel quel, aucune conversion serveur (`sharp` est interdit sur Workers, Q-2026-11-08-03).
- OGG ≤ 30 Mo ; PDF ≤ 20 Mo ; vidéo refusée.
- Contrôle du type MIME **et** des magic numbers (JPEG `ffd8ff`, PNG `89504e47`, WebP `52494646`).
- Aucun objet privé accessible par URL publique permanente ; service par `/api/files/...` après guard. **Q-2026-11-08-04**.

### 12.5 OneSignal

- Clé REST strictement serveur ; jamais dans le bundle client, les logs ou les exemples.
- Audiences :
  - `admin` : globale (tous les membres actifs avec push activé).
  - `secretaire` : plusieurs pupitres, tous autorisés.
  - `chef_pupitre` : uniquement les pupitres dont `is_chef = true`.
  - `member` : aucun envoi.
- Le serveur résout les destinataires depuis `profiles` / `profile_pupitres` ; il n'accepte **jamais** un `playerId`, `externalId` ou une liste de destinataires soumis par le navigateur.
- Préférences respectées : `events_enabled` pour les nouveaux événements, `reminders_enabled` pour les rappels, `no_response_reminder_enabled` pour le rappel sans réponse.
- Audiences d'un événement : `public` et `interne` → tous les membres actifs ; `pupitre` → membres des pupitres ciblés. Un sondage suit la même règle.
- Chaque envoi est journalisé dans `notification_log` (`type`, `title`, `content`, `sent_at`, `status`).
- **Q-2026-11-08-07** : la V1 doit trancher entre notification à la création et rappel J-3 (ou les deux). Le contrat décrit les deux chemins derrière des préférences distinctes, sans supposer la cadence.

### 12.6 Contact

- Turnstile vérifié côté serveur avant tout envoi.
- Resend envoie à `CONTACT_EMAIL` (attendu `bagadpenhars@gmail.com`).
- Accusé de réception à l'expéditeur uniquement après succès de l'envoi principal.
- Aucune pièce jointe ; adresse de réception et clé API jamais exposées.
- Limitation de débit recommandée (`rate_limited`) pour éviter le spam.

### 12.7 Articles et albums

- Articles : `title`, `slug` unique, `content` Markdown, `is_published`, `published_at`, `author_id`, plus les colonnes nullables `category`, `image_url`, `image_alt` (Q-2026-11-17-04, option A du 2026-11-18, migration additive).
- Un brouillon n'est jamais rendu publiquement ni récupérable par un appel direct.
- Une catégorie ou une image vide n'est jamais affichée sur le site public ; aucune valeur par défaut n'est inventée.
- Prévisualisation réservée aux rôles autorisés (secrétaire, admin).
- Albums : `title`, `description`, `is_published`, `album_date` (à ajouter), photos avec `caption` et `sort_order` (à ajouter).
- Publication et suppression réservées à la secrétaire et à l'admin.
- Médias publics dans `bagad-public/albums/{albumId}/` ; médias non publics dans `bagad-private/`.

### 12.8 Contexte RLS et source de vérité des droits

- Le contexte de session PostgreSQL est **`app.profile_id`**, posé par `withUserContext` (`set_config('app.profile_id', ..., true)`) dans la transaction courante. **`app.current_user_id` et `app.user_id` ne sont pas des réglages valides** : aucune nouvelle policy, aucun nouveau code ne doit les lire (**Q-A9**, audit du 2026-11-20).
- Le rôle métier n'est pas transmis par un réglage dédié : il se lit depuis `profiles.role` par `app.profile_id`.
- **Aucun droit ne dérive du créateur d'une ligne.** Les droits de gestion d'un événement découlent du **pupitre** ; les présences nominatives également.
- Les policies RLS et les gardes serveur appliquent **la même règle** ; une divergence est un défaut bloquant, pas un détail d'implémentation. Toute nouvelle table métier arrive **avec** ses policies.
- La création d'événement passe par une **fonction SQL atomique**, sans endpoint HTTP dédié : le contrat HTTP (§9.2) reste **inchangé**.

---

## 13. Points « À CONFIRMER » et dépendances

| #   | Point                                                                                                                      | Pourquoi                                                                                                                                                                          | Renvoi                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | **Driver transactionnel** `neon-http` vs `neon-serverless` + `Pool`                                                        | `set_config(..., true)` exige la même transaction que les requêtes ; `neon-http` ne le permet pas. Le contrat cible `withUserContext`, mais le choix du driver n'est pas tranché. | **Q-2026-11-08-01**                                |
| 2   | **Modèle `storage_usage`** global vs par bucket, colonnes `bigint` et seuils                                               | `docs/database.md` et `docs/media.md` divergent ; le schéma actuel est en `integer`.                                                                                              | **Q-2026-11-08-02**                                |
| 3   | **Pipeline images** Cloudflare Images vs R2 + variantes                                                                    | Les URL `imagedelivery.net/{hash}/{r2_key}` ne servent pas une clé R2 ; le contrat expose `thumbnailUrl` / `fullUrl` sans figer le fournisseur.                                   | **Q-2026-11-08-03**                                |
| 4   | **Noms des bindings R2**                                                                                                   | Trois noms coexistent (`R2_BUCKET`, `R2_BUCKET_PUBLIC/PRIVATE`, `bagad_public/private`). Le contrat cible `R2_PUBLIC` / `R2_PRIVATE`.                                             | **Q-2026-11-08-04**                                |
| 5   | **État annulé** `cancelled_at`                                                                                             | Le schéma `events` n'a ni statut ni date d'annulation ; le contrat expose `state: 'annule'` et `cancelledAt`.                                                                     | **Q-2026-11-08-05**                                |
| 6   | **Création du compte à l'invitation**                                                                                      | Better Auth ne crée pas d'utilisateur sans plugin admin ou flux d'inscription ; le parcours §5.5/§5.6 en dépend.                                                                  | **Q-2026-11-08-06**                                |
| 7   | **Cadence des notifications** création vs J-3                                                                              | `docs/Spec.md` §4.6 et `docs/event.md` décrivent deux mécanismes ; le contrat expose les deux préférences sans trancher.                                                          | **Q-2026-11-08-07**                                |
| 8   | **Durées de conservation et purge**                                                                                        | Aucune durée validée pour réponses, `activity_log`, messages de contact, invitations expirées ; aucune purge automatique.                                                         | **Q-2026-11-08-08**                                |
| 9   | **Dossiers historiques Supabase/Netlify**                                                                                  | Le déplacement ou la suppression exige l'accord du client ; sans impact direct sur l'API.                                                                                         | **Q-2026-11-08-09**                                |
| 10  | **Couleurs et icônes PWA**                                                                                                 | Le manifest et les icônes ne sont pas finalisés ; sans impact sur l'API, mais bloque la PWA.                                                                                      | **Q-2026-11-07-02**                                |
| 11  | **Route canonique d'invitation** : `/auth/invitation?/invite` (existant) vs `/dashboard/admin/invitations?/invite` (cible) | Doublon de route ; le contrat choisit l'administration, l'implémentation existante est sous `auth/`.                                                                              | À confirmer par l'équipe (pas une question client) |
| 12  | **Route du trombinoscope** : `/dashboard/trombinoscope` (à créer) vs `/dashboard/membres` vs `/dashboard/pupitre/membres`  | Aucune route dédiée n'existe ; le contrat propose `/dashboard/trombinoscope`.                                                                                                     | À confirmer par l'équipe                           |
| 13  | **Action RSVP sur l'agenda public**                                                                                        | L'action `?/rsvp` existe sur `/[lang]/agenda`, qui doit être en lecture seule (F4). Le contrat la déplace vers `/dashboard/agenda?/rsvp`.                                         | Écart à corriger (F4, F16, F17)                    |
| 14  | **Contact : action `submit` vs endpoint `/api/contact`**                                                                   | Le document parle d'« endpoint SvelteKit » ; le contrat choisit une action `submit` pour le progressive enhancement.                                                              | Choix de contrat, à valider frontend/backend       |
| 15  | **`/dashboard/admin/permissions` vs `/dashboard/admin/settings`**                                                          | La route `permissions` porte un `settingsSchema` (`siteName`, `supportEmail`) ; `settings` n'a pas de load. Les deux pages se recoupent.                                          | À confirmer par l'équipe                           |
| 16  | **`bureauPositionId` modifiable par le membre**                                                                            | `docs/Spec.md` §4.3 dit « hors rôle et pupitres » ; le titre du bureau est honorifique et validé par le bureau. Le contrat le réserve à l'administration.                         | À confirmer (règle absente)                        |
| 17  | **Révocation d'invitation**                                                                                                | Le schéma `invitations` n'a pas de `revoked_at` ; faut-il supprimer la ligne ou ajouter une colonne ?                                                                             | À confirmer (migration)                            |
| 18  | **Colonnes d'album manquantes**                                                                                            | `albums.album_date`, `media.caption`, `media.sort_order` sont requis par F6 mais absents du schéma Drizzle.                                                                       | Migration à prévoir (étape 25)                     |
| 19  | **Visibilité nominative des réponses**                                                                                     | **Tranché le 2026-11-20 (Q-A3)** : chef = événements mono-pupitre de son pupitre uniquement ; multi-pupitres et globaux = secrétaire/admin ; membre = sa propre réponse et les agrégats. Appliqué en base **et** côté serveur (§12.2).              | **Q-A3** (audit RLS)                                |
| 20  | **`GET /api/storage/usage` et `POST /api/sync-storage`**                                                                   | `docs/media.md` mentionne une route de synchronisation ; le load `/dashboard/admin/media` peut suffire.                                                                           | À confirmer par l'équipe                           |
| 21  | **`isChef` d'un autre profil** — projection de page, affichage des chefs et édition                                       | §12.3 / Q-A5 déclarent `isChef` strictement interne, et interdisent `/dashboard/pupitre/membres`, où l'écran affiche pourtant les chefs (`activeChefs`). Le retrait serait une **modification d'interface**, hors du chantier 2026-11-25. Le contrat retient : projection **uniquement** par `getPupitrePage` et `listAdminMembersPage`, jamais dans l'annuaire, l'agenda ou les notifications. | **Q-2026-11-25-01** (client)                        |
| 22  | **Droits d'écriture sur `tests/**`** et tests vides (`tests/i18n.test.ts`, `tests/invitation.test.ts`)                     | L'étape 73 prévoit `tests/member-queries.test.ts` ; l'attribution de `tests/**` n'est pas confirmée, et deux fichiers de test sont vides (0 octet).                              | **Q-2026-11-25-02** et **-03** (Chef)              |
| 23  | **Nommage des DTO de page** : `date`/`type`/`status`/`pupitreIds` (code) vs `eventDate`/`eventType`/`state`/`pupitres` (§3) | Les composants lisent les noms du code ; renommer casserait l'interface. Les DTO de page (§3.1) suivent donc le code ; l'idéalisation du §3 reste un objectif documentaire non planifié. | Choix de contrat, à ne pas rouvrir sans refonte d'écran |

---

## 14. Traçabilité vers les besoins

| Besoin                                    | Endpoints / actions concernés |
| ----------------------------------------- | ----------------------------- |
| F4 — agenda public en lecture seule       | §6.2, §7.2                    |
| F5 — actualités                           | §6.3, §9.3                    |
| F6 — albums photo                         | §6.4, §9.4                    |
| F8 — contact                              | §6.5                          |
| F9 — SEO                                  | §6.6                          |
| F10 — i18n                                | §6, §6.6                      |
| F13 — connexion / mot de passe            | §5.2 à §5.4                   |
| F14 — invitations                         | §5.5, §5.6, §9.6              |
| F15 — profil                              | §7.6, §7.7                    |
| F16 — agenda privé                        | §7.2                          |
| F17 — RSVP                                | §7.2, §12.2                   |
| F18 — sondages                            | §7.2, §12.2                   |
| F19 — trombinoscope                       | §7.3, §12.3                   |
| F20 — documents                           | §7.4, §8.1 à §8.3, §10.1      |
| F21 — préférences de notifications        | §7.5                          |
| F22 — suppression de compte               | §7.9                          |
| F23 / F24 — PWA et installation           | hors API (étape 30)           |
| F25 / F26 / F27 — rôles et administration | §4, §9                        |
| F28 — membre                              | §7                            |
| F29 — types et visibilités                | §9.2, §12.1                   |
| F30 — OneSignal                           | §8.5, §9.7, §12.5             |
| F31 — journalisation                      | §5.5, §9.5, §9.6              |
| F32 — guards + RLS                        | §2.7, §4, §11                 |
| T2 — migrations                           | §3, §13 (colonnes manquantes) |
| T3 — Better Auth                          | §5.1, §5.2                    |
| T5 / T6 — RLS et cache                    | §11 (`withUserContext`)       |
| T7 — R2                                   | §7.7, §8.2, §9.4, §10         |
| T8 — quota                                | §9.4, §10.2, §12.4            |
| T9 — formats et tailles                   | §7.7, §8.2, §9.4, §12.4       |
| T10 — Resend / Turnstile                  | §5.4, §5.5, §6.5, §12.6       |
| T11 — OneSignal serveur                   | §8.5, §9.7, §12.5             |
| T12 — service worker                      | hors API (étape 30)           |
| T16 — runes                               | hors API (interface)          |
