# 📚 CONTEXT.md — Guide du projet pour les contributeurs

> **Passages obsolètes :** certaines décisions décrites plus bas ont été
> remplacées ou corrigées. Pour les règles marquées **OBsolète — ne plus
> prendre en compte**, se référer au registre daté dans
> [`docs/questions.md`](./docs/questions.md).

Ce document est destiné à expliquer le contexte global du projet **Bagad Penhars** pour faciliter la collaboration (humaine ou IA).

---

## 🎯 Vision du projet

**Bagad Penhars** est un site web pour un ensemble musical breton traditionnel.

**Objectif** : Créer une application simple (pas de SaaS) avec :
- Un site public multilingue (FR / BR / EN)
- Une zone adhérents sécurisée (français uniquement)
- Un système de gestion de membres, agenda et partitions

**Principes** :
- ✅ **Simple** : Pas d'over-engineering, fonctionnalités essentielles
- ✅ **Sécurisé** : Validation côté serveur, guards, tokens expirants
- ✅ **Modulaire** : Chaque page peut être développée indépendamment

---

## 🏗️ Stack technique

| Composant | Technologie cible | Rôle |
|-----------|------------------|------|
| **Frontend** | SvelteKit 5 (runes) | Framework fullstack |
| **Backend** | SvelteKit | Routes serveur, form actions et load functions |
| **Authentification** | Better Auth | Identités et sessions; les rôles métier viennent de `profiles.role` |
| **Base de données** | Neon PostgreSQL + RLS | Données relationnelles et sécurité au niveau des lignes |
| **Driver et pooling** | `@neondatabase/serverless` + Cloudflare Hyperdrive | Connexions PostgreSQL; pas de cache partagé pour les lectures privées |
| **ORM et migrations** | Drizzle | Modèle relationnel et migrations |
| **Stockage fichiers** | Cloudflare R2 | Partitions et médias |
| **Styling** | TailwindCSS | CSS utility-first |
| **i18n** | Fichiers TS custom | Traductions (fr.ts, en.ts, br.ts) |
| **Notifications** | OneSignal | Notifications push |
| **Déploiement** | Cloudflare Pages | Hébergement de l'application |

Les guards SvelteKit et les policies RLS sont tous deux requis pour protéger
les données sensibles. Le contexte `set_config(..., true)` est limité à la
transaction courante. Le menu est filtré côté serveur, mais toute route,
action ou endpoint sensible vérifie aussi les droits côté serveur. Les choix
d'architecture de référence sont détaillés dans
[`docs/architecture.md`](./docs/architecture.md) et
[`docs/database.md`](./docs/database.md).

Cette stack est la cible documentaire; le dépôt contient encore du code et
des dépendances historiques qui n'ont pas tous été migrés.

> **OBsolète — ne plus prendre en compte :** les références à Supabase
> (Auth, PostgreSQL, Storage), Netlify, et au client Supabase dans les sections
> suivantes décrivent l'ancienne cible. Elles sont remplacées par la stack
> ci-dessus et les contrats de [`docs/architecture.md`](./docs/architecture.md)
> et [`docs/database.md`](./docs/database.md).

---

## 🔑 Concepts clés à comprendre

### 1. **Routing multilingue public**

```
/                        → Détection auto langue
/fr/home                 → Français
/en/home                 → Anglais
/br/home                 → Breton
/dashboard               → Français uniquement (privé)
```

**Comment ça marche** :
- Le `hooks.server.ts` charge les traductions selon `[lang]`
- Un cookie `preferred_lang` mémorise le choix
- Si pas de cookie, détection via `Accept-Language` header du navigateur

### 2. **Dashboard "Caméléon"**

Une **seule route** (`/dashboard/agenda`) qui s'adapte au rôle de l'utilisateur :

```typescript
// Dans +page.svelte
{#if data.canEditAgenda}
  <button>Modifier</button>
{/if}
```

**Pas de routes séparées** par rôle. L'affichage change via blocs `{#if}`.

### 3. **Rôles et autorisations**

```
member → chef_pupitre → admin
  ↓          ↓            ↓
Lecture    Gestion      Tout
seule      pupitre      gérer
```

Les niveaux de rôle ne remplacent pas les règles métier : les droits propres à
un pupitre, la visibilité d'un événement et la validation d'un compte doivent
être vérifiés explicitement côté serveur et dans la base.

### 4. **Pupitres**

