# Bagad Penhars — site de l'association

Le projet vise à fournir au Bagad Penhars (Quimper) un site public et un
espace privé pour les adhérents. Le site public présente l'association et ses
activités; l'espace adhérents sert à consulter l'agenda et les partitions,
répondre aux événements et gérer son profil.

> **État du projet :** les décisions ci-dessous décrivent la cible produit,
> pas nécessairement des fonctions déjà opérationnelles. L'intégration
> Supabase et plusieurs parcours restent à développer. Consultez
> [la spécification](./Spec.md) et [l'architecture](./docs/architecture.md)
> avant de considérer un parcours comme livré.

## Décisions produit

### Langues et visibilité

- Le site public est disponible en français, anglais et breton (`fr`, `en`,
  `br`).
- L'authentification et l'espace adhérents sont en français uniquement.
- Il n'y a pas d'annuaire des membres, public ou privé. Les titres du bureau
  ne sont pas publiés.
- Les représentations explicitement publiques sont consultables sans compte.
- Le fuseau horaire des événements est `Europe/Paris`. Les événements
  récurrents peuvent être modifiés occurrence par occurrence.

### Rôles et comptes

| Rôle | Responsabilités prévues |
| --- | --- |
| `pending` | Terminer la création du compte et consulter l'attente de validation; pas d'accès à l'espace adhérents. |
| `member` | Consulter l'agenda et les partitions, répondre aux événements et modifier son profil, sauf son rôle et ses pupitres. |
| `chef_pupitre` | Droits d'un membre; gérer les événements, partitions et notifications de son ou ses pupitres. |
| `secretaire` | Rôle applicatif; gérer les invitations, validations et pupitres, créer les contenus et événements autorisés, et notifier plusieurs pupitres. |
| `admin` | Gérer globalement les utilisateurs, rôles, contenus, événements et notifications. |

Un membre peut être rattaché à un ou plusieurs pupitres : bombarde, cornemuse,
caisse claire et percussion. Le rôle et les pupitres sont des données de profil,
pas des informations de session fournies par le navigateur.

Les invitations sont envoyées par email par un admin ou une secrétaire. Elles
expirent après sept jours et sont à usage unique. Après définition du mot de
passe, le compte reste `pending`; l'admin ou la secrétaire approuve le compte
avec le rôle `member`. L'attribution d'un rôle supérieur est réservée à
l'admin. Le pupitre ne peut pas être modifié par la personne invitée.

### Agenda, présences et documents

- L'agenda public est en lecture seule. L'admin et la secrétaire peuvent créer
  des événements communs et des événements destinés au public. Un chef ne
  crée que des événements de son ou ses pupitres.
- Les événements par pupitre sont indiqués comme visibles par tous les
  membres approuvés dans la décision produit. La règle de lecture décrite dans
  [la documentation de la base](./docs/database.md) limite toutefois cette
  visibilité aux pupitres concernés. Cette divergence doit être tranchée et
  répercutée dans les règles RLS avant l'implémentation.
- Pour les événements, une réponse peut être « présent », « absent »,
  « ne sait pas » ou rester sans réponse. Un sondage est lui-même l'événement
  d'agenda, sans validation préalable, et ses réponses sont « présent » ou
  « absent ».
- Les partitions sont des PDF privés consultables par tous les membres
  approuvés, quel que soit leur pupitre. Les chefs déposent des partitions
  pour leur périmètre; la secrétaire et l'admin peuvent en déposer pour tous
  les pupitres.

### Contenus, médias et contact

- Les articles et albums sont prévisualisés avant publication. L'admin et la
  secrétaire peuvent publier et supprimer les albums.
- Les médias publics publiés sont accessibles sans connexion. Les photos
  source JPG/JPEG de 20 Mo maximum sont converties en WebP. Les vidéos et les
  avatars téléversés ne sont pas acceptés pour la première version; les
  initiales servent d'avatar.
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
l'invitation, les profils, les formats de médias et le fournisseur de
notifications. Les points suivants ne doivent pas être supposés :

1. **Événements par pupitre :** choisir entre la décision « visibles par tous
   les membres approuvés » et la règle RLS actuelle « visibles par les
   pupitres concernés ».
2. **Notifications de sondage :** confirmer les destinataires des notifications
   automatiques.
3. **Netlify Forms :** confirmer le calendrier de branchement et le mécanisme
   de confirmation à l'expéditeur.
4. **Conservation et suppression :** fixer les durées de conservation des
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

| Commande | Usage |
| --- | --- |
| `pnpm dev` | Démarrer le serveur local |
| `pnpm run check` | Vérifier Svelte et TypeScript |
| `pnpm run lint` | Vérifier le formatage et ESLint |
| `pnpm test` | Exécuter les tests unitaires |
| `pnpm run build` | Construire l'application |
| `pnpm run preview` | Prévisualiser le build |

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
- [Spécification développeur](./Spec.md) — rôles, règles fonctionnelles et
  critères d'acceptation.
- [Architecture](./docs/architecture.md) — routes et flux.
- [Base de données](./docs/database.md) — schéma cible, RLS et droits.
- [PWA](./docs/pwa.md) — cache et notifications.
- [Questions produit](./docs/questions.md) — décisions prises et questions
  ouvertes.
- [Feuille de route](./docs/roadmap.md) et [backlog](./docs/backlog.md) —
  priorités et travail restant.
