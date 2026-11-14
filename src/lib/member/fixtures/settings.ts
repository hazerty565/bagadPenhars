import type { DemoPreferences, DemoProfile, DemoSettings } from '../types';
import { DEMO_PROFILES } from './profiles';

/** Préférences par défaut de chaque profil fictif. */
export function defaultPreferences(profile: DemoProfile): DemoPreferences {
	return {
		profileId: profile.id,
		global: true,
		reminders: true,
		events: true
	};
}

export const DEMO_PREFERENCES: DemoPreferences[] = DEMO_PROFILES.map((profile) => {
	const preferences = defaultPreferences(profile);
	if (profile.id === 'p06') preferences.reminders = false;
	if (profile.id === 'p10') preferences.global = false;
	if (profile.id === 'p15') preferences.events = false;
	return preferences;
});

/** Réglages fictifs de l’association. Aucune donnée sensible. */
export const DEMO_SETTINGS: DemoSettings = {
	associationName: 'Bagad Penhars',
	email: 'contact@bagad-penhars.com',
	address: 'Espace Chaptal, 6 avenue des Oiseaux, 29000 Quimper',
	website: 'https://bagad-penhars.com',
	storageUsedBytes: 5_771_038_720,
	storageQuotaBytes: 8_589_934_592,
	storageAlertBytes: 7_516_192_768,
	notifyOnEventCreate: true,
	notifyReminderDays: 3
};
