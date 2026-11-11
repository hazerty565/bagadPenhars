import type { ContactSubject, EventType, PrestationKey, PupitreKey } from '$lib/types';

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
	formation: {
		meta: {
			title: string;
			description: string;
		};
		eyebrow: string;
		title: string;
		lead: string;
		leadMore: string;
		ctaContact: string;
		mascotAlt: string;
		sectionsEyebrow: string;
		sectionsTitle: string;
		sectionsLead: string;
		tagsLabel: string;
		items: Record<
			PupitreKey,
			{
				name: string;
				breton: string;
				role: string;
				photoAlt: string;
				paragraphs: string[];
				imageAlt: string;
				tags: string[];
			}
		>;
		practical: {
			eyebrow: string;
			title: string;
			lead: string;
			points: { title: string; text: string }[];
			note: string;
			cta: string;
		};
		join: {
			title: string;
			text: string;
			cta: string;
		};
	};
	bagad: {
		meta: {
			title: string;
			description: string;
		};
		eyebrow: string;
		title: string;
		lead: string;
		heroAlt: string;
		history: {
			eyebrow: string;
			title: string;
			foundedLabel: string;
			paragraphs: string[];
			cta: string;
		};
		mission: {
			eyebrow: string;
			title: string;
			paragraphs: string[];
			imageAlt: string;
			cta: string;
		};
		figures: {
			title: string;
			items: { value: string; label: string }[];
		};
		join: {
			title: string;
			text: string;
			ctaFormation: string;
			ctaContact: string;
		};
	};
	agenda: {
		meta: {
			title: string;
			description: string;
		};
		eyebrow: string;
		title: string;
		lead: string;
		cta: string;
		heroAlt: string;
		heroCaption: string;
		upcoming: {
			title: string;
			lead: string;
		};
		past: {
			title: string;
			lead: string;
		};
		locationLabel: string;
		currentLabel: string;
		emptyTitle: string;
		emptyText: string;
		contact: {
			title: string;
			text: string;
			cta: string;
		};
		types: Record<EventType, string>;
		/** Douze libellés de mois, de janvier à décembre, pour un affichage déterministe. */
		months: string[];
	};
	prestations: {
		eyebrow: string;
		title: string;
		lead: string;
		items: Record<
			PrestationKey,
			{
				title: string;
				description: string;
			}
		>;
		ctaLead: string;
		cta: string;
	};
	partners: {
		meta: {
			title: string;
			description: string;
		};
		eyebrow: string;
		title: string;
		lead: string;
		cta: string;
		support: {
			title: string;
			paragraphs: string[];
			deductionIntro: string;
			deductions: { rate: string; label: string; text: string }[];
			thanks: string;
		};
		logos: {
			eyebrow: string;
			title: string;
			lead: string;
			cta: string;
			newTab: string;
		};
	};
	contact: {
		meta: {
			title: string;
			description: string;
		};
		eyebrow: string;
		title: string;
		lead: string;
		form: {
			title: string;
			intro: string;
			lastName: string;
			firstName: string;
			email: string;
			subject: string;
			subjectPlaceholder: string;
			subjects: Record<ContactSubject, string>;
			message: string;
			messageHint: string;
			captcha: string;
			captchaHelp: string;
			captchaUnavailable: string;
			submit: string;
			submitting: string;
			successTitle: string;
			successText: string;
			errorTitle: string;
			errors: {
				invalid: string;
				captcha: string;
				send: string;
				unavailable: string;
			};
			required: string;
			fieldError: string;
		};
		details: {
			title: string;
			addressLabel: string;
			emailLabel: string;
			hoursLabel: string;
			hours: string[];
			hoursNote: string;
		};
		map: {
			title: string;
			text: string;
			open: string;
			openGoogle: string;
			openApple: string;
			loading: string;
			error: string;
			marker: string;
		};
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
		legal: string;
	};
	legal: {
		meta: {
			title: string;
			description: string;
		};
		eyebrow: string;
		title: string;
		lead: string;
		updated: string;
		/** Identité officielle de l'association (source : annuaire des entreprises). */
		identity: {
			title: string;
			items: {
				label: string;
				value: string;
			}[];
		};
		/** Sections dans l'ordre d'affichage, identiques dans les trois langues. */
		sections: {
			title: string;
			paragraphs: string[];
		}[];
		contact: {
			title: string;
			text: string;
			cta: string;
		};
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
