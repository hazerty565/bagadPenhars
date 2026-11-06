# Documentation : Gestion des Médias

## 📋 Vue d'ensemble

Ce document décrit l'architecture et les règles métier pour la gestion des médias (photos) dans l'application, avec stockage sur Cloudflare R2, optimisation via Cloudflare Images, et suivi du quota dans Neon.

---

## 🏗️ Architecture Technique

### Stack
- **Frontend** : SvelteKit 5 avec Runes (`$state`, `$derived`, `$props`)
- **ORM** : Drizzle ORM
- **Base de données** : Neon (PostgreSQL) avec Hyperdrive pour la mise en pool
- **Stockage** : Cloudflare R2 (2 buckets : `bagad-public` et `bagad-private`)
- **Optimisation images** : Cloudflare Images (plan Free : 5 000 transformations/mois)
- **Authentification** : Better Auth (cookies HTTP-only, sessions sécurisées)
- **Déploiement** : Cloudflare Pages Functions

### Buckets R2
| Bucket | Contenu | Quota |
|--------|---------|-------|
| `bagad-public` | Médias publiés, photos d'événements | 10 Go (partagé) |
| `bagad-private` | Profils, documents, albums privés | 10 Go (partagé) |

**Capacité opérationnelle globale** : 10 Go (les deux buckets sont additionnés dans le même quota).

---

## 📐 Règles Métier

### 1. Quota de Stockage

| Seuil | Action |
|-------|--------|
| < 7 Go | Fonctionnement normal |
| 7 Go - 8 Go | ⚠️ Alerte administrateur (affichage visuel orange) |
| ≥ 8 Go | 🚫 Blocage des nouveaux téléversements côté serveur |

**Table `storage_usage` dans Neon** :
- `bucket_name` : Bucket concerné
- `used_bytes` : Volume réellement utilisé
- `reserved_bytes` : Volume réservé pour les uploads en cours
- `quota_bytes` : Limite autorisée (10 Go)
- `alert_threshold_bytes` : Seuil d'alerte (7 Go)
- `block_threshold_bytes` : Seuil de blocage (8 Go)
- `last_sync_at` : Dernière synchronisation avec R2
- `updated_at` : Dernière mise à jour

### 2. Règles de Transformation d'Images

**Objectif** : Produire toujours le même résultat, indépendamment du fichier source.

| Paramètre | Valeur |
|-----------|--------|
| Format de sortie | WebP |
| Dimensions maximales | 2000 × 2000 pixels (avec conservation du ratio) |
| Qualité | 82% |
| Métadonnées | Supprimées (strip metadata) |
| Taille maximale en entrée | 15 Mo |
| Dimensions maximales en entrée | 6000 × 6000 pixels |
| Types acceptés | JPG/JPEG, PNG, WebP |
| Vidéos | ❌ Refusées |

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

### Étape 3 : Upload temporaire dans R2
- Le fichier original est uploadé dans `bagad-public/temp/{timestamp}-{nom_fichier}`
- L'URL publique temporaire est utilisée pour Cloudflare Images

### Étape 4 : Transformation via Cloudflare Images
- Appel à `cf.images.fetch()` avec les paramètres :
  - `w=2000&h=2000&fit=contain&format=webp&quality=82&metadata=none`
- Récupération de l'image optimisée

### Étape 5 : Upload final dans R2
- L'image WebP optimisée est stockée dans :
  - `public/events/{event_id}/{uuid}.webp` (si public)
  - `private/events/{event_id}/{uuid}.webp` (si privé)

### Étape 6 : Nettoyage
- Suppression du fichier temporaire dans `bagad-public/temp/`

### Étape 7 : Enregistrement dans Neon
- Insertion dans la table `media` avec les métadonnées :
  - `id`, `event_id`, `bucket_name`, `r2_key`, `original_name`, `mime_type`
  - `original_size_bytes`, `optimized_size_bytes`, `width`, `height`
  - `is_public`, `upload_status` ('completed')

### Étape 8 : Finalisation du quota
- Appel à `finalize_upload()` :
  - `used_bytes += taille_réelle_du_webp`
  - `reserved_bytes -= taille_estimée`
  - Mise à jour de `last_sync_at`

### Gestion des erreurs (Rollback)
Si une erreur survient à n'importe quelle étape :
1. Libération de la réservation (`release_reservation()`)
2. Suppression des fichiers temporaires dans R2
3. Retour d'un message d'erreur à l'utilisateur

---

## 🗄️ Structure des Données (Drizzle)

