import type { EventType, PupitreKey } from '$lib/types';

export type Lang = 'fr' | 'en' | 'br';

export interface Dictionary {
	meta: {
		title: string;
		description: string;
	};
	nav: {
		main: string;
		home: string;
		bagad: string;
		formation: string;
		agenda: string;
		media: string;
		partenaires: string;
		contact: string;
		listen: string;
		login: string;
		menu: string;
		closeMenu: string;
		language: string;
		skip: string;
	};
	header: {
		tagline: string;
		social: string;
	};
	hero: {
		eyebrow: string;
		lead: string;
		ctaPrimary: string;
		ctaSecondary: string;
		imageAlt: string;
		caption: string;
		sinceLabel: string;
		sinceValue: string;
		pupitresLabel: string;
		pupitresValue: string;
	};
	about: {
		eyebrow: string;
		title: string;
		paragraphs: string[];
		cta: string;
		imageAlt: string;
		since: string;
	};
	pupitres: {
		eyebrow: string;
		title: string;
		lead: string;
		cta: string;
		items: Record<
			PupitreKey,
			{
				name: string;
				breton: string;
				description: string;
			}
		>;
	};
	agenda: {
		eyebrow: string;
		title: string;
		lead: string;
		cta: string;
		emptyTitle: string;
		emptyText: string;
		types: Record<EventType, string>;
	};
	gallery: {
		eyebrow: string;
		title: string;
		lead: string;
		cta: string;
		captions: string[];
	};
	join: {
		eyebrow: string;
		title: string;
		text: string;
		ctaContact: string;
		ctaFormation: string;
	};
	footer: {
		tagline: string;
		navTitle: string;
		contactTitle: string;
		socialTitle: string;
		membersTitle: string;
		membersText: string;
		membersCta: string;
		rights: string;
		madeIn: string;
	};
	player: {
		title: string;
		subtitle: string;
		emptyTitle: string;
		emptyText: string;
		close: string;
		play: string;
		pause: string;
		previous: string;
		next: string;
		loading: string;
		error: string;
	};
}
