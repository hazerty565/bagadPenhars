import { demo } from '../store.svelte';
import type { DemoSettings } from '../types';
import { canManageSettings, DemoPermissionError } from '../permissions';
import { actorFor } from './helpers';

export function updateSettings(actorProfileId: string, settings: DemoSettings): void {
	const actor = actorFor(actorProfileId);
	if (!canManageSettings(actor)) {
		throw new DemoPermissionError('Seul l’administrateur peut modifier les réglages.');
	}
	if (settings.notifyReminderDays < 0 || settings.notifyReminderDays > 30) {
		throw new DemoPermissionError('Le délai de rappel doit être compris entre 0 et 30 jours.');
	}
	demo.settings = { ...settings, associationName: settings.associationName.trim() };
	demo.persist();
}

export function storagePercent(): number {
	return Math.round((demo.settings.storageUsedBytes / demo.settings.storageQuotaBytes) * 100);
}
