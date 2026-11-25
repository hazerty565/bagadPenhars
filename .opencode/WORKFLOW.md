# Référence du workflow Bagad Penhars

Ce fichier est un aide-mémoire du processus. Il ne constitue pas un rôle d'agent et ne doit pas être invoqué comme sous-agent.

Client
↓
Chef
↓
Architecte → [PLAN.md + CONTRAT_API.md]
↓
Mainteneur → [Audit des packages et versions dans docs/mises-a-jour.md]
↓
🛑 POINT DE CONTRÔLE 1 (le client valide le plan, les packages et les versions)
↓
Mainteneur → [Installation des dépendances validées, pnpm uniquement]
↓
Dev-backend → [Schéma Drizzle, migrations, Neon, Better Auth, services backend]
↓
Dev-frontend → [UI SvelteKit, routes serveur et endpoints, appels aux services backend]
↓
Intégrateur → [INTEGRATION.md]
↓
Tech Lead → [REVUE.md]
↓
🛑 POINT DE CONTRÔLE 2 (le client valide la revue technique)
↓
Testeur → [TESTS.md]
↓
🛑 POINT DE CONTRÔLE 3 (le client valide la recette)
↓
Sécurité → [SECURITE.md]
↓
Pentesteur → [PENTEST.md]
↓
🛑 POINT DE CONTRÔLE 4 (le client prend connaissance de la sécurité et du pentest, accepte explicitement les seules réserves non bloquantes et autorise la suite)
↓
Déployeur → [DEPLOIEMENT.md]
↓
Client (livraison finale)

Règles de reprise : après toute correction, le cycle de vérification reprend à l'Intégrateur et rejoue les contrôles aval concernés. Aucun verdict antérieur ne valide un commit modifié. Les agents ne se contactent jamais directement ; toute coordination passe par le Chef.
