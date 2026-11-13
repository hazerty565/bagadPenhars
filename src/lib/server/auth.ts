import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';

/**
 * Configuration centrale de Better Auth.
 *
 * Better Auth est l'autorité pour l'identité et les sessions (tables user,
 * session, account, verification). Les rôles et statuts métier restent dans
 * profiles.role et profiles.account_status — jamais dans user_metadata.
 *
 * L'adaptateur Drizzle est branché explicitement (décision : plus de `lucia`,
 * plus de passage de `db` brut).
 *
 * Ce module est réservé au serveur.
 */

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification
		}
	}),
	// Secret Better Auth : variable privée à définir en local et dans Cloudflare Pages.
	secret: process.env.BETTER_AUTH_SECRET,
	// URL publique de l'application ; fallback utile pour le déploiement Pages.
	baseURL: process.env.BETTER_AUTH_URL || 'https://bagadpenhars.pages.dev',
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async () => {
			// L'envoi réel est piloté par Resend via src/lib/server/email.ts
			// et les routes auth/ ; ce hook est laissé pour l'extensibilité.
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
	emailVerification: {
		sendVerificationEmail: async () => {
			// Piloté par Resend via les routes auth/
		}
	},
	advanced: {
		defaultCookieAttributes: {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			httpOnly: true
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)]
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
