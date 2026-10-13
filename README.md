# 🎶 Bagad Penhars : site officiel

Site du Bagad Penhars : un site public multilingue (français, anglais, breton) et une zone adhérents privée, en français, réservée aux membres approuvés.

**Stack** : SvelteKit 2 · Netlify (hébergement, fonctions, Blobs) · Netlify DB (Postgres, propulsé par Neon) · Better Auth · TailwindCSS

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
- **Reset annuel** : l'agenda est vidé le 31 décembre, avec `scripts/reset-agenda.js` (tâche planifiée).

---

## 📑 Partitions

Les fichiers sont stockés dans **Netlify Blobs**. La base ne garde que la clé du blob (`blob_key`).

Les fichiers ne sont **jamais servis directement** : une route serveur vérifie le rôle et le pupitre avant de renvoyer le fichier.

| Action | Member | Chef | Admin |
|--------|--------|------|-------|
| Lire partitions globales | ✅ | ✅ | ✅ |
| Lire partitions de son pupitre | ✅ | ✅ | ✅ |
| Ajouter partition de son pupitre | ❌ | ✅ | ✅ |
| Ajouter partition globale | ❌ | ❌ | ✅ |
| Supprimer | ❌ | ✅ son pupitre | ✅ |

Les médias publics (photos et vidéos du site) sont dans un blob séparé, servi directement par le CDN.

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
- création du compte Better Auth ;
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
│ │ │ ├── auth.ts # Configuration Better Auth
│ │ │ ├── db.ts # Connexion Postgres, requêtes
│ │ │ ├── blobs.ts # Accès Netlify Blobs
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
│ │ └── auth/[...all]/ # Routes Better Auth
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

## 🗄️ Base de données (Netlify DB / Neon)

Schéma complet dans `migrations/001_initial_schema.sql`. Les tables `user`, `session`, `account` et `verification` sont créées par Better Auth ; ne pas les modifier à la main.

| Table | Rôle |
|-------|------|
| `profiles` | Un profil par utilisateur Better Auth : pupitre, rôle, avatar |
| `invitations` | Invitations, avec token haché, expiration et `used_at` |
| `events` | Répétitions, sorties, réunions, événements externes |
| `attendance` | Présence : une seule réponse par personne et par événement (clé composite) |
| `documents` | Métadonnées des partitions, avec `blob_key` vers Netlify Blobs |

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

## 🔑 Authentification (Better Auth)

- **Connexion** (`/auth/login`) : email et mot de passe, session gérée par Better Auth dans un cookie `HttpOnly`, `Secure` et `SameSite=Lax`.
- **Déconnexion** (`/auth/logout`) : invalidation de la session et suppression du cookie.
- **Mot de passe oublié** : Better Auth envoie un lien vers `/auth/reset-password?token=...` (fonction `sendResetPassword`).

Better Auth est configuré dans `src/lib/server/auth.ts`, avec la connexion Postgres fournie par Netlify DB.

> **Choix à confirmer** : ce README suppose **Better Auth auto-hébergé sur Neon**, qui permet le plugin `admin` et les routes serveur personnalisées. **Neon Auth** (managé, en bêta) est une alternative plus simple, mais avec un SDK différent et sans plugins personnalisés. Le choix doit être fait avant d'écrire les routes d'authentification.

---

## 🛡️ Sécurité

- Vérification du rôle à chaque requête, dans `hooks.server.ts`, actions comprises.
- Guards sur les layouts et les actions.
- Le navigateur n'accède jamais à la base ni aux fichiers directement.
- Tokens d'invitation : aléatoires, hachés en base, à usage unique et expirants.
- Validation côté serveur de toutes les valeurs de formulaire (rôle, pupitre, type, statut de présence).
- Aucune action ne modifie `role` ou `pupitre` hors des actions réservées à l'admin.
- Variables sensibles (`DATABASE_URL`, clés d'API, identifiants SMTP) uniquement côté serveur.

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
- Un compte Netlify, avec un plan permettant Netlify DB
- Netlify CLI : `npm install -g netlify-cli`

### Mise en route

```bash
git clone https://github.com/hazerty565/bagadPenhars.git
cd bagadPenhars
npm install

# Base de données (crée une base Neon via Netlify DB)
netlify login
netlify link
netlify init db

# Migrations
npm run db:migrate

cp .env.example .env.local   # puis renseigner les valeurs
npm run dev                  # http://localhost:5173
```

### Variables d'environnement

```env
# Base de données : fournie par Netlify DB (vérifier le nom exact dans la console Netlify)
DATABASE_URL=postgres://...

# Better Auth
BETTER_AUTH_SECRET=une_longue_chaine_aleatoire
BETTER_AUTH_URL=http://localhost:5173

# Email (invitations, réinitialisation de mot de passe)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=contact@bagad-penhars.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Bagad Penhars <contact@bagad-penhars.com>"

# Netlify Blobs (en local, via netlify dev)
# Aucune variable publique n'est nécessaire.
```

Toutes ces variables sont **côté serveur**. Aucune ne doit être préfixée par `PUBLIC_`.

---

## 📚 Commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Aperçu du build |
| `npm run check` | Vérification TypeScript et Svelte |
| `npm test` | Tests (guards, traductions, invitations) |
| `npm run db:migrate` | Applique `migrations/*.sql` |
| `npm run reset:agenda` | Vide l'agenda (usage annuel) |

---

## 🚀 Déploiement (Netlify)

Le projet utilise `@sveltejs/adapter-netlify`. Netlify gère la publication : ne **pas** publier `.svelte-kit/build` à la main.

1. Pousser le dépôt sur GitHub.
2. Connecter le dépôt dans Netlify (*Add new site → Import an existing project*).
3. Build : `npm run build` (détecté automatiquement).
4. Ajouter les variables d'environnement dans *Site configuration → Environment variables*.
5. Vérifier que la base Netlify DB est rattachée au site.
6. Configurer le domaine personnalisé (`bagadpenhars.fr`) et le HTTPS.

Chaque pull request génère une **preview** avec sa propre branche de base, grâce à Netlify DB.

---

## 💰 Limites et coûts

Les quotas actuels (vérifier sur les pages tarifaires avant chaque décision) :

| Ressource | Limite | Usage prévu |
|-----------|--------|-------------|
| Utilisateurs actifs mensuels (Better Auth / Neon Auth) | 60 000 | Quelques dizaines de membres |
| Temps de calcul de la base | 100 CU-heures / mois / projet | Principal point de vigilance |
| Stockage de la base | 1 Go / projet | Quelques Mo de texte |
| Stockage objet (partitions, médias) | 5 Go | Partitions PDF et médias |

**Précautions** :
- Cache des pages publiques pour limiter les requêtes à la base.
- Mise en veille de la base par inactivité, pour ne pas consommer les CU-heures hors usage.
- Partitions compressées avant upload si elles deviennent volumineuses.

---

## 📋 État d'avancement

- [x] Choix de la stack : Netlify, Netlify DB, Better Auth
- [x] Schéma SQL initial
- [x] Routage multilingue FR / EN / BR (conception)
- [x] Règle de blocage des comptes `pending` (conception)
- [ ] Configuration Better Auth et routes d'authentification
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

**Dernière mise à jour** : 13/10/2026
**Stack** : SvelteKit 2 · Netlify · Netlify DB (Neon) · Better Auth · TailwindCSS · Node.js 22+


