# 🎶 Bagad Penhars — Site officiel

Site du Bagad Penhars : un site public multilingue (français, anglais, breton) et une zone adhérents privée, en français, réservée aux membres approuvés. Stack : **SvelteKit 2 + Appwrite + TailwindCSS**.

---

## 🧭 Objectif

Un projet volontairement simple (pas un SaaS) :

- Site public vitrine en **FR / EN / BR**
- Zone adhérents en **français uniquement**, avec un espace par rôle
- Agenda des répétitions et événements avec suivi de présence
- Partitions par pupitre
- Membres ajoutés par invitation, validés par un administrateur
- Notifications par pupitre (OneSignal ou Appwrite Realtime)

---

## 🌐 Site public (multilingue)

Accessible sans connexion. Les URLs sont préfixées par la langue : `/fr/...`, `/en/...`, `/br/...`.

| Route | Description |
|-------|-------------|
| `/fr`, `/en`, `/br` | Accueil : actualités, infos, chiffres clés |
| `/[lang]/bagad` | Présentation du bagad |
| `/[lang]/formation` | École de formation |
| `/[lang]/agenda` | Agenda public (lecture seule) |
| `/[lang]/media` | Photos, vidéos, enregistrements |
| `/[lang]/partenaires` | Partenaires |
| `/[lang]/contact` | Formulaire de contact |

Seuls `fr`, `en` et `br` sont acceptés. Toute autre valeur renvoie une 404.

### Choix de la langue

1. Si l'URL contient une langue, elle est utilisée.
2. Sinon, le cookie `preferred_lang` est utilisé s'il existe.
3. Sinon, l'en-tête `Accept-Language` du navigateur est lu.
4. Sinon, le français est utilisé.

Le sélecteur de langue du header garde la même page dans la langue choisie et mémorise le choix dans le cookie `preferred_lang`. L'attribut `lang` du HTML correspond à la langue affichée.

### Contenus non traduits

Les traductions couvrent l'interface. Les **événements** et **actualités** saisis dans Appwrite sont pour l'instant en français uniquement. Le site l'indique lorsqu'un contenu n'existe pas dans la langue demandée.

---

## 🔐 Zone privée (dashboard)

Accessible après connexion. **Français uniquement** : les routes `/dashboard` et `/auth` n'ont pas de préfixe de langue, et les pages sont marquées `noindex`.

### Rôles

| Rôle | Accès | Notes |
|------|-------|-------|
| `pending` | Page d'attente uniquement (`/auth/pending`) | Compte créé, en attente de validation par un admin |
| `member` | Dashboard complet | Agenda, présence, partitions globales et de son pupitre, profil |
| `chef_pupitre` | + gestion du pupitre | Membres du pupitre, partitions du pupitre, notifications au pupitre |
| `admin` | + gestion globale | Invitations, validation des comptes, tous les membres, réglages |

### Blocage des comptes `pending`

Le contrôle est fait dans `hooks.server.ts`, à chaque requête, y compris les actions de formulaire :

- sans session, toute route `/dashboard` redirige vers `/auth/login` ;
- avec une session et le rôle `pending`, toute route `/dashboard` redirige vers `/auth/pending` ;
- le rôle est relu depuis la base à chaque requête, donc une validation prend effet immédiatement, sans reconnexion.

Les permissions de la collection `profiles` dans Appwrite doivent interdire à l'utilisateur de modifier son propre `role` et son `pupitre`. Seules les opérations serveur, avec la clé d'API, peuvent les changer.

### Dashboard

Une seule route par section (`/dashboard/agenda`, `/dashboard/documents`, etc.). Le contenu s'adapte au rôle avec des blocs conditionnels.

---

## 📅 Agenda et présence

- **Public** (`/[lang]/agenda`) : événements marqués publics, lecture seule.
- **Dashboard** (`/dashboard/agenda`) : tous les événements. Chaque membre ne peut modifier **que sa propre présence** (`present`, `absent`, `unknown`). L'identifiant vient de la session, jamais du formulaire.
- **Gestion** (chef et admin) : ajouter, modifier, supprimer.
- **Reset annuel** : l'agenda est vidé le 31 décembre (`scripts/reset-agenda.js` ou trigger Appwrite).

