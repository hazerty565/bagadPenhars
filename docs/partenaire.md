# Gestion des Partenaires

## Structure des fichiers

### Données des partenaires
- **Fichier principal** : `src/lib/data/partenaires.ts`
- **Format** : TypeScript (tableau d'objets)
- **Alternative** : `src/lib/data/partenaires.json`

### Images des logos
- **Dossier** : `static/logos/`
- **Formats acceptés** :
  - `.svg` (prioritaire - vectoriel, léger, net)
  - `.webp` (si pas de SVG disponible)
  - `.png` (éviter si possible)

## Comment ajouter un nouveau partenaire

### Étape 1 : Préparer le logo
1. Demander le logo en format **SVG** au partenaire
2. Si SVG non disponible, convertir en **WebP**
3. Nommer le fichier : `nom-entreprise.svg` ou `nom-entreprise.webp`
4. Placer dans `static/logos/`

### Étape 2 : Ajouter les données
Ouvrir `src/lib/data/partenaires.ts` et ajouter :

```typescript
{
  nom: "Nom de l'entreprise",
  logo: "/logos/nom-entreprise.svg",
  lien: "https://entreprise.com",  
}
