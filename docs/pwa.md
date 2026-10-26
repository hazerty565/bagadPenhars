# PWA : manifest, service worker, notifications

> Tout changement du manifest, du service worker ou des en-têtes de cache est consigné ici.

## 1. Objectif

Rendre le site installable sur l'écran d'accueil (surtout sur téléphone), afficher une page propre sans réseau, et recevoir les notifications OneSignal.

Hors objectif : un mode hors-ligne complet. Les données de l'espace adhérents nécessitent le réseau.

## 2. Fichiers

| Fichier | Rôle |
|---|---|
| `static/manifest.webmanifest` | Nom, couleurs, icônes |
| `static/icons/` | Icônes 192, 512, maskable 512, `apple-touch-icon` 180 |
| `src/service-worker.ts` | Cache des fichiers statiques et page hors-ligne |
| `src/app.html` | Liens vers le manifest, `theme-color`, icône iOS |
| `src/routes/offline/+page.svelte` | Page affichée sans réseau (prérendue) |
| `netlify.toml` | En-têtes de cache du service worker et du manifest |

## 3. Manifest

```json
{
  "name": "Bagad Penhars",
  "short_name": "Bagad",
  "lang": "fr",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Les couleurs sont à remplacer par celles du thème du site.

Dans `src/app.html` :

```html
<link rel="manifest" href="%sveltekit.assets%/manifest.webmanifest" />
<meta name="theme-color" content="#000000" />
<link rel="apple-touch-icon" href="%sveltekit.assets%/icons/apple-touch-icon.png" />
```

## 4. Service worker

### Règles de cache

| Requête | Stratégie |
|---|---|
| Fichiers du build et `static/` (même origine) | Cache d'abord |
| Navigation (pages HTML) | **Réseau uniquement**, repli sur `/offline` si coupure |
| Autre origine (Supabase, OneSignal) | **Jamais interceptée** |
| Méthodes autres que GET | Jamais interceptées |

Pourquoi : les URL de l'espace adhérents ne sont pas préfixées (un groupe de routes `(app)` n'apparaît pas dans l'URL). Mettre les pages HTML en cache risquerait de montrer des données privées à quelqu'un de déconnecté. Seuls les fichiers statiques sont donc mis en cache.

### Squelette

```ts
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files, '/offline'];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== sw.location.origin) return; // Supabase, OneSignal : jamais touchés

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match('/offline')) ?? Response.error())
    );
    return;
  }

  if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((cached) => cached ?? fetch(req)));
  }
});
```

La page `/offline` doit être prérendue (`export const prerender = true` dans son `+page.ts`) pour exister dans le cache.

## 5. Cohabitation avec OneSignal

**Décision ouverte, à valider avant d'implémenter.**

OneSignal fournit son propre service worker (`OneSignalSDKWorker.js`). Deux service workers ne peuvent pas partager la même portée. Deux pistes :

- **A.** Charger le SDK OneSignal depuis notre `service-worker.ts` avec `importScripts`. Attention : `importScripts` n'existe pas dans un worker de type module, et SvelteKit enregistre le worker en module en développement. À tester en dev **et** en production.
- **B.** Utiliser le worker OneSignal seul et y mettre le cache minimal.

Vérifier la documentation OneSignal actuelle avant de choisir, puis noter la décision ici. Tant qu'elle n'est pas prise, ne pas publier de service worker en production.

## 6. En-têtes Netlify

```toml
[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"
```

Sans `no-cache` sur le service worker, les mises à jour n'arrivent pas chez les utilisateurs.

## 7. iOS

- Les notifications push d'une PWA ne fonctionnent que si elle est **installée sur l'écran d'accueil** (iOS 16.4 minimum).
- Prévoir dans l'espace adhérents une page d'aide « Installer l'application » (Safari → Partager → Sur l'écran d'accueil), et inviter à activer les notifications une fois installée.
- La demande de permission de notification se déclenche sur une action de l'utilisateur, jamais au chargement de la page.

## 8. Mises à jour

Chaque déploiement change `version` : un nouveau cache est créé et l'ancien supprimé à l'activation. Après un déploiement, l'utilisateur obtient la nouvelle version au prochain chargement.

## 9. Tests avant mise en production

- [ ] Lighthouse : la PWA est installable
- [ ] Mode avion : une navigation affiche `/offline`
- [ ] Déconnecté, aucune page de l'espace adhérents n'est servie depuis le cache
- [ ] Aucune requête Supabase n'apparaît dans le cache (DevTools → Application → Cache Storage)
- [ ] Après un déploiement, la nouvelle version remplace l'ancienne
- [ ] Installation et notification testées sur Android et sur iPhone

## 10. Questions ouvertes

- Piste A ou B pour OneSignal ? (voir §5)
- Faut-il proposer l'installation de l'application avant ou après la connexion ?
- Couleurs et icônes définitives du thème.