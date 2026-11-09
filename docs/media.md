# Documentation : Gestion des Médias

## 📋 Vue d'ensemble

Ce document décrit l'architecture et les règles métier pour la gestion des médias (photos) dans l'application, avec stockage sur Cloudflare R2, optimisation à la volée via Cloudflare Image Resizing, et suivi du quota dans Neon.

> **Décision Q-2026-11-08-02 :** un seul quota global (une ligne `storage_usage`, buckets additionnés), colonnes en `bigint`, avec `quota_bytes`, `alert_threshold_bytes`, `block_threshold_bytes` et `last_sync_at`.
>
> **Décision Q-2026-11-08-03 :** option B — R2 + **Cloudflare Image Resizing** à la volée sur un domaine public. Aucune image n'est téléversée dans Cloudflare Images ; une seule version est stockée dans R2.
>
> **Décision Q-2026-11-08-04 :** les bindings R2 s'appellent `R2_PUBLIC` et `R2_PRIVATE` ; les objets privés sont servis par `/api/files/[...key]` après contrôle serveur, sans URL signée.

---

## 🏗️ Architecture Technique

### Stack

- **Frontend** : SvelteKit 5 avec Runes (`$state`, `$derived`, `$props`)
- **ORM** : Drizzle ORM
- **Base de données** : Neon (PostgreSQL) avec Hyperdrive pour la mise en pool
- **Stockage** : Cloudflare R2 (2 buckets : `bagad-public` et `bagad-private`, bindings `R2_PUBLIC` / `R2_PRIVATE`)
- **Optimisation images** : Cloudflare Image Resizing à la volée (aucun stockage d'images chez Cloudflare Images)
- **Authentification** : Better Auth (cookies HTTP-only, sessions sécurisées)
- **Déploiement** : Cloudflare Pages Functions

### Buckets R2

| Bucket          | Contenu                             | Quota                |
| --------------- | ----------------------------------- | -------------------- |
| `bagad-public`  | Médias publiés, photos d'événements | Quota global partagé |
| `bagad-private` | Profils, documents, albums privés   | Quota global partagé |

**Capacité opérationnelle globale** : 8 Go (les deux buckets sont additionnés dans le même quota).

---

## 📐 Règles Métier

### 1. Quota de Stockage

| Seuil       | Action                                              |
| ----------- | --------------------------------------------------- |
| < 7 Go      | Fonctionnement normal                               |
| 7 Go - 8 Go | ⚠️ Alerte administrateur (affichage visuel orange)  |
| ≥ 8 Go      | 🚫 Blocage des nouveaux téléversements côté serveur |

**Table `storage_usage` dans Neon (ligne unique, quota global)** :

- `public_bytes` : Volume réellement utilisé dans le bucket public
- `private_bytes` : Volume réellement utilisé dans le bucket privé
- `reserved_bytes` : Volume réservé pour les uploads en cours (tous buckets)
- `quota_bytes` : Limite autorisée (8 Go)
- `alert_threshold_bytes` : Seuil d'alerte (7 Go)
- `block_threshold_bytes` : Seuil de blocage (8 Go)
- `last_sync_at` : Dernière synchronisation avec R2
- `updated_at` : Dernière mise à jour

`used_bytes` désigne partout dans ce document la somme `public_bytes + private_bytes`.
Toutes les colonnes d'octets sont en `bigint` (un `integer` déborde dès 2 Go).

### 2. Règles de Transformation d'Images

**Objectif** : Produire toujours le même résultat, indépendamment du fichier source.

| Paramètre                      | Valeur                                          |
| ------------------------------ | ----------------------------------------------- |
| Format de sortie               | WebP                                            |
| Dimensions maximales           | 2000 × 2000 pixels (avec conservation du ratio) |
| Qualité                        | 82%                                             |
| Métadonnées                    | Supprimées (strip metadata)                     |
| Taille maximale en entrée      | 15 Mo                                           |
| Dimensions maximales en entrée | 6000 × 6000 pixels                              |
| Types acceptés                 | JPG/JPEG, PNG, WebP                             |
| Vidéos                         | ❌ Refusées                                     |

**Exemples de transformation** :

- Photo paysage 6000 × 4000 → WebP 2000 × 1333
- Photo portrait 3000 × 4500 → WebP 1333 × 2000
- Photo carrée 4000 × 4000 → WebP 2000 × 2000

### 3. Validation des Fichiers

Avant tout traitement, le fichier doit passer ces vérifications :

1. **Type MIME** : Doit être `image/jpeg`, `image/png`, ou `image/webp`
2. **Magic Numbers** : Vérification des premiers octets du fichier pour éviter les fichiers malveillants déguisés
3. **Taille** : Maximum 15 Mo
4. **Dimensions** : Maximum 6000 × 6000 pixels (après lecture des métadonnées)

---

## 🔄 Flux d'Upload Détaillé

### Étape 1 : Validation côté client

- Vérification du type et de la taille avant envoi
- Affichage d'un message d'erreur si non conforme

### Étape 2 : Réservation du quota (transaction atomique)

```
1. Le serveur reçoit la requête d'upload
2. Il demande à Neon l'autorisation via la fonction `reserve_storage()`
3. Neon vérifie : used_bytes + reserved_bytes + taille_estimée ≤ block_threshold
4. Si OK → Neon réserve le volume (reserved_bytes += taille_estimée)
5. Si KO → Retour d'erreur "Quota dépassé"
```

**Pourquoi une réservation ?**  
Évite les race conditions : si deux admins uploadent en même temps et que le quota est à 7.9 Go, la réservation garantit qu'on ne dépasse pas 8 Go.

### Étape 3 : Upload direct dans R2

- Le fichier validé est uploadé directement dans son bucket définitif :
  - `public/events/{event_id}/{uuid}.{ext}` (bucket `R2_PUBLIC`)
  - `private/events/{event_id}/{uuid}.{ext}` (bucket `R2_PRIVATE`)
- Aucun fichier temporaire et aucun passage par Cloudflare Images : la décision Q-2026-11-08-03 retient R2 + Image Resizing à la volée.
- Le type MIME et les dimensions sont vérifiés côté serveur avant l'écriture ; les fichiers non conformes sont refusés.

### Étape 4 : Transformation à la volée (à l'affichage uniquement)

- Aucune variante n'est stockée : les URLs d'affichage sont construites à la demande (voir « Stratégie d'affichage »).
- Pour les images publiques, Cloudflare Image Resizing produit le WebP 2000×2000 q82 et la vignette 400×400, avec suppression des métadonnées.
- Les images privées ne passent pas par le domaine public : elles sont servies par `/api/files/[...key]` après guard, donc sans redimensionnement edge.

### Étape 5 : Enregistrement dans Neon

- Insertion dans la table `media` avec les métadonnées :
  - `id`, `event_id`, `bucket_name`, `r2_key`, `original_name`, `mime_type`
  - `size_bytes`, `width`, `height`
  - `is_public`, `upload_status` ('completed')

### Étape 6 : Finalisation du quota

- Appel à `finalize_upload()` :
  - `public_bytes` ou `private_bytes` += taille réelle du fichier
  - `reserved_bytes` -= taille estimée
  - Mise à jour de `last_sync_at`

### Gestion des erreurs (Rollback)

Si une erreur survient à n'importe quelle étape :

1. Libération de la réservation (`release_reservation()`)
2. Suppression des fichiers temporaires dans R2
3. Retour d'un message d'erreur à l'utilisateur

---

## 🗄️ Structure des Données (Drizzle)

### Table `storage_usage` (une seule ligne globale)

```typescript
// Schéma Drizzle cible (décision Q-2026-11-08-02)
export const storageUsage = pgTable('storage_usage', {
	id: uuid('id').primaryKey().defaultRandom(),
	public_bytes: bigint('public_bytes', { mode: 'number' }).notNull().default(0),
	private_bytes: bigint('private_bytes', { mode: 'number' }).notNull().default(0),
	reserved_bytes: bigint('reserved_bytes', { mode: 'number' }).notNull().default(0),
	quota_bytes: bigint('quota_bytes', { mode: 'number' }).notNull().default(8_589_934_592),
	alert_threshold_bytes: bigint('alert_threshold_bytes', { mode: 'number' })
		.notNull()
		.default(7_516_192_768),
	block_threshold_bytes: bigint('block_threshold_bytes', { mode: 'number' })
		.notNull()
		.default(8_589_934_592),
	last_sync_at: timestamp('last_sync_at', { withTimezone: true }),
	updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
```

### Table `media` (alignée sur `src/lib/db/schema.ts`)

```typescript
export const media = pgTable('media', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: varchar('title', { length: 200 }).notNull(),
	description: text('description'),
	file_key: varchar('file_key', { length: 500 }).notNull().unique(),
	bucket: varchar('bucket', { length: 50 }).notNull(), // 'R2_PUBLIC' | 'R2_PRIVATE'
	mime_type: varchar('mime_type', { length: 100 }).notNull(),
	size: integer('size').notNull(), // un fichier ≤ 20 Mo tient dans un integer
	album_id: uuid('album_id').references(() => albums.id, { onDelete: 'set null' }),
	uploaded_by: uuid('uploaded_by')
		.notNull()
		.references(() => profiles.id, { onDelete: 'restrict' }),
	created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
```

### Table `events` (référence)

```typescript
export const events = pgTable('events', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	eventDate: date('event_date'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
```

---

## 🔒 Sécurité

### 1. Authentification

- **Better Auth** gère les sessions via des cookies HTTP-only sécurisés
- Middleware dans `src/hooks.server.ts` pour intercepter chaque requête
- Vérification du rôle `admin` pour les routes de gestion

### 2. Validation des fichiers

- **Magic Numbers** : Vérification des signatures hexadécimales des premiers octets
  - JPEG : `ffd8ff`
  - PNG : `89504e47`
  - WebP : `52494646`
- Empêche l'upload de scripts malveillants déguisés en images

### 3. Nommage des fichiers

- Utilisation d'un UUID pour éviter les collisions
- Structure : `{public|private}/events/{event_id}/{uuid}.webp`

### 4. URLs publiques

- **Bucket public** : Domaine R2 public (ex: `pub-xxx.r2.dev`) ou domaine personnalisé
- **Bucket privé** : URLs signées générées à la volée par SvelteKit

---

## 🔄 Synchronisation R2 ↔ Neon

### Pourquoi synchroniser ?

Neon est le compteur opérationnel (rapide, transactionnel), mais R2 reste la source de vérité physique. Des écarts peuvent apparaître (échecs de rollback, bugs, etc.).

### Mécanisme de synchronisation

**Scheduled Worker Cloudflare** (cron : tous les jours à minuit UTC)

1. Liste tous les objets de chaque bucket via l'API R2
2. Calcule la taille réelle totale
3. Compare avec `used_bytes` dans Neon
4. Si écart > 1% → Correction automatique dans Neon
5. Mise à jour de `last_sync_at`

### Route API manuelle (optionnel)

- `POST /api/sync-storage` pour déclencher une synchronisation manuelle
- Protégée par authentification admin

---

## 🎨 Interface Utilisateur

### Galerie publique (`/media`)

- Grille responsive (1 à 4 colonnes selon la taille d'écran)
- Lazy loading des images
- Filtre par événement
- Lightbox pour affichage en plein écran
- Affichage des métadonnées au survol (nom, événement)

### Interface administrateur (`/media/admin`)

- **Tableau de bord quota** :
  - Barre de progression colorée (vert → jaune → orange → rouge)
  - Indicateurs : Images stockées, Volume utilisé, Volume réservé, Espace disponible
  - Alerte visuelle à 7 Go (orange)
  - Blocage visuel à 8 Go (rouge)

- **Formulaire d'upload** :
  - Sélection d'événement (optionnel)
  - Input fichier avec validation côté client
  - Checkbox "Image publique"
  - Bouton désactivé si quota bloqué

- **Liste des médias** :
  - Grille de vignettes
  - Informations : nom, événement, taille, visibilité
  - Bouton de suppression avec confirmation

---

## 📊 Indicateurs et Alertes

### Niveaux d'alerte

| Niveau     | Condition                       | Couleur | Action                |
| ---------- | ------------------------------- | ------- | --------------------- |
| `ok`       | < 80% du seuil d'alerte         | Vert    | Aucune                |
| `warning`  | 80% - 100% du seuil d'alerte    | Jaune   | Surveillance          |
| `critical` | Seuil d'alerte atteint (7 Go)   | Orange  | Alerte administrateur |
| `blocked`  | Seuil de blocage atteint (8 Go) | Rouge   | Uploads bloqués       |

### Calcul du pourcentage

```
used_bytes = public_bytes + private_bytes
usage_percentage = (used_bytes / quota_bytes) * 100
```

### Espace disponible

```
available_bytes = block_threshold_bytes - (public_bytes + private_bytes) - reserved_bytes
```

---

## ⚙️ Configuration Cloudflare

### wrangler.toml

```toml
name = "your-app-name"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "R2_PUBLIC"
bucket_name = "bagad-public"

[[r2_buckets]]
binding = "R2_PRIVATE"
bucket_name = "bagad-private"

[triggers]
crons = ["0 0 * * *"]  # Synchronisation quotidienne
```

### Variables d'environnement

- `DATABASE_URL` : chaîne de connexion Neon (avec Hyperdrive)
- `BETTER_AUTH_SECRET` : Clé secrète pour Better Auth
- `R2_PUBLIC_DOMAIN` : Domaine public R2 pour les images publiques (ex: `pub-xxx.r2.dev` ou domaine personnalisé)
- `R2_ACCOUNT_ID` : Identifiant de compte Cloudflare (si Image Resizing est activé via compte)
- `IMAGES_ACCOUNT_HASH` : **supprimé** — Cloudflare Images n'est plus utilisé (Q-2026-11-08-03)

---

## 🚀 Considérations de Performance

### 1. Cloudflare Image Resizing (à la volée)

- Une seule version de l'image est stockée dans R2 ; aucune transformation n'est stockée.
- Les variantes 400×400 et 2000×2000 sont générées à la demande et mises en cache par le CDN.
- Aucune consommation du quota Cloudflare Images (service non utilisé, Q-2026-11-08-03).
- Le plan Cloudflare doit autoriser Image Resizing sur le domaine public R2.

### 2. Hyperdrive (Neon)

- Mise en pool des connexions pour réduire la latence
- Cache des requêtes fréquentes (liste des médias, stats quota)

### 3. R2

- Pas de frais d'egress (sortie) pour les images servies via Cloudflare CDN
- Latence faible grâce à la distribution edge de Cloudflare

### 4. SvelteKit

- Server-side rendering pour la galerie publique (SEO)
- Client-side navigation pour l'interface admin (UX fluide)
- Runes pour une réactivité fine sans re-renders inutiles

---

## 🧪 Scénarios de Test

### Upload normal

1. Admin upload une image JPG de 5 Mo
2. Réservation de ~7.5 Mo (estimation)
3. Le fichier validé est stocké tel quel dans R2 (aucune variante stockée)
4. Finalisation : `public_bytes` += 5 Mo, `reserved_bytes` -= 7.5 Mo
5. Affichage dans la galerie via une URL Image Resizing

### Quota atteint

1. `public_bytes + private_bytes` = 7.9 Go
2. Admin tente d'uploader une image de 5 Mo
3. Réservation refusée (7.9 + 0.005 > 8)
4. Message d'erreur : "Quota dépassé"

### Race condition

1. used_bytes = 7.95 Go
2. Admin A et Admin B uploadent simultanément (5 Mo chacun)
3. Admin A : réservation acceptée (7.95 + 0.005 = 7.955 < 8)
4. Admin B : réservation refusée (7.955 + 0.005 = 7.96 > 8)
5. Seul Admin A peut uploader

### Synchronisation

1. Neon indique 6.8 Go
2. R2 contient réellement 6.9 Go (écart de 100 Mo)
3. Worker scheduled détecte l'écart (> 1%)
4. Correction : `public_bytes` / `private_bytes` réalignés sur R2 (total 6.9 Go)
5. `last_sync_at` mis à jour

---

## 📝 Notes Importantes

1. **Image Resizing vs R2** : Cloudflare Image Resizing transforme les images à la volée ; il ne stocke rien. Les images restent dans R2 (Q-2026-11-08-03).

2. **Limites de Cloudflare Workers** : 128 Mo de mémoire (plan Free). Aucune image n'est décodée dans le Worker : le fichier est stocké tel quel et les variantes sont produites par Image Resizing.

3. **Transactions atomiques** : La réservation de quota utilise `FOR UPDATE` dans PostgreSQL pour verrouiller la ligne unique `storage_usage` et éviter les race conditions.

4. **Rollback** : En cas d'erreur, toujours libérer la réservation et supprimer l'objet R2 déjà écrit.

5. **Monitoring** : Prévoir des logs pour tracer les uploads, les erreurs, et les synchronisations.

6. **Objets privés** : jamais exposés par le domaine public R2 ; servis uniquement par `/api/files/[...key]` après contrôle de session et de visibilité (Q-2026-11-08-04).

---

## 🖼️ Stratégie d'Affichage et Thumbnails (Cloudflare Image Resizing à la volée)

Pour optimiser les performances, la bande passante et le stockage, l'application ne stocke aucun thumbnail physique. Elle s'appuie sur **Cloudflare Image Resizing**, activé sur le domaine public des images (Q-2026-11-08-03).

### Principe

L'image est stockée une seule fois dans R2. À l'affichage, Cloudflare génère et met en cache dynamiquement la taille demandée via l'URL `/cdn-cgi/image/<options>/<chemin>`.

### Tailles définies

| Contexte      | Dimensions     | Qualité | Fit (Ajustement)           | Usage                                                     |
| ------------- | -------------- | ------- | -------------------------- | --------------------------------------------------------- |
| **Thumbnail** | 400 × 400 px   | 75%     | `cover` (crop centré)      | Grille de la galerie publique, liste de l'interface admin |
| **Full**      | 2000 × 2000 px | 82%     | `contain` (ratio respecté) | Lightbox, vue détaillée au clic                           |

### Avantages de cette approche

- **Zéro stockage supplémentaire** : une seule version est conservée dans R2, ce qui préserve le quota strict de 8 Go.
- **Bande passante optimisée** : une vignette de 400 px pèse environ 30 à 50 Ko, contre 1 à 3 Mo pour l'image complète.
- **Mise en cache automatique** : une fois générée par Cloudflare, la vignette est servie instantanément depuis le CDN Edge.

### Coût / quota

- Image Resizing est facturé au compte Cloudflare selon l'offre ; aucune « transformation unique » Cloudflare Images n'est consommée.
- Le format de sortie est forcé en WebP (`format=webp`), les métadonnées sont supprimées par le redimensionneur.

### Exemple d'implémentation (URL)

Vignette pour la grille (bucket public) :

```
https://{R2_PUBLIC_DOMAIN}/cdn-cgi/image/width=400,height=400,fit=cover,quality=75,format=webp/public/events/{event_id}/{uuid}.jpg
```

Image complète pour la lightbox :

```
https://{R2_PUBLIC_DOMAIN}/cdn-cgi/image/width=2000,height=2000,fit=contain,quality=82,format=webp/public/events/{event_id}/{uuid}.jpg
```

> Les images **privées** ne passent pas par `/cdn-cgi/image` : elles sont servies par `/api/files/[...key]` après guard, sans transformation edge.

---

## 🔮 Évolutions Possibles

- **Upload en plusieurs parties** : Pour les fichiers > 15 Mo (si besoin futur)
- **Versions d'images** : Conserver l'original + plusieurs tailles (thumbnail, medium, large)
- **Tags et catégories** : Organisation avancée des médias
- **Recherche** : Filtrage par nom, date, événement
- **Export** : Téléchargement groupé d'images
- **Analytics** : Statistiques d'utilisation (images les plus vues, etc.)

---

## 📚 Références

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Images Documentation](https://developers.cloudflare.com/images/)
- [Cloudflare Image Resizing Documentation](https://developers.cloudflare.com/images/image-resizing/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [SvelteKit 5 Documentation](https://kit.svelte.dev/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Neon Documentation](https://neon.tech/docs)
