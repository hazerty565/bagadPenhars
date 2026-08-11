# 🎶 Bagad Penhars — Site officiel

Site web du Bagad Penhars avec une zone adhérents sécurisée basée sur **SvelteKit + Appwrite**.

---

## 🧭 Objectif du projet

Un projet volontairement **simple** (pas un SaaS) :

- ✅ Site public vitrine multilingue (FR / BR / EN)
- ✅ Zone adhérents avec dashboard unique (français uniquement)
- ✅ Agenda des répétitions / événements avec système de présence
- ✅ Gestion des partitions musicales par pupitre
- ✅ Gestion des membres par invitation sécurisée
- ✅ Notifications par pupitre (OneSignal ou Appwrite Realtime)
- ✅ Rôles simples et hiérarchiques

---

## 🌐 Pages publiques

Accessibles sans connexion. Les URLs sont multilingues : `/[lang]/route`.

| Route | Description | Langues |
|-------|-------------|---------|
| `/` ou `/fr` | Home — news, infos, chiffres clés | Détection auto |
| `/[lang]/bagad` | Présentation du bagad | FR / BR / EN |
| `/[lang]/formation` | École de formation | FR / BR / EN |
| `/[lang]/agenda` | Agenda public (lecture seule) | FR / BR / EN |
| `/[lang]/media` | Photos, vidéos, enregistrements | FR / BR / EN |
| `/[lang]/partenaires` | Partenaires | FR / BR / EN |
| `/[lang]/contact` | Formulaire de contact | FR / BR / EN |

**Fonctionnement** :
- Visite sur `bagadpenhars.fr` → Détection auto de la langue du navigateur
- Cookie `preferred_lang` mémorise le choix de l'utilisateur
- Sélecteur de langue dans le header pour changer manuellement

---

## 🔐 Zone privée (Dashboard)

Accessible via Appwrite Auth. **Français uniquement**, pas de multilingue.

Route unique : `/dashboard` avec affichage "Caméléon" (adapté au rôle).

### Rôles et hiérarchie

| Rôle | Accès | Notes |
|------|-------|-------|
| `pending` | ❌ Aucun | En attente d'approbation admin |
| `member` | Dashboard complet | Agenda, présence, documents, profil |
| `chef_pupitre` | + Gestion pupitre | Membres du pupitre, documents, partitions, notifications |
| `admin` | + Gestion globale | Tous les membres, invitations, settings, notifications globales |

### Dashboard (Une seule page, affichage adapté)

```
/dashboard
├── Accueil (tous)
├── Agenda + Présence (tous)
├── Documents / Partitions (tous - lecture seule pour member, R/W pour chef/admin)
├── Mon Profil (tous)
├── Gestion Pupitre (chef_pupitre + admin) — /dashboard/pupitre/*
│   ├── Membres du pupitre
│   ├── Partitions du pupitre (upload)
│   └── Notifications au pupitre
└── Administration (admin uniquement) — /dashboard/admin/*
    ├── Invitations (créer + approuver)
    ├── Tous les membres (vue globale)
    └── Settings (notifications globales)
```

**Principe** : Une seule route `/dashboard/agenda`, `/dashboard/documents`, etc., avec contenu adapté au rôle via blocs `{#if}`.

---

## 📅 Agenda & Présence

### Page publique `/[lang]/agenda`
- **Affichage** : Événements publics uniquement
- **Accès** : Tous (même sans connexion)
- **Interaction** : Lecture seule

### Dashboard `/dashboard/agenda`
- **Affichage** : Tous les événements (répétitions + sorties + réunions)
- **Présence** : Boutons "✅ Présent / ❌ Absent / ❓ Ne sais pas"
- **Gestion** (chef + admin) :
  - Bouton "Ajouter événement"
  - Bouton "Modifier / Supprimer"

**Reset annuel** : L'agenda est vidé le **31 décembre** (via script ou trigger Appwrite).

---

## 📑 Documents / Partitions

**Type** : Partitions musicales (PDF, MP3, partitions scannées)

**Stockage** : Bucket Appwrite `documents`

**Hiérarchie** :
- **Globales** : Accessible à tous les membres
- **Par pupitre** : Accessible uniquement aux membres du pupitre

**Permissions** :
| Action | Member | Chef | Admin |
|--------|--------|------|-------|
| Lire partitions globales | ✅ | ✅ | ✅ |
| Lire partitions du pupitre | ✅ | ✅ | ✅ |
| Upload partition pupitre | ❌ | ✅ Son pupitre | ✅ Tous |
| Upload partition global | ❌ | ❌ | ✅ |
| Supprimer | ❌ | ✅ Son pupitre | ✅ Tous |

