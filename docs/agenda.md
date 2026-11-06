En lien avec le fichier event.md
Voici une proposition design pour la page agenda

> **Note pour l'implémentation :** les extraits ci-dessous sont une maquette
> fonctionnelle historique, pas du code à reprendre tel quel. Respecter les
> conventions Svelte 5 de `AGENTS.md` et la spécification actuelle. En
> particulier, l'identité du répondant doit venir de la session vérifiée côté
> serveur, jamais d'un `userId` fourni par le navigateur; les actions de
> présence doivent appliquer les règles d'accès serveur.
---

## Structure des fichiers

```
src/
├── routes/
│   └── agenda/
│       └── +page.svelte          ← Page principale
├── lib/
│   └── components/
│       ├── EventCard.svelte      ← Composant carte événement
│       └── PresenceModal.svelte  ← Modal liste des présences
```

---

## 1. Page principale `+page.svelte`

```svelte
<!-- src/routes/agenda/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import EventCard from '$lib/components/EventCard.svelte';
    
    let events = [];
    let loading = true;
    let user = null; // null = public, objet = membre connecté
    
    onMount(async () => {
        // Récupérer l'utilisateur connecté (via ton système d'auth)
        try {
            const userRes = await fetch('/api/auth/me');
            if (userRes.ok) {
                user = await userRes.json();
            }
        } catch (e) {
            user = null;
        }
        
        // Récupérer les événements
        const eventsRes = await fetch('/api/events/upcoming');
        events = await eventsRes.json();
        loading = false;
    });
</script>

<svelte:head>
    <title>Événements à venir</title>
</svelte:head>

<div class="container">
    <h1>Événements à venir</h1>
    
    {#if loading}
        <p>Chargement...</p>
    {:else if events.length === 0}
        <p>Aucun événement à venir.</p>
    {:else}
        <div class="events-grid">
            {#each events as event}
                <EventCard 
                    {event}
                    {user}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    
    h1 {
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
    }
    
    .events-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
```

---

## 2. Composant `EventCard.svelte`

```svelte
<!-- src/lib/components/EventCard.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import PresenceModal from './PresenceModal.svelte';
    
    export let event;
    export let user = null;
    
    let userStatut = null; // 'present' | 'absent' | null
    let loading = false;
    let error = null;
    let showPresenceList = false;
    let presences = [];
    
    // Récupérer la réponse de l'utilisateur au montage
    onMount(async () => {
        if (user) {
            try {
                const res = await fetch(`/api/event/${event.id}/my-rsvp`);
                if (res.ok) {
                    const data = await res.json();
                    userStatut = data.statut;
                }
            } catch (e) {
                console.error('Erreur chargement RSVP:', e);
            }
        }
    });
    
    async function handleRsvp(statut) {
        if (!user || event.etat_reel !== 'actif') return;
        
        loading = true;
        error = null;
        
        try {
            const res = await fetch(`/api/event/${event.id}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, statut })
            });
            
            if (res.ok) {
                userStatut = statut;
            } else {
                const data = await res.json();
                error = data.error;
            }
        } catch (e) {
            error = 'Erreur réseau';
        } finally {
            loading = false;
        }
    }
    
    async function openPresenceList() {
        try {
            const res = await fetch(`/api/event/${event.id}/presences`);
            if (res.ok) {
                presences = await res.json();
                showPresenceList = true;
            }
        } catch (e) {
            console.error('Erreur chargement présences:', e);
        }
    }
    
    function closePresenceList() {
        showPresenceList = false;
    }
    
    function getStatusMessage() {
        if (event.etat_reel === 'annule') {
            return 'Cet événement est annulé.';
        }
        if (event.etat_reel === 'clos') {
            if (userStatut === 'present') return 'Tu avais indiqué que tu serais présent.';
            if (userStatut === 'absent') return 'Tu avais indiqué que tu serais absent.';
            return 'Tu n\'as pas répondu pour cet événement.';
        }
        if (userStatut === 'present') return 'Tu as indiqué que tu seras présent.';
        if (userStatut === 'absent') return 'Tu as indiqué que tu seras absent.';
        return 'Tu n\'as pas encore répondu pour cet événement.';
    }
    
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }
</script>

