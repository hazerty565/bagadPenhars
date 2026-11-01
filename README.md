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
> pas nécessairement des fonctions déjà opérationnelles. L'intégration
> Supabase et plusieurs parcours restent à développer. Consultez
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
- Supabase Storage sépare les médias publiés (`bagad-public`) des photos de
  profil et documents privés (`bagad-private`).
- Les représentations explicitement publiques sont consultables sans compte.
- Le fuseau horaire des événements est `Europe/Paris`. La première version ne
  gère pas les événements récurrents.

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

Seul l'administrateur envoie une invitation par `inviteUserByEmail()`. Le lien
Supabase Auth expire après une heure. Le membre confirme son adresse et définit
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
- Les partitions sont des PDF privés consultables par tous les membres
  approuvés, quel que soit leur pupitre. Les chefs déposent des partitions
  pour leur périmètre; la secrétaire et l'admin peuvent en déposer pour tous
  les pupitres.

### Contenus, médias et contact

- Les articles et albums sont prévisualisés avant publication. L'admin et la
  secrétaire peuvent publier et supprimer les albums.
- Les médias publics publiés sont accessibles sans connexion. Les photos
  source JPG/JPEG de 20 Mo maximum sont converties en WebP. Les vidéos sont
  interdites. Chaque membre actif peut lire les photos de profil des autres
  membres actifs, mais modifier uniquement la sienne.
- Le formulaire de contact doit utiliser Netlify Forms; les pièces jointes
  sont interdites. La configuration existe côté Netlify, mais le branchement
  dans l'application et la confirmation à l'expéditeur restent à préciser.

### Notifications

OneSignal est le service prévu pour les notifications push de la première
version; aucun email de notification n'est prévu. La création d'un événement
déclenche une notification automatique. Les membres peuvent gérer leurs
préférences globales, celles des événements et des rappels, y compris les
rappels en cas de réponse manquante à un sondage. L'audience exacte des
notifications de sondage reste à valider.

## Points encore à décider

Les réponses sont suffisamment claires pour les langues, les rôles,
l'invitation, les profils, les formats de médias, la visibilité des événements
(`public`, `interne`, `pupitre`) et les notifications de sondage. Les points
suivants ne doivent pas être supposés :

1. **Netlify Forms :** confirmer le calendrier de branchement et le mécanisme
   de confirmation à l'expéditeur.
2. **Conservation et suppression :** fixer les durées de conservation des
   soumissions de contact, présences et journaux d'audit, ainsi que le
   processus de traitement d'une demande de suppression de compte.

Le détail et l'historique des réponses sont dans
[les questions produit](./docs/questions.md). Une réponse non confirmée n'est
pas une exigence définitive.

## Architecture cible et état technique

La cible est SvelteKit 5, TypeScript et Tailwind CSS, avec Supabase Auth,
PostgreSQL/RLS et Storage. Netlify héberge l'application et reçoit les
formulaires de contact; OneSignal gère les notifications push.

Le dépôt contient encore des éléments historiques fondés sur Better Auth,
PostgreSQL direct et Netlify Blobs. Le schéma SQL sous `migrations/` n'est pas
une migration Supabase et ne doit pas être appliqué tel quel. Les migrations
Supabase, les policies RLS et l'intégration complète des parcours restent à
mettre en place. L'état détaillé figure dans
[la documentation de la base](./docs/database.md).

Les environnements Supabase de développement, de preview et de production
doivent être séparés. Les secrets restent dans des variables d'environnement
et ne sont jamais committés; les clés de service ne sont jamais exposées au
navigateur.

## Développement local

Prérequis : Node.js 22+ et pnpm.

```bash
git clone https://github.com/hazerty565/bagadPenhars.git
cd bagadPenhars
pnpm install
pnpm dev
```

Le dépôt ne fournit pas encore de fichier `.env.example` ni de procédure
reproductible de configuration des services Supabase. Le serveur de
développement ne signifie donc pas que les parcours dépendant de ces services
sont configurés.

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

Netlify est la cible d'hébergement (`@sveltejs/adapter-netlify`). Avant toute
mise en production, il faut terminer la migration vers Supabase, définir et
tester les policies RLS, configurer séparément les environnements, vérifier
les secrets et valider la compatibilité du service worker avec OneSignal.
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
- [Base de données](./docs/database.md) — schéma cible, RLS et droits.
- [PWA](./docs/pwa.md) — cache et notifications.
- [Questions produit](./docs/questions.md) — décisions prises et questions
  ouvertes.
- [Feuille de route](./docs/roadmap.md) et [backlog](./docs/backlog.md) —
  priorités et travail restant.
