import { error } from '@sveltejs/kit';
import { isLang } from '$lib/i18n';
import { publishedArticles } from '$lib/data/articles';
import type { PageServerLoad } from './$types';

/**
 * Liste publique des actualités.
 *
 * Les articles viennent de `src/lib/data/articles.ts` (contenus de
 * démonstration) et non de Neon. Le branchement sur la table `articles`
 * remplacera uniquement ce chargement, sans toucher aux composants.
 */
export const load: PageServerLoad = ({ params }) => {
	if (!isLang(params.lang)) {
		error(404, 'Langue non prise en charge');
	}

	return { articles: publishedArticles(params.lang) };
};
