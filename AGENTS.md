# AGENTS.md : Contexte Maître du Projet Bagad Penhars

Ce fichier est la **source de vérité** pour tous les agents de l'équipe. 
Lis ce fichier en premier, puis les fichiers pertinents dans `docs/`. 
En cas de doute ou de contradiction, n'invente jamais : signale le point au Chef. Celui-ci fait consigner la question dans `docs/questions.md` par l'Architecte lorsque nécessaire, puis arbitre ou sollicite le client.

## 0. Stack Technique
- **Frontend** : SvelteKit 5 (Runes uniquement), Tailwind CSS, Motion, `svelte-i18n`.
- **Backend / Auth** : Better Auth, Neon PostgreSQL (avec politiques RLS), Drizzle ORM.
- **Infrastructure** : Cloudflare Pages, Cloudflare R2 (stockage), Cloudflare Hyperdrive.
- **Services tiers** : OneSignal (notifications push).
- **Gestionnaire de paquets** : pnpm uniquement (jamais `npm` ni `yarn`, pas de `package-lock.json`).

## 1. Ordre de lecture des documents

### À lire systématiquement en début de session
- `docs/brief.md` : Besoin global, rôles, décisions de visibilité.
- `docs/journal.md` : Où la dernière session s'est arrêtée, état actuel.

### À lire selon la tâche en cours
| Fichier | Quand le lire |
|---------|---------------|
| `docs/Spec.md` | Pour les exigences fonctionnelles et techniques détaillées. |
| `docs/Spec_UI.md` | Pour les spécifications des pages, composants et comportements UI. |
| `docs/Structure.md` | Pour comprendre l'arborescence du dépôt, routes et services. |
| `docs/architecture.md` | Pour les flux d'authentification et l'architecture des routes. |
| `docs/database.md` | Pour les détails Neon, Better Auth, R2 et les règles de migration. |
| `docs/bagad-penhars-schema.*` | (`.mmd`, `.sql`, `.webp`) Pour visualiser le schéma de base de données. |
| `docs/pwa.md` | Pour tout ce qui concerne le manifest, le service worker et les notifications. |
| `docs/agenda.md` / `docs/event.md` | Pour les règles métier spécifiques à l'agenda et aux RSVP. |
| `docs/media.md` | Pour la gestion des uploads, le stockage R2 et les règles d'accès. |
| `docs/partenaire.md` | Pour l'organisation et l'ajout des partenaires. |
| `docs/roadmap.md` / `docs/backlog.md` | Pour choisir la prochaine tâche (Focus actuel -> Backlog). |
| `docs/questions.md` | Pour voir les décisions en attente ou les ambiguïtés. |

*Règle : Ne lis que ce dont ta tâche a besoin, mais toujours `brief.md` et `journal.md`.*

## 2. Règles d'Or (Non négociables)

### Svelte 5 & Frontend
- **Runes uniquement** : utilise `$state`, `$derived`, `$effect`, `$props`.
- **Interdits absolus** : `export let`, `$:`, `on:click` (utiliser `onclick`), et les stores legacy pour l'état local des composants.
- **UI** : Tailwind uniquement (via les tokens du thème). Respecter `prefers-reduced-motion` pour Motion. Mobile first et accessibilité (labels, contrastes, focus visible).
- **i18n** : Site public en `fr`, `en`, `br` via `svelte-i18n`. L'espace adhérents reste en français. Centralise les textes dans `src/lib/i18n/`, jamais de chaînes en dur dans les composants.

### Base de données, Auth & Sécurité (Critique)
- **Autorisations** : Toujours vérifiées côté serveur (loads/actions/endpoints).
- **Identité vs Rôle** : Better Auth gère l'identité et les sessions. Le rôle métier est lu côté serveur depuis `profiles.role` (ENUM PostgreSQL `app_role`), selon le schéma validé. Aucune valeur de rôle fournie par le client ne fait autorité.
- **RLS & Contexte** : Les tables sensibles utilisent les politiques RLS natives de Neon/PostgreSQL en défense en profondeur. Après validation de la session Better Auth, chaque transaction applicative établit son contexte utilisateur avec `set_config('app.current_user_id', '...', true)` avant les requêtes métier.
- **Hyperdrive** : Sert uniquement au pooling des connexions. **Ne jamais** activer le cache de requêtes pour des données protégées par RLS ou dépendantes de l'identité. Le cache n'est que pour les lectures explicitement publiques.
- **Migrations** : Reproductibles via Drizzle. Une migration appliquée n'est **jamais** modifiée : on en ajoute une nouvelle additive.
- **Secrets** : Les identifiants Neon, clés Better Auth et clés OneSignal restent strictement côté serveur (`.env` ignoré, `.env.example` à jour).

### PWA & OneSignal
- **PWA** : L'installation est requise pour les notifications push. **Aucun mode hors-ligne** pour l'espace adhérents. Le service worker sert *uniquement* aux push, pas de cache applicatif pour les pages/données membres.
- **OneSignal** : La clé REST reste côté serveur. L'envoi de notification vérifie strictement le rôle : secrétaire (plusieurs pupitres), chef de pupitre (son pupitre), ou admin.