---

## 👥 Pupitres

**Pupitres du Bagad** :
1. Bombarde
2. Cornemuse
3. Caisse Claire
4. Percussion

**Chaque membre appartient à un seul pupitre.**

**Chef de pupitre** :
- Ne voit que les membres de son pupitre
- Gère les documents de son pupitre uniquement
- Peut envoyer des notifications à son pupitre
- Valide la présence de ses membres

---

## 🔐 Flow d'invitation (sécurisé)

### 1️⃣ Création de l'invitation (Admin)

Admin → `/dashboard/admin/invitations` → Formulaire :
```
Email : xxx@example.com
Nom : Jean
Prénom : Dupont
Pupitre : Bombarde
```

**Serveur** :
- Crée un token unique (UUID)
- Enregistre l'invitation en BDD (collection `invitations`)
- Envoie un email avec le lien : `bagadpenhars.fr/auth/invitation?token=UUID`

### 2️⃣ L'utilisateur clique le lien

Route : `/auth/invitation?token=abc123...`

**Validation côté serveur** :
- ✅ Token existe
- ✅ Token non expiré (+7 jours)
- ✅ Token non utilisé

**Formulaire** :
```
Email : xxx@example.com (pré-rempli, lecture seule)
Nom : Jean (pré-rempli)
Prénom : Dupont (pré-rempli)
Pupitre : Bombarde (pré-rempli)
Mot de passe : ___________
Confirmer : ___________
```

**Action** :
- Crée l'utilisateur Appwrite
- Crée le profil en BDD avec rôle `pending`
- Marque le token comme `used: true`
- Redirect vers `/auth/login?success=true`

### 3️⃣ Admin approuve et attribue le rôle

Route : `/dashboard/admin/invitations`

Affiche les profils `pending` :
```
✅ Jean Dupont | Bombarde | [Approuver]
```

Action : Choisir le rôle (member, chef, admin) → Rôle passe de `pending` à `member` / `chef_pupitre` / `admin`

---

## 🔔 Notifications

**Services supportés** : OneSignal ou Appwrite Realtime

### Notifications globales
- Nouvel événement
- Rappel présence (24h avant)
- Admin envoie une notification à tous

### Notifications par pupitre
- Nouvel événement du pupitre
- Nouveau document du pupitre
- Chef envoie une notification à son pupitre

**Implémentation** : Admin/Chef → Form action → Trigger webhook → OneSignal / Appwrite → Push notification

---

## 🏗️ Architecture du projet