Le Bagad conserve quatre pupitres distincts : Bombarde, Caisse claire,
Cornemuse et Percussion. Un membre affecté à Percussion est également membre de
Caisse claire par une relation explicite, sans duplication d'affectation.
Chaque pupitre a au plus un chef. Un chef peut diriger plusieurs pupitres et
choisit une seule cible lors de la création d'un événement, même s'il n'en est
pas l'auteur ; les événements multi-pupitres
ou globaux relèvent uniquement de la secrétaire ou de l'administrateur.

### 5. **Invitation flow sécurisé**

```
Admin crée l'invitation et le compte Auth → Email de confirmation et de définition du mot de passe →
Profil "pending" → Admin vérifie la confirmation et valide manuellement →
account_status "active" → Accès selon app_role
```

`account_status` (`pending`, `active`, `suspended`) est séparé du rôle
applicatif (`member`, `chef_pupitre`, `secretaire`, `admin`). Un compte
suspendu perd l'accès métier sans suppression de ses données.

La création de comptes est réservée aux invitations d'un administrateur via
`inviteUserByEmail()`. Le lien Supabase Auth est valable une heure. Le membre
confirme son adresse e-mail et définit son mot de passe ; son profil reste
`account_status = pending` jusqu'à l'activation administrative, qui vérifie la
confirmation. Le rôle applicatif initial est `member` et reste indépendant.
Si le lien expire, l'administrateur peut renvoyer une invitation au compte
existant sans créer un second compte.

### 6. **Événements**

Chaque événement a un `event_type` ENUM parmi `sortie`, `concert`, `fest-noz`,
`festival`, `concours`, `gala`, `repetition`, `reunion` et `repas`, ainsi
qu'une visibilité indépendante choisie explicitement :

- `public` : accessible à tous, y compris sans compte ;
- `interne` : accessible aux membres actifs connectés ;
- `pupitre` : accessible et ouvert aux réponses uniquement aux membres actifs
  des pupitres ciblés.

Une répétition peut être publique, interne ou ciblée sur un pupitre. Un chef
choisit dans une liste le pupitre qu'il dirige et l'événement `pupitre` conserve
une seule cible. Les membres des autres pupitres ne le voient pas et ne peuvent
pas y répondre. Les événements publics et internes restent visibles et ouverts
aux réponses selon leur visibilité.
La secrétaire et l'administrateur gèrent tous les événements, y compris les
événements multi-pupitres ou globaux. Un chef crée, modifie et supprime les
événements `pupitre` des pupitres qu'il dirige, sans restriction liée à
l'auteur ; il ne gère pas les événements globaux ni les événements multi-pupitres.
Percussion est indépendant de Caisse claire et ne bénéficie d'aucun héritage
de lecture ou de gestion. Un membre ne fait que consulter et répondre selon son
statut et son rôle. Aucune gestion des
événements récurrents n'est incluse en V1.

### 7. **Trombinoscope**

Le trombinoscope est une fonctionnalité obligatoire de la V1, opérationnelle à
la première mise en production, et réservée aux membres actifs connectés. Il expose uniquement
le nom, le prénom, la photo de profil, les pupitres, le niveau musical et la
fonction éventuelle au bureau. Il ne rend pas accessibles les coordonnées
privées (téléphone, e-mail personnel, adresse postale ou autres données non
autorisées). La fonction au bureau est informative et ne confère aucun droit.

La vue SQL dédiée `member_directory` limite les colonnes exposées et s'appuie
sur RLS pour autoriser les seuls membres actifs. Les droits de lecture des
profils complets restent distincts de ceux du trombinoscope ; les tables
associées aux pupitres et niveaux sont également protégées. Seul le propriétaire
peut modifier sa photo, administrateurs inclus.

### 8. **Système de présence**

Pour chaque événement, les membres autorisés peuvent répondre présent ou absent.

### 9. **Documents = Partitions**

Stockés par pupitre ou globaux.
- **Member** : Peut télécharger
- **Chef** : Peut upload pour son pupitre
- **Admin** : Peut upload pour tous

---

## 🔒 Sécurité — Points critiques

### Authentification

```typescript
// hooks.server.ts lit le cookie CHAQUE requête
const { data: { user }, error } = await supabase.auth.getUser();
if (error) throw error;
event.locals.user = user;
// Charger le rôle depuis public.profiles, jamais depuis user_metadata.
event.locals.role = profile.role;
```

**JAMAIS faire confiance au client.** Le rôle est toujours lu en BDD.

### Guards

```typescript
// Chaque route protégée commence par un guard
export const load = ({ locals }) => {
    requireAdmin(locals); // Lance une erreur 403 si pas admin
    // ... code sûr
};
```

### Form Actions

