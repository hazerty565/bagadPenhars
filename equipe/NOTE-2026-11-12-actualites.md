# Note d'équipe — Page publique Actualités

**Date :** 2026-11-12
**Demandeur :** client
**Statut :** livré en développement, en attente de relecture

---

## 1. Demande

1. Ajouter une page « Actualités » dans le menu public, présentée sous forme de
   cards à la suite.
2. Afficher sur la page d'accueil les trois derniers articles publiés.
3. Utiliser de faux articles pour l'instant.
4. Placer la section Actualités de l'accueil **au-dessus de la galerie et sous
   l'agenda**.

---

## 2. Décisions prises

| Sujet              | Décision                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| URL                | Réutilisation de `/…/articles` (route déjà prévue par `docs/Structure.md`) avec le libellé « Actualités ».                   |
| Détail             | `/…/articles/[slug]`, slug stable et commun aux trois langues.                                                               |
| Données            | Six articles de démonstration localisés `fr` / `en` / `br` dans `src/lib/data/articles.ts`.                                  |
| Branchement futur  | Seuls `publishedArticles()`, `latestArticles()` et `articleBySlug()` changeront pour lire la table `articles` de Neon.       |
| Navigation         | Entrée ajoutée au header, au menu mobile et au footer, via `PUBLIC_NAV`.                                                     |
| Responsive         | Menu desktop à partir de `xl` (1280 px) avec libellés compacts ; burger jusqu'à 1279 px ; « Connexion » à partir de 1536 px. |
| Ordre de l'accueil | Hero → À propos → Pupitres → Prestations → Agenda → **Actualités** → Galerie → Rejoindre.                                    |
| Dépendances        | Aucune ajoutée ; pas d'analyseur Markdown, les contenus sont des sections structurées.                                       |

---

## 3. Fichiers

**Créés**

- `src/lib/data/articles.ts`
- `src/lib/components/articles/ArticleCard.svelte`
- `src/lib/components/home/NewsPreview.svelte`
- `src/routes/(public)/[lang=lang]/articles/+page.svelte`
- `src/routes/(public)/[lang=lang]/articles/[slug]/+page.svelte`
- `src/routes/(public)/[lang=lang]/articles/[slug]/+page.server.ts`

**Modifiés**

- `src/lib/types.ts` (`PublicArticle`, `ArticleSection`)
- `src/lib/utils.ts` (`formatArticleDate`)
- `src/lib/data/nav.ts`, `src/lib/components/layout/Nav.svelte`
- `src/lib/i18n/types.ts`, `fr.ts`, `en.ts`, `br.ts`
- `src/routes/(public)/[lang=lang]/+page.server.ts`, `+page.svelte`
- `src/routes/(public)/[lang=lang]/articles/+page.server.ts`
- `docs/architecture.md`, `docs/journal.md`

---

## 4. Validation

- `pnpm run check` : 0 erreur, 0 avertissement.
- Prettier et ESLint : OK.
- `pnpm run build` : OK.
- Navigateur : liste et détail vérifiés en `fr`, `en` et `br` ; header et
  footer à jour ; 404 sur slug inconnu ; pas de débordement du header.

---

## 5. Points à reprendre

- Remplacer les six articles de démonstration par la table `articles`.
- Ajouter la gestion des actualités dans l'espace adhérents (déjà prévue au
  périmètre de `equipe/PLAN-DEMO.md`).
- Faire relire les textes bretons par un locuteur natif.
- Vérifier les crédits photo des images réutilisées (`IMG_0877.webp` porte un
  crédit « Lionel Lemaire »).
