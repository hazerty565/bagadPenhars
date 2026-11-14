import type { DemoPupitre } from '../types';

/** Les quatre pupitres, alignés sur `src/lib/data/pupitres.ts`. */
export const DEMO_PUPITRES: DemoPupitre[] = [
	{ id: 'bombarde', name: 'Bombarde', description: 'Anches et bombardes du bagad.' },
	{ id: 'cornemuse', name: 'Cornemuse', description: 'Cornemuses écossaises et binious.' },
	{ id: 'caisse-claire', name: 'Caisse claire', description: 'Batterie et caisses claires.' },
	{ id: 'percussion', name: 'Percussion', description: 'Grosse caisse et percussions.' }
];

export function pupitreName(id: string): string {
	return DEMO_PUPITRES.find((pupitre) => pupitre.id === id)?.name ?? id;
}