---

## 📑 Partitions

**Stockage** : bucket Appwrite `documents`, lecture par URL signée (pas de lecture publique).

| Action | Member | Chef | Admin |
|--------|--------|------|-------|
| Lire partitions globales | ✅ | ✅ | ✅ |
| Lire partitions de son pupitre | ✅ | ✅ | ✅ |
| Ajouter partition de son pupitre | ❌ | ✅ | ✅ |
| Ajouter partition globale | ❌ | ❌ | ✅ |
| Supprimer | ❌ | ✅ son pupitre | ✅ |

---

## 👥 Pupitres

1. Bombarde
2. Cornemuse
3. Caisse claire
4. Percussion

Chaque membre appartient à un seul pupitre. Le chef de pupitre ne voit que les membres de son pupitre et ne gère que ses partitions.

---

## 🔐 Invitation et validation

### 1. Création (admin)

L'admin renseigne **prénom**, **nom**, **email** et **pupitre**. Le serveur crée un token UUID, enregistre l'invitation (expiration : 7 jours) et envoie le lien `/auth/invitation?token=...`.

### 2. Acceptation (invité)

Le serveur vérifie que le token existe, n'est pas expiré et n'a pas été utilisé. Le formulaire pré-remplit email, prénom, nom et pupitre (lecture seule pour les champs venant de l'invitation), et demande un mot de passe.

À la validation :
- création du compte Appwrite ;
- création du profil avec `role: pending` ;
- invitation marquée `used: true` ;
- redirection vers `/auth/pending`.

### 3. Validation (admin)

Dans `/dashboard/admin/invitations`, l'admin voit les profils `pending` et choisit un rôle (`member`, `chef_pupitre` ou `admin`). Le serveur refuse toute autre valeur. Le compte peut ensuite accéder à son espace.

---

## 🔔 Notifications

- **Globales** : nouvel événement, rappel de présence 24 h avant, message de l'admin à tous.
- **Par pupitre** : nouvel événement ou nouvelle partition du pupitre, message du chef à son pupitre.

Implémentation : action de formulaire → webhook → OneSignal ou Appwrite → notification push.

---

## 🗄️ Schéma Appwrite

**Base** : `bagad_db`

### `profiles`
| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | ID utilisateur Appwrite |
| `email` | String | ✅ | Unique |
| `name` | String | ✅ | Prénom et nom |
| `pupitre` | Enum | ✅ | bombarde, cornemuse, caisse_claire, percussion |
| `role` | Enum | ✅ | pending, member, chef_pupitre, admin |
| `avatar` | String | ❌ | ID du fichier dans `avatars` |
| `phone` | String | ❌ | |
| `createdAt` | DateTime | ✅ | |

Index : `email` (unique), `role`, `pupitre`.

### `invitations`
| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | |
| `email` | String | ✅ | |
| `prenom` | String | ✅ | |
| `nom` | String | ✅ | |
| `pupitre` | Enum | ✅ | |
| `token` | String | ✅ | UUID unique |
| `expiresAt` | DateTime | ✅ | Création + 7 jours |
| `used` | Boolean | ✅ | |
| `createdAt` | DateTime | ✅ | |

Index : `token` (unique), `email`.

### `events`
| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | |
| `title` | String | ✅ | Français |
| `date` | DateTime | ✅ | |
| `description` | String | ❌ | Français |
| `type` | Enum | ✅ | repetition, sortie, reunion, externe |
| `location` | String | ❌ | |
| `isPublic` | Boolean | ✅ | Visible sur le site public |
| `createdBy` | String | ✅ | ID du profil |
| `createdAt` | DateTime | ✅ | |

Index : `date` (DESC), `isPublic`.

### `attendance`
| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | |
| `userId` | String | ✅ | |
| `eventId` | String | ✅ | |
| `status` | Enum | ✅ | present, absent, unknown |
| `updatedAt` | DateTime | ✅ | |

Index : `userId` + `eventId` (unique), `eventId`.

### `documents`
| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | |
| `name` | String | ✅ | |
| `fileId` | String | ✅ | ID dans `documents` |
| `pupitre` | Enum | ❌ | NULL = global |
| `type` | Enum | ✅ | partition, arrangement, recording |
| `uploadedBy` | String | ✅ | |
| `createdAt` | DateTime | ✅ | |

Index : `pupitre`, `type`.

### Buckets

| Bucket | Contenu | Lecture | Écriture |
|--------|---------|---------|----------|
| `avatars` | Photos de profil | Publique | Chef et admin |
| `documents` | Partitions | URL signée | Chef et admin |
| `media` | Photos et vidéos publiques | Publique | Admin |

---

## 🔐 Authentification

- **Connexion** (`/auth/login`) : identifiants vérifiés, session créée, secret stocké dans un cookie `HttpOnly`, `Secure` et `SameSite=Lax`.
- **Déconnexion** (`/auth/logout`) : suppression du cookie et de la session Appwrite.
- **Mot de passe oublié** : Appwrite envoie un lien vers `/auth/reset-password?token=...`.

---

## 🛡️ Sécurité

- Vérification du rôle à chaque requête dans `hooks.server.ts`, actions comprises.
- Guards `requireMember`, `requireChef`, `requireAdmin` sur les layouts et les actions.
- Clé d'API Appwrite côté serveur uniquement. Un client Appwrite est créé par requête, avec la session de l'utilisateur.
- Tokens d'invitation uniques, à usage unique et expirants.
- Validation de toutes les valeurs de formulaire côté serveur (rôle, pupitre, type).
- Interdiction faite aux utilisateurs de modifier leur `role` ou leur `pupitre` dans Appwrite.

---

## 🌍 Traductions

```
src/lib/i18n/
├── index.ts     # messages, Lang, LANGS
├── types.ts     # type Messages, dérivé de fr.ts
├── fr.ts        # Référence
├── en.ts
└── br.ts
```

`en.ts` et `br.ts` sont typés avec `Messages` : une clé manquante fait échouer `npm run check`. Le test `tests/i18n.test.ts` vérifie aussi l'absence de clé orpheline.

Les traductions en breton doivent être relues par une personne qui pratique la langue. Une traduction automatique ne suffit pas pour un site associatif.

---

## 🚀 Installation

### Prérequis
- Node.js 22+
- Projet Appwrite (Cloud ou local)
- OneSignal (optionnel)

### Mise en route

```bash
git clone https://github.com/hazerty565/bagadPenhars.git
cd bagadPenhars
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev                  # http://localhost:5173
```

### Variables d'environnement

```env
# Public
PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
PUBLIC_APPWRITE_PROJECT_ID=your_project_id

# Serveur uniquement (jamais préfixé PUBLIC_)
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=bagad_db

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=contact@bagad-penhars.com
EMAIL_PASS=your_app_password

# OneSignal (optionnel)
ONESIGNAL_APP_ID=xxx
ONESIGNAL_REST_KEY=xxx
```

---

## 📚 Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Aperçu du build |
| `npm run check` | Vérification TypeScript et Svelte |
| `npm test` | Tests (guards, traductions) |
| `npm run appwrite:export` | Export du schéma Appwrite |
| `npm run appwrite:import` | Import des migrations |

---

## 🚀 Déploiement

### Netlify

Le projet utilise `@sveltejs/adapter-netlify`. Netlify gère la publication, il ne faut donc **pas** publier `.svelte-kit/build` à la main.

1. Pousser sur GitHub.
2. Connecter le dépôt dans Netlify.
3. Build : `npm run build` (détecté automatiquement).
4. Renseigner les variables d'environnement dans *Site settings → Environment variables*.

### Appwrite Cloud

Authentification et base prêtes pour la production, après application des règles d'accès de la collection `profiles`.

---
### structure du projet
bagad-penhars/
├── src/
│   ├── app.html                       # <html lang="%lang%"> ← modifié
│   ├── app.d.ts
│   ├── app.css
│   ├── hooks.server.ts                # Session, rôle, blocage pending ← modifié
│   │
│   ├── params/
│   │   └── lang.ts                    # Matcher : fr | en | br ← nouveau
│   │
│   ├── lib/
│   │   ├── appwrite/
│   │   │   ├── client.ts              # SDK browser
│   │   │   ├── server.ts              # SDK serveur (clé d'API), un client par requête
│   │   │   └── config.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── roles.ts               # Types Role, can()
│   │   │   └── guards.ts              # requireMember, requireChef, requireAdmin ← modifié
│   │   │
│   │   ├── data/
│   │   │   ├── events.ts
│   │   │   ├── profiles.ts            # + updateProfileRole (serveur uniquement) ← modifié
│   │   │   ├── documents.ts
│   │   │   ├── attendance.ts
│   │   │   ├── invitations.ts
│   │   │   └── notifications.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   │   └── LanguageSwitcher.svelte   ← nouveau
│   │   │   ├── events/
│   │   │   ├── documents/
│   │   │   ├── members/
│   │   │   └── auth/
│   │   │
│   │   ├── i18n/
│   │   │   ├── index.ts               # messages, Lang, LANGS ← modifié
│   │   │   ├── types.ts               # type Messages (dérivé de fr.ts) ← nouveau
│   │   │   ├── fr.ts                  # Référence, zone publique + privée
│   │   │   ├── en.ts                  # Public uniquement
│   │   │   └── br.ts                  # Public uniquement
│   │   │
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   └── routes/
│       ├── +layout.svelte
│       ├── +layout.server.ts
│       ├── +error.svelte
│       │
│       ├── (public)/
│       │   ├── +page.server.ts        # Redirige / vers la langue détectée ← modifié
│       │   └── [lang=lang]/           # ← modifié (matcher)
│       │       ├── +layout.server.ts  # Langue, traductions, cookie ← modifié
│       │       ├── +layout.svelte
│       │       ├── +page.svelte       # Accueil
│       │       ├── bagad/
│       │       ├── formation/
│       │       ├── agenda/
│       │       ├── media/
│       │       ├── partenaires/
│       │       └── contact/
│       │
│       ├── auth/                      # Pas de préfixe de langue
│       │   ├── login/
│       │   ├── logout/
│       │   ├── forgot-password/
│       │   ├── reset-password/
│       │   ├── invitation/
│       │   └── pending/               # Compte en attente d'approbation ← nouveau
│       │
│       └── dashboard/                 # Français uniquement, pas de préfixe de langue
│           ├── +layout.server.ts      # requireMember
│           ├── +layout.svelte
│           ├── +page.svelte
│           ├── agenda/
│           ├── documents/
│           ├── profil/
│           ├── pupitre/
│           │   ├── +layout.server.ts  # requireChef
│           │   ├── membres/
│           │   └── documents/
│           └── admin/
│               ├── +layout.server.ts  # requireAdmin
│               ├── invitations/       # Création + approbation des pending
│               ├── membres/
│               └── settings/
│
├── migrations/
│   ├── 001_initial_schema.json
│   └── README.md
│
├── scripts/
│   ├── reset-agenda.js
│   ├── export-appwrite.js
│   └── import-appwrite.js
│
├── static/
├── tests/
│   ├── guards.test.ts                 # Tests des rôles pending/member/chef/admin ← nouveau
│   └── i18n.test.ts                   # Mêmes clés dans fr, en, br ← nouveau
├── .env.example
├── .gitignore
├── package.json
├── svelte.config.js                   # adapter-netlify ← modifié
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
---
## 📋 État d'avancement

- [x] Structure SvelteKit + Appwrite
- [x] Routage multilingue FR / EN / BR (site public)
- [x] Blocage des comptes `pending`
- [ ] Authentification et guards complets
- [ ] Traductions EN et BR complètes (relecture BR à prévoir)
- [ ] Flow d'invitation
- [ ] Dashboard : agenda, partitions, profil
- [ ] Sections chef et admin
- [ ] Gestion des erreurs (401, 403, 404, 500)
- [ ] Notifications (OneSignal)
- [ ] Tests (guards, traductions)
- [ ] Tests E2E (Playwright)
- [ ] Responsive mobile
- [ ] Déploiement Netlify + Appwrite Cloud

---

## 📄 Licence

MIT — voir [LICENSE](./LICENSE).

**Dernière mise à jour** : 13/10/2026
**Stack** : SvelteKit 2 + Appwrite + TailwindCSS + Node.js 22+
