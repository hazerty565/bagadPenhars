import { member } from '../store.svelte';
import type { MemberSettings } from '../types';
import { actorOf, canManageSettings, MemberPermissionError } from '../permissions';

export async function updateSettings(
	_actorProfileId: string,
	settings: MemberSettings
): Promise<void> {
	if (!canManageSettings(actorOf(member.profile))) {
		throw new MemberPermissionError('Seul l’administrateur peut modifier les réglages.');
	}
	if (settings.notifyReminderDays < 0 || settings.notifyReminderDays > 30) {
		throw new MemberPermissionError('Le délai de rappel doit être compris entre 0 et 30 jours.');
	}
	await member.request('settings.update', {
		associationName: settings.associationName.trim(),
		email: settings.email.trim(),
		address: settings.address.trim(),
		website: settings.website.trim(),
		notifyOnEventCreate: settings.notifyOnEventCreate,
		notifyReminderDays: settings.notifyReminderDays
	});
}

export function storagePercent(): number {
	const settings = member.settings;
	if (settings.storageQuotaBytes <= 0) return 0;
	return Math.round((settings.storageUsedBytes / settings.storageQuotaBytes) * 100);
}
