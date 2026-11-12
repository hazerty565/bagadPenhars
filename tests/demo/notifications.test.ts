import { beforeEach, describe, expect, it } from 'vitest';
import { demo } from '$lib/demo/store.svelte';
import {
	markAllRead,
	markRead,
	markUnread,
	notificationRecipients,
	notificationsFor,
	sendNotification,
	unreadCount,
	type DemoNotificationInput
} from '$lib/demo/services/notifications';
import { DemoPermissionError } from '$lib/demo/permissions';

/**
 * Notifications simulées : aucun envoi réel, mais les mêmes règles de ciblage
 * que la future API (chef = ses pupitres, secrétaire = tout le bagad).
 */

const input = (overrides: Partial<DemoNotificationInput> = {}): DemoNotificationInput => ({
	title: 'Message de test',
	body: 'Contenu du message de test.',
	audience: 'pupitre',
	pupitreIds: ['bombarde'],
	profileIds: [],
	...overrides
});

beforeEach(() => {
	demo.reset();
	demo.clearNotice();
});

describe('envoi', () => {
	it('un chef notifie un de ses pupitres', () => {
		const notification = sendNotification('p03', input());
		expect(notification.sentBy).toBe('p03');
		expect(notification.audience).toBe('pupitre');
		expect(notification.audienceIds).toEqual(['bombarde']);
		expect(notification.readBy).toContain('p03');
	});

	it('un chef ne notifie pas un autre pupitre', () => {
		expect(() => sendNotification('p03', input({ pupitreIds: ['percussion'] }))).toThrow(
			DemoPermissionError
		);
	});

	it('un chef ne notifie pas tout le bagad', () => {
		expect(() => sendNotification('p03', input({ audience: 'all', pupitreIds: [] }))).toThrow(
			DemoPermissionError
		);
	});

	it('un membre ne notifie personne', () => {
		expect(() => sendNotification('p06', input())).toThrow(DemoPermissionError);
	});

	it('la secrétaire notifie tout le bagad', () => {
		const notification = sendNotification('p02', input({ audience: 'all', pupitreIds: [] }));
		expect(notification.audience).toBe('all');
		expect(notificationRecipients(notification)).toHaveLength(demo.profiles.length);
	});

	it('exige un titre, un message et un destinataire', () => {
		expect(() => sendNotification('p02', input({ title: 'a' }))).toThrow(DemoPermissionError);
		expect(() => sendNotification('p02', input({ body: 'a' }))).toThrow(DemoPermissionError);
		expect(() => sendNotification('p02', input({ audience: 'pupitre', pupitreIds: [] }))).toThrow(
			DemoPermissionError
		);
	});
});

describe('ciblage et lecture', () => {
	it('ne remonte une notification de pupitre qu’aux membres concernés', () => {
		sendNotification('p03', input({ title: 'Bombardes uniquement' }));

		const bombarde = notificationsFor('p06').map((notification) => notification.title);
		const percussion = notificationsFor('p05').map((notification) => notification.title);

		expect(bombarde).toContain('Bombardes uniquement');
		expect(percussion).not.toContain('Bombardes uniquement');
	});

	it('marque lue, non lue, puis tout lu', () => {
		const notification = sendNotification('p02', input({ audience: 'all', pupitreIds: [] }));
		expect(unreadCount('p06')).toBeGreaterThan(0);

		markRead('p06', notification.id);
		expect(notification.readBy).toContain('p06');

		markUnread('p06', notification.id);
		expect(notification.readBy).not.toContain('p06');

		markAllRead('p06');
		expect(unreadCount('p06')).toBe(0);
	});

	it('respecte la préférence « annonces générales » désactivée', () => {
		const notification = sendNotification('p02', input({ audience: 'all', pupitreIds: [] }));
		const preferences = demo.preferences.find((item) => item.profileId === 'p06');
		expect(preferences).toBeDefined();
		preferences!.global = false;

		const titles = notificationsFor('p06').map((item) => item.title);
		expect(titles).not.toContain(notification.title);
	});

	it('refuse une notification inexistante', () => {
		expect(() => markRead('p06', 'inconnu')).toThrow(DemoPermissionError);
	});
});
