import { error } from '@sveltejs/kit';
import { isLang } from '$lib/i18n';
import { articleBySlug, latestArticles } from '$lib/data/articles';
import type { PageServerLoad } from './$types';

/**
 * Détail d’un article public.
 *
 * Les contenus proviennent de `src/lib/data/articles.ts` (données de
 * démonstration). Le jour où la table `articles` sera branchée sur Neon, seul
 * ce chargement changera : le composant ne manipule que `PublicArticle`.
 */
export const load: PageServerLoad = ({ params }) => {
	if (!isLang(params.lang)) {
		error(404, 'Langue non prise en charge');
	}

	const article = articleBySlug(params.lang, params.slug);

	if (!article) {
		error(404, 'Article introuvable');
	}

	const related = latestArticles(params.lang, 4)
		.filter((item) => item.slug !== article.slug)
		.slice(0, 3);

	return { article, related };
};
