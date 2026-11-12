export interface Partner {
	id: string;
	/** Nom affiché sous le logo (et utilisé comme nom accessible du lien). */
	name: string;
	logo: string;
	width: number;
	height: number;
	url: string;
}

/**
 * Partenaires du Bagad Penhars.
 *
 * Liste, logos et liens repris de la page officielle
 * https://bagad-penhars.com/partenaires (à reconfirmer par le bureau).
 * Les fichiers sont servis depuis `static/logos/`.
 */
export const PARTNERS: Partner[] = [
	{
		id: 'quimper',
		name: 'Quimper',
		logo: '/logos/Quimper.webp',
		width: 404,
		height: 144,
		url: 'https://www.quimper.bzh/'
	},
	{
		id: 'finistere',
		name: 'Département du Finistère',
		logo: '/logos/Finistere.webp',
		width: 451,
		height: 658,
		url: 'https://www.finistere.fr/'
	},
	{
		id: 'mederien',
		name: 'Mederien Penhars',
		logo: '/logos/Mederien.webp',
		width: 225,
		height: 225,
		url: 'https://mederien-penhars.fr/'
	},
	{
		id: 'fenetres-de-toit-29',
		name: 'Fenêtres de toit 29',
		logo: '/logos/Logo-Fenetres-de-toit-29.webp',
		width: 400,
		height: 137,
		url: 'https://fenetresdetoit29.fr/'
	}
];
