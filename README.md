# 🎶 Bagad Penhars : site officiel

Site du Bagad Penhars : un site public multilingue (français, anglais, breton) et une zone adhérents privée, en français, réservée aux membres approuvés.

**Stack cible** : SvelteKit 5 · Supabase (Auth, PostgreSQL/RLS, Storage) · Netlify (hébergement) · TailwindCSS

---

## 🧭 Objectif

Un projet volontairement simple, pas un SaaS :

- Site public vitrine en **français, anglais et breton**
- Zone adhérents en **français uniquement**, avec un espace adapté au rôle
- Agenda des répétitions et événements, avec suivi des présences
- Partitions par pupitre
- Membres ajoutés par invitation, validés par un administrateur

---

## 🌐 Site public (multilingue)

Accessible sans connexion. Les URLs sont préfixées par la langue : `/fr/...`, `/en/...`, `/br/...`. Toute autre valeur renvoie une 404 (matcher `src/params/lang.ts`).

| Route | Description |
|-------|-------------|
| `/fr`, `/en`, `/br` | Accueil : actualités, infos, chiffres clés |
| `/[lang]/bagad` | Présentation du bagad |
| `/[lang]/formation` | École de formation |
| `/[lang]/agenda` | Agenda public (lecture seule) |
| `/[lang]/media` | Photos, vidéos, enregistrements |
| `/[lang]/partenaires` | Partenaires |
| `/[lang]/contact` | Formulaire de contact |

### Choix de la langue

1. Si l'URL contient une langue, elle est utilisée.
2. Sinon, le cookie `preferred_lang` est utilisé s'il existe.
3. Sinon, l'en-tête `Accept-Language` est lu.
4. Sinon, le français est utilisé.

Le sélecteur de langue garde la même page dans la langue choisie et met à jour le cookie. L'attribut `lang` du HTML correspond à la langue affichée.

### Contenus non traduits

Les traductions couvrent l'interface. Les **événements** et les **actualités** saisis dans la base sont en français uniquement. Le site l'indique quand un contenu n'existe pas dans la langue demandée.

### Cache

Les pages publiques (accueil, agenda, présentation) sont mises en cache côté CDN pour limiter les requêtes vers la base. Le temps de calcul de la base est le quota le plus facilement consommé (voir *Limites et coûts*).

---

## 🔐 Zone privée (dashboard)

Accessible après connexion. **Français uniquement** : les routes `/dashboard` et `/auth` n'ont pas de préfixe de langue, et leurs pages sont marquées `noindex`.

### Rôles

| Rôle | Accès | Notes |
|------|-------|-------|
| `pending` | Page d'attente uniquement (`/auth/pending`) | Compte créé, en attente de validation par un admin |
| `member` | Dashboard complet | Agenda, présence, partitions globales et de son pupitre, profil |
| `chef_pupitre` | + gestion de son pupitre | Membres du pupitre, partitions du pupitre, notifications au pupitre |
| `admin` | + gestion globale | Invitations, validation des comptes, tous les membres, réglages |

### Contrôle des accès

- **`hooks.server.ts`** lit la session à chaque requête, charge le profil et vérifie le rôle. Cela couvre aussi les actions de formulaire.
  - Sans session : redirection vers `/auth/login`.
  - Rôle `pending` : redirection vers `/auth/pending`.
- **Guards** `requireMember`, `requireChef` et `requireAdmin` (dans `src/lib/auth/guards.ts`) sont appelés dans les layouts et les actions qui le demandent.
- Le rôle est relu depuis la base à chaque requête : une validation prend effet immédiatement, sans reconnexion.

### Règle de sécurité principale

Le navigateur **n'accède jamais directement à la base**. Toutes les lectures et écritures passent par des routes serveur (`+page.server.ts`, `+server.ts`, actions). Un utilisateur ne peut donc pas modifier son propre `role` ou son `pupitre` : seules les actions réservées à l'admin écrivent ces champs.

---

## 📅 Agenda et présence

- **Public** (`/[lang]/agenda`) : événements marqués `is_public`, lecture seule.
- **Dashboard** (`/dashboard/agenda`) : tous les événements. Chaque membre ne modifie **que sa propre présence** (`present`, `absent`, `unknown`). L'identifiant vient de la session, jamais du formulaire.
- **Gestion** (chef et admin) : ajouter, modifier, supprimer un événement.

---

## 📑 Partitions

Les fichiers sont stockés dans **Supabase Storage**. PostgreSQL conserve les métadonnées et les clés des objets; les accès aux fichiers privés sont protégés par des policies Storage et des contrôles côté serveur.

Les fichiers ne sont **jamais servis directement** : une route serveur vérifie le rôle et le pupitre avant de renvoyer le fichier.

