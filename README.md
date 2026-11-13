# Bagad Penhars — site de l'association

> **Passages obsolètes :** certaines décisions décrites plus bas ont été
> remplacées ou corrigées. Pour les règles marquées **OBsolète — ne plus
> prendre en compte**, se référer au registre daté dans
> [`docs/questions.md`](./docs/questions.md).

Le projet vise à fournir au Bagad Penhars (Quimper) un site public et un
espace privé pour les adhérents. Le site public présente l'association et ses
activités; l'espace adhérents sert à consulter l'agenda et les partitions,
répondre aux événements et gérer son profil.

> **État du projet :** les décisions ci-dessous décrivent la cible produit,
> pas nécessairement des fonctions déjà opérationnelles. Supabase et Netlify
> sont obsolètes depuis le 2026-11-05; la cible est Better Auth + Neon +
> Cloudflare Pages/R2. Plusieurs parcours restent à développer. Consultez
> [la spécification](./docs/Spec.md) et [l'architecture](./docs/architecture.md)
> avant de considérer un parcours comme livré.

## Décisions produit

### Langues et visibilité

- Le site public est disponible en français, anglais et breton (`fr`, `en`,
  `br`).
- L'authentification et l'espace adhérents sont en français uniquement.
- Le trombinoscope est réservé aux membres actifs et n'expose que les champs
  autorisés. Les coordonnées privées et les titres du bureau ne sont pas
  publics.
- Cloudflare R2 sépare les médias publics des photos de profil et documents
  privés. Les objets privés sont servis uniquement après autorisation serveur.
- Les représentations explicitement publiques sont consultables sans compte.
- Les événements ne stockent qu'une date, sans heure. La clôture des réponses
  a lieu à minuit au début du lendemain selon `Europe/Paris`. La première
  version ne gère pas les événements récurrents.

### Rôles et comptes

| Rôle           | Responsabilités prévues                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`      | Terminer la création du compte et consulter l'attente de validation; pas d'accès à l'espace adhérents.                                          |
| `member`       | Consulter l'agenda, les partitions et le trombinoscope autorisé, répondre aux événements et modifier son profil, sauf son rôle et ses pupitres. |
| `chef_pupitre` | Droits d'un membre; gérer les événements, partitions et notifications de son ou ses pupitres.                                                   |
| `secretaire`   | Rôle applicatif; gérer les invitations, validations et pupitres, créer les contenus et événements autorisés, et notifier plusieurs pupitres.    |
| `admin`        | Gérer globalement les utilisateurs, rôles, contenus, événements et notifications.                                                               |

L'association compte trois pupitres : bombarde, caisse claire et cornemuse. Un
membre peut être rattaché à un ou plusieurs pupitres. Le rôle et les pupitres
sont des données de profil, pas des informations de session fournies par le
navigateur.

Seuls l'administrateur et la secrétaire envoient une invitation. Le lien
Better Auth expire après une heure. Le membre confirme son adresse et définit
son mot de passe ; le profil reste `pending` jusqu'à l'approbation manuelle par
l'administrateur après confirmation de l'adresse. Si le lien expire,
l'administrateur peut renvoyer une invitation au compte Auth existant. Le
pupitre ne peut pas être modifié par la personne invitée.

### Agenda, présences et documents

- L'agenda public est en lecture seule. L'admin et la secrétaire peuvent créer
  des événements communs et des événements destinés au public. Un chef ne
  crée que des événements de son ou ses pupitres.
- Aucun événement récurrent n'est prévu en V1 ; la migration initiale ne
  contient ni table `event_series` ni colonne `events.series_id`.
- La visibilité des événements comprend trois niveaux distincts :
  `public` (visible par tous), `interne` (visible par tous les membres approuvés),
  et `pupitre` (visible uniquement par les membres du ou des pupitres concernés).
- Pour les événements et sondages, une réponse est obligatoirement « présent »
  ou « absent » (ou reste sans réponse en l'absence de saisie).
- Une réponse peut être modifiée jusqu'à la fin de la date de l'événement;
  elle est close à minuit au début du lendemain, puis reste en lecture seule.
  Elle n'est pas supprimée lors de l'annulation
  ou de la clôture; la suppression de compte suit le processus dédié.
- Les partitions sont des PDF privés consultables par tous les membres
  approuvés, quel que soit leur pupitre. Les chefs déposent des partitions
  pour leur périmètre; la secrétaire et l'admin peuvent en déposer pour tous
  les pupitres.

### Contenus, médias et contact

- Les articles et albums sont prévisualisés avant publication. L'admin et la
  secrétaire peuvent publier et supprimer les albums.
- Les médias publics publiés sont accessibles sans connexion. Les photos
  JPG/JPEG, PNG et WebP (15 Mo maximum et 6000 × 6000 pixels maximum) sont
  transformées par Cloudflare Images en WebP jusqu'à 2000 × 2000 pixels.
  Les vidéos sont interdites. Chaque membre actif peut lire les photos de
  profil des autres membres actifs, mais modifier uniquement la sienne.
- Le formulaire de contact doit être traité par un endpoint Cloudflare Pages
  avec Resend et Cloudflare Turnstile; les pièces jointes sont interdites.
  L'adresse officielle est configurée côté serveur et l'expéditeur reçoit un
  accusé après l'envoi réussi du message à l'association.

### Notifications

OneSignal est le service prévu pour les notifications push de la première
version; aucun email de notification n'est prévu. La création d'un événement
déclenche une notification automatique. Les membres peuvent gérer leurs
préférences globales, celles des événements et des rappels, y compris les
rappels en cas de réponse manquante à un sondage. Les règles d'audience
figurent dans le brief et la spécification.

## Décisions et points restant à valider

Les arbitrages datés sont consignés dans [`docs/questions.md`](./docs/questions.md)
et appliqués dans les spécifications. Les durées de conservation des messages
de contact, des réponses et des journaux d'audit restent à valider par
l'association; aucune purge automatique irréversible n'est activée avant cette
validation.

## Architecture cible et état technique

La cible est SvelteKit 5, TypeScript et Tailwind CSS, avec Better Auth,
Neon PostgreSQL avec RLS, Drizzle, `@neondatabase/serverless` et Cloudflare
Hyperdrive pour le pooling, Cloudflare R2, Cloudflare Pages, Resend et
Cloudflare Turnstile. OneSignal gère les notifications push. Better Auth
gère l'identité et les sessions; `profiles.role` reste la source des rôles
métier. Le contexte RLS est transactionnel et les lectures privées ne sont
pas servies depuis un cache partagé de requêtes.

Le dépôt contient encore des éléments historiques fondés sur Supabase et
Netlify. Ils sont obsolètes et ne doivent pas être utilisés comme implémentation
ni comme source de vérité. Le modèle Neon/Better Auth/R2 reste à finaliser.
L'état détaillé figure dans
[la documentation de la base](./docs/database.md).

Les branches Neon `test` et `production` sont séparées des environnements
Cloudflare Pages. Les secrets restent dans des variables d'environnement
serveur et ne sont jamais committés ni exposés au navigateur.

## Développement local

Prérequis : Node.js 22+ et pnpm.

```bash
git clone https://github.com/hazerty565/bagadPenhars.git
cd bagadPenhars
pnpm install
pnpm dev
```

Le dépôt ne fournit pas encore de fichier `.env.example` ni de procédure
reproductible complète pour Neon, Better Auth, R2 ou Cloudflare Pages.

### Commandes

| Commande           | Usage                           |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Démarrer le serveur local       |
| `pnpm run check`   | Vérifier Svelte et TypeScript   |
| `pnpm run lint`    | Vérifier le formatage et ESLint |
| `pnpm test`        | Exécuter les tests unitaires    |
| `pnpm run build`   | Construire l'application        |
| `pnpm run preview` | Prévisualiser le build          |

Pour une validation complète avant livraison :

```bash
pnpm run check && pnpm run lint && pnpm run build
```

## Déploiement

Cloudflare Pages est la cible d'hébergement. Avant toute mise en production,
il faut configurer Better Auth, Neon et R2, séparément les branchements `test`
et `production`, vérifier les secrets et valider la compatibilité du service
worker avec OneSignal.
Consultez [la feuille de route](./docs/roadmap.md) et
[le backlog](./docs/backlog.md) pour l'ordre de réalisation.

## Documents de référence

- [Brief produit](./docs/brief.md) — besoin et périmètre.
- [Spécification développeur](./docs/Spec.md) — rôles, règles fonctionnelles et
  critères d'acceptation.
- [Spécification UI](./docs/Spec_UI.md) — structure des pages et composants de
  l'interface.
- [Structure du dépôt](./docs/Structure.md) — arborescence réelle, prototype
  visuel et repères des modules.
- [Architecture](./docs/architecture.md) — routes et flux.
- [Base de données](./docs/database.md) — Neon, Better Auth, R2 et droits.
- [PWA](./docs/pwa.md) — cache et notifications.
- [Questions produit](./docs/questions.md) — décisions prises et questions
  ouvertes.
- [Feuille de route](./docs/roadmap.md) et [backlog](./docs/backlog.md) —
  priorités et travail restant.
