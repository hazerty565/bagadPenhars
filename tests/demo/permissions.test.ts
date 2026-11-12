import { describe, expect, it } from 'vitest';
import {
	canChangeAvatar,
	canChangeRole,
	canCreateEvent,
	canDeleteDocument,
	canDeleteEvents,
	canDepositDocument,
	canEditMemberPupitres,
	canEditOwnProfile,
	canManageContents,
	canManageEvent,
	canManageMembers,
	canManageSettings,
	canNotify,
	canRespondToEvent,
	canSeeAdminSection,
	canSeePupitreSection,
	canViewEvent,
	canViewPermissionMatrix,
	canViewPresenceDetail,
	chefPupitreIds,
	isChefOf,
	pupitreIdsOf,
	responseLockMessage,
	scopedPupitreIds,
	statusLabel,
	type DemoActor
} from '$lib/demo/permissions';
import type { DemoEvent } from '$lib/demo/types';

/**
 * Matrice de permissions de la démonstration.
 *
 * Ces tests fixent le contrat métier : un chef ne gère que ses pupitres, la
 * secrétaire gère l'ensemble du bagad, l'administrateur ajoute les rôles et les
 * réglages. Ils vérifient la source de vérité utilisée par les services, pas
 * seulement l'affichage des boutons.
 */

const member: DemoActor = {
	id: 'p06',
	role: 'member',
	pupitres: [{ pupitreId: 'bombarde', isChef: false }]
};

const chefBombarde: DemoActor = {
	id: 'p03',
	role: 'chef_pupitre',
	pupitres: [
		{ pupitreId: 'bombarde', isChef: true },
		{ pupitreId: 'cornemuse', isChef: true }
	]
};

const chefPercussion: DemoActor = {
	id: 'p05',
	role: 'chef_pupitre',
	pupitres: [{ pupitreId: 'percussion', isChef: true }]
};

const secretaire: DemoActor = {
	id: 'p02',
	role: 'secretaire',
	pupitres: [
		{ pupitreId: 'cornemuse', isChef: false },
		{ pupitreId: 'caisse-claire', isChef: false }
	]
};

const admin: DemoActor = {
	id: 'p01',
	role: 'admin',
	pupitres: [{ pupitreId: 'bombarde', isChef: false }]
};

function event(overrides: Partial<DemoEvent> = {}): DemoEvent {
	return {
		id: 'ex',
		title: 'Événement de test',
		description: '',
		date: '2026-12-01',
		type: 'repetition',
		visibility: 'pupitre',
		isPoll: false,
		status: 'active',
		pupitreIds: ['bombarde'],
		createdBy: 'p03',
		location: 'Espace Chaptal',
		...overrides
	};
}

describe('lecture des pupitres', () => {
	it('distingue les pupitres dirigés des pupitres joués', () => {
		expect(chefPupitreIds(chefBombarde)).toEqual(['bombarde', 'cornemuse']);
		expect(chefPupitreIds(member)).toEqual([]);
		expect(pupitreIdsOf(member)).toEqual(['bombarde']);
		expect(isChefOf(chefBombarde, 'bombarde')).toBe(true);
		expect(isChefOf(chefBombarde, 'percussion')).toBe(false);
	});

	it('borne le périmètre de l’espace pupitre', () => {
		expect(scopedPupitreIds(chefPercussion)).toEqual(['percussion']);
		expect(scopedPupitreIds(secretaire)).toEqual([
			'bombarde',
			'cornemuse',
			'caisse-claire',
			'percussion'
		]);
		expect(scopedPupitreIds(member)).toEqual([]);
	});
});

describe('événements', () => {
	it('un membre ne crée, ne gère et ne supprime rien', () => {
		expect(canCreateEvent(member, ['bombarde'])).toBe(false);
		expect(canManageEvent(member, event())).toBe(false);
		expect(canDeleteEvents(member)).toBe(false);
	});

	it('un chef ne crée que pour un seul de ses pupitres', () => {
		expect(canCreateEvent(chefBombarde, ['bombarde'])).toBe(true);
		expect(canCreateEvent(chefBombarde, ['cornemuse'])).toBe(true);
		expect(canCreateEvent(chefBombarde, [])).toBe(false);
		expect(canCreateEvent(chefBombarde, ['bombarde', 'cornemuse'])).toBe(false);
		expect(canCreateEvent(chefBombarde, ['percussion'])).toBe(false);
		expect(canCreateEvent(chefPercussion, ['bombarde'])).toBe(false);
	});

	it('un chef ne gère et ne supprime que les événements de son pupitre', () => {
		expect(canManageEvent(chefBombarde, event({ pupitreIds: ['bombarde'] }))).toBe(true);
		expect(canManageEvent(chefBombarde, event({ pupitreIds: ['percussion'] }))).toBe(false);
		expect(canManageEvent(chefBombarde, event({ pupitreIds: [] }))).toBe(false);
		expect(canDeleteEvents(chefBombarde)).toBe(false);
	});

	it('la secrétaire et l’administrateur gèrent tout', () => {
		for (const actor of [secretaire, admin]) {
			expect(canCreateEvent(actor, [])).toBe(true);
			expect(canManageEvent(actor, event({ pupitreIds: ['percussion'] }))).toBe(true);
			expect(canDeleteEvents(actor)).toBe(true);
		}
	});

	it('la visibilité d’un événement de pupitre dépend de l’appartenance', () => {
		const bombarde = event({ pupitreIds: ['bombarde'] });
		expect(canViewEvent(member, bombarde)).toBe(true);
		expect(canViewEvent(chefPercussion, bombarde)).toBe(false);
		expect(canViewEvent(secretaire, bombarde)).toBe(true);
		expect(canViewEvent(member, event({ visibility: 'public', pupitreIds: [] }))).toBe(true);
	});

	it('les présences nominatives sont réservées aux chefs concernés', () => {
		const bombarde = event({ pupitreIds: ['bombarde'] });
		expect(canViewPresenceDetail(chefBombarde, bombarde)).toBe(true);
		expect(canViewPresenceDetail(chefPercussion, bombarde)).toBe(false);
		expect(canViewPresenceDetail(member, bombarde)).toBe(false);
		expect(canViewPresenceDetail(secretaire, bombarde)).toBe(true);
	});

	it('verrouille la réponse après la date et sur un événement annulé', () => {
		expect(canRespondToEvent(member, event({ date: '2026-12-01' }))).toBe(true);
		expect(canRespondToEvent(member, event({ date: '2026-11-04' }))).toBe(false);
		expect(canRespondToEvent(member, event({ status: 'cancelled' }))).toBe(false);

		expect(responseLockMessage(event({ date: '2026-11-04' }))).toContain('closes');
		expect(responseLockMessage(event({ status: 'cancelled' }))).toContain('annulé');
		expect(responseLockMessage(event({ date: '2026-12-01' }))).toBeNull();
	});
});

