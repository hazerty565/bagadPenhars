import type { Dictionary } from './types';

const fr: Dictionary = {
	meta: {
		title: 'Bagad Penhars — Musique traditionnelle bretonne à Quimper',
		description:
			'Bagad Penhars : bombarde, cornemuse, caisse claire et percussion. Découvrez l’association, les formations et l’agenda des prochaines sorties à Quimper.'
	},
	nav: {
		main: 'Navigation principale',
		home: 'Accueil',
		bagad: 'Le Bagad',
		formation: 'Formation',
		agenda: 'Agenda',
		media: 'Médias',
		partenaires: 'Partenaires',
		contact: 'Contact',
		listen: 'Écouter',
		login: 'Connexion',
		menu: 'Ouvrir le menu',
		closeMenu: 'Fermer le menu',
		language: 'Langue',
		skip: 'Aller au contenu'
	},
	header: {
		tagline: 'Musique traditionnelle bretonne',
		social: 'Réseaux sociaux du Bagad Penhars'
	},
	hero: {
		eyebrow: 'Quimper · Bretagne',
		lead: 'Depuis 1985, le Bagad Penhars réunit des musiciens de tous âges autour de la musique bretonne. Quatre pupitres, une même envie de partager et de faire vivre la tradition.',
		ctaPrimary: 'Voir l’agenda',
		ctaSecondary: 'Découvrir le bagad',
		imageAlt: 'Le Bagad Penhars en représentation dans les rues de Quimper',
		caption: 'En sortie à Quimper',
		sinceLabel: 'Création',
		sinceValue: '1985',
		pupitresLabel: 'Pupitres',
		pupitresValue: '4'
	},
	about: {
		eyebrow: 'L’association',
		title: 'Une musique vivante, ancrée en Cornouaille',
		paragraphs: [
			'Fondé en 1985, le Bagad Penhars perpétue la tradition musicale bretonne avec passion et authenticité. Notre ensemble réunit des musiciens de tous âges autour des instruments emblématiques de Bretagne.',
			'Nous nous attachons à transmettre la richesse de la musique traditionnelle bretonne tout en l’adaptant aux sensibilités contemporaines. Nos concerts et festivals témoignent de cette volonté de partage culturel.'
		],
		cta: 'En savoir plus sur le Bagad',
		imageAlt: 'Deux jeunes sonneurs de cornemuse du Bagad Penhars sur scène',
		since: 'Année de création'
	},
	pupitres: {
		eyebrow: 'Les pupitres',
		title: 'Quatre voix, un même souffle',
		lead: 'Bombarde, cornemuse, caisse claire et percussion : chaque pupitre a sa personnalité, tous se retrouvent pour sonner ensemble.',
		cta: 'Découvrir la formation',
		items: {
			bombarde: {
				name: 'Bombarde',
				breton: 'Bombard',
				description:
					'Instrument à vent emblématique de la musique bretonne, la bombarde porte la mélodie aux côtés des cornemuses.'
			},
			cornemuse: {
				name: 'Cornemuse',
				breton: 'Binioù bras',
				description:
					'La cornemuse forme la base mélodique du bagad, souvent jouée à l’unisson pour créer un son riche et puissant.'
			},
			caisseClaire: {
				name: 'Caisse claire',
				breton: 'Taboulin-snare',
				description:
					'Jouée à l’unisson par plusieurs batteurs, la caisse claire donne au bagad son rythme et sa puissance.'
			},
			percussion: {
				name: 'Percussion',
				breton: 'Percussionoù',
				description:
					'Tambours, grosses caisses et cymbales complètent l’ensemble rythmique et soutiennent le jeu collectif.'
			}
		}
	},
	agenda: {
		eyebrow: 'Agenda',
		title: 'Les prochains rendez-vous',
		lead: 'Retrouvez les sorties, concerts et fest-noz du Bagad Penhars ouverts au public.',
		cta: 'Tout l’agenda',
		emptyTitle: 'Le prochain rendez-vous sera bientôt annoncé.',
		emptyText:
			'Les dates publiques sont publiées au fil des confirmations. En attendant, découvrez le bagad et ses formations.',
		types: {
			sortie: 'Sortie',
			concert: 'Concert',
			'fest-noz': 'Fest-noz',
			festival: 'Festival',
			concours: 'Concours',
			gala: 'Gala',
			repetition: 'Répétition',
			reunion: 'Réunion',
			repas: 'Repas'
		}
	},
	gallery: {
		eyebrow: 'Galerie',
		title: 'Le bagad en images',
		lead: 'Quelques instants de scène, de répétition et de fête.',
		cta: 'Voir les médias',
		captions: ['Sonneurs et batteurs sur scène', 'Grosse caisse du bagad', 'Atelier de percussion']
	},
	join: {
		eyebrow: 'Nous rejoindre',
		title: 'Envie de faire sonner la Bretagne avec nous ?',
		text: 'Débutants ou sonneurs confirmés, le Bagad Penhars accueille tous les âges et tous les niveaux. Venez essayer un instrument, pousser la porte d’une répétition ou simplement nous écrire.',
		ctaContact: 'Nous contacter',
		ctaFormation: 'Découvrir les formations'
	},
	footer: {
		tagline: 'Association de musique traditionnelle bretonne à Quimper.',
		navTitle: 'Navigation',
		contactTitle: 'Contact',
		socialTitle: 'Réseaux',
		membersTitle: 'Espace adhérents',
		membersText: 'Agenda, documents et vie du bagad : accès réservé aux membres.',
		membersCta: 'Se connecter',
		rights: 'Tous droits réservés.',
		madeIn: 'Site de l’association Bagad Penhars.'
	},
	player: {
		title: 'Écouter le Bagad',
		subtitle: 'Lecteur audio',
		emptyTitle: 'Aucune piste publiée pour le moment.',
		emptyText: 'Les enregistrements du bagad seront disponibles ici dès leur publication.',
		close: 'Fermer le lecteur',
		play: 'Lire',
		pause: 'Pause',
		previous: 'Piste précédente',
		next: 'Piste suivante',
		loading: 'Chargement…',
		error: 'La lecture a échoué.'
	}
};

export default fr;
