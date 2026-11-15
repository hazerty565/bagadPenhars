/**
 * Notifications push OneSignal — côté serveur uniquement.
 *
 * La clé REST OneSignal ne doit jamais être exposée au navigateur.
 * L'envoi vérifie le rôle de l'expéditeur :
 * - secrétaire : plusieurs pupitres
 * - chef de pupitre : son pupitre uniquement
 * - admin : global
 */

import { serverEnv } from '$lib/server/env';

export interface OneSignalConfig {
	appId: string;
	restApiKey: string;
}

let config: OneSignalConfig | null = null;

function getConfig(): OneSignalConfig {
	if (!config) {
		const appId = serverEnv('ONESIGNAL_APP_ID');
		const restApiKey = serverEnv('ONESIGNAL_REST_API_KEY');
		if (!appId || !restApiKey) {
			throw new Error("OneSignal n'est pas configuré (ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY).");
		}
		config = { appId, restApiKey };
	}
	return config;
}

/**
 * Envoie une notification push via OneSignal.
 *
 * @param playerIds - Identifiants OneSignal des appareils cibles (fournis par le front-end, validés côté serveur)
 * @param title - Titre de la notification
 * @param message - Contenu de la notification
 * @param url - URL à ouvrir après clic (optionnel)
 */
export async function sendPushNotification(params: {
	playerIds: string[];
	title: string;
	message: string;
	url?: string;
}) {
	const { appId, restApiKey } = getConfig();

	const response = await fetch('https://onesignal.com/api/v1/notifications', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${restApiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			app_id: appId,
			include_player_ids: params.playerIds,
			headings: { en: params.title, fr: params.title },
			contents: { en: params.message, fr: params.message },
			url: params.url
		})
	});

	if (!response.ok) {
		throw new Error(`Échec OneSignal : ${response.status} ${await response.text()}`);
	}

	return response.json();
}

/**
 * Résout les identifiants de notification autorisés pour un rôle donné.
 * Les identifiants de pupitre soumis par le navigateur ne sont jamais crus.
 */
export function resolveAudience(
	role: string | null,
	userPupitreIds: string[],
	claimedPupitreIds: string[]
): string[] {
	if (role === 'admin') {
		// Admin : audience globale (tous les joueurs)
		return userPupitreIds; // placeholder - à adapter selon la logique métier
	}
	if (role === 'secretaire') {
		// Secrétaire : plusieurs pupitres autorisés
		return claimedPupitreIds.filter((id) => userPupitreIds.includes(id));
	}
	if (role === 'chef_pupitre') {
		// Chef : uniquement ses pupitres
		return claimedPupitreIds.filter((id) => userPupitreIds.includes(id));
	}
	return [];
}
