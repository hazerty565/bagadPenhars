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
│   ├── hooks.server.ts
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
│   │   │   ├── ImageUpload.svelte
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
│   │   │   ├── user.ts
│   │   │   └── media.ts
│   │   ├── utils/
│   │   │   ├── slugify.ts
│   │   │   └── language.ts
│   │   ├── services/
│   │   │   └── media.ts
│   │   └── notifications/
│   │       ├── client.ts
│   │       └── server.ts
│   │
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.server.ts
│   │   ├── [lang]/
│   │   │   ├── +layout.svelte
│   │   │   ├── +layout.server.ts
│   │   │   ├── +page.svelte
│   │   │   ├── articles/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── [slug]/
│   │   │   │       └── +page.svelte
│   │   │   ├── agenda/
│   │   │   │   └── +page.svelte
│   │   │   ├── bagad/
│   │   │   │   └── +page.svelte
│   │   │   ├── partenaires/
│   │   │   │   └── +page.svelte
│   │   │   ├── contact/
│   │   │   │   └── +page.svelte
│   │   │   ├── media/
│   │   │   │   └── +page.svelte
│   │   │   ├── login/
│   │   │   │   └── +page.svelte
│   │   │   └── reset-password/
│   │   │       └── +page.svelte
│   │   └── fr/
│   │       └── admin/
│   │           ├── +layout.svelte
│   │           ├── +layout.server.ts
│   │           ├── +page.svelte
│   │           ├── articles/
│   │           │   ├── +page.svelte
│   │           │   ├── new/
│   │           │   │   └── +page.svelte
│   │           │   └── [id]/
│   │           │       └── edit/
│   │           │           └── +page.svelte
│   │           ├── agenda/
│   │           │   ├── +page.svelte
│   │           │   └── new/
│   │           │       └── +page.svelte
│   │           ├── membres/
│   │           │   ├── +page.svelte
│   │           │   └── invite/
│   │           │       └── +page.svelte
│   │           ├── media/
│   │           │   └── +page.svelte
│   │           ├── notifications/
│   │           │   └── +page.svelte
│   │           └── parametres/
│   │               └── +page.svelte
│   │
│   └── api/
│       ├── articles/
│       │   └── +server.ts
│   │       ├── events/
│   │       │   └── +server.ts
│   │       ├── media/
│   │       │   └── +server.ts
│   │       └── upload/
│   │           └── +server.ts
│   
├── static/
│   ├── manifest.webmanifest
│   ├── OneSignalSDKWorker.js
│   ├── logos/
│   └── icons/
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│
├── netlify/
│   └── functions/
│       ├── invite-user.ts
│       └── send-notification.ts
│
├── package.json
├── vite.config.ts
├── svelte.config.js
├── tailwind.config.js
└── postcss.config.js
```
