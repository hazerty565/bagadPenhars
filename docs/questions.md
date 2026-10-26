# Questions à trancher

Les agents et contributeurs ajoutent ici les ambiguïtés découvertes, avec le
contexte et les choix nécessaires. Ne pas transformer une hypothèse en
décision sans validation.

## Architecture Supabase

La cible est décidée : Supabase est l'unique fournisseur pour Auth, PostgreSQL
et Storage; Netlify est réservé à l'hébergement, OneSignal aux notifications.
Le code et le schéma historiques doivent être migrés, pas conservés en parallèle.

1. **Policies RLS** — quelles policies précises s'appliquent aux nouvelles
   tables et aux buckets? La règle est d'activer RLS partout et de refuser
   l'accès par défaut; documenter les autorisations table par table.
2. **Migration historique** — planifier la conversion des clés du schéma
   historique en références à `auth.users(id)` et l'import des données, si
   nécessaire. Ne pas appliquer directement
   `migrations/001_initial_schema.sql` au projet Supabase.
3. **Variables d'environnement** — finaliser les noms utilisés par
   l'intégration Supabase SSR et documenter les clés publiques et serveur
   dans `.env.example`, sans inclure de valeur secrète.

## Modèle de données et exploitation

4. **Rôles** — le brief définit `secretaire`, absent de l'énumération `app_role`
   de la migration initiale. Faut-il l'ajouter comme rôle applicatif, ou le
   déterminer autrement sans confondre titre au bureau et permission?
5. **Schéma cible** — quelles tables sont nécessaires au-delà de la migration
   existante? Le README mentionne notamment les invitations, alors que la
   migration ne définit pas de table `invitations`.
6. **Migrations** — quel ordre d'exécution retenir entre Supabase Auth, les
   tables métier et les fonctions/policies RLS?
7. **Tests navigateur** — les tests Vitest avec Chromium doivent-ils être
   installés et exécutés dans la CI, ou la CI doit-elle rester limitée à
   `check`, `lint` et `build`?

## Visibilité et rôles

8. **Médias et actualités** — quelles catégories sont publiques par défaut,
    et quelles actions de gestion sont réservées aux chefs ou administrateurs?
9. **Pupitres** — la règle d'un seul titulaire par poste de bureau et la
    possibilité pour un membre d'avoir plusieurs pupitres correspondent-elles
    au fonctionnement réel de l'association?
