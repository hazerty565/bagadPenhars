// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('better-auth').$Infer.SessionUser | null;
			session: import('better-auth').$Infer.Session | null;
			/** Rôle métier — TOUJOURS lu en BDD (profiles.role). */
			role: import('$lib/auth/roles').Role | null;
			/** Statut du compte (pending | active | suspended). */
			accountStatus: import('$lib/auth/roles').AccountStatus | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
