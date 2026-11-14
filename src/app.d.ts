// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AppRole, AccountStatus } from '$lib/auth/roles';
import type { Profile } from '$lib/auth/guards';
import type { DB } from '$lib/db';
import type { Auth } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			/** Connexion Drizzle du rôle applicatif `bagad_app`, ouverte pour la requête. */
			db: DB | null;
			/** Instance Better Auth liée à la connexion de la requête. */
			auth: Auth | null;
			/** Session Better Auth vérifiée, ou null. */
			session: { user?: { id: string; email?: string } } | null;
			profile: Profile | null;
			role: AppRole | null;
			accountStatus: AccountStatus | null;
			user: Profile | null;
		}
		interface PageData {}
		interface PageState {}
		interface Platform {
			env?: {
				/** Binding Cloudflare Hyperdrive vers la branche Neon de l'environnement. */
				HYPERDRIVE?: { connectionString: string };
				BETTER_AUTH_SECRET?: string;
				BETTER_AUTH_URL?: string;
				[key: string]: unknown;
			};
			ctx?: unknown;
			caches?: unknown;
		}
	}
}

export {};
