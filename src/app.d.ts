// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AppRole, AccountStatus } from '$lib/auth/roles';
import type { Profile } from '$lib/auth/guards';

declare global {
	namespace App {
		interface Locals {
			auth: { session: { user: { id: string } } } | null;
			profile: Profile | null;
			role: AppRole | null;
			accountStatus: AccountStatus | null;
		}
		interface PageData {}
		interface PageState {}
		interface Platform {}
	}
}

export {};
