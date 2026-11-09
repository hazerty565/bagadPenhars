import br from './br';
import en from './en';
import fr from './fr';
import type { Dictionary, Lang } from './types';

export type { Dictionary, Lang } from './types';

export const LANGUAGES: Record<Lang, string> = {
	fr: 'Français',
	en: 'English',
	br: 'Brezhoneg'
};

export const LOCALES: Record<Lang, string> = {
	fr: 'fr-FR',
	en: 'en-GB',
	br: 'br-FR'
};

export const DEFAULT_LANG: Lang = 'fr';

export const dictionaries: Record<Lang, Dictionary> = { fr, en, br };

export function isLang(value: string | undefined): value is Lang {
	return value === 'fr' || value === 'en' || value === 'br';
}

export function getDict(lang: Lang): Dictionary {
	return dictionaries[lang];
}
