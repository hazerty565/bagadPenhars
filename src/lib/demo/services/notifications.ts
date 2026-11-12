import { demo } from '../store.svelte';
import type {
	DemoNotification,
	DemoNotificationAudience,
	DemoProfile,
	DemoPupitreId
} from '../types';
import { canNotify, DemoPermissionError } from '../permissions';
import { actorFor, isNonEmpty, nextId, nowIso } from './helpers';

export interface DemoNotificationInput {
	title: string;
	body: string;
	audience: DemoNotificationAudience;
	pupitreIds: DemoPupitreId[];
	profileIds: string[];
}

export function sendNotification(
	actorProfileId: string,
	input: DemoNotificationInput
): DemoNotification {
	const actor = actorFor(actorProfileId);
	const audience =
		input.audience === 'pupitre' ? 'pupitre' : input.audience === 'profiles' ? 'profiles' : 'all';

	if (!canNotify(actor, audience === 'all' ? 'all' : 'pupitre', input.pupitreIds)) {
		throw new DemoPermissionError(
			'Vous ne pouvez notifier que vos pupitres, ou l’ensemble du bagad si vous êtes secrétaire.'
		);
	}
	if (!isNonEmpty(input.title, 3) || !isNonEmpty(input.body, 5)) {
		throw new DemoPermissionError('Le titre et le message sont obligatoires.');
	}

	const audienceIds =
		audience === 'pupitre'
			? [...new Set(input.pupitreIds)]
			: audience === 'profiles'
				? [...new Set(input.profileIds)]
				: [];
	if (audience !== 'all' && audienceIds.length === 0) {
		throw new DemoPermissionError('Choisissez au moins un destinataire.');
	}

	const notification: DemoNotification = {
		id: nextId('n', demo.notifications),
		title: input.title.trim(),
		body: input.body.trim(),
		createdAt: nowIso(),
		audience,
		audienceIds,
		sentBy: actor.id,
		readBy: [actor.id]
	};
	demo.notifications = [notification, ...demo.notifications];
	demo.persist();
	return notification;
}

/** Destinataires réels d’une notification, calculés à partir des profils. */
export function notificationRecipients(notification: DemoNotification): DemoProfile[] {
	if (notification.audience === 'all') return demo.profiles;
	if (notification.audience === 'profiles') {
		return demo.profiles.filter((profile) => notification.audienceIds.includes(profile.id));
	}
	return demo.profiles.filter((profile) =>
		profile.pupitres.some((pupitre) => notification.audienceIds.includes(pupitre.pupitreId))
	);
}

export function notificationsFor(profileId: string): DemoNotification[] {
	const profile = demo.profiles.find((item) => item.id === profileId);
	if (!profile) return [];
	const preferences = demo.preferences.find((item) => item.profileId === profileId);
	return demo.notifications
		.filter((notification) => {
			if (notification.audience === 'all') return preferences?.global !== false;
			if (notification.audience === 'profiles') return notification.audienceIds.includes(profileId);
			if (preferences?.events === false) return false;
			return profile.pupitres.some((pupitre) =>
				notification.audienceIds.includes(pupitre.pupitreId)
			);
		})
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isRead(notification: DemoNotification, profileId: string): boolean {
	return notification.readBy.includes(profileId);
}

export function markRead(profileId: string, notificationId: string): void {
	const notification = demo.notifications.find((item) => item.id === notificationId);
	if (!notification) throw new DemoPermissionError('Notification introuvable.');
	if (!notification.readBy.includes(profileId)) {
		notification.readBy.push(profileId);
		demo.persist();
	}
}

export function markUnread(profileId: string, notificationId: string): void {
	const notification = demo.notifications.find((item) => item.id === notificationId);
	if (!notification) throw new DemoPermissionError('Notification introuvable.');
	notification.readBy = notification.readBy.filter((id) => id !== profileId);
	demo.persist();
}

export function markAllRead(profileId: string): void {
	for (const notification of notificationsFor(profileId)) {
		if (!notification.readBy.includes(profileId)) notification.readBy.push(profileId);
	}
	demo.persist();
}

export function unreadCount(profileId: string): number {
	return notificationsFor(profileId).filter(
		(notification) => !notification.readBy.includes(profileId)
	).length;
}

export function deleteNotification(actorProfileId: string, notificationId: string): void {
	const actor = actorFor(actorProfileId);
	if (actor.role !== 'admin' && actor.role !== 'secretaire') {
		throw new DemoPermissionError(
			'Seuls la secrétaire et l’administrateur peuvent supprimer une notification.'
		);
	}
	demo.notifications = demo.notifications.filter((item) => item.id !== notificationId);
	demo.persist();
}