```typescript
// Chaque action revérifie les permissions
export const actions = {
    deleteEvent: async ({ request, locals }) => {
        if (locals.role !== 'admin') throw error(403);
        // ... deletion
    }
};
```

### Permissions fines

Chef ne peut modifier que son pupitre :
```typescript
if (locals.role === 'chef_pupitre' && doc.pupitre !== locals.pupitre) {
    throw error(403); // Bloqué côté serveur
}
```

---

## 📁 Structure des fichiers — Conventions

### Pages publiques

```
src/routes/(public)/
├── [lang]/
│   ├── +layout.server.ts    # Charge traductions
│   ├── +page.svelte         # Home
│   ├── bagad/+page.svelte
│   ├── agenda/+page.svelte
│   ├── contact/+page.svelte
│   └── ... autres pages
```

**Convention** : Une seule page SvelteKit = une route publique.

### Pages privées

```
src/routes/dashboard/
├── +layout.server.ts        # Guard requireAuth
├── +page.svelte             # Accueil
├── agenda/                  # Page commune (caméléon)
│   ├── +page.server.ts
│   └── +page.svelte
├── pupitre/
│   ├── +layout.server.ts    # Guard requireChef
│   ├── membres/+page.svelte
│   └── documents/+page.svelte
└── admin/
    ├── +layout.server.ts    # Guard requireAdmin
    └── invitations/+page.svelte
```

**Convention** :
- Chaque section a son propre `+layout.server.ts` avec guard
- Pas de sous-dossiers inutiles
- Une page = une fonctionnalité

### Données (lib/data)

```
src/lib/data/
├── events.ts       # getEvents(), createEvent(), deleteEvent()
├── profiles.ts     # getProfile(), updateProfile()
├── documents.ts    # getDocuments(), uploadDocument()
├── attendance.ts   # getAttendance(), saveAttendance()
└── invitations.ts  # getInvitation(), createInvitation()
```

**Convention** :
- Une fonction par action
- Pas de logique métier complexe
- Accès aux données via le client Supabase serveur et des policies RLS

### Composants

```
src/lib/components/
├── ui/             # Button, Input, Modal, etc.
├── layout/         # Header, Sidebar, Footer
├── events/         # EventCard, EventForm
├── documents/      # DocumentCard, UploadForm
├── members/        # MemberList, MemberForm
└── auth/           # LoginForm, InvitationForm
```

**Convention** :
- Composants réutilisables dans `ui/`
- Composants spécifiques à une section dans leur dossier

---

## 🌍 i18n — Comment ça marche

### Fichiers de traductions

```typescript
// src/lib/i18n/fr.ts
export const fr = {
  nav: { home: 'Accueil', bagad: 'Le Bagad', ... },
  home: { title: 'Bagad Penhars', ... },
  agenda: { title: 'Agenda', ... },
  // ... hiérarchie logique
};
```

### Utilisation

```svelte
<!-- Dans une page -->
<script>
  let { data } = $props();
  const { t, lang } = data; // t = traductions
</script>

<h1>{t.home.title}</h1>
<a href="/{lang}/bagad">{t.nav.bagad}</a>
```

### Détection auto langue

```typescript
// Si utilisateur visite bagadpenhars.fr
// 1. Check cookie preferred_lang
// 2. Check Accept-Language header du navigateur
// 3. Default: FR
```

---

## 🎨 Le système "Caméléon"

**Une seule page, plusieurs affichages.**

```svelte
<!-- /dashboard/agenda/+page.svelte -->
<script>
  let { data } = $props();
</script>

<!-- TOUS voient ça -->
<h1>Agenda</h1>
{#each data.events as event}
  <!-- Présence (tous) -->
  <form method="POST" action="?/respondEvent">
    <button name="status" value="present">Présent</button>
  </form>

  <!-- Modification (chef d'un pupitre cible, secrétaire ou admin) -->
  {#if data.canEditAgenda}
    <button onclick={() => editEvent(event.id)}>Modifier</button>
  {/if}
{/each}

<!-- Ajouter (chef d'un pupitre dirigé, secrétaire ou admin) -->
{#if data.canEditAgenda}
  <a href="/dashboard/agenda/create">Ajouter</a>
{/if}
```

**Points clés** :
- `data.canEditAgenda` calculé dans le `+page.server.ts`
- Pas de logique complexe en Svelte, juste `{#if}`
- Toute modification est protégée côté serveur (form actions)

---

## 📊 Schéma Supabase — Résumé

### Tables PostgreSQL cibles

