/**
 * Erreurs des lectures ciblées de l'espace adhérents (étapes 58 à 73).
 *
 * Elles ne sont pas des erreurs HTTP : le `+*.server.ts` appelant les traduit
 * en `403`/`404`. Les codes permettent au caller de distinguer les cas sans
 * interpréter le texte du message.
 */

export class MemberQueryError extends Error {
	readonly code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = 'MemberQueryError';
		this.code = code;
	}
}

export const QueryErrorCode = {
	PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
	ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
	INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
	NOT_CHEF_OF_PUPITRE: 'NOT_CHEF_OF_PUPITRE'
} as const;
