import type { DemoArticle } from '../types';

/** Articles fictifs de l’espace membre (3 publiés, 1 brouillon). */
export const DEMO_ARTICLES: DemoArticle[] = [
	{
		id: 'a01',
		title: 'Retour sur le concert de la Sainte-Cécile',
		slug: 'retour-concert-sainte-cecile',
		excerpt:
			'Une salle comble, un programme renouvelé et une belle soirée partagée avec les partenaires du bagad.',
		status: 'published',
		authorId: 'p02',
		publishedAt: '2026-11-10',
		updatedAt: '2026-11-10T18:00:00.000Z',
		contentMarkdown: `## Une soirée de partage

Le concert annuel a réuni plus de trois cents personnes au Théâtre de Cornouaille. Le programme mêlait les airs traditionnels du répertoire et deux créations arrangées par les chefs de pupitre.

## Merci aux bénévoles

Le montage, l’accueil du public et la logistique ont été assurés par une équipe de bénévoles. Un grand merci à toutes les personnes qui ont donné de leur temps.

## Prochains rendez-vous

- **5 décembre** : fest-noz de décembre
- **12 décembre** : sortie « Passeurs des lumières »
- **19 décembre** : repas de fin d’année

Les inscriptions se font depuis l’agenda de l’espace adhérents.`
	},
	{
		id: 'a02',
		title: 'Les nouveaux élèves du bagadig',
		slug: 'nouveaux-eleves-bagadig',
		excerpt:
			'Douze jeunes musiciens ont rejoint les rangs du bagadig cette saison. Présentation du parcours et des pupitres.',
		status: 'published',
		authorId: 'p02',
		publishedAt: '2026-10-24',
		updatedAt: '2026-10-24T09:30:00.000Z',
		contentMarkdown: `## Une rentrée encourageante

Douze élèves ont intégré le bagadig à la rentrée. Ils suivent une séance hebdomadaire par pupitre et participent aux répétitions communes une fois par mois.

## Le rôle des chefs de pupitre

Chaque chef de pupitre accompagne les nouveaux arrivants : réglage des instruments, travail de lecture et préparation des premières sorties.

> « Le plus important est de prendre du plaisir à jouer ensemble », rappelle l’équipe pédagogique.

Les familles peuvent poser leurs questions depuis le formulaire de contact du site public.`
	},
	{
		id: 'a03',
		title: 'Préparer le concours de printemps',
		slug: 'preparer-concours-printemps',
		excerpt:
			'Le calendrier de travail, les pupitres concernés et les répétitions supplémentaires jusqu’au mois de mars.',
		status: 'published',
		authorId: 'p03',
		publishedAt: '2026-10-12',
		updatedAt: '2026-10-12T20:15:00.000Z',
		contentMarkdown: `## Un travail par pupitre

La préparation du concours de printemps commence dès le mois de novembre. Chaque pupitre travaille ses parties séparément avant les répétitions communes.

## Calendrier indicatif

1. Novembre : mise en place des partitions
2. Décembre : travail des harmonies
3. Janvier : premières répétitions complètes
4. Février : filage et corrections
5. Mars : concours

## Points d’attention

Les instruments doivent être réglés avant chaque répétition commune. Les partitions annotées sont disponibles dans l’espace Documents.`
	},
	{
		id: 'a04',
		title: 'Brouillon — bilan de la saison 2026',
		slug: 'bilan-saison-2026',
		excerpt: 'Brouillon en cours de relecture par le bureau.',
		status: 'draft',
		authorId: 'p01',
		publishedAt: null,
		updatedAt: '2026-11-11T08:45:00.000Z',
		contentMarkdown: `## Chiffres de la saison

- Concerts et sorties : à compléter
- Nouveaux adhérents : à compléter
- Heures de répétition : à compléter

## Bilan moral

Texte à relire par le bureau avant publication.`
	}
];
