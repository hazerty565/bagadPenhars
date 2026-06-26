# 🎶 Bagad Penhars — Site officiel

Site web du Bagad Penhars avec une zone adhérents sécurisée basée sur **SvelteKit + Appwrite**.

---

## 🧭 Objectif du projet

Un projet volontairement **simple** (pas un SaaS) :

- Site public vitrine multilingue
- Zone adhérents avec dashboard unique
- Agenda des répétitions / événements
- Gestion des documents internes
- Gestion des membres par invitation
- Rôles simples et extensibles

---

## 🌐 Pages publiques

Accessibles sans connexion, disponibles en FR / BR / EN.

| Route | Description |
|-------|-------------|
| `/` | Home — news, infos, chiffres clés |
| `/bagad` | Présentation du bagad |
| `/formation` | École de formation |
| `/agenda` | Agenda public (lecture seule) |
| `/media` | Photos, vidéos, enregistrements |
| `/partenaires` | Partenaires |
| `/contact` | Formulaire de contact |

---

## 🔐 Zone privée

Accessible via Appwrite Auth — route unique `/dashboard`.

### Rôles

| Rôle | Accès |
|------|-------|
| `member` | agenda, présence, documents, profil |
| `chef_pupitre` | + gestion membres pupitre, docs pupitre |
| `admin` | + gestion globale, membres, invitations |

Les permissions sont portées par le champ `permissions[]` du profil Appwrite.

### Dashboard

Une seule route `/dashboard` avec affichage conditionnel selon le rôle :

```txt
/dashboard
  ├── agenda + présence        (tous)
  ├── documents                (tous)
  ├── profil                   (tous)
  ├── gestion pupitre          (chef_pupitre + admin)
  └── administration           (admin)
```

---

## 📅 Agenda

| Contexte | Accès |
|----------|-------|
| Public `/agenda` | lecture seule, événements publics |
| Dashboard | répétitions + événements, gestion présence |

Actions selon rôle :
- `member` → déclarer sa présence
- `chef_pupitre` / `admin` → CRUD événements

---

## 🏗️ Architecture projet

```txt
bagad-penhars/
├── src/
│   ├── app.html
│   ├── app.d.ts
│   ├── app.css
│   ├── hooks.server.ts              # session Appwrite + résolution rôle
│   │
│   ├── lib/
│   │   ├── appwrite/
│   │   │   ├── client.ts            # SDK browser
│   │   │   ├── server.ts            # SDK server (API key)
│   │   │   └── config.ts            # IDs collections, buckets, endpoint
│   │   │
│   │   ├── auth/
│   │   │   ├── roles.ts             # types Role, constantes
│   │   │   └── guards.ts            # requireAuth, requireChef, requireAdmin
│   │   │
│   │   ├── data/                    # accès Appwrite direct
│   │   │   ├── events.ts
│   │   │   ├── members.ts
│   │   │   ├── documents.ts
│   │   │   ├── profiles.ts
│   │   │   └── attendance.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── events/
│   │   │   ├── documents/
│   │   │   └── members/
│   │   │
│   │   ├── i18n/
│   │   │   ├── fr.ts
│   │   │   ├── br.ts
│   │   │   └── en.ts
│   │   │
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   └── routes/
│       ├── +layout.svelte
│       ├── +layout.server.ts
│       ├── +error.svelte
│       │
│       ├── (public)/               # 🌐 Pages publiques avec i18n
│       │   └── [lang]/
│       │       ├── +page.svelte    # home
│       │       ├── bagad/
│       │       ├── formation/
│       │       ├── agenda/
│       │       ├── media/
│       │       ├── partenaires/
│       │       └── contact/
│       │
│       ├── auth/
│       │   ├── login/
│       │   ├── logout/
│       │   └── invitation/          # 🔐 Page de complétion du profil (token unique)
│       │       └── +page.svelte    # Formulaire sécurisé (validation côté serveur)
│       │
│       └── dashboard/               # 🔒 Zone privée (pas d'i18n, français uniquement)
│           ├── +layout.server.ts    # guard requireAuth
│           ├── +layout.svelte
│           ├── +page.svelte
│           ├── agenda/
│           ├── documents/
│           ├── profil/
│           ├── pupitre/             # 🔒 chef_pupitre + admin
│           │   ├── +layout.server.ts  # guard requireChef
│           │   ├── membres/
│           │   └── documents/
│           └── admin/               # 🔒 admin uniquement
│               ├── +layout.server.ts  # guard requireAdmin
│               ├── membres/
│               ├── agenda/
│               ├── invitations/
│               └── settings/
│
├── static/
├── tests/
├── .env.example
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🗄️ Appwrite

**Database** : `bagad_db`

| Collection | Description |
|------------|-------------|
| `profiles` | profil membre (rôle, pupitre, infos) |
| `events` | répétitions et événements |
| `attendance` | présences par événement |
| `documents` | documents internes |
| `invitations` | invitations en attente (avec token unique, `expiresAt`, `used`) |

**Buckets** :

| Bucket | Contenu |
|--------|---------|
| `avatars` | photos de profil |
| `documents` | fichiers PDF internes |
| `media` | photos et vidéos publiques |

---

## 🔐 Invitation flow (sécurisé)

1. **Admin** saisit un email dans `/dashboard/admin/invitations`.
2. **Création du compte Appwrite** (via API serveur).
3. **Génération d’un token unique** (UUID) avec :
   - `email` : Email du futur membre.
   - `expiresAt` : Date d’expiration (ex : +7 jours).
   - `used: false` : Token non utilisé.
4. **Envoi de l’email d’invitation** avec un lien vers `/auth/invitation?token=UUID`.
5. **Page `/auth/invitation`** :
   - **Validation côté serveur** du token (existence, non expiré, non utilisé).
   - **Formulaire sécurisé** (POST) pour compléter le profil (nom, pupitre, etc.).
   - **Soumission** :
     - Re-vérification du token.
     - Création du profil en base avec rôle `pending`.
     - Marquer le token comme `used: true`.
6. **Redirection** vers `/login?success=true`.
7. **Validation admin** : L’admin active manuellement le rôle `member` dans `/dashboard/admin/invitations`.

---

## ⚡ Realtime (Appwrite)

| Événement | Usage |
|-----------|-------|
| `attendance` | mise à jour présence en live |
| `events` | agenda live (ajout/modif) |
| `invitations` | notification admin pour nouvelles invitations |

---

## 🧠 Philosophie

- **Simple** — pas de SaaS, pas d'over-engineering.
- **Appwrite** — unique backend (auth, db, stockage, realtime).
- **Logique côté SvelteKit** — load functions + form actions.
- **Dashboard unique** — affichage conditionnel selon rôle, pas de routes séparées par rôle.
- **i18n public uniquement** — la zone privée est en **français uniquement**.
- **Sécurité** :
  - Tokens d’invitation **uniques, expirants, à usage unique**.
  - Validation **côté serveur** pour toutes les actions sensibles.
  - **Pas de guards manuels** pour les routes publiques/privées : SvelteKit gère la séparation via `(public)` et `dashboard/`.

---

## 🚀 Stack

| Outil | Usage |
|-------|-------|
| SvelteKit | framework fullstack |
| Appwrite | auth, base de données, stockage, realtime |
| TailwindCSS | styles |
| Node.js 22 | runtime |