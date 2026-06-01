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
│
├── src/
│   ├── app.html
│   ├── app.d.ts               ← App.Locals { user, session }, App.PageData
│   ├── app.css
│   ├── hooks.server.ts        ← injecte session Supabase → event.locals.user
│   │
│   ├── lib/
│   │   ├── supabase.ts          ← client browser (anon key)
│   │   ├── config.ts            ← SITE_NAME, DEFAULT_LANG, LANGS, ARTICLES_PER_PAGE…
│   │   │
│   │   ├── server/              ← jamais importé côté client
│   │   │   ├── supabase.ts        ← client service_role key
│   │   │   ├── articles.ts        ← getArticles(), getArticleBySlug(), getArticlesByTag()
│   │   │   ├── events.ts          ← getEvents(), getUpcomingEvents()
│   │   │   └── media.ts           ← getAlbums(), getMediaByAlbum()
│   │   │
│   │   ├── auth/
│   │   │   ├── roles.ts           ← enum Role { admin, member, anon }
│   │   │   └── permissions.ts     ← canEdit(), canInvite(), canManagePupitre()
│   │   │
│   │   ├── i18n/
│   │   │   ├── index.ts           ← types Language, t(), localizedPath()
│   │   │   ├── store.ts           ← store lang réactif
│   │   │   └── locales/
│   │   │       ├── fr.json        ← source de vérité
│   │   │       ├── en.json
│   │   │       └── br.json        ← brezhoneg
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Badge.svelte
│   │   │   │   ├── Spinner.svelte
│   │   │   │   └── Pagination.svelte
│   │   │   │
│   │   │   ├── Nav.svelte           menu unique adaptatif
│   │   │   │                                ← anon : liens publics + login
│   │   │   │                                ← connecté : + profil / sécurité / notifs
│   │   │   │                                ← chef pupitre : + mon pupitre / fichiers
│   │   │   │                                ← admin : + lien → /[lang]/admin
│   │   │   ├── Footer.svelte
│   │   │   ├── LangSwitcher.svelte  ← fr · br · en (dans la Nav)
│   │   │   ├── Sidebar.svelte       ← navigation interne admin uniquement
│   │   │   ├── ArticleCard.svelte
│   │   │   ├── RichEditor.svelte    ← TipTap
│   │   │   ├── ImageUpload.svelte
│   │   │   ├── MediaGallery.svelte
│   │   │   ├── VideoEmbed.svelte    ← YouTube / mp4 / Google Drive (plus tard)
│   │   │   ├── Toast.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Map.svelte
│   │   │   └── NotificationButton.svelte
│   │   │
│   │   ├── data/                ← données statiques
│   │   │   ├── formation.ts
│   │   │   ├── partenaires.ts
│   │   │   └── nav.ts             ← liens nav (source unique)
│   │   │
│   │   ├── stores/
│   │   │   ├── user.ts
│   │   │   ├── lang.ts
│   │   │   └── toast.ts
│   │   │
│   │   ├── types/
│   │   │   ├── article.ts
│   │   │   ├── event.ts
│   │   │   ├── user.ts
│   │   │   ├── media.ts
│   │   │   └── album.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── slugify.ts
│   │   │   ├── language.ts
│   │   │   ├── date.ts
│   │   │   └── seo.ts
│   │   │
│   │   └── notifications/
│   │       ├── client.ts
│   │       └── server.ts
│   │
│   └── routes/
│       ├── +layout.svelte          ← racine (app.css, Toast global)
│       ├── +layout.server.ts       ← redirect / → /fr (detect Accept-Language)
│       ├── +error.svelte
│       │
│       ├── auth/callback/
│       │   └── +server.ts           ← valide token Supabase (invite + reset)
│       │
│       ├── sitemap.xml/
│       │   └── +server.ts           ← sitemap dynamique avec slugs articles
│       │
│       └── [lang]/               fr · en · br
│           ├── +layout.svelte     ← Nav (adaptative) + Footer
│           ├── +layout.server.ts  ← valide lang + injecte translations + session
│           ├── +error.svelte      ← erreur localisée i18n
│           │
│           ├── +page.svelte       ← Home : hero + events + articles récents
│           ├── +page.server.ts
│           │
│           ├── articles/
│           │   ├── +page.svelte
│           │   ├── +page.server.ts
│           │   └── [slug]/
│           │       ├── +page.svelte
│           │       └── +page.server.ts ← SSR + meta OG
│           │
│           ├── bagad/
│           │   ├── +page.svelte   ← cards tag=bagad + lien voir plus
│           │   └── +page.server.ts
│           │
│           ├── formation/         statique
│           │   └── +page.svelte   ← lib/data/formation.ts
│           │
│           ├── agenda/
│           │   ├── +page.svelte
│           │   └── +page.server.ts
│           │
│           ├── media/             Google Drive plus tard
│           │   ├── +page.svelte   ← galerie masonry : photos + vidéos + albums
│           │   └── +page.server.ts
│           │
│           ├── partenaires/       statique
│           │   └── +page.svelte   ← lib/data/partenaires.ts
│           │
│           ├── contact/
│           │   ├── +page.svelte
│           │   └── +page.server.ts ← Form Action : envoi email
│           │
│           ├── login/
│           │   ├── +page.svelte
│           │   └── +page.server.ts ← signInWithPassword → redirect /[lang]/profil
│           │
│           ├── reset-password/
│           │   ├── +page.svelte
│           │   └── +page.server.ts
│           │
│           ├── (compte)/          session requise
│           │   ├── +layout.server.ts ← gardien : !session → redirect /[lang]/login
│           │   ├── +layout.svelte
│           │   ├── profil/
│           │   │   ├── +page.svelte   ← dashboard unique, menu adaptatif
│           │   │   └── +page.server.ts
│           │   ├── securite/
│           │   │   ├── +page.svelte
│           │   │   └── +page.server.ts
│           │   └── notifications/
│           │       ├── +page.svelte
│           │       └── +page.server.ts
│           │
│           ├── (gestion-pupitre)/ chef pupitre
│           │   └── pupitre/
│           │       ├── +layout.server.ts ← gardien : responsable_pupitre === null → 403
│           │       ├── +layout.svelte
│           │       ├── +page.svelte
│           │       ├── fichiers/
│           │       │   ├── +page.svelte
│           │       │   └── +page.server.ts ← upload → bucket pupitre-files (privé)
│           │       └── notifications/
│           │           ├── +page.svelte
│           │           └── +page.server.ts
│           │
│           └── (gestion-admin)/   admin — français forcé en interne
│               └── admin/
│                   ├── +layout.server.ts ← gardien is_admin + force lang='fr'
│                   ├── +layout.svelte   ← Nav + Sidebar (fr uniquement)
│                   ├── +error.svelte
│                   ├── +page.svelte     ← dashboard stats
│                   ├── +page.server.ts  ← nb articles, membres, events
│                   ├── articles/
│                   │   ├── +page.svelte
│                   │   ├── +page.server.ts
│                   │   ├── new/
│                   │   │   ├── +page.svelte   ← RichEditor + champs fr/br/en
│                   │   │   └── +page.server.ts
│                   │   └── [id]/edit/
│                   │       ├── +page.svelte
│                   │       └── +page.server.ts
│                   ├── agenda/
│                   │   ├── +page.svelte
│                   │   ├── +page.server.ts
│                   │   └── new/
│                   │       ├── +page.svelte
│                   │       └── +page.server.ts
│                   ├── membres/
│                   │   ├── +page.svelte
│                   │   ├── +page.server.ts
│                   │   └── invite/
│                   │       ├── +page.svelte
│                   │       └── +page.server.ts ← inviteUserByEmail via Netlify fn
│                   ├── media/
│                   │   ├── +page.svelte
│                   │   └── +page.server.ts
│                   ├── notifications/
│                   │   ├── +page.svelte
│                   │   └── +page.server.ts
│                   └── permissions/
│                       ├── +page.svelte
│                       └── +page.server.ts ← update is_admin / responsable_pupitre
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_profiles.sql
│       ├── 002_articles.sql
│       ├── 003_events.sql
│       ├── 004_media.sql
│       ├── 005_albums.sql
│       └── 006_rls_policies.sql
│
├── netlify/functions/
│   ├── invite-user.ts
│   └── send-notification.ts
│
├── static/
│   ├── favicon.png
│   ├── logo-penhars.svg
│   ├── manifest.json
│   ├── robots.txt
│   └── logos/
│
├── svelte.config.js         ← adapter-netlify
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml
├── tsconfig.json
├── package.json
└── README.md
```
