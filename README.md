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

Exemple :

```ts
[
  "agenda.read",
  "agenda.manage",
  "documents.read",
  "news.manage"
]
```

---

# 📊 Dashboard (SIMPLE)

Une seule route :

```
/dashboard
```

Affichage conditionnel selon rôle :

- agenda (événements + répétitions)
- présence (présent / absent)
- documents
- profil
- gestion pupitre (chef)
- administration (admin)

---

# 📅 Agenda

## Visible :
- événements publics
- répétitions (si connecté)

## Actions :
- membre → présence
- chef/admin → CRUD événements

---

# 🧑‍🤝‍🧑 Modèle métier

- Utilisateur = Appwrite Auth
- Profil = collection `profiles`
- Pupitre = instrument section

---

# 🏗️ Architecture

```txt
src/
├── lib/
│   ├── appwrite/
│   ├── auth/
│   ├── data/
│   ├── components/
│   ├── utils.ts
│   └── types.ts
│
└── routes/
    ├── (public)
    └── dashboard
```

---

# 🗄️ Appwrite

## Database: bagad_db

### Collections

- profiles
- events
- attendance
- documents
- invitations
- news (optionnel)

### Buckets

- avatars
- documents
- media

---

# 🔐 Invitation flow

1. Admin invite par email
2. Création user Appwrite
3. Email envoyé
4. Création profil vide
5. Complétion utilisateur
6. Validation admin

---

# ⚡ Realtime

Utilisé uniquement pour :

- présence
- notifications UI
- agenda live

---

# 🧠 Philosophie

✔ simple
✔ pas SaaS
✔ pas microservices
✔ Appwrite unique backend
✔ logique métier côté SvelteKit

---

# 🚀 Stack

- SvelteKit
- Appwrite
- TailwindCSS
- NodeJS 22
