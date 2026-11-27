# PWA : manifest, service worker, notifications

> Tout changement du manifest, du service worker ou des en-têtes de cache est consigné ici.

## 1. Objectif

La PWA sert à permettre l'activation des notifications push OneSignal. Son
installation est requise sur Android et iOS pour recevoir ces notifications.
L'espace adhérents et ses données nécessitent une connexion réseau : aucun
mode hors-ligne n'est prévu pour les membres.

## 2. Fichiers

| Fichier                                       | Rôle                                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| `static/manifest.webmanifest`                 | Nom, couleurs, icônes                                 |
| `static/icons/`                               | Icônes 192, 512, maskable 512, `apple-touch-icon` 180 |
| Service worker OneSignal ou worker applicatif | Fonctionnement des notifications push                 |
| `src/app.html`                                | Liens vers le manifest, `theme-color`, icône iOS      |
| Cloudflare Pages / `_headers`                 | En-têtes de cache du service worker et du manifest    |

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
		{
			"src": "/icons/icon-maskable-512.png",
			"sizes": "512x512",
			"type": "image/png",
			"purpose": "maskable"
		}
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

Le service worker est nécessaire au fonctionnement des notifications push. Il
ne fournit pas de mode hors-ligne et ne doit mettre en cache ni pages, ni
requêtes applicatives, ni données membres. En particulier, aucune page de
l'espace adhérents ne doit rester accessible depuis un cache après
déconnexion.

## 5. Cohabitation avec OneSignal

**Décision produit — 2026-11-06 :** l'installation de la PWA est requise pour
recevoir les notifications push OneSignal. Le choix technique entre un worker
applicatif et le worker OneSignal est confié au développeur front-end.

OneSignal fournit son propre service worker (`OneSignalSDKWorker.js`). Deux service workers ne peuvent pas partager la même portée. Deux pistes :

- **A.** Charger le SDK OneSignal depuis notre `service-worker.ts` avec `importScripts`. Attention : `importScripts` n'existe pas dans un worker de type module, et SvelteKit enregistre le worker en module en développement. À tester en dev **et** en production.
- **B.** Utiliser le worker OneSignal seul et y mettre le cache minimal.

Le développeur front-end choisit et documente l'architecture après avoir
vérifié la documentation OneSignal actuelle. Il teste la compatibilité avant
l'activation en production. Aucun cache applicatif ou mode hors-ligne n'est à
ajouter.

## 6. En-têtes Cloudflare Pages

Les headers exacts sont configurés dans Cloudflare Pages ou `_headers`, selon
la solution retenue. Le service worker et le manifest ne doivent pas être
mis en cache plus longtemps que nécessaire, notamment avec
`Cache-Control: no-cache` pour le service worker.

Sans `no-cache` sur le service worker, les mises à jour n'arrivent pas chez les utilisateurs.

## 7. Installation et notifications

- L'installation sur l'écran d'accueil est requise sur Android et iOS pour recevoir les notifications push.
- Sur iOS, les notifications push des web apps installées nécessitent iOS 16.4 minimum.
- Prévoir dans l'espace adhérents une page d'aide « Installer l'application » (Safari → Partager → Sur l'écran d'accueil), et inviter à activer les notifications une fois installée.
- Proposer l'installation après la connexion, dans l'espace adhérents (décision client du 2026-11-07).
- La demande de permission de notification se déclenche sur une action de l'utilisateur, jamais au chargement de la page.

## 8. Mises à jour

Après un déploiement, le navigateur doit pouvoir récupérer la nouvelle version
du service worker et du manifest au prochain chargement.

## 9. Tests avant mise en production

- [ ] La PWA est installable sur Android et iOS
- [ ] Un membre hors-ligne ne peut pas consulter l'espace adhérents
- [ ] Aucune page ni donnée membre n'est mise en cache
- [ ] Après un déploiement, le service worker et le manifest sont actualisés
- [ ] Installation et notifications push testées sur Android et sur iPhone

## 10. Points restant à définir

- Couleurs et icônes définitives du thème.
