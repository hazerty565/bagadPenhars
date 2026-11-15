import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import type { DB } from '$lib/db';
import * as schema from '$lib/db/schema';
import { sendEmail } from '$lib/server/email';
import { serverEnv } from '$lib/server/env';

/**
 * Configuration centrale de Better Auth.
 *
 * Better Auth est l'autorité pour l'identité et les sessions (tables user,
 * session, account, verification). Les rôles et statuts métier restent dans
 * profiles.role et profiles.account_status — jamais dans user_metadata.
 *
 * L'instance est créée par requête avec la connexion Drizzle de la requête :
 * sur Cloudflare, les objets d'E/S ne peuvent pas être partagés entre
 * requêtes. `getAuth()` retrouve l'instance placée dans `event.locals` par le
 * hook serveur.
 *
 * Ce module est réservé au serveur.
 */

type Env = Record<string, unknown> | undefined;

function readEnv(env: Env, key: string): string | undefined {
	const fromPlatform = env?.[key];
	if (typeof fromPlatform === 'string' && fromPlatform.length > 0) return fromPlatform;
	return serverEnv(key);
}

export function createAuth(db: DB, env?: Env) {
	const secret = readEnv(env, 'BETTER_AUTH_SECRET') ?? readEnv(env, 'BETTER_AUTH_API_KEY');
	if (!secret || secret.length < 32) {
		throw new Error('BETTER_AUTH_SECRET est absent ou trop court (32 caractères minimum).');
	}

	const baseURL = readEnv(env, 'BETTER_AUTH_URL') ?? 'http://localhost:5173';
	const secureCookies = baseURL.startsWith('https://');

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification
			}
		}),
		secret,
		baseURL,
		trustedOrigins: [baseURL],
		emailAndPassword: {
			enabled: true,
			// L'inscription publique est fermée : seuls les administrateurs et
			// secrétaires invitent, et l'acceptation crée le compte côté serveur.
			disableSignUp: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				await sendEmail({
					to: user.email,
					subject: 'Réinitialisation de votre mot de passe — Bagad Penhars',
					html: `<p>Bonjour ${user.name},</p>
<p>Pour choisir un nouveau mot de passe, ouvrez ce lien :</p>
<p><a href="${url}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire rapidement. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
					text: `Bonjour ${user.name},\n\nRéinitialisez votre mot de passe : ${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`
				});
			}
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				await sendEmail({
					to: user.email,
					subject: 'Confirmez votre adresse — Bagad Penhars',
					html: `<p>Bonjour ${user.name},</p>
<p>Confirmez votre adresse e-mail pour activer votre compte :</p>
<p><a href="${url}">Confirmer mon adresse</a></p>`,
					text: `Bonjour ${user.name},\n\nConfirmez votre adresse : ${url}`
				});
			}
		},
		session: {
			expiresIn: 60 * 60 * 24 * 30, // 30 jours
			updateAge: 60 * 60 * 24, // 1 jour
			cookieCache: {
				enabled: true,
				maxAge: 60 * 60 // 1 heure
			}
		},
		advanced: {
			defaultCookieAttributes: {
				secure: secureCookies,
				sameSite: 'lax',
				path: '/',
				httpOnly: true
			}
		},
		plugins: [sveltekitCookies(getRequestEvent)]
	});
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Retourne l'instance Better Auth de la requête courante. Le hook serveur
 * l'a créée avec la connexion Drizzle associée.
 */
export function getAuth(): Auth {
	const event = getRequestEvent();
	if (!event.locals.auth) {
		throw new Error("L'instance Better Auth n'est pas initialisée pour cette requête.");
	}
	return event.locals.auth;
}