```
public.profiles          → Profil et rôle, lié à auth.users
public.invitations       → Invitations (email, expiration)
public.events            → Événements (type et visibilité)
public.event_pupitres    → Pupitres ciblés par les événements
public.event_responses   → Réponses de présence
public.documents         → Métadonnées des partitions
```

La migration 005 est le schéma actuellement versionné. Les décisions de
trombinoscope, de type d'événement et de flux d'invitation décrites ici sont
des exigences cibles ; leur compatibilité et leur implémentation doivent être
validées avant toute nouvelle migration. Toute table exposée par l'API doit
avoir RLS et des policies explicites.

### Buckets Supabase Storage

Le stockage utilise deux buckets Supabase :

- `bagad-public` (`public = true`) : médias publiés sous `articles/`, `albums/`,
  `events/` et `documents/`, lisibles sans connexion.
- `bagad-private` (`public = false`) : photos de profil sous
  `profiles/{profile_id}/avatar.webp` et documents privés sous `documents/`.

Les partitions vont sous `documents/{pupitre_slug}/`. Les photos d'albums non
publiques vont sous `documents/albums/{album_id}/` dans le bucket privé. Chaque
membre actif lit les avatars des membres actifs, mais ne peut modifier que sa
propre photo. Les fichiers privés sont servis par requête authentifiée ou URL
signée à courte durée ; ils ne reçoivent jamais d'URL publique permanente.
Les chemins et rôles sont contrôlés par les policies RLS Storage.

---

## 🔄 Flow d'une feature — Exemple: "Ajouter un événement"

### 1. **Route**
```
POST /dashboard/agenda?/addEvent
```

### 2. **Form HTML** (`+page.svelte`)
```svelte
<form method="POST" action="?/addEvent">
  <input name="title" />
  <input name="date" type="datetime-local" />
  <button>Ajouter</button>
</form>
```

### 3. **Validation côté serveur** (`+page.server.ts`)
```typescript
export const actions = {
  addEvent: async ({ request, locals }) => {
    // Guard 1: Authentifié ?
    if (!locals.user) throw error(401);
    
    // Guard 2: Chef ou admin ?
    if (!['chef_pupitre', 'admin'].includes(locals.role)) {
      throw error(403);
    }

    // Guard 3: Valider les données
    const { title, date } = Object.fromEntries(await request.formData());
    if (!title || !date) return fail(400, { error: 'Données invalides' });

    // Créer l'événement
    await createEvent({ title, date, createdBy: locals.user.id });
    
    return { success: true };
  }
};
```

### 4. **Accès à la donnée** (`lib/data/events.ts`)
```typescript
export async function createEvent(data) {
  const { data: event, error } = await supabase
    .from('events')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return event;
}
```

### 5. **Affichage** (`+page.svelte`)
```svelte
{#if form?.success}
  <p>Événement créé !</p>
{/if}
```

---

## 🧪 Conventions de code

### TypeScript strict

```typescript
// ✅ BON
const role: 'member' | 'chef_pupitre' | 'admin' = locals.role;

// ❌ MAUVAIS
const role: any = locals.role;
```

### Variables Svelte 5

```svelte
<!-- ✅ BON (Runes) -->
<script>
  let { data } = $props();
  let message = $state('');
</script>

<!-- ❌ MAUVAIS (Svelte 4) -->
<script>
  let message;
</script>
```

### Nommage

```typescript
// Fonctions data
getEvents()              // Récupérer
createEvent()            // Créer
updateEvent()            // Modifier
deleteEvent()            // Supprimer
getEventsByPupitre()     // Filtrer

// Fichiers
+page.svelte             // Page
+page.server.ts          // Load + Actions
+layout.svelte           # Layout
+layout.server.ts        # Load + Guards

// Variables booléennes
isAdmin, canEdit, hasAccess
```

### Form Actions

```typescript
// Noms d'actions = verbes
export const actions = {
  loginUser: async ({ request, event }) => {},
  createInvitation: async ({ request, locals }) => {},
  deleteDocument: async ({ request, locals }) => {},
};
```

---

## 📝 Workflow de développement

### 1. **Nouvelle feature**
```bash
git checkout -b feature/nom-feature
```

### 2. **Créer la structure**
```
- Créer la route (+page.svelte)
- Ajouter le load/action (+page.server.ts)
- Créer les fonctions data (lib/data/)
- Ajouter les traductions (i18n/)
```

### 3. **Implémenter**
```
- Frontend (HTML + styling TailwindCSS)
- Backend (load, actions, guards)
- Tests (si test E2E)
```

