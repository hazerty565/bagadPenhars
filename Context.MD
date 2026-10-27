# 📚 CONTEXT.md — Guide du projet pour les contributeurs

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
| **Frontend** | SvelteKit 5 (runes) | Framework fullstack | typescript
| **Backend** | SvelteKit + Node.js | Serveurs, form actions, load functions |
| **Authentification** | Supabase Auth | Comptes et sessions |
| **Base de données** | Supabase PostgreSQL | Données relationnelles et RLS |
| **Stockage fichiers** | Supabase Storage | Partitions, avatars et médias |
| **Styling** | TailwindCSS | CSS utility-first |
| **i18n** | Fichiers TS custom | Traductions (fr.ts, en.ts, br.ts) |
| **Notifications** | OneSignal | Notifications push |
| **Déploiement** | Netlify | Hébergement de l'application |

Supabase est l'unique fournisseur de données applicatives : Auth, PostgreSQL
et Storage. Netlify sert uniquement à héberger l'application. Le code et la
migration historiques du dépôt n'ont pas encore tous été portés vers cette
cible; ne pas réintroduire d'autre fournisseur de base de données ou de
stockage.

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

### 3. **Rôles hiérarchiques**

```
member → chef_pupitre → admin
  ↓          ↓            ↓
Lecture    Gestion      Tout
seule      pupitre      gérer
```

**Chaque rôle hérite des permissions du rôle inférieur.**

### 4. **Pupitres**

Le Bagad a **4 pupitres** (sections musicales) :
- Bombarde
- Cornemuse
- Caisse Claire
- Percussion

**Chaque membre = 1 pupitre.**
**Chaque chef_pupitre = gère seulement son pupitre.**

### 5. **Invitation flow sécurisé**

```
Admin crée invitation → Email avec token unique → 
Utilisateur se crée compte → Profil en "pending" → 
Admin approuve et attribue rôle → Accès au dashboard
```

**Tokens** : UUID, expirant (+7 jours), à usage unique.

### 6. **Système de présence**

Pour chaque événement : "Présent / Absent / Ne sais pas"

Stocké en collection `attendance`.

### 7. **Documents = Partitions**

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

  <!-- Modification (chef + admin) -->
  {#if data.canEditAgenda}
    <button onclick={() => editEvent(event.id)}>Modifier</button>
  {/if}
{/each}

<!-- Ajouter (chef + admin) -->
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
public.invitations       → Invitations (token haché, expiration)
public.events            → Événements (agenda et visibilité)
public.attendance        → Présences
public.documents         → Métadonnées des partitions
```

Ce schéma est la cible fonctionnelle; il n'est pas encore intégralement
implémenté dans le dépôt. Les tables métier seront définies par des migrations
versionnées dans
`supabase/migrations/`. La base gérée par Supabase fournit les comptes dans
`auth.users`. Toute table exposée par l'API doit avoir RLS et des policies
explicites.

### Buckets Supabase Storage

```
bagad-avatars      → Photos de profil, accès protégé
bagad-partitions   → Partitions privées, accès contrôlé par rôle
bagad-medias       → Médias destinés au public
```

Les médias doivent être servis depuis le bucket Supabase Storage configuré
pour leur visibilité; ne pas utiliser de blob ou CDN de stockage externe.

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
**Stack cible** : SvelteKit 5 + Supabase (Auth, PostgreSQL, Storage) + TailwindCSS + Netlify
