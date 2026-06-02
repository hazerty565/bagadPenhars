## 🏗️ Architecture MVC

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ff6b6b', 'primaryTextColor': '#fff', 'lineColor': '#4a4a4a', 'secondaryColor': '#f0f0f0', 'tertiaryColor': '#d4d4d4'}}}%%
flowchart TB
    subgraph "🟦 Modèle (Model)"
        direction TB
        A1[Supabase\n(Base de données + RLS)]
        A2[/lib/schemas/\n(Schémas Zod)]
        A3[/lib/types/\n(Types TypeScript)]
        A4[/lib/server/\n(Logique métier : CRUD, requêtes)]
        A5[/supabase/migrations/\n(Migrations SQL)]
    end

    subgraph "🟥 Contrôleur (Controller)"
        direction TB
        B1[+page.server.ts\n(Chargement des données, actions)]
        B2[+server.ts\n(API Endpoints)]
        B3[/lib/auth/guards.ts\n(requireAuth, requireAdmin)]
        B4[/lib/auth/permissions.ts\n(canEdit, canDelete)]
        B5[/netlify/functions/\n(Serverless Functions)]
    end

    subgraph "🟨 Vue (View)"
        direction TB
        C1[/routes/[lang]/\n(Pages Svelte : +page.svelte)]
        C2[/lib/components/ui/\n(Design System : Button, Input...)]
        C3[/lib/components/articles/\n(Composants métiers : ArticleCard...)]
        C4[/lib/components/layout/\n(Nav, Footer, Sidebar...)]
        C5[/lib/i18n/\n(Traductions : fr/, en/, br/)]
    end

    subgraph "🌍 Utilisateur"
        D1[Navigateur\n(Requêtes HTTP)]
    end

    %% Connexions
    D1 --> "1. Requête HTTP\n(ex: GET /fr/articles)"| B1
    D1 -->|"2. Soumission de formulaire\n(ex: POST /fr/articles)"| B1
    D1 -->|"3. Appel API\n(ex: POST /api/revalidate)"| B2

    B1 -->|"Utilise les schémas\npour valider les données"| A2
    B1 -->|"Appelle la logique métier\n(ex: getArticles())"| A4
    B1 -->|"Vérifie les permissions\n(ex: requireAuth())"| B3
    B1 -->|"Prépare les données\npour la vue"| C1

    B2 -->|"Appelle la logique métier\n(ex: revalidatePath())"| A4
    B2 -->|"Vérifie les permissions"| B3

    B3 -->|"Utilise les rôles\n(ex: Role.admin)"| A3
    B4 -->|"Vérifie les permissions\nsur les ressources"| A1

    A4 -->|"Requêtes Supabase\n(ex: select, insert)"| A1
    A4 -->|"Utilise les types\npour typer les retours"| A3
    A4 -->|"Valide les données\navec Zod"| A2

    C1 -->|"Affiche les données\n(ex: {#each articles})"| D1
    C1 -->|"Utilise les composants\n(ex: <ArticleCard />)"| C2
    C1 -->|"Utilise les composants métiers\n(ex: <ArticleList />)"| C3
    C1 -->|"Utilise les layouts\n(ex: <Nav />)"| C4
    C1 -->|"Charge les traductions\n(ex: t('home.title'))"| C5

    %% Styles
    classDef model fill:#e3f2fd,stroke:#2196f3,stroke-width:2px,color:#000
    classDef controller fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#000
    classDef view fill:#e8f5e9,stroke:#4caf50,stroke-width:2px,color:#000
    classDef user fill:#fce4ec,stroke:#e91e63,stroke-width:2px,color:#000

    class A1,A2,A3,A4,A5 model
    class B1,B2,B3,B4,B5 controller
    class C1,C2,C3,C4,C5 view
    class D1 user