| Action | Member | Chef | Admin |
|--------|--------|------|-------|
| Lire partitions globales | ✅ | ✅ | ✅ |
| Lire partitions de son pupitre | ✅ | ✅ | ✅ |
| Ajouter partition de son pupitre | ❌ | ✅ | ✅ |
| Ajouter partition globale | ❌ | ❌ | ✅ |
| Supprimer | ❌ | ✅ son pupitre | ✅ |

Les médias publics (photos et vidéos du site) sont dans le bucket Supabase
Storage configuré pour une lecture publique; les contenus privés restent
protégés par des policies.

---

## 👥 Pupitres

1. Bombarde
2. Cornemuse
3. Caisse claire
4. Percussion

Chaque membre appartient à un seul pupitre. Le chef de pupitre ne voit que les membres de son pupitre et ne gère que les partitions de son pupitre.

---

## 🔐 Invitation et validation

### 1. Création (admin)

L'admin renseigne **prénom**, **nom**, **email** et **pupitre**. Le serveur :
- génère un token aléatoire ;
- enregistre **l'empreinte SHA-256 du token** (jamais le token en clair) ;
- fixe l'expiration à 7 jours ;
- envoie le lien `/auth/invitation?token=...` par email.

### 2. Acceptation (invité)

Le serveur calcule l'empreinte du token reçu et vérifie qu'une invitation correspond, non expirée et non utilisée. Le formulaire pré-remplit email, prénom, nom et pupitre (lecture seule), et demande un mot de passe.

Le serveur vérifie que l'email de l'inscription correspond à celui de l'invitation. Puis, **dans une même transaction** :
- création du compte Supabase Auth ;
- création du profil avec `role = 'pending'` ;
- marquage de l'invitation avec `used_at`.

Sans transaction, un échec entre deux étapes laisserait un compte sans profil.

### 3. Validation (admin)

Dans `/dashboard/admin/invitations`, l'admin voit les profils `pending` et choisit un rôle (`member`, `chef_pupitre` ou `admin`). Le serveur n'accepte que ces trois valeurs.

---

## 🔔 Notifications

- **Globales** : nouvel événement, rappel de présence 24 h avant, message de l'admin à tous.
- **Par pupitre** : nouvel événement ou nouvelle partition du pupitre, message du chef à son pupitre.

Implémentation : action serveur → envoi d'email (dès le départ) ; notifications push à évaluer plus tard (OneSignal ou autre).

---
## 🏗️ Architecture du projet