```
bagad-penhars/
├── src/
│   ├── app.html
│   ├── app.d.ts
│   ├── app.css
│   ├── hooks.server.ts              # Session Appwrite + résolution rôle + pupitre
│   │
│   ├── lib/
│   │   ├── appwrite/
│   │   │   ├── client.ts            # SDK browser
│   │   │   ├── server.ts            # SDK server (API key)
│   │   │   └── config.ts            # IDs collections, buckets, endpoint
│   │   │
│   │   ├── auth/
│   │   │   ├── roles.ts             # Types Role, constantes, fonctions can()
│   │   │   └── guards.ts            # requireAuth, requireChef, requireAdmin
│   │   │
│   │   ├── data/                    # Accès Appwrite direct
│   │   │   ├── events.ts
│   │   │   ├── profiles.ts
│   │   │   ├── documents.ts
│   │   │   ├── attendance.ts
│   │   │   ├── invitations.ts
│   │   │   └── notifications.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── events/
│   │   │   ├── documents/
│   │   │   ├── members/
│   │   │   └── auth/
│   │   │
│   │   ├── i18n/
│   │   │   ├── index.ts             # Helper functions (getTranslation, t)
│   │   │   ├── fr.ts                # Traductions français
│   │   │   ├── en.ts                # Traductions anglais
│   │   │   └── br.ts                # Traductions breton
│   │   │
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   └── routes/
│       ├── +layout.svelte           # Layout global
│       ├── +layout.server.ts        # Hooks pour session
│       ├── +error.svelte            # Page erreur
│       │
│       ├── (public)/                # Pages publiques (multilingues)
│       │   ├── +layout.server.ts    # Charge traductions + détection langue
│       │   └── [lang]/
│       │       ├── +page.svelte     # Home
│       │       ├── bagad/
│       │       ├── formation/
│       │       ├── agenda/
│       │       ├── media/
│       │       ├── partenaires/
│       │       └── contact/
│       │
│       ├── auth/                    # Authentification
│       │   ├── login/
│       │   ├── logout/
│       │   ├── forgot-password/
│       │   ├── reset-password/
│       │   └── invitation/          # Complétion profil (token unique)
│       │
│       └── dashboard/               # Zone privée (français uniquement)
│           ├── +layout.server.ts    # Guard requireAuth
│           ├── +layout.svelte       # Header + sidebar caméléon
│           ├── +page.svelte         # Accueil dashboard
│           ├── agenda/
│           ├── documents/
│           ├── profil/
│           ├── pupitre/             # Chef pupitre + admin
│           │   ├── +layout.server.ts  # Guard requireChef
│           │   ├── +layout.svelte
│           │   ├── membres/
│           │   └── documents/
│           └── admin/               # Admin uniquement
│               ├── +layout.server.ts  # Guard requireAdmin
│               ├── +layout.svelte
│               ├── invitations/
│               ├── membres/
│               └── settings/
│
├── migrations/                      # Schéma Appwrite (JSON)
│   ├── 001_initial_schema.json
│   └── README.md
│
├── scripts/                         # Utilitaires
│   ├── reset-agenda.js              # Reset agenda 31 décembre
│   ├── export-appwrite.js
│   └── import-appwrite.js
│
├── static/
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🗄️ Schéma Appwrite

**Database ID** : `bagad_db`

### Collection: `profiles`

| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | Clé primaire (userId Appwrite) |
| `email` | String | ✅ | Email (copie pour requêtes) |
| `name` | String | ✅ | Nom complet |
| `pupitre` | Enum | ✅ | bombarde, cornemuse, caisse_claire, percussion |
| `role` | Enum | ✅ | pending, member, chef_pupitre, admin |
| `avatar` | String | ❌ | File ID du bucket avatars |
| `phone` | String | ❌ | Téléphone |
| `createdAt` | DateTime | ✅ | Date d'adhésion |

**Index** : `email` (unique), `role`, `pupitre`

### Collection: `invitations`

| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | Clé primaire |
| `email` | String | ✅ | Email invité |
| `name` | String | ✅ | Nom |
| `prenom` | String | ✅ | Prénom |
| `pupitre` | Enum | ✅ | bombarde, cornemuse, caisse_claire, percussion |
| `token` | String | ✅ | UUID unique |
| `expiresAt` | DateTime | ✅ | Date d'expiration (+7 jours) |
| `used` | Boolean | ✅ | Marque si utilisé |
| `createdAt` | DateTime | ✅ | Date création |

**Index** : `token` (unique), `email`

### Collection: `events`

| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | Clé primaire |
| `title` | String | ✅ | Titre événement |
| `date` | DateTime | ✅ | Date/heure |
| `description` | String | ❌ | Description |
| `type` | Enum | ✅ | repetition, sortie, reunion, externe |
| `location` | String | ❌ | Lieu |
| `isPublic` | Boolean | ✅ | Visible en page publique |
| `createdBy` | String | ✅ | Relation vers userId |
| `createdAt` | DateTime | ✅ | Date création |

**Index** : `date` (DESC), `isPublic`

### Collection: `attendance`

| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | Clé primaire |
| `userId` | String | ✅ | Relation vers profiles |
| `eventId` | String | ✅ | Relation vers events |
| `status` | Enum | ✅ | present, absent, unknown |
| `updatedAt` | DateTime | ✅ | Dernière mise à jour |

**Index** : `userId` + `eventId` (unique), `eventId`

### Collection: `documents`

| Attribut | Type | Requis | Notes |
|----------|------|--------|-------|
| `$id` | String | ✅ | Clé primaire |
| `name` | String | ✅ | Nom du document (partition) |
| `fileId` | String | ✅ | File ID du bucket documents |
| `pupitre` | Enum | ❌ | bombarde, cornemuse, caisse_claire, percussion (NULL = global) |
| `type` | Enum | ✅ | partition, arrangement, recording |
| `uploadedBy` | String | ✅ | Relation vers userId |
| `createdAt` | DateTime | ✅ | Date création |

**Index** : `pupitre`, `type`

### Buckets Appwrite

| Bucket | Contenu | Public | Permissions |
|--------|---------|--------|-------------|
| `avatars` | Photos de profil | ✅ Lecture | Chef/Admin écrivent |
| `documents` | Partitions PDF | ❌ Lecture token | Chef/Admin écrivent |
| `media` | Photos/vidéos publiques | ✅ Lecture | Admin écrit |

---

## 🔐 Authentification

### Login
**Route** : `/auth/login`

Formulaire : Email + Mot de passe

**Action** :
1. Vérifier les identifiants
2. Créer une session Appwrite
3. Sauvegarder le secret de session dans un **HttpOnly Cookie**
4. Redirect vers `/dashboard`

### Logout
**Route** : `/auth/logout`

**Action** :
1. Supprimer le cookie de session
2. Invalider la session Appwrite
3. Redirect vers `/`

### Mot de passe oublié
**Route** : `/auth/forgot-password`

Appwrite envoie un email avec un lien vers `/auth/reset-password?token=...`

---

## 🔐 Sécurité & Hooks

### `hooks.server.ts`

Le fichier clé qui gère la session à chaque requête :

```typescript
export const handle: Handle = async ({ event, resolve }) => {
    const session = event.cookies.get('appwrite-session');

    if (!session) {
        event.locals.user = null;
        event.locals.role = null;
        event.locals.pupitre = null;
    } else {
        try {
            const appwriteUser = await account.get();
            const profile = await getProfileByUserId(appwriteUser.$id);

            event.locals.user = appwriteUser;
            event.locals.role = profile.role;       // pending | member | chef_pupitre | admin
            event.locals.pupitre = profile.pupitre; // bombarde | cornemuse | caisse_claire | percussion

        } catch (error) {
            // Session expirée ou invalide
            event.locals.user = null;
            event.locals.role = null;
            event.locals.pupitre = null;
            event.cookies.delete('appwrite-session', { path: '/' });

            if (event.url.pathname.startsWith('/dashboard')) {
                throw redirect(303, '/auth/login?expired=true');
            }
        }
    }

    return resolve(event);
};
```

### Guards

```typescript
// src/lib/auth/guards.ts
import { redirect, error } from '@sveltejs/kit';

