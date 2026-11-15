/**
 * Vérification Cloudflare Turnstile côté serveur.
 *
 * La clé secrète reste dans les variables d'environnement Cloudflare Pages et
 * n'est jamais exposée au navigateur. Ce module est réservé au serveur.
 *
 * Documentation : https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

import { serverEnv } from '$lib/server/env';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileResult =
	| { ok: true }
	| { ok: false; reason: 'unconfigured' | 'rejected' | 'unreachable' };

interface SiteverifyResponse {
	success?: boolean;
	'error-codes'?: string[];
}

/**
 * Valide un jeton Turnstile.
 *
 * Échoue de manière fermée : une configuration absente, un réseau injoignable
 * ou une réponse ambiguë de Cloudflare refusent l'envoi. Mieux vaut perdre un
 * message légitime (l'expéditeur peut écrire directement) que laisser passer du
 * spam.
 */
export async function verifyTurnstile(
	token: string | undefined,
	remoteIp?: string
): Promise<TurnstileResult> {
	const secret = serverEnv('TURNSTILE_SECRET_KEY');
	if (!secret) {
		console.error('[contact] TURNSTILE_SECRET_KEY absent : envoi refusé.');
		return { ok: false, reason: 'unconfigured' };
	}

	if (!token) {
		return { ok: false, reason: 'rejected' };
	}

	const body = new URLSearchParams({ secret, response: token });
	if (remoteIp) body.set('remoteip', remoteIp);

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			body,
			headers: { 'content-type': 'application/x-www-form-urlencoded' }
		});

		if (!response.ok) {
			console.error(`[contact] siteverify a répondu ${response.status}.`);
			return { ok: false, reason: 'unreachable' };
		}

		const result = (await response.json()) as SiteverifyResponse;
		if (result.success === true) return { ok: true };

		console.warn('[contact] Turnstile a refusé le jeton :', result['error-codes'] ?? 'sans détail');
		return { ok: false, reason: 'rejected' };
	} catch (error) {
		console.error('[contact] siteverify injoignable :', error);
		return { ok: false, reason: 'unreachable' };
	}
}

/** Adresse IP du visiteur, telle que Cloudflare la transmet. */
export function clientIp(request: Request): string | undefined {
	return request.headers.get('cf-connecting-ip') ?? undefined;
}
