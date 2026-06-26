# 🎶 Bagad Penhars — Site officiel

Site web du Bagad Penhars avec une zone adhérents sécurisée basée sur **SvelteKit + Appwrite**.

---

# 🧭 Objectif du projet

Un projet volontairement SIMPLE (pas un SaaS) :

- Site public vitrine
- Zone adhérents (dashboard unique)
- Agenda des répétitions / événements
- Gestion des documents internes
- Gestion des membres par invitation
- Rôles simples et extensibles

---

# 🌐 Pages publiques

Accessible sans connexion :

- `/` Home (news + infos + chiffres clés)
- `/bagad`
- `/formation`
- `/agenda` (lecture publique)
- `/media`
- `/partenaires`
- `/contact`

### 🌐 i18n
- FR / BR / EN
- uniquement côté public

---

# 🔐 Zone privée

Accessible via Appwrite Auth

## Rôles

- member
- chef_pupitre
- admin

Les permissions sont gérées par :

```ts
permissions[]
```

---

# 📊 Dashboard (SIMPLE)

Une seule route :

```
/dashboard
```

Affichage conditionnel selon rôle :

- agenda (événements + répétitions)
- présence
- documents
- profil
- gestion pupitre (chef)
- administration (admin)

---

# 📅 Agenda

- événements publics
- répétitions (connecté)

Actions :

- member → présence
- chef/admin → CRUD

---

# 🏗️ Architecture projet

```txt
bagad-penhars/
├── src/
│   ├── app.html
│   ├── app.d.ts
│   ├── app.css
│   ├── hooks.server.ts
│   │
│   ├── lib/
│   │   ├── appwrite/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── config.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── roles.ts
│   │   │   └── guards.ts
│   │   │
│   │   ├── data/
│   │   │   ├── events.ts
│   │   │   ├── members.ts
│   │   │   ├── documents.ts
│   │   │   └── attendance.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── events/
│   │   │   ├── documents/
│   │   │   └── members/
│   │   │
│   │   ├── utils.ts
│   │   └── types.ts
│   │
│   ├── routes/
│   │   ├── auth/
│   │   ├── (public)/
│   │   ├── (adherent)/
│   │   ├── (chef)/
│   │   └── (admin)/
│   │
│   └── static/
│       ├── favicon.png
│       ├── logo.svg
│       └── robots.txt
│
├── .env.example
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

# 🗄️ Appwrite

Database: `bagad_db`

Collections :

- profiles
- events
- attendance
- documents
- invitations

Buckets :

- avatars
- documents
- media

---

# 🔐 Invitation flow

1. admin invite email
2. création user Appwrite
3. email invitation
4. profil créé vide
5. utilisateur complète profil
6. validation admin

---

# ⚡ Realtime

- présence
- agenda live
- notifications UI

---

# 🧠 Philosophie

- simple
- pas SaaS
- Appwrite unique backend
- logique côté SvelteKit
- dashboard unique

---

# 🚀 Stack

- SvelteKit
- Appwrite
- TailwindCSS
- NodeJS 22