export function requireAuth(locals: App.Locals) {
    if (!locals.user) {
        throw redirect(303, '/auth/login');
    }
}

export function requireChef(locals: App.Locals) {
    requireAuth(locals);
    if (locals.role !== 'chef_pupitre' && locals.role !== 'admin') {
        throw error(403, 'Accès réservé aux chefs de pupitre et admins');
    }
}

export function requireAdmin(locals: App.Locals) {
    requireAuth(locals);
    if (locals.role !== 'admin') {
        throw error(403, 'Accès réservé aux administrateurs');
    }
}
```

### Permissions fines dans les Form Actions

```typescript
// Exemple: Upload document
export const actions = {
    uploadDocument: async ({ request, locals }) => {
        if (locals.role === 'member') throw error(403);
        
        const { file, pupitre } = Object.fromEntries(await request.formData());

        // Chef ne peut upload que pour son pupitre
        if (locals.role === 'chef_pupitre' && pupitre !== locals.pupitre) {
            throw error(403, 'Vous ne pouvez upload que pour votre pupitre');
        }

        await uploadDocument(file, pupitre || locals.pupitre);
        return { success: true };
    }
};
```

---

## 🌍 i18n (Internationalisation)

### Structure

```
src/lib/i18n/
├── index.ts              # Helper functions
├── fr.ts                 # Traductions français
├── en.ts                 # Traductions anglais
└── br.ts                 # Traductions breton
```

### Exemple: `fr.ts`

```typescript
export const fr = {
  nav: {
    home: 'Accueil',
    bagad: 'Le Bagad',
    formation: 'Formation',
    agenda: 'Agenda',
    login: 'Connexion',
    logout: 'Déconnexion',
    dashboard: 'Tableau de bord'
  },
  home: {
    title: 'Bagad Penhars',
    subtitle: 'Le son de Bretagne',
    description: 'Découvrez le Bagad Penhars, ensemble musical traditionnel breton.'
  },
  // ... rest
};
```

### Utilisation dans les pages

```svelte
<!-- src/routes/(public)/[lang]/+page.svelte -->
<script>
  let { data } = $props();
  const { t, lang } = data;
</script>

<h1>{t.home.title}</h1>
<p>{t.home.subtitle}</p>

<nav>
  <a href="/{lang}/bagad">{t.nav.bagad}</a>
  <a href="/{lang}/formation">{t.nav.formation}</a>
  <a href="/{lang}/agenda">{t.nav.agenda}</a>
