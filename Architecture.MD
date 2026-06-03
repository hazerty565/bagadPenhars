---

---

## **✅ Pourquoi ça marche maintenant ?**
1. **Suppression de `%%{init}%%`** :
   - GitHub ne supporte pas les configurations avancées de Mermaid comme les thèmes personnalisés.
   - On utilise les **couleurs par défaut** de GitHub (qui sont déjà claires).

2. **Saut de ligne dans les labels** :
   - Remplacé `\n` par des **espaces** ou des **sauts de ligne explicites** dans les labels des nœuds.
   - Exemple : `A1[Supabase\nBase de données]` → `A1[Supabase\nBase de données + RLS]` (GitHub gère mal les `\n` dans certains cas).

3. **Simplification des styles** :
   - Les `classDef` sont conservés pour les couleurs, mais sans variables de thème.

---

---

## **📌 Autres Corrections pour `ARCHITECTURE.md`**
Si tu veux inclure **d’autres diagrammes** (comme les flux de données), voici comment les adapter :

### **Exemple : Flux pour une Requête GET**
```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant V as Vue
    participant C as Contrôleur
    participant M as Modèle
    participant DB as Supabase

    U->>V: Accède à /fr/articles
    V->>C: Appel de load()
    C->>M: Appel de getArticles()
    M->>DB: Requête SELECT * FROM articles
    DB-->>M: Retourne les articles
    M-->>C: Retourne les articles
    C->>V: Retourne { articles }
    V->>U: Affiche les articles
