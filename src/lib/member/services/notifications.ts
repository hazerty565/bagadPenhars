import { member } from '../store.svelte';
import type {
	MemberNotification,
	MemberNotificationAudience,
	MemberProfile,
	MemberPupitreId
} from '../types';
import { actorOf, canNotify, MemberPermissionError } from '../permissions';
import { isNonEmpty } from './helpers';

export interface MemberNotificationInput {
	title: string;
	body: string;
	audience: MemberNotificationAudience;
	pupitreIds: MemberPupitreId[];
	profileIds: string[];
}

export async function sendNotification(
	_actorProfileId: string,
	input: MemberNotificationInput
): Promise<void> {
	const actor = actorOf(member.profile);
	const audience =
		input.audience === 'pupitre' ? 'pupitre' : input.audience === 'profiles' ? 'profiles' : 'all';

	if (!canNotify(actor, audience === 'all' ? 'all' : 'pupitre', input.pupitreIds)) {
		throw new MemberPermissionError(
			'Vous ne pouvez notifier que vos pupitres, ou l’ensemble du bagad si vous êtes secrétaire.'
		);
	}
	if (!isNonEmpty(input.title, 3) || !isNonEmpty(input.body, 5)) {
		throw new MemberPermissionError('Le titre et le message sont obligatoires.');
	}

	const audienceIds =
		audience === 'pupitre'
			? [...new Set(input.pupitreIds)]
			: audience === 'profiles'
				? [...new Set(input.profileIds)]
				: [];
	if (audience !== 'all' && audienceIds.length === 0) {
		throw new MemberPermissionError('Choisissez au moins un destinataire.');
	}

	await member.request('notification.send', {
		title: input.title.trim(),
		body: input.body.trim(),
		audience,
		audienceIds
	});
}

/** Destinataires réels d'une notification, calculés à partir des profils visibles. */
export function notificationRecipients(notification: MemberNotification): MemberProfile[] {
	if (notification.audience === 'all') return member.profiles;
	if (notification.audience === 'profiles') {
		return member.profiles.filter((profile) => notification.audienceIds.includes(profile.id));
	}
	return member.profiles.filter((profile) =>
		profile.pupitres.some((pupitre) => notification.audienceIds.includes(pupitre.pupitreId))
	);
}

export function notificationsFor(profileId: string): MemberNotification[] {
	const profile = member.profiles.find((item) => item.id === profileId);
	if (!profile) return [];
	const preferences = member.preferences.find((item) => item.profileId === profileId);
	return member.notifications
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

export function isRead(notification: MemberNotification, profileId: string): boolean {
	return notification.readBy.includes(profileId);
}

export async function markRead(profileId: string, notificationId: string): Promise<void> {
	const notification = member.notifications.find((item) => item.id === notificationId);
	if (!notification) throw new MemberPermissionError('Notification introuvable.');
	if (notification.readBy.includes(profileId)) return;
	await member.request('notification.read', { notificationId });
}

export async function markUnread(profileId: string, notificationId: string): Promise<void> {
	const notification = member.notifications.find((item) => item.id === notificationId);
	if (!notification) throw new MemberPermissionError('Notification introuvable.');
	if (!notification.readBy.includes(profileId)) return;
	await member.request('notification.unread', { notificationId });
}

export async function markAllRead(profileId: string): Promise<void> {
	const unread = notificationsFor(profileId).filter(
		(notification) => !notification.readBy.includes(profileId)
	);
	if (unread.length === 0) return;
	await member.request('notification.readAll', {});
}

export function unreadCount(profileId: string): number {
	return notificationsFor(profileId).filter(
		(notification) => !notification.readBy.includes(profileId)
	).length;
}

export async function deleteNotification(
	_actorProfileId: string,
	notificationId: string
): Promise<void> {
	const role = member.profile.role;
	if (role !== 'admin' && role !== 'secretaire') {
		throw new MemberPermissionError(
			'Seuls la secrétaire et l’administrateur peuvent supprimer une notification.'
		);
	}
	await member.request('notification.delete', { notificationId });
}