```
bagad-penhars/
├── src/
│ ├── app.html # <html lang="%lang%">
│ ├── app.d.ts
│ ├── app.css
│ ├── hooks.server.ts # Session, rôle, blocage pending
│ │
│ ├── params/
│ │ └── lang.ts # Matcher : fr | en | br
│ │
│ ├── lib/
│ │ ├── server/ # Code serveur uniquement (jamais importé côté client)
│ │ │ ├── auth.ts # Intégration Supabase Auth (à finaliser)
│ │ │ ├── db.ts # Connexion Postgres, requêtes
│ │ │ ├── blobs.ts # Accès Storage (à migrer vers Supabase)
│ │ │ ├── email.ts # Envoi d’emails
│ │ │ └── data/
│ │ │ ├── events.ts
│ │ │ ├── profiles.ts # updateProfileRole (admin uniquement)
│ │ │ ├── documents.ts
│ │ │ ├── attendance.ts
│ │ │ └── invitations.ts # Création, hachage, vérification du token
│ │ │
│ │ ├── auth/
│ │ │ ├── roles.ts # Types Role, can()
│ │ │ └── guards.ts # requireMember, requireChef, requireAdmin
│ │ │
│ │ ├── components/
│ │ │ ├── ui/
│ │ │ ├── layout/
│ │ │ │ └── LanguageSwitcher.svelte
│ │ │ ├── events/
│ │ │ ├── documents/
│ │ │ ├── members/
│ │ │ └── auth/
│ │ │
│ │ ├── i18n/
│ │ │ ├── index.ts # messages, Lang, LANGS
│ │ │ ├── types.ts # type Messages (dérivé de fr.ts)
│ │ │ ├── fr.ts # Référence : public et privé
│ │ │ ├── en.ts # Public uniquement
│ │ │ └── br.ts # Public uniquement
│ │ │
│ │ ├── types.ts
│ │ └── utils.ts
│ │
│ └── routes/
│ ├── +layout.svelte
│ ├── +layout.server.ts
│ ├── +error.svelte
│ │
│ ├── (public)/
│ │ ├── +page.server.ts # Redirige / vers la langue détectée
│ │ └── [lang=lang]/
│ │ ├── +layout.server.ts # Langue, traductions, cookie
│ │ ├── +layout.svelte
│ │ ├── +page.svelte # Accueil
│ │ ├── bagad/
│ │ ├── formation/
│ │ ├── agenda/
│ │ ├── media/
│ │ ├── partenaires/
│ │ └── contact/
│ │
│ ├── auth/ # Sans préfixe de langue
│ │ ├── login/
│ │ ├── logout/
│ │ ├── forgot-password/
│ │ ├── reset-password/
│ │ ├── invitation/
│ │ └── pending/ # Compte en attente
│ │
│ ├── api/
│ │ ├── files/[...key]/ # Accès aux partitions (vérifie le rôle)
│ │ └── auth/ # Pages et callback Supabase Auth
│ │
│ └── dashboard/ # Français uniquement, noindex
│ ├── +layout.server.ts # requireMember
│ ├── +layout.svelte
│ ├── +page.svelte
│ ├── agenda/
│ ├── documents/
│ ├── profil/
│ ├── pupitre/
│ │ ├── +layout.server.ts # requireChef
│ │ ├── membres/
│ │ └── documents/
│ └── admin/
│ ├── +layout.server.ts # requireAdmin
│ ├── invitations/
│ ├── membres/
│ └── settings/
│
├── migrations/
│ ├── 001_initial_schema.sql
│ └── README.md
│
├── scripts/
│ ├── reset-agenda.js
│ └── migrate.js
│
├── static/
├── tests/
│ ├── guards.test.ts # pending / member / chef / admin
│ ├── i18n.test.ts # Mêmes clés dans fr, en, br
│ └── invitation.test.ts # Expiration, usage unique, hachage
├── .env.example
├── .gitignore
├── package.json
├── svelte.config.js # @sveltejs/adapter-netlify
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🗄️ Base de données (Supabase PostgreSQL)

Supabase fournit PostgreSQL et les tables de comptes dans `auth.users`. Le schéma métier cible est versionné dans `supabase/migrations/`; les policies RLS doivent être définies dans ces migrations.

> **État de migration** : `migrations/001_initial_schema.sql` est un schéma historique lié à Better Auth et ne doit pas être appliqué tel quel à Supabase. Il doit être porté vers `auth.users`, les identifiants UUID Supabase, les migrations versionnées et les policies RLS avant le déploiement.

| Table | Rôle |
|-------|------|
| `profiles` | Un profil lié à `auth.users` : pupitre, rôle, avatar |
| `invitations` | Invitations, avec token haché, expiration et `used_at` |
| `events` | Répétitions, sorties, réunions, événements externes |
| `attendance` | Présence : une seule réponse par personne et par événement (clé composite) |
| `documents` | Métadonnées des partitions, avec la clé d'objet Supabase Storage |

### Enums

- `pupitre` : bombarde, cornemuse, caisse_claire, percussion
- `app_role` : pending, member, chef_pupitre, admin
- `event_type` : repetition, sortie, reunion, externe
- `attendance_status` : present, absent, unknown
- `document_type` : partition, arrangement, recording

### Suppression

- Supprimer un membre supprime ses présences (`CASCADE`), mais conserve ses événements et partitions (`SET NULL`).
- Les événements sont en français (`title`, `description`).

---

## 🔑 Authentification (Supabase Auth)

- **Connexion** (`/auth/login`) : email et mot de passe via Supabase Auth; utiliser l'intégration serveur SSR pour gérer les cookies de session.
- **Déconnexion** (`/auth/logout`) : invalider la session Supabase.
- **Mot de passe oublié** : utiliser le flux de récupération Supabase Auth et une URL de retour autorisée.

Les rôles et pupitres sont stockés dans les tables publiques, notamment
`public.profiles`; ils ne doivent jamais être lus depuis `user_metadata`.
L'intégration Supabase Auth et la synchronisation du profil restent à
implémenter dans le code.

---

## 🛡️ Sécurité

- Vérification du rôle à chaque requête, dans `hooks.server.ts`, actions comprises.
- Guards sur les layouts et les actions.
- Le navigateur n'accède jamais à la base ni aux fichiers directement.
- Tokens d'invitation : aléatoires, hachés en base, à usage unique et expirants.
- Validation côté serveur de toutes les valeurs de formulaire (rôle, pupitre, type, statut de présence).
- Aucune action ne modifie `role` ou `pupitre` hors des actions réservées à l'admin.
- Les clés secrètes Supabase et les identifiants SMTP restent côté serveur; ne jamais exposer la clé `service_role`.

---

## 🌍 Traductions
```
src/lib/i18n/
├── index.ts # messages, Lang, LANGS
├── types.ts # type Messages, dérivé de fr.ts
├── fr.ts # Référence
├── en.ts
└── br.ts
```

`en.ts` et `br.ts` sont typés avec `Messages` : une clé manquante fait échouer `npm run check`. Le test `tests/i18n.test.ts` vérifie aussi l'absence de clé orpheline.

Les traductions en breton doivent être **relues par une personne qui pratique la langue**. Une traduction automatique ne suffit pas pour un site associatif.

---

## 🚀 Installation

### Prérequis

- Node.js 22+
- Un projet Supabase
- Un compte Netlify pour l'hébergement
- Netlify CLI : `npm install -g netlify-cli`

### Mise en route

```bash
git clone https://github.com/hazerty565/bagadPenhars.git
cd bagadPenhars
npm install

