import { describe, it, expect } from 'vitest';
import fr from '$lib/i18n/fr';
import en from '$lib/i18n/en';
import br from '$lib/i18n/br';
import { isLang, getDict, DEFAULT_LANG, type Lang, type Dictionary } from '$lib/i18n';

/**
 * Tests de contrat pour le système i18n typé.
 *
 * Vérifie que les trois dictionnaires (fr, en, br) sont cohérents :
 * - mêmes clés à tous les niveaux (récursif)
 * - pas de chaîne vide là où une valeur est attendue
 * - getDict / isLang fonctionnent correctement
 */

const DICTIONARIES: Record<Lang, Dictionary> = { fr, en, br };

/** Extrait récursivement toutes les clés d'un objet imbriqué. */
function extractKeys(obj: unknown, prefix = ''): string[] {
	if (obj === null || typeof obj !== 'object') {
		return [prefix].filter(Boolean);
	}
	if (Array.isArray(obj)) {
		return obj.flatMap((item, idx) => extractKeys(item, `${prefix}[${idx}]`));
	}
	return Object.entries(obj).flatMap(([key, value]) =>
		extractKeys(value, prefix ? `${prefix}.${key}` : key)
	);
}

/** Vérifie qu'aucune chaîne n'est vide dans un dictionnaire. */
function assertNoEmptyStrings(obj: unknown, path = ''): void {
	if (typeof obj === 'string') {
		expect(obj.length).toBeGreaterThan(0);
		return;
	}
	if (obj === null || typeof obj !== 'object') return;
	if (Array.isArray(obj)) {
		obj.forEach((item, idx) => assertNoEmptyStrings(item, `${path}[${idx}]`));
		return;
	}
	Object.entries(obj).forEach(([key, value]) =>
		assertNoEmptyStrings(value, path ? `${path}.${key}` : key)
	);
}

describe('i18n — dictionnaires', () => {
	describe('parité des clés', () => {
		const langs: Lang[] = ['fr', 'en', 'br'];

		langs.forEach((lang) => {
			it(`${lang} a toutes les clés du dictionnaire de référence (fr)`, () => {
				const refKeys = extractKeys(fr).sort();
				const targetKeys = extractKeys(DICTIONARIES[lang]).sort();

				expect(targetKeys).toEqual(refKeys);
			});
		});
	});

	describe('pas de chaînes vides', () => {
		const langs: Lang[] = ['fr', 'en', 'br'];

		langs.forEach((lang) => {
			it(`${lang} ne contient aucune chaîne vide`, () => {
				assertNoEmptyStrings(DICTIONARIES[lang]);
			});
		});
	});

	describe('getDict', () => {
		it('retourne le bon dictionnaire pour chaque Lang', () => {
			expect(getDict('fr')).toBe(fr);
			expect(getDict('en')).toBe(en);
			expect(getDict('br')).toBe(br);
		});

		it('retourne le dictionnaire par défaut pour une langue valide', () => {
			expect(getDict(DEFAULT_LANG)).toBe(DICTIONARIES[DEFAULT_LANG]);
		});
	});

	describe('isLang', () => {
		it('accepte fr, en, br', () => {
			expect(isLang('fr')).toBe(true);
			expect(isLang('en')).toBe(true);
			expect(isLang('br')).toBe(true);
		});

		it('rejoint les valeurs invalides', () => {
			expect(isLang('FR')).toBe(false);
			expect(isLang('EN')).toBe(false);
			expect(isLang('es')).toBe(false);
			expect(isLang('')).toBe(false);
			expect(isLang(undefined)).toBe(false);
			expect(isLang('french')).toBe(false);
		});
	});
});

describe('i18n — structure Dictionary', () => {
	it('toutes les sections obligatoires sont présentes', () => {
		const requiredSections = [
			'meta',
			'nav',
			'header',
			'hero',
			'about',
			'pupitres',
			'formation',
			'bagad',
			'agenda',
			'articles',
			'prestations',
			'partners',
			'contact',
			'gallery',
			'join',
			'footer',
			'legal',
			'player'
		] as const;

		requiredSections.forEach((section) => {
			expect(fr).toHaveProperty(section);
			expect(en).toHaveProperty(section);
			expect(br).toHaveProperty(section);
		});
	});

	it('nav contient toutes les clés attendues', () => {
		const navKeys = [
			'main',
			'home',
			'bagad',
			'formation',
			'agenda',
			'articles',
			'media',
			'partenaires',
			'contact',
			'listen',
			'login',
			'menu',
			'closeMenu',
			'language',
			'skip'
		] as const;

		navKeys.forEach((key) => {
			expect(fr.nav).toHaveProperty(key);
			expect(en.nav).toHaveProperty(key);
			expect(br.nav).toHaveProperty(key);
		});
	});

	it('agenda.months a exactement 12 éléments', () => {
		expect(fr.agenda.months).toHaveLength(12);
		expect(en.agenda.months).toHaveLength(12);
		expect(br.agenda.months).toHaveLength(12);
	});

	it('agenda.types couvre tous les EventType', () => {
		const eventTypes = [
			'sortie',
			'concert',
			'fest-noz',
			'festival',
			'concours',
			'gala',
			'repetition',
			'reunion',
			'repas'
		] as const;

		eventTypes.forEach((type) => {
			expect(fr.agenda.types).toHaveProperty(type);
			expect(en.agenda.types).toHaveProperty(type);
			expect(br.agenda.types).toHaveProperty(type);
		});
	});

	it('contact.form.subjects couvre tous les sujets du formulaire', () => {
		// Les clés réelles dans le dictionnaire (diffèrent de ContactSubject du schéma)
		const subjects = ['adhesion', 'information', 'partenariat', 'prestation', 'autre'] as const;

		subjects.forEach((subject) => {
			expect(fr.contact.form.subjects).toHaveProperty(subject);
			expect(en.contact.form.subjects).toHaveProperty(subject);
			expect(br.contact.form.subjects).toHaveProperty(subject);
		});
	});
});