<div class="event-card">
    <div class="card-header">
        <h2 class="event-title">{event.titre}</h2>
    </div>
    
    <div class="card-body">
        {#if event.lieu}
            <div class="event-info">
                <span class="icon">📍</span>
                <span>{event.lieu}</span>
            </div>
        {/if}
        
        <div class="event-info">
            <span class="icon">📅</span>
            <span>{formatDate(event.date_evenement)}</span>
        </div>
        
        {#if user}
            <!-- Section membre : sondage + bouton -->
            <div class="rsvp-section">
                {#if event.etat_reel === 'actif'}
                    <div class="radio-group">
                        <label class="radio-label">
                            <input 
                                type="radio" 
                                name="rsvp-{event.id}" 
                                value="present"
                                checked={userStatut === 'present'}
                                on:change={() => handleRsvp('present')}
                                disabled={loading}
                            />
                            <span class="radio-text">Présent</span>
                        </label>
                        <label class="radio-label">
                            <input 
                                type="radio" 
                                name="rsvp-{event.id}" 
                                value="absent"
                                checked={userStatut === 'absent'}
                                on:change={() => handleRsvp('absent')}
                                disabled={loading}
                            />
                            <span class="radio-text">Absent</span>
                        </label>
                    </div>
                {/if}
                
                <button 
                    class="btn-presences" 
                    on:click={openPresenceList}
                >
                    Voir les présences
                </button>
            </div>
            
            <p class="status-message {userStatut || 'no-response'}">
                {getStatusMessage()}
            </p>
            
            {#if error}
                <p class="error-message">{error}</p>
            {/if}
        {/if}
    </div>
    
    <!-- Modal liste des présences -->
    {#if showPresenceList}
        <PresenceModal 
            {presences}
            eventTitle={event.titre}
            on:close={closePresenceList}
        />
    {/if}
</div>

<style>
    .event-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .card-header {
        margin-bottom: 1rem;
    }
    
    .event-title {
        font-size: 1.25rem;
        color: #2563eb;
        margin: 0;
        text-decoration: none;
    }
    
    .event-title:hover {
        text-decoration: underline;
    }
    
    .event-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        color: #4b5563;
    }
    
    .icon {
        font-size: 1rem;
    }
    
    .rsvp-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }
    
    .radio-group {
        display: flex;
        gap: 1.5rem;
    }
    
    .radio-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .radio-label input[type="radio"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }
    
    .radio-text {
        font-size: 0.95rem;
    }
    
    .btn-presences {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s;
    }
    
    .btn-presences:hover {
        background: #e5e7eb;
    }
    
    .status-message {
        margin-top: 0.75rem;
        font-size: 0.9rem;
        font-style: italic;
        color: #6b7280;
    }
    
    .status-message.present {
        color: #059669;
    }
    
    .status-message.absent {
        color: #dc2626;
    }
    
    .error-message {
        color: #dc2626;
        font-size: 0.85rem;
        margin-top: 0.5rem;
    }
</style>
```

---

## 3. Composant `PresenceModal.svelte`

```svelte
<!-- src/lib/components/PresenceModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let presences = [];
    export let eventTitle = '';
    
    const dispatch = createEventDispatcher();
    
    function close() {
        dispatch('close');
    }
    
    function handleClickOutside(event) {
        if (event.target === event.currentTarget) {
            close();
        }
    }
    
    function getStatutLabel(statut) {
        return statut === 'present' ? 'Présent' : 'Absent';
    }
    
    function getStatutClass(statut) {
        return statut === 'present' ? 'statut-present' : 'statut-absent';
    }
</script>

<div class="modal-overlay" on:click={handleClickOutside}>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Présences - {eventTitle}</h3>
            <button class="btn-close" on:click={close}>✕</button>
        </div>
        
        <div class="modal-body">
            {#if presences.length === 0}
                <p class="empty-message">Aucune réponse pour le moment.</p>
            {:else}
                <div class="stats">
                    <span class="stat-present">
                        {presences.filter(p => p.statut === 'present').length} présent(s)
                    </span>
                    <span class="stat-absent">
                        {presences.filter(p => p.statut === 'absent').length} absent(s)
                    </span>
                </div>
                
                <ul class="presence-list">
                    {#each presences as presence}
                        <li class="presence-item">
                            <span class="member-name">{presence.nom}</span>
                            <span class="statut-badge {getStatutClass(presence.statut)}">
                                {getStatutLabel(presence.statut)}
                            </span>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }
    
    .modal-content {
        background: white;
        border-radius: 8px;
        max-width: 500px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
    }
    
    .btn-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #6b7280;
    }
    
    .btn-close:hover {
        color: #1f2937;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }
    
    .stat-present {
        color: #059669;
        font-weight: 600;
    }
    
    .stat-absent {
        color: #dc2626;
        font-weight: 600;
    }
    
    .presence-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .presence-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f3f4f6;
    }
    
    .presence-item:last-child {
        border-bottom: none;
    }
    
    .member-name {
        font-weight: 500;
    }
    
    .statut-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    .statut-present {
        background: #d1fae5;
        color: #065f46;
    }
    
    .statut-absent {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .empty-message {
        text-align: center;
        color: #6b7280;
        font-style: italic;
    }
</style>
```

---

## 4. Endpoints API manquants

Tu auras besoin de ces 3 endpoints supplémentaires :

### `GET /api/events/upcoming` - Liste des événements

```typescript
// src/routes/api/events/upcoming/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
    const events = await db`
        SELECT 
            id,
            titre,
            lieu,
            date_evenement,
            statut,
            CASE 
                WHEN statut = 'annule' THEN 'annule'
                WHEN date_evenement < (now() AT TIME ZONE 'Europe/Paris')::date THEN 'clos'
                ELSE 'actif'
            END as etat_reel
        FROM agenda
        WHERE date_evenement >=
              (now() AT TIME ZONE 'Europe/Paris')::date - 7
        ORDER BY date_evenement ASC
    `;
    
    return json(events);
};
```

### `GET /api/event/[id]/my-rsvp` - Réponse de l'utilisateur

```typescript
// src/routes/api/event/[id]/my-rsvp/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
    const eventId = params.id;
    const userId = locals.user?.id; // À adapter selon ton système d'auth
    
    if (!userId) {
        return json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    const result = await db`
        SELECT statut 
        FROM agenda_presence 
        WHERE agenda_id = ${eventId} AND user_id = ${userId}
    `;
    
    if (result.length === 0) {
        return json({ statut: null });
    }
    
    return json(result[0]);
};
```

### `GET /api/event/[id]/presences` - Liste des présences

```typescript
// src/routes/api/event/[id]/presences/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
    const eventId = params.id;
    
    const presences = await db`
        SELECT 
            u.id,
            u.nom,
            u.email,
            ap.statut,
            ap.updated_at
        FROM agenda_presence ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.agenda_id = ${eventId}
        ORDER BY u.nom ASC
    `;
    
    return json(presences);
};
```

---

## Résumé du comportement

| État | Affichage |
|------|-----------|
| **Public (non connecté)** | Titre, lieu, date uniquement (Image 3) |
| **Membre sans réponse** | + Radio buttons + "Tu n'as pas encore répondu" (Image 1) |
| **Membre avec réponse** | + Radio button coché + "Tu as indiqué que tu seras présent/absent" (Image 2) |
| **Événement clos** | Radio buttons désactivés, message au passé |
| **Événement annulé** | Radio buttons désactivés, message "annulé" |

Le bouton **"Voir les présences"** ouvre un modal avec la liste de tous les membres et leur statut.

Tu veux que j'ajuste quelque chose (design, comportement, gestion de l'auth) ?