### Table `storage_usage`
```typescript
// Schéma conceptuel Drizzle
export const storageUsage = pgTable('storage_usage', {
  id: serial('id').primaryKey(),
  bucketName: varchar('bucket_name', { length: 50 }).notNull().unique(),
  usedBytes: bigint('used_bytes', { mode: 'number' }).notNull().default(0),
  reservedBytes: bigint('reserved_bytes', { mode: 'number' }).notNull().default(0),
  quotaBytes: bigint('quota_bytes', { mode: 'number' }).notNull(),
  alertThresholdBytes: bigint('alert_threshold_bytes', { mode: 'number' }).notNull(),
  blockThresholdBytes: bigint('block_threshold_bytes', { mode: 'number' }).notNull(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

### Table `media`
```typescript
export const media = pgTable('media', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
  bucketName: varchar('bucket_name', { length: 50 }).notNull(),
  r2Key: varchar('r2_key', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  originalSizeBytes: bigint('original_size_bytes', { mode: 'number' }).notNull(),
  optimizedSizeBytes: bigint('optimized_size_bytes', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  isPublic: boolean('is_public').default(false),
  uploadStatus: varchar('upload_status', { length: 20 }).default('processing'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
| Niveau | Condition | Couleur | Action |
|--------|-----------|---------|--------|
| `ok` | < 80% du seuil d'alerte | Vert | Aucune |
| `warning` | 80% - 100% du seuil d'alerte | Jaune | Surveillance |
| `critical` | Seuil d'alerte atteint (7 Go) | Orange | Alerte administrateur |
| `blocked` | Seuil de blocage atteint (8 Go) | Rouge | Uploads bloqués |

### Calcul du pourcentage
```
usage_percentage = (used_bytes / quota_bytes) * 100
```

### Espace disponible
```
available_bytes = block_threshold_bytes - used_bytes - reserved_bytes
```

---

## ⚙️ Configuration Cloudflare

### wrangler.toml
```toml
name = "your-app-name"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "R2_BUCKET_PUBLIC"
bucket_name = "bagad-public"

[[r2_buckets]]
binding = "R2_BUCKET_PRIVATE"
bucket_name = "bagad-private"

[triggers]
crons = ["0 0 * * *"]  # Synchronisation quotidienne
```

### Variables d'environnement
- `DATABASE_URL` : URL de connexion Neon (avec Hyperdrive)
- `CF_ACCOUNT_HASH` : Hash du compte Cloudflare Images
- `BETTER_AUTH_SECRET` : Clé secrète pour Better Auth
- `R2_PUBLIC_DOMAIN` : Domaine public R2 (ex: `pub-xxx.r2.dev`)

---

## 🚀 Considérations de Performance

### 1. Cloudflare Images
- Plan Free : 5 000 transformations uniques/mois
- Une "transformation unique" = une combinaison unique de paramètres (dimensions, format, qualité)
- Comme on utilise toujours les mêmes paramètres (2000x2000, WebP, qualité 82), on consomme 1 transformation unique par image uploadée
- **Limite** : 5 000 uploads/mois maximum avec le plan Free

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
3. Transformation en WebP ~2 Mo
4. Finalisation : used_bytes += 2 Mo, reserved_bytes -= 7.5 Mo
5. Affichage dans la galerie

### Quota atteint
1. used_bytes = 7.9 Go
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
4. Correction : used_bytes = 6.9 Go
5. last_sync_at mis à jour

---

## 📝 Notes Importantes

1. **Cloudflare Images vs R2** : Cloudflare Images ne stocke pas les images, il les transforme à la volée. Les images restent dans R2.

2. **Limites de Cloudflare Workers** : 128 Mo de mémoire (plan Free). Le traitement d'images lourdes (> 15 Mo) peut poser problème si fait directement dans le Worker. D'où l'utilisation de Cloudflare Images.

3. **Transactions atomiques** : La réservation de quota utilise `FOR UPDATE` dans PostgreSQL pour verrouiller la ligne et éviter les race conditions.

4. **Rollback** : En cas d'erreur, toujours libérer la réservation et supprimer les fichiers temporaires.

5. **Monitoring** : Prévoir des logs pour tracer les uploads, les erreurs, et les synchronisations.

---
## 🖼️ Stratégie d'Affichage et Thumbnails (Cloudflare Images à la volée)

Pour optimiser les performances, la bande passante et le stockage, l'application n'utilise ni de thumbnails physiques stockés dans R2, ni un simple redimensionnement CSS. Elle s'appuie sur **Cloudflare Images à la volée**.

### Principe
L'image WebP optimisée (max 2000x2000) est stockée une seule fois dans R2. Lors de l'affichage sur le site, Cloudflare génère et met en cache dynamiquement les différentes tailles nécessaires directement via des paramètres d'URL.

### Tailles définies

| Contexte | Dimensions | Qualité | Fit (Ajustement) | Usage |
|----------|------------|---------|------------------|-------|
| **Thumbnail** | 400 × 400 px | 75% | `cover` (crop centré) | Grille de la galerie publique, liste de l'interface admin |
| **Full** | 2000 × 2000 px | 82% | `contain` (ratio respecté) | Lightbox, vue détaillée au clic |

### Avantages de cette approche
- **Zéro stockage supplémentaire** : Une seule version de l'image est conservée dans R2, ce qui préserve le quota strict de 10 Go.
- **Bande passante optimisée** : Une thumbnail de 400px pèse environ 30 à 50 Ko, contre 1 à 3 Mo pour l'image complète.
- **Mise en cache automatique** : Une fois générée par Cloudflare, la thumbnail est servie instantanément depuis le CDN Edge.

### Impact sur le quota Cloudflare Images (Plan Free)
- Le plan Free inclut **5 000 transformations uniques par mois**.
- Une "transformation unique" est définie par une combinaison unique de paramètres (URL de base + dimensions + qualité).
- Puisque l'application utilise toujours les mêmes paramètres stricts pour les thumbnails (`w=400&h=400&fit=cover`) et pour les images pleines (`w=2000&h=2000&fit=contain`), cela ne consomme que **2 transformations uniques** au total, peu importe le nombre d'images uploadées ou de pages vues.

### Exemple d'implémentation (URL)

Thumbnail pour la grille
https://imagedelivery.net/{CF_ACCOUNT_HASH}/{r2_key}/w=400,h=400,fit=cover,quality=75
Image complète pour la lightbox
https://imagedelivery.net/{CF_ACCOUNT_HASH}/{r2_key}/w=2000,h=2000,fit=contain,quality=82
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
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [SvelteKit 5 Documentation](https://kit.svelte.dev/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [Neon Documentation](https://neon.tech/docs)
