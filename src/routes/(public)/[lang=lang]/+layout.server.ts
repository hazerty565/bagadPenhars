import { error } from '@sveltejs/kit';
import { isLang } from '$lib/i18n';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ params }) => {
	if (!isLang(params.lang)) {
		error(404, 'Langue non prise en charge');
	}

	return { lang: params.lang };
};