### Général
- Aucune nouvelle dépendance sans justification dans `equipe/PLAN.md`, audit du Mainteneur consigné dans `docs/mises-a-jour.md` et validation du client avant installation. Le résultat de l'installation est ensuite consigné dans `docs/journal.md`.
- Le trombinoscope est réservé aux membres actifs connectés. Les titres du bureau ne sont jamais publics.
- **Hors périmètre absolu** : paiement en ligne, inscription libre.

## 3. Workflow Multi-Agents

Ce projet est développé par une équipe d'agents orchestrée par le `chef.md`. 
- Si tu es un agent de développement, tu suis les directives de `equipe/PLAN.md` et `equipe/CONTRAT_API.md`.
- Tu ne dois jamais modifier les fichiers dans `equipe/`, sauf autorisation explicite prévue par ta fiche : Architecte (`PLAN.md`, `CONTRAT_API.md`), Chef (`HISTORIQUE.md`), Intégrateur (`INTEGRATION.md`), Tech Lead (`REVUE.md`), Testeur (`TESTS.md` et `essais/`), Sécurité (`SECURITE.md`), Pentesteur (`PENTEST.md` et `essais/pentest/`) ou Déployeur (`DEPLOIEMENT.md`). Les autres agents restent en lecture seule sur ce dossier.
- En cas de conflit entre le plan et ce fichier `AGENTS.md`, **ce fichier `AGENTS.md` prévaut**. Signale-le au Chef ; l'Architecte consigne la question dans `docs/questions.md` avant toute décision qui modifie le périmètre ou l'architecture.

## 4. Checklist de fin de tâche

Pour toute tâche de développement qui modifie le code, et lorsque les scripts correspondants existent dans `package.json`, exécute avant de la déclarer terminée :
1. `pnpm run check`
2. `pnpm run lint`
3. `pnpm run build`

Puis, selon les changements :
- Si le schéma a changé : générer une nouvelle migration + mettre à jour `docs/database.md` (incluant la matrice des droits RLS).
- Si une route ou un flux a changé : mettre à jour `docs/architecture.md`.
- Ajouter une entrée datée dans `docs/journal.md` : ce qui est fait, ce qui reste, les pièges rencontrés.

Les agents de contrôle (Intégrateur, Tech Lead, Testeur, Sécurité, Pentesteur et Déployeur) appliquent leurs propres procédures et rapports. Ils ne sont pas tenus de modifier le code ni de lancer des commandes auxquelles leurs permissions ne leur donnent pas accès.

## 5.  Règle absolue de communication et d'escalade

Tu dois signaler le point au Chef et attendre son arbitrage, ainsi que l'accord explicite du client lorsqu'il est requis, avant de :
- Changer de stack ou ajouter un service tiers.
- Modifier les rôles, les autorisations existantes ou le flux d'invitation.
- Supprimer des données ou une migration existante.
- Toucher aux en-têtes de sécurité (CSP) ou à la configuration de déploiement (**Cloudflare Pages**).
- Modifier la politique de cache du service worker.

Le Chef est l'unique canal de communication, de coordination et d'arbitrage entre tous les agents.

Aucun agent ne contacte directement un autre agent, ne lui délègue une tâche et ne lui transmet une demande. Toute question technique, tout blocage et toute demande de coordination remontent au Chef. L'Architecte est le seul agent autorisé à mettre à jour `docs/questions.md` ; le Chef lui transmet les éléments à consigner lorsque nécessaire.

En cas de doute, question, information manquante, contradiction, problème technique, blocage ou besoin dépassant son périmètre de responsabilité :

1. L'agent fait remonter la situation au Chef.
2. Il décrit précisément le contexte, le problème et ses conséquences.
3. Il présente, si possible, une ou plusieurs solutions proposées.
4. Il attend les instructions ou l'arbitrage du Chef avant de poursuivre la partie concernée.

Le Chef analyse la demande, consulte si nécessaire l'agent compétent dans le respect du fonctionnement séquentiel, transmet les réponses et décisions, et veille à la mise à jour de `docs/questions.md` par l'Architecte lorsque le point doit être tracé.

Aucun agent ne doit inventer une décision, modifier un contrat ou dépasser ses responsabilités pour contourner un blocage.

Cette règle s'applique à tous les agents, sans exception. Les échanges entre Backend et Frontend sont donc médiés par le Chef ; ils ne se contactent pas directement.

## Gouvernance des packages

L'architecte est responsable du choix technique des packages dans `equipe/PLAN.md`.

Les développeurs peuvent :
- signaler qu'un package prévu est inutile ;
- proposer un package plus adapté à un besoin concret ;
- demander un package spécialisé pour une fonctionnalité précise.

Les développeurs ne doivent jamais installer eux-mêmes un package.

Le mainteneur vérifie :
- la version disponible ;
- la compatibilité avec la stack ;
- la maintenance du package ;
- la licence ;
- l'impact sur le bundle ;
- le type de mise à jour : patch, minor, major.

Le mainteneur ne décide pas seul de remplacer un package choisi par l'architecte.  
S'il détecte un problème, il le signale au Chef, qui renvoie la décision à l'architecte.

Le client valide le plan final incluant les packages importants.
