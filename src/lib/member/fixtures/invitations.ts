import type { DemoInvitation } from '../types';

/** Invitations fictives, sans envoi d’e-mail réel. */
export const DEMO_INVITATIONS: DemoInvitation[] = [
	{
		id: 'i01',
		email: 'nina.le-guen@example.com',
		firstName: 'Nina',
		lastName: 'Le Guen',
		pupitreIds: ['cornemuse'],
		status: 'pending',
		sentAt: '2026-11-09',
		expiresAt: '2026-11-16',
		invitedBy: 'p02'
	},
	{
		id: 'i02',
		email: 'jules.pere@example.com',
		firstName: 'Jules',
		lastName: 'Péré',
		pupitreIds: ['caisse-claire'],
		status: 'accepted',
		sentAt: '2026-10-30',
		expiresAt: '2026-11-06',
		invitedBy: 'p02'
	},
	{
		id: 'i03',
		email: 'elise.keravel@example.com',
		firstName: 'Élise',
		lastName: 'Keravel',
		pupitreIds: ['percussion'],
		status: 'expired',
		sentAt: '2026-10-20',
		expiresAt: '2026-10-27',
		invitedBy: 'p02'
	}
];
