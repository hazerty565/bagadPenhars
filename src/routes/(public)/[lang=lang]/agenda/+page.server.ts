import { agendaSections } from '$lib/data/agenda';
import type { PageServerLoad } from './$types';

/**
 * Agenda public provisoire.
 *
 * Les événements viennent de `src/lib/data/agenda.ts` (données d'attente
 * reprises du site officiel) et non de Neon. Le partage « à venir / passés »
 * est calculé côté serveur sur la date de Paris.
 */
export const load: PageServerLoad = () => agendaSections();
