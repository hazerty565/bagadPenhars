# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.3 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" --no-install bagadPenhars
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Project structure

```text
bagadPenhars/
├── src/
│   ├── app.html
│   ├── app.d.ts
│   ├── hooks.server.ts            <-- Injecte la session Supabase dans event.locals.user
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── roles.ts
│   │   │   └── permissions.ts
│   │   ├── i18n/
│   │   │   ├── index.ts
│   │   │   ├── store.ts
│   │   │   └── locales/
│   │   │       ├── fr.json
│   │   │       ├── en.json
│   │   │       └── br.json
│   │   ├── components/
│   │   │   ├── Nav.svelte
│   │   │   ├── Footer.svelte
│   │   │   ├── LangSwitcher.svelte
│   │   │   ├── ArticleCard.svelte
│   │   │   ├── RichEditor.svelte
│   │   │   ├── ImageUpload.svelte   <-- Envoie le fichier directement via un formulaire standard
│   │   │   ├── MediaGallery.svelte
│   │   │   ├── Toast.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Map.svelte
│   │   │   ├── NotificationButton.svelte
│   │   │   └── Sidebar.svelte
│   │   ├── stores/
│   │   │   ├── toast.ts
│   │   │   ├── user.ts
│   │   │   └── lang.ts
│   │   ├── types/
│   │   │   ├── article.ts
│   │   │   ├── event.ts
│   │   │   ├── user.ts            <-- is_super_admin, is_admin, responsable_pupitre
│   │   │   └── media.ts
│   │   ├── utils/
│   │   │   ├── slugify.ts
│   │   │   └── language.ts
│   │   ├── services/
│   │   │   └── media.ts            <-- Contient la logique d'envoi vers Supabase Storage
│   │   └── notifications/
│   │       ├── client.ts
│   │       └── server.ts
│   │
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.server.ts
│   │   │
│   │   └── [lang]/                 <-- Gestion de la langue globale
│   │       ├── +layout.svelte
│   │       ├── +layout.server.ts
│   │       ├── +page.svelte       <-- +page.server.ts associé pour charger les articles/événements
│   │       ├── +page.server.ts    <-- Charge les données initiales pour l'accueil publique
│   │       │
│   │       ├── articles/
│   │       │   ├── +page.svelte
│   │       │   ├── +page.server.ts <-- Charge la liste des articles publics
│   │       │   └── [slug]/
│   │       │       ├── +page.svelte
│   │       │       └── +page.server.ts <-- Charge l'article complet selon le slug
│   │       ├── agenda/
│   │       │   ├── +page.svelte
│   │       │   └── +page.server.ts <-- Charge les événements de l'agenda
│   │       ├── bagad/
│   │       │   └── +page.svelte
│   │       ├── partenaires/
│   │       │   └── +page.svelte
│   │       ├── contact/
│   │       │   ├── +page.svelte
│   │       │   └── +page.server.ts <-- Gère l'envoi du formulaire de contact (Action)
│   │       ├── media/
│   │       │   └── +page.svelte
│   │       ├── login/
│   │       │   ├── +page.svelte
│   │       │   └── +page.server.ts <-- Gère la connexion avec Supabase (Action)
│   │       ├── reset-password/
│   │       │   ├── +page.svelte
│   │       │   └── +page.server.ts <-- Gère la demande de réinitialisation (Action)
│   │       │
│   │       │  /===============================================================\
│   │       │ |  ESPACES PRIVÉS & SÉCURISÉS                                     |
│   │       │  \===============================================================/
│   │       │
│   │       ├── (compte)/          <-- ACCESSIBLE À TOUS LES CONNECTÉS
│   │       │   ├── +layout.server.ts <-- GARDIEN : Vérifie la session
│   │       │   ├── +layout.svelte
│   │       │   │
│   │       │   ├── profil/
│   │       │   │   ├── +page.svelte
│   │       │   │   └── +page.server.ts <-- Form Action : Met à jour les infos du profil
│   │       │   ├── securite/
│   │       │   │   ├── +page.svelte
│   │       │   │   └── +page.server.ts <-- Form Action : Change le mot de passe
│   │       │   └── notifications/
│   │       │       ├── +page.svelte
│   │       │       └── +page.server.ts <-- Form Action : Enregistre les préférences d'alertes
│   │       │
│   │       ├── (gestion-pupitre)/ <-- ACCESSIBLE AUX CHEFS DE PUPITRE & SUPER ADMIN
│   │       │   └── pupitre/
│   │       │       ├── +layout.server.ts <-- GARDIEN : Bloque si responsable_pupitre === null
│   │       │       ├── +layout.svelte
│   │       │       ├── +page.svelte       <-- Dashboard du Chef
│   │       │       │
│   │       │       ├── fichiers/
│   │       │       │   ├── +page.svelte
│   │       │       │   └── +page.server.ts <-- Form Action : Réceptionne et stocke les partitions/audios
│   │       │       └── notifications/
│   │       │           ├── +page.svelte
│   │       │           └── +page.server.ts <-- Form Action : Envoie la notif flash au pupitre
│   │       │
│   │       └── (gestion-admin)/   <-- ACCESSIBLE AUX ADMINS & SUPER ADMIN
│   │           └── admin/
│   │               ├── +layout.server.ts <-- GARDIEN : Bloque si is_admin === false
│   │               ├── +layout.svelte
│   │               ├── +page.svelte       <-- Dashboard de l'Admin Général
│   │               │
│   │               ├── articles/
│   │               │   ├── +page.svelte
│   │               │   ├── +page.server.ts <-- Charge tous les articles + Action "Supprimer"
│   │               │   ├── new/
│   │               │   │   ├── +page.svelte
│   │               │   │   └── +page.server.ts <-- Form Action : Crée un nouvel article
│   │               │   └── [id]/
│   │               │       └── edit/
│   │               │           ├── +page.svelte
│   │               │           └── +page.server.ts <-- Form Action : Modifie l'article
│   │               ├── agenda/
│   │               │   ├── +page.svelte
│   │               │   ├── +page.server.ts <-- Charge l'agenda + Action "Supprimer"
│   │               │   └── new/
│   │               │       ├── +page.svelte
│   │               │       └── +page.server.ts <-- Form Action : Crée un événement
│   │               ├── membres/
│   │               │   ├── +page.svelte
│   │               │   ├── +page.server.ts <-- Charge les membres
│   │               │   └── invite/
│   │               │       ├── +page.svelte
│   │               │       └── +page.server.ts <-- Form Action : Invite un membre (via Supabase/Netlify)
│   │               ├── media/
│   │               │   ├── +page.svelte
│   │               │   └── +page.server.ts <-- Gère l'affichage global des fichiers média du site
│   │               ├── notifications/
│   │               │   ├── +page.svelte
│   │               │   └── +page.server.ts <-- Form Action : Envoie une notif globale
│   │               └── permissions/
│   │                   ├── +page.svelte
│   │                   └── +page.server.ts <-- Form Action : Modifie les rangs en BDD (Super Admin)
│   │
│   └── (aucun dossier api ici)
│   
├── static/
├── supabase/
├── netlify/
├── package.json
├── vite.config.ts
├── svelte.config.js
├── tailwind.config.js
└── postcss.config.js
```