# Lier le site d'hébergement
netlify login
netlify link

# Configurer le projet Supabase et appliquer les migrations avec Supabase CLI
# (la procédure de migrations du dépôt reste à finaliser)
cp .env.example .env.local   # puis renseigner les valeurs Supabase et email
npm run dev                  # http://localhost:5173
```

### Variables d'environnement

```env
# Projet Supabase (noms à aligner avec l'intégration serveur retenue)
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<secret-server-only>

# Email (invitations, réinitialisation de mot de passe)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=contact@bagad-penhars.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Bagad Penhars <contact@bagad-penhars.com>"

# Les fichiers sont stockés dans Supabase Storage.
```

Les clés Supabase publiables (`PUBLIC_SUPABASE_URL` et
`PUBLIC_SUPABASE_ANON_KEY`) peuvent être utilisées par le client avec des
policies RLS strictes. La clé `SUPABASE_SERVICE_ROLE_KEY` et les identifiants
SMTP sont exclusivement côté serveur; ne jamais les préfixer par `PUBLIC_`.

---

## 📚 Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Aperçu du build |
| `npm run check` | Vérification TypeScript et Svelte |
| `npm test` | Tests (guards, traductions, invitations) |
| `npm run reset:agenda` | Vide l'agenda (usage annuel) |

Les migrations Supabase ne sont pas encore configurées dans le dépôt. Ne pas
exécuter `migrations/001_initial_schema.sql` directement; voir
[`docs/database.md`](./docs/database.md).

---

## 🚀 Déploiement (Netlify)

Le projet utilise `@sveltejs/adapter-netlify`. Netlify gère la publication : ne **pas** publier `.svelte-kit/build` à la main.

1. Pousser le dépôt sur GitHub.
2. Connecter le dépôt dans Netlify (*Add new site → Import an existing project*).
3. Build : `npm run build` (détecté automatiquement).
4. Ajouter les variables d'environnement dans *Site configuration → Environment variables*.
5. Configurer le projet Supabase, ses variables d'environnement et ses policies RLS.
6. Configurer le domaine personnalisé (`bagadpenhars.fr`) et le HTTPS.

Chaque pull request génère une preview Netlify. La base Supabase de preview doit être configurée séparément ou utiliser une branche Supabase dédiée.

---

## 💰 Limites et coûts

Les quotas actuels (vérifier sur les pages tarifaires avant chaque décision) :

| Ressource | Limite | Usage prévu |
|-----------|--------|-------------|
| Authentification, base et stockage objet | Quotas selon le plan Supabase choisi | À vérifier avant le déploiement |
| Hébergement de l'application | Quotas selon le plan Netlify choisi | À vérifier avant le déploiement |

**Précautions** :
- Cache des pages publiques pour limiter les requêtes à Supabase.
- Vérifier les quotas, sauvegardes et règles de rétention du projet Supabase.
- Partitions compressées avant upload si elles deviennent volumineuses.

---

## 📋 État d'avancement

- [x] Choix de la stack cible : Supabase (Auth, PostgreSQL, Storage) et Netlify (hébergement)
- [ ] Migration du schéma historique vers Supabase et activation de RLS
- [x] Routage multilingue FR / EN / BR (conception)
- [x] Règle de blocage des comptes `pending` (conception)
- [ ] Configuration Supabase Auth et routes d'authentification
- [ ] Flow d'invitation (création, acceptation, validation)
- [ ] Routes de fichiers (`/api/files`)
- [ ] Dashboard : agenda, partitions, profil
- [ ] Sections chef et admin
- [ ] Traductions EN et BR complètes (relecture BR à prévoir)
- [ ] Gestion des erreurs (401, 403, 404, 500)
- [ ] Tests : guards, traductions, invitations
- [ ] Tests E2E (Playwright)
- [ ] Notifications
- [ ] Responsive mobile
- [ ] Déploiement Netlify et domaine

---

## 📄 Licence

MIT, voir [LICENSE](./LICENSE).

**Dernière mise à jour** : 26/10/2026
**Stack cible** : SvelteKit 5 · Supabase (Auth, PostgreSQL, Storage) · Netlify · TailwindCSS · Node.js 22+