### 4. **Commit + Push**
```bash
git add .
git commit -m "feat: ajouter gestion invitations"
git push origin feature/nom-feature
```

### 5. **Pull Request**
```
Description de la feature
Screenshots (si UI)
```

---

## 🐛 Debugging — Tips

### Vérifier la session
```typescript
// En développement, dans hooks.server.ts
console.log('Session user:', event.locals.user);
console.log('Role:', event.locals.role);
console.log('Pupitre:', event.locals.pupitre);
```

### Vérifier une query Supabase
```typescript
const { data, error } = await supabase
  .from('events')
  .select('id, title, starts_at');

if (error) throw error;
console.log('Events:', data);
```

### Erreur 401/403 ?
```
1. Vérifier le guard dans +layout.server.ts
2. Vérifier la session dans hooks.server.ts
3. Vérifier le rôle en base (`public.profiles`)
```

### i18n manquante ?
```
1. Vérifier que la clé existe dans fr.ts, en.ts, br.ts
2. Vérifier l'accès: data.t.section.key
3. Vérifier que [lang] est passé à la vue
```

---

## 📚 Fichiers clés à connaître

| Fichier | Rôle | Doit savoir |
|---------|------|-----------|
| `hooks.server.ts` | Session + rôles | Exécuté à CHAQUE requête |
| `lib/auth/guards.ts` | Protection routes | Utilisé dans load() |
| `lib/auth/roles.ts` | Permissions | Fonctions can.manageAgenda() |
| `src/lib/server/data/*.ts` | Supabase | Accès serveur aux données |
| `lib/i18n/index.ts` | Traductions | Comment les utiliser |
| `+layout.server.ts` | Guard section | Bloque si pas autorisé |
| `+page.server.ts` | Load + Actions | Données + traitements |
| `+page.svelte` | Affichage | Rendu HTML |

---

## ⚠️ Pièges courants

### ❌ Pièce 1: Faire confiance au rôle du client
```typescript
// MAUVAIS
if (locals.role === 'admin') { // ✅ Ok côté serveur
}

// Mais ne JAMAIS faire ça côté client:
// const role = JSON.parse(localStorage.getItem('role')); // ❌
```

### ❌ Pièges 2: Oublier un guard
```typescript
// MAUVAIS: Page admin sans guard
export const load = () => {
  // N'importe qui peut voir cette page !
};

// BON: Ajouter le guard
export const load = ({ locals }) => {
  requireAdmin(locals); // Bloque si pas admin
};
```

### ❌ Pièges 3: Filtrer côté client au lieu que serveur
```typescript
// MAUVAIS: Charger TOUS les documents puis filtrer en JS
const allDocs = await getAll();
const myDocs = allDocs.filter(d => d.pupitre === myPupitre);

// BON: Filtrer côté serveur
const myDocs = await getDocuments({ pupitre: locals.pupitre });
```

### ❌ Pièges 4: Oublier la validation côté serveur
```typescript
// MAUVAIS: Valider juste en HTML
<input type="email" required />

// BON: Valider en TypeScript aussi
if (!email.includes('@')) return fail(400, { error: 'Email invalide' });
```

---

## 🎓 Pour une IA contributrice

Si une IA contribue au projet, elle doit :

1. **Respecter la structure** : Pas de fichiers à des endroits bizarres
2. **Utiliser les conventions** : Types TypeScript stricts, runes Svelte 5
3. **Ajouter des traductions** : Toute nouvelle string doit être en i18n
4. **Protéger les routes** : Guards dans tous les load() sensibles
5. **Valider côté serveur** : Jamais de validation front uniquement
6. **Documenter les changes** : Commits clairs et explicites
7. **Tester les scenarios** : Login, invitation, permissions, etc.

---

## 📞 Questions avant de commencer

**Une IA ou contributeur doit se poser** :

1. ✅ Cette route doit-elle être protégée par un guard ?
2. ✅ Ai-je ajouté les traductions (fr, en, br) ?
3. ✅ Est-ce que je valide côté serveur ?
4. ✅ Est-ce que le rôle/pupitre limite l'accès correctement ?
5. ✅ Ai-je respecté la structure des fichiers ?
6. ✅ Ai-je testé sans être connecté ?
7. ✅ Ai-je testé avec un rôle différent (member vs chef vs admin) ?

---

**Dernière mise à jour** : 26/10/2026
**Maintainer** : hazerty565
**Stack cible** : SvelteKit 5 + Better Auth + Neon PostgreSQL/RLS + Drizzle +
`@neondatabase/serverless` + Cloudflare Hyperdrive/Pages/R2 + TailwindCSS
