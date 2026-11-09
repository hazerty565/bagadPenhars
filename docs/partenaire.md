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

````typescript
{
  nom: "Nom de l'entreprise",
  logo: "/logos/nom-entreprise.svg",
  lien: "https://entreprise.com",
}

---

## 📋 Explication

Ce fichier `partenaires.md` sert de **guide pour ton agent IA** :

1. **Il explique la structure** : Où sont les fichiers, quels formats utiliser
2. **Il donne les étapes** : Comment ajouter un partenaire de A à Z
3. **Il liste les règles** : Nommage, bonnes pratiques, erreurs à éviter
4. **Il montre des exemples** : Code concret pour comprendre

### 🎯 Pourquoi un `.md` ici ?

Contrairement au fichier de données (qui doit être `.ts` ou `.json`), ce fichier est une **documentation** :
- Lisible par un humain
- Lisible par un agent IA
- Facile à mettre à jour
- Ne sera jamais "compilé" dans ton site

### 📁 Où le placer ?

Je te conseille de le mettre à la racine ou dans un dossier `docs/` :

```txt
/
├── docs/
│   └── partenaires.md          ← Documentation pour l'agent
├── src/
│   └── lib/
│       └── data/
│           └── partenaires.ts  ← Vraies données
````
