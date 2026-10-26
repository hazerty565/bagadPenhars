# Questions à trancher

Les agents et contributeurs ajoutent ici les ambiguïtés découvertes, avec le
contexte et les choix nécessaires. Ne pas transformer une hypothèse en
décision sans validation.

## Fournisseurs et architecture

1. **Base de données** — le README décrit Netlify DB / Neon; un ancien
   `Context.MD` mentionne Appwrite. Quel fournisseur est la référence?
2. **Authentification** — le README indique Better Auth auto-hébergé et signale
   Neon Auth comme alternative. Quel choix doit être implémenté?
3. **RLS** — les permissions sont-elles garanties uniquement par le serveur,
   ou faut-il aussi activer RLS et écrire des politiques PostgreSQL?

## Modèle de données et exploitation

4. **Schéma cible** — quelles tables sont nécessaires au-delà de la migration
   existante? Le README mentionne notamment les invitations, alors que la
   migration ne définit pas de table `invitations`.
5. **Migrations** — quel mécanisme et quel ordre d'exécution faut-il retenir
   pour les tables Better Auth et le schéma métier?
6. **Environnements** — quels noms de variables de configuration sont la
   référence? Le fichier `.env.example` et le README ne sont pas alignés sur le
   nom de la clé Better Auth.
7. **Tests navigateur** — les tests Vitest avec Chromium doivent-ils être
   installés et exécutés dans la CI, ou la CI doit-elle rester limitée à
   `check`, `lint` et `build`?

## Visibilité et rôles

8. **Médias et actualités** — quelles catégories sont publiques par défaut,
   et quelles actions de gestion sont réservées aux chefs ou administrateurs?
9. **Pupitres** — la règle d'un seul titulaire par poste de bureau et la
   possibilité pour un membre d'avoir plusieurs pupitres correspondent-elles
   au fonctionnement réel de l'association?
