# Gestion des partenaires

## Où se trouve quoi

| Élément             | Emplacement                                                |
| ------------------- | ---------------------------------------------------------- |
| Données (nom, lien) | `src/lib/data/partenaires.ts` — tableau `PARTNERS`         |
| Logos               | `static/logos/` (servis à l'URL `/logos/<fichier>`)        |
| Page publique       | `src/routes/(public)/[lang=lang]/partenaires/+page.svelte` |
| Textes éditoriaux   | `src/lib/i18n/fr.ts`, `en.ts`, `br.ts` — bloc `partners`   |

## Format d'une entrée

```ts
export interface Partner {
	id: string; // identifiant stable, sert de clé Svelte
	name: string; // nom affiché sous le logo (nom accessible du lien)
	logo: string; // chemin public, ex. '/logos/Quimper.webp'
	width: number; // largeur intrinsèque du fichier, en pixels
	height: number; // hauteur intrinsèque du fichier, en pixels
	url: string; // site officiel du partenaire
}
```

`width` / `height` doivent correspondre aux dimensions réelles du fichier :
elles réservent la place du logo avant son chargement et évitent les sauts de
mise en page (CLS). Pour les relever, mesurer l'image dans le navigateur
(`naturalWidth` / `naturalHeight`) : les `.webp` ne sont pas lisibles par
`System.Drawing`.

## Ajouter un partenaire

1. **Logo** : demander le fichier au partenaire, en `.svg` de préférence, sinon
   `.webp`. Nommer en kebab-case (`nom-du-partenaire.webp`) et déposer dans
   `static/logos/`.
2. **Dimensions** : relever la largeur et la hauteur réelles du fichier.
3. **Données** : ajouter une entrée dans `PARTNERS` (`src/lib/data/partenaires.ts`)
   en respectant l'ordre de la page officielle.
4. **Vérifier** : la page doit afficher le logo, le nom sous le logo et le lien
   qui s'ouvre dans un nouvel onglet.

## Règles

- **Uniquement des éléments fournis et validés** (`docs/maquette_UI.md` §8.6) :
  pas de logo ni de lien inventé, pas de lien deviné à partir d'un nom.
- **Logos décoratifs** : le logo porte `alt=""`, le nom visible sous le logo sert
  de nom accessible au lien, complété par un texte `sr-only` « — nouvel onglet ».
- **Liens externes** : toujours `target="_blank"` + `rel="noopener noreferrer"`.
- **Orthographe** : garder la dénomination officielle du partenaire (« Département
  du Finistère », « Fenêtres de toit 29 »), même si la page d'origine comporte
  des coquilles.
- **Mise en page** : la grille de logos est homogène (hauteur de bloc fixe,
  `object-contain`), quelle que soit l'orientation du fichier ; ne pas rogner
  un logo.
- **Autorisations** : l'usage du logo doit être couvert par l'accord du partenaire.
  En cas de doute, ne pas publier l'élément et poser la question dans
  `docs/questions.md`.

## Textes de la page

Les contenus proviennent de la page officielle
<https://bagad-penhars.com/partenaires> : accroche, « Rejoignez le Bagad »,
déductions fiscales (66 % particuliers, 60 % professionnels) et remerciements.
Les textes localisés sont dans le bloc `partners` des trois dictionnaires ; le
breton doit être relu par un locuteur natif.