</nav>
```

### Détection auto de la langue

```typescript
// src/routes/(public)/+page.server.ts
export const load: PageServerLoad = ({ request, event }) => {
  const savedLang = event.cookies.get('preferred_lang');
  if (savedLang && ['fr', 'en', 'br'].includes(savedLang)) {
    throw redirect(303, `/${savedLang}`);
  }

  const acceptLanguage = request.headers.get('accept-language') || 'fr';
  const languages = acceptLanguage
    .split(',')
    .map(lang => lang.split('-')[0].toLowerCase().trim())
    .filter(lang => ['fr', 'en', 'br'].includes(lang));

  const detectedLang = languages[0] || 'fr';
  throw redirect(303, `/${detectedLang}`);
};
```

---

## 🎨 Le système "Caméléon" du Dashboard

Une seule page `/dashboard/agenda`, mais l'affichage change selon le rôle :

```svelte
<script>
  let { data } = $props();
</script>

{#each data.events as event}
  <div class="event-card">
    <h3>{event.title}</h3>

    <!-- Tous: Présence -->
    <form method="POST" action="?/respondEvent">
      <button name="status" value="present">✅ Présent</button>
      <button name="status" value="absent">❌ Absent</button>
      <button name="status" value="unknown">❓ Ne sais pas</button>
    </form>

    <!-- Chef/Admin: Modifier -->
    {#if data.canEditAgenda}
      <a href="/dashboard/agenda/edit/{event.id}">Modifier</a>
      <form method="POST" action="?/deleteEvent">
        <button>Supprimer</button>
      </form>
    {/if}
  </div>
{/each}

<!-- Chef/Admin: Ajouter -->
{#if data.canEditAgenda}
  <a href="/dashboard/agenda/create" class="btn-primary">Ajouter</a>
{/if}
```

---

## 🚀 Quick Start

### Prérequis
- Node.js 22+
- Compte Appwrite Cloud ou instance locale
- OneSignal (optionnel)

### Installation

```bash
# Clone
git clone https://github.com/hazerty565/bagadPenhars.git
cd bagadPenhars

# Install
npm install

# Env
cp .env.example .env.local
# Remplis avec tes clés Appwrite
```

### Variables d'environnement

```env
# Appwrite (Public)
PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
PUBLIC_APPWRITE_PROJECT_ID=your_project_id

# Appwrite (Serveur - JAMAIS côté client)
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=bagad_db

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=contact@bagad-penhars.com
EMAIL_PASS=your_app_password

# OneSignal (optionnel)
ONESIGNAL_APP_ID=xxx
ONESIGNAL_REST_KEY=xxx

# Mode
NODE_ENV=development
```

### Lancer le dev

```bash
npm run dev

# Accès: http://localhost:5173
```

---

## 📚 Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur dev |
| `npm run build` | Build production |
| `npm run preview` | Preview build |
| `npm run appwrite:export` | Export schéma Appwrite |
| `npm run appwrite:import` | Import migrations |

---

## 🚀 Déploiement

### Netlify

1. Push sur GitHub
2. Connect à Netlify
3. Build: `npm run build`
4. Publish: `.svelte-kit/build`
5. Variables d'environnement dans Settings

### Appwrite Cloud

L'authentification Appwrite Cloud est prête pour la production.

---

## 🛡️ Pratiques de sécurité

- ✅ **Validation côté serveur** : Tous les form actions
- ✅ **Guards sur layouts** : Protection des zones privées
- ✅ **Tokens d'invitation** : Uniques, expirants, à usage unique
- ✅ **HttpOnly + Secure Cookies** : Immunisé XSS / HTTPS
- ✅ **API Key côté serveur uniquement** : Jamais exposée au client
- ✅ **Vérification des rôles à chaque requête** : `hooks.server.ts` + form actions
- ✅ **Permissions fines** : Chefs ne voient que leur pupitre
- ✅ **Sessions expirées** : Auto-cleanup, redirect login
- ✅ **Logout sécurisé** : Suppression cookie + session Appwrite

---

## 📋 Status de développement

### ✅ Planifié / À implémenter

- [ ] Structure SvelteKit + Appwrite
- [ ] Authentification + Rôles + Guards
- [ ] Pages publiques multilingues (i18n)
- [ ] Invitation flow sécurisée
- [ ] Dashboard pages communes (Agenda, Documents, Profil)
- [ ] Sections Chef + Admin
- [ ] Gestion des erreurs (401, 403, 404, 500)
- [ ] Notifications (OneSignal)
- [ ] Tests E2E (Playwright)
- [ ] Responsive mobile
- [ ] Optimisations performance
- [ ] Déploiement (Netlify + Appwrite Cloud)

---

## 📄 License

MIT License — voir [LICENSE](./LICENSE) pour les détails.



**Dernière mise à jour** : 11/08/2026  
**Stack** : SvelteKit 2.x + Appwrite + TailwindCSS + Node.js 22+
```

---