describe('documents, notifications et contenus', () => {
	it('un membre consulte mais ne dépose pas', () => {
		expect(canDepositDocument(member, 'bombarde')).toBe(false);
		expect(canDepositDocument(member, null)).toBe(false);
		expect(canDeleteDocument(member, 'bombarde')).toBe(false);
	});

	it('un chef dépose pour ses pupitres uniquement', () => {
		expect(canDepositDocument(chefBombarde, 'bombarde')).toBe(true);
		expect(canDepositDocument(chefBombarde, 'percussion')).toBe(false);
		expect(canDepositDocument(chefBombarde, null)).toBe(false);
		expect(canDepositDocument(secretaire, null)).toBe(true);
	});

	it('un chef notifie ses pupitres, jamais tout le bagad', () => {
		expect(canNotify(chefBombarde, 'pupitre', ['bombarde'])).toBe(true);
		expect(canNotify(chefBombarde, 'pupitre', ['bombarde', 'cornemuse'])).toBe(true);
		expect(canNotify(chefBombarde, 'pupitre', ['bombarde', 'percussion'])).toBe(false);
		expect(canNotify(chefBombarde, 'pupitre', [])).toBe(false);
		expect(canNotify(chefBombarde, 'all', [])).toBe(false);
		expect(canNotify(member, 'pupitre', ['bombarde'])).toBe(false);
		expect(canNotify(secretaire, 'all', [])).toBe(true);
	});

	it('la gestion des contenus est réservée à la secrétaire et à l’administrateur', () => {
		expect(canManageContents(member)).toBe(false);
		expect(canManageContents(chefBombarde)).toBe(false);
		expect(canManageContents(secretaire)).toBe(true);
		expect(canManageContents(admin)).toBe(true);
	});
});

describe('membres, rôles et réglages', () => {
	it('la gestion des membres est réservée à la secrétaire et à l’administrateur', () => {
		expect(canManageMembers(member)).toBe(false);
		expect(canManageMembers(chefBombarde)).toBe(false);
		expect(canManageMembers(secretaire)).toBe(true);
		expect(canManageMembers(admin)).toBe(true);
	});

	it('seul l’administrateur attribue un rôle ou modifie les réglages', () => {
		expect(canChangeRole(secretaire)).toBe(false);
		expect(canChangeRole(chefBombarde)).toBe(false);
		expect(canChangeRole(admin)).toBe(true);
		expect(canManageSettings(secretaire)).toBe(false);
		expect(canManageSettings(admin)).toBe(true);
	});

	it('chacun modifie son profil et sa photo, personne celle des autres', () => {
		expect(canEditOwnProfile(member, 'p06')).toBe(true);
		expect(canEditOwnProfile(member, 'p07')).toBe(false);
		expect(canChangeAvatar(member, 'p06')).toBe(true);
		expect(canChangeAvatar(admin, 'p06')).toBe(false);

		expect(canEditMemberPupitres(secretaire, 'p06')).toBe(true);
		expect(canEditMemberPupitres(secretaire, 'p02')).toBe(false);
		expect(canEditMemberPupitres(chefBombarde, 'p06')).toBe(false);
	});

	it('ouvre les espaces selon le rôle', () => {
		expect(canSeeAdminSection(member)).toBe(false);
		expect(canSeeAdminSection(chefBombarde)).toBe(false);
		expect(canSeeAdminSection(secretaire)).toBe(true);
		expect(canSeeAdminSection(admin)).toBe(true);

		expect(canSeePupitreSection(member)).toBe(false);
		expect(canSeePupitreSection(chefBombarde)).toBe(true);
		expect(canSeePupitreSection(secretaire)).toBe(true);

		expect(canViewPermissionMatrix(chefBombarde)).toBe(false);
		expect(canViewPermissionMatrix(secretaire)).toBe(true);
	});

	it('libelle les réponses', () => {
		expect(statusLabel('present')).toBe('Présent');
		expect(statusLabel('absent')).toBe('Absent');
	});
});
