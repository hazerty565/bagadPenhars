import { betterAuth } from 'better-auth';
import { db } from '@/lib/db';
import { generateId } from 'lucia';

/**
 * Configuration centrale de Better Auth.
 *
 * Better Auth est l'autorité pour l'identité et les sessions (tables user,
 * session, account, verification). Les rôles et statuts métier restent dans
 * profiles.role et profiles.account_status — jamais dans user_metadata.
 *
 * Ce module est réservé au serveur.
 */

export const auth = betterAuth({
	database: db,
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetEmail: async ({ user, url }) => {
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
		enabled: true,
		sendVerificationEmail: async ({ user, url }) => {
			// Piloté par Resend via les routes auth/
		}
	},
	account: {
		linkProviders: []
	},
	advanced: {
		generateId: () => generateId(16),
		defaultCookieAttributes: {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			httpOnly: true
		}
	}
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
