```text
bagadPenhars/
│
├── src/
│   ├── app.html
│   ├── app.d.ts                          # Types globaux (App.Locals, App.PageData)
│   ├── app.css                           # Styles globaux (Tailwind)
│   ├── hooks.server.ts                   # Session Supabase → event.locals.user
│   │
│   ├── lib/
│   │   ├── supabase.ts                   # Client browser (anon key)
│   │   ├── config.ts                     # SITE_NAME, DEFAULT_LANG, LANGS, ARTICLES_PER_PAGE…
│   │   │
│   │   │
│   │   ├── schemas/                      # Schémas Zod + types inférés (Structure 1)
│   │   │   ├── index.ts                  # Réexporte tous les schémas
│   │   │   ├── article.ts                # ArticleSchema, ArticleFormSchema
│   │   │   ├── event.ts                  # EventSchema, EventFormSchema
│   │   │   ├── user.ts                   # UserSchema, ProfileUpdateSchema
│   │   │   ├── contact.ts                # ContactFormSchema
│   │   │   ├── notification.ts           # NotificationSchema
│   │   │   ├── document.ts               # DocumentSchema, UploadSchema
│   │   │   ├── invitation.ts             # InvitationSchema
│   │   │   ├── partner.ts                # PartnerSchema, PartnerFormSchema
│   │   │   └── poll.ts                   # PollSchema, PollResponseSchema
│   │   │
│   │   │
│   │   ├── types/                        # Types TypeScript purs (DB, API responses)
│   │   │   ├── index.ts
│   │   │   ├── database.ts               # Types générés par Supabase CLI
│   │   │   ├── article.ts                # Article, ArticleWithAuthor
│   │   │   ├── event.ts                  # Event, EventWithAttendees
│   │   │   ├── user.ts                   # User, Profile, Session
│   │   │   ├── media.ts                  # Media, Album
│   │   │   ├── notification.ts           # Notification, NotificationPayload
│   │   │   ├── partner.ts                # Partner, PartnerWithLogo
│   │   │   └── poll.ts                   # Poll, PollOption, PollResponse
│   │   │
│   │   │
│   │   ├── auth/                         # Logique d'autorisation centralisée (Structure 2)
│   │   │   ├── index.ts
│   │   │   ├── roles.ts                  # enum Role { admin, section_leader, member, anon }
│   │   │   ├── permissions.ts            # canEdit(), canDelete(), canInvite(), canManagePupitre()
│   │   │   └── guards.ts                 # requireAuth(), requireAdmin(), requireSectionLeader()
│   │   │
│   │   │
│   │   ├── server/                       # Logique métier — JAMAIS importé côté client
│   │   │   ├── supabase.ts               # Client service_role key
│   │   │   ├── articles.ts               # CRUD + getBySlug, getByTag
│   │   │   ├── events.ts                 # CRUD + getUpcoming, getByMonth
│   │   │   ├── users.ts                  # CRUD + getMembers, getBySection
│   │   │   ├── media.ts                  # CRUD + getAlbums
│   │   │   ├── documents.ts              # CRUD + getByPupitre
│   │   │   ├── notifications.ts          # CRUD + broadcast
│   │   │   ├── invitations.ts            # createInvitation, validateToken
│   │   │   ├── partners.ts               # CRUD partenaires
│   │   │   ├── polls.ts                  # CRUD sondages
│   │   │   └── email.ts                  # Envoi emails (Brevo/Resend)
│   │   │
│   │   │
│   │   ├── components/
│   │   │   │
│   │   │   ├── ui/                       # Design System (primitives)
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Textarea.svelte
│   │   │   │   ├── Select.svelte
│   │   │   │   ├── Checkbox.svelte
│   │   │   │   ├── Badge.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Dialog.svelte
│   │   │   │   ├── Dropdown.svelte
│   │   │   │   ├── Tabs.svelte
│   │   │   │   ├── Table.svelte
│   │   │   │   ├── Pagination.svelte
│   │   │   │   ├── Spinner.svelte
│   │   │   │   ├── Toast.svelte
│   │   │   │   ├── Skeleton.svelte
│   │   │   │   └── Avatar.svelte
│   │   │   │
│   │   │   ├── layout/                   # Mise en page
│   │   │   │   ├── Nav.svelte            # Navigation adaptative selon rôle
│   │   │   │   ├── Footer.svelte
│   │   │   │   ├── Sidebar.svelte        # Admin uniquement
│   │   │   │   ├── Hero.svelte
│   │   │   │   └── PageHeader.svelte
│   │   │   │
│   │   │   ├── articles/                 # Module articles (partagé)
│   │   │   │   ├── ArticleList.svelte
│   │   │   │   ├── ArticleCard.svelte
│   │   │   │   ├── ArticleForm.svelte
│   │   │   │   └── ArticleContent.svelte
│   │   │   │
│   │   │   ├── events/                   # Module événements (partagé)
│   │   │   │   ├── EventList.svelte
│   │   │   │   ├── EventCard.svelte
│   │   │   │   ├── EventForm.svelte
│   │   │   │   ├── EventCalendar.svelte
│   │   │   │   └── EventPresence.svelte
│   │   │   │
│   │   │   ├── files/                    # Module fichiers (partagé)
│   │   │   │   ├── FileList.svelte
│   │   │   │   ├── FileCard.svelte
│   │   │   │   ├── FileUpload.svelte
│   │   │   │   ├── FileActions.svelte
│   │   │   │   └── FileDownload.svelte
│   │   │   │
│   │   │   ├── members/                  # Module membres (partagé)
│   │   │   │   ├── MemberList.svelte
│   │   │   │   ├── MemberCard.svelte
│   │   │   │   ├── MemberForm.svelte
│   │   │   │   └── InviteForm.svelte
│   │   │   │
│   │   │   ├── notifications/            # Module notifications (partagé)
│   │   │   │   ├── NotificationList.svelte
│   │   │   │   ├── NotificationCard.svelte
│   │   │   │   ├── NotificationForm.svelte
│   │   │   │   └── NotificationBell.svelte
│   │   │   │
│   │   │   ├── partners/                 # Module partenaires (partagé)
│   │   │   │   ├── PartnerGrid.svelte
│   │   │   │   ├── PartnerCard.svelte
│   │   │   │   ├── PartnerForm.svelte
│   │   │   │   └── PartnerActions.svelte
│   │   │   │
│   │   │   ├── polls/                    # Module sondages (partagé)
│   │   │   │   ├── PollList.svelte
│   │   │   │   ├── PollCard.svelte
│   │   │   │   ├── PollForm.svelte
│   │   │   │   ├── PollResults.svelte
│   │   │   │   └── PollVote.svelte
│   │   │   │
│   │   │   ├── media/                    # Composants média
│   │   │   │   ├── ImageUpload.svelte
│   │   │   │   ├── MediaGallery.svelte
│   │   │   │   ├── VideoEmbed.svelte
│   │   │   │   └── RichEditor.svelte     # TipTap pour articles
│   │   │   │
│   │   │   ├── forms/                    # Formulaires génériques
│   │   │   │   ├── ContactForm.svelte
│   │   │   │   └── ProfileForm.svelte
│   │   │   │
│   │   │   └── shared/                   # Composants utilitaires
│   │   │       ├── LangSwitcher.svelte   # fr | br | en
│   │   │       ├── ThemeSwitcher.svelte
│   │   │       ├── SearchBar.svelte
│   │   │       ├── Map.svelte
│   │   │       ├── Calendar.svelte
│   │   │       └── EmptyState.svelte
│   │   │
│   │   │
│   │   ├── stores/
│   │   │   ├── user.ts
│   │   │   ├── lang.ts
│   │   │   ├── toast.ts
│   │   │   └── theme.ts
│   │   │
│   │   │
│   │   │  ┌─────────────────────────────────────────────────────────────────┐
│   │   │  │  i18n PAR PAGE (Structure 6)                                    │
│   │   │  │  Avantage : fichiers JSON ciblés, chargement à la demande,      │
│   │   │  │  pas de fichier monolithique ingérable à long terme.            │
│   │   │  └─────────────────────────────────────────────────────────────────┘
│   │   │
│   │   ├── i18n/
│   │   │   ├── index.ts                  # t(), localizedPath(), loadTranslations()
│   │   │   ├── store.ts                  # Store langue réactif
│   │   │   │
│   │   │   ├── fr/
│   │   │   │   ├── common.json           # Nav, footer, erreurs, boutons globaux
│   │   │   │   ├── home.json
│   │   │   │   ├── bagad.json
│   │   │   │   ├── formation.json
│   │   │   │   ├── agenda.json
│   │   │   │   ├── articles.json
│   │   │   │   ├── media.json
│   │   │   │   ├── partenaires.json
│   │   │   │   ├── contact.json
│   │   │   │   ├── auth.json             # login, reset-password, invitation
│   │   │   │   ├── compte.json           # profil, sécurité, notifications, fichiers
│   │   │   │   ├── pupitre.json          # dashboard chef, membres, sondages
│   │   │   │   └── admin.json            # toutes les pages admin
│   │   │   │
│   │   │   ├── en/
│   │   │   │   ├── common.json
│   │   │   │   ├── home.json
│   │   │   │   ├── bagad.json
│   │   │   │   ├── formation.json
│   │   │   │   ├── agenda.json
│   │   │   │   ├── articles.json
│   │   │   │   ├── media.json
│   │   │   │   ├── partenaires.json
│   │   │   │   ├── contact.json
│   │   │   │   ├── auth.json
│   │   │   │   ├── compte.json
│   │   │   │   ├── pupitre.json
│   │   │   │   └── admin.json
│   │   │   │
│   │   │   └── br/                       # Brezhoneg
│   │   │       ├── common.json
│   │   │       ├── home.json
│   │   │       ├── bagad.json
│   │   │       ├── formation.json
│   │   │       ├── agenda.json
│   │   │       ├── articles.json
│   │   │       ├── media.json
│   │   │       ├── partenaires.json
│   │   │       ├── contact.json
│   │   │       ├── auth.json
│   │   │       ├── compte.json
│   │   │       ├── pupitre.json
│   │   │       └── admin.json
│   │   │
│   │   │
│   │   ├── data/                         # Données statiques
│   │   │   ├── formation.ts
│   │   │   ├── partenaires.ts
│   │   │   ├── nav.ts
│   │   │   └── seo.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── slugify.ts
│   │   │   ├── date.ts
│   │   │   ├── string.ts
│   │   │   ├── file.ts
│   │   │   └── seo.ts
│   │   │
│   │   └── notifications/
│   │       ├── client.ts                 # Logique client (service worker)
│   │       └── server.ts                 # Logique serveur (envoi)
│   │
│   │
│   └── routes/
│       ├── +layout.svelte                # Layout racine (Toast global, fonts)
│       ├── +layout.server.ts             # Redirect / → /fr (detect Accept-Language)
│       ├── +error.svelte
│       │
│       ├── auth/callback/
│       │   └── +server.ts                # Callback Supabase (invite + reset)
│       │
│       ├── sitemap.xml/
│       │   └── +server.ts
│       │
│       ├── api/
│       │   ├── health/+server.ts
│       │   └── revalidate/+server.ts
│       │
│       │
│       └── [lang]/
│           ├── +layout.svelte            # Nav adaptative + Footer
│           ├── +layout.server.ts         # Valide lang + charge common.json + session
│           ├── +error.svelte
│           │
│           │
│           │  ── PAGES PUBLIQUES ──────────────────────────────────────────
│           │
│           ├── +page.svelte              # Accueil
│           ├── +page.server.ts           # Charge home.json
│           │
│           ├── bagad/
│           │   ├── +page.svelte
│           │   └── +page.server.ts       # Charge bagad.json
│           │
│           ├── formation/
│           │   └── +page.svelte          # Charge formation.json (statique)
│           │
│           ├── agenda/
│           │   ├── +page.svelte
│           │   └── +page.server.ts       # Charge agenda.json
│           │
│           ├── articles/
│           │   ├── +page.svelte
│           │   ├── +page.server.ts       # Charge articles.json
│           │   └── [slug]/
│           │       ├── +page.svelte
│           │       └── +page.server.ts   # SSR + meta OG
│           │
│           ├── media/
│           │   ├── +page.svelte
│           │   └── +page.server.ts       # Charge media.json
│           │
│           ├── partenaires/
│           │   └── +page.svelte          # Charge partenaires.json (statique)
│           │
│           ├── contact/
│           │   ├── +page.svelte
│           │   └── +page.server.ts       # Charge contact.json + Form Action email
│           │
│           ├── login/
│           │   ├── +page.svelte
│           │   └── +page.server.ts       # Charge auth.json
│           │
│           ├── reset-password/
│           │   ├── +page.svelte
│           │   └── +page.server.ts       # Charge auth.json
│           │
│           ├── invitation/
│           │   ├── +page.svelte
│           │   └── +page.server.ts       # Charge auth.json + valide token
│           │
│           │
│           │  ── (compte) — SESSION REQUISE ──────────────────────────────
│           │  Gardien : requireAuth() → redirect /[lang]/login
│           │
│           ├── (compte)/
│           │   ├── +layout.server.ts     # requireAuth() + charge compte.json
│           │   ├── +layout.svelte
│           │   │
│           │   ├── profil/
│           │   │   ├── +page.svelte
│           │   │   └── +page.server.ts
│           │   │
│           │   ├── securite/
│           │   │   ├── +page.svelte
│           │   │   └── +page.server.ts
│           │   │
│           │   ├── notifications/
│           │   │   ├── +page.svelte
│           │   │   └── +page.server.ts
│           │   │
│           │   ├── presences/
│           │   │   ├── +page.svelte
│           │   │   └── +page.server.ts
│           │   │
│           │   └── fichiers/
│           │       ├── +page.svelte
│           │       └── +page.server.ts
│           │
│           │
│           │  ── (pupitre) — CHEF DE PUPITRE ────────────────────────────
│           │  Gardien : requireSectionLeader() → 403
│           │
│           ├── (pupitre)/
│           │   └── pupitre/
│           │       ├── +layout.server.ts # requireSectionLeader() + charge pupitre.json
│           │       ├── +layout.svelte
│           │       │
│           │       ├── +page.svelte      # Dashboard pupitre
│           │       ├── +page.server.ts
│           │       │
│           │       ├── membres/
│           │       │   ├── +page.svelte
│           │       │   └── +page.server.ts
│           │       │
│           │       ├── fichiers/
│           │       │   ├── +page.svelte
│           │       │   └── +page.server.ts  # Upload → bucket pupitre-files
│           │       │
│           │       ├── presences/
│           │       │   ├── +page.svelte
│           │       │   └── +page.server.ts
│           │       │
│           │       ├── notifications/
│           │       │   ├── +page.svelte
│           │       │   └── +page.server.ts
│           │       │
│           │       └── sondages/
│           │           ├── +page.svelte
│           │           └── +page.server.ts
│           │
│           │
│           │  ── (admin) — ADMINISTRATION ──────────────────────────────
│           │  Gardien : requireAdmin() → 403 · Interface forcée en français
│           │
│           └── (admin)/
│               └── admin/
│                   ├── +layout.server.ts # requireAdmin() + force lang='fr' + charge admin.json
│                   ├── +layout.svelte    # Nav + Sidebar
│                   ├── +error.svelte
│                   │
│                   ├── +page.svelte      # Dashboard stats globales
│                   ├── +page.server.ts
│                   │
│                   ├── articles/
│                   │   ├── +page.svelte
│                   │   ├── +page.server.ts
│                   │   ├── new/
│                   │   │   ├── +page.svelte
│                   │   │   └── +page.server.ts
│                   │   └── [id]/edit/
│                   │       ├── +page.svelte
│                   │       └── +page.server.ts
│                   │
│                   ├── agenda/
│                   │   ├── +page.svelte
│                   │   ├── +page.server.ts
│                   │   └── new/
│                   │       ├── +page.svelte
│                   │       └── +page.server.ts
│                   │
│                   ├── membres/
│                   │   ├── +page.svelte
│                   │   ├── +page.server.ts
│                   │   ├── [id]/
│                   │   │   ├── +page.svelte
│                   │   │   └── +page.server.ts
│                   │   └── invite/
│                   │       ├── +page.svelte
│                   │       └── +page.server.ts
│                   │
│                   ├── pupitres/
│                   │   ├── +page.svelte
│                   │   └── +page.server.ts
│                   │
│                   ├── media/
│                   │   ├── +page.svelte
│                   │   └── +page.server.ts
│                   │
│                   ├── fichiers/
│                   │   ├── +page.svelte
│                   │   └── +page.server.ts
│                   │
│                   ├── notifications/
│                   │   ├── +page.svelte
│                   │   └── +page.server.ts
│                   │
│                   ├── permissions/
│                   │   ├── +page.svelte
│                   │   └── +page.server.ts
│                   │
│                   └── partenaires/
│                       ├── +page.svelte
│                       ├── +page.server.ts
│                       └── [id]/edit/
│                           ├── +page.svelte
│                           └── +page.server.ts
│
│

supabase/
├── config.toml
├── seed.sql
│
├── migrations/
│   └── 005_bagadPenhars_final.sql         # Schéma initial autonome (projet vierge)
│
├── deprecated_migrations/                 # Références historiques, jamais exécutées
│   ├── README.md
│   ├── 001_initial_schema.sql.deprecated
│   ├── 002_initial_schema.sql.deprecated
│   ├── 003_schema.sql.deprecated
│   └── 004_equipment_loans_and_profile_fields.sql.deprecated
│
└── tests/
    ├── rls/
    │   ├── profiles.test.sql
    │   ├── memberships.test.sql
    │   ├── invitations.test.sql
    │   ├── events.test.sql
    │   ├── event_responses.test.sql
    │   ├── documents.test.sql
    │   ├── storage.test.sql
    │   └── account_deletion.test.sql
    └── integrity/
        ├── roles.test.sql
        ├── events.test.sql
        └── foreign_keys.test.sql

│
├── netlify/
│   └── functions/
│       ├── invite-user.ts
│       ├── send-notification.ts
│       └── scheduled-reminder.ts
│
│
├── static/
│   ├── favicon.png
│   ├── favicon.svg
│   ├── logo-penhars.svg
│   ├── og-image.png
│   ├── manifest.json
│   ├── robots.txt
│   ├── sw.js                             # Service Worker (notifications push)
│   └── logos/                            # Logos partenaires
│
│
├── svelte.config.js                      # adapter-netlify
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── .env.example
├── .gitignore
└── README.md
```
