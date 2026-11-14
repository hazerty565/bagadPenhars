import { json } from '@sveltejs/kit';
import { withUserContext } from '$lib/db';
import { MemberCommandError, runMemberCommand } from '$lib/server/member/commands';
import { buildMemberSnapshot } from '$lib/server/member/snapshot';
import { sendInvitationEmail } from '$lib/server/email';
import type { RequestHandler } from './$types';

/**
 * Exécution d'une commande de l'espace adhérents.
 *
 * Corps attendu : `{ action: string, payload?: unknown }`. La commande et la
 * reconstruction de l'instantané partagent la même transaction : une erreur
 * annule tout, et le client ne reçoit jamais un état intermédiaire.
 */

interface InvitationOutcome {
	email?: string;
	inviteUrl?: string;
}

function isInvitationOutcome(value: unknown): value is InvitationOutcome {
	return typeof value === 'object' && value !== null;
}

function isPgError(error: unknown): error is { code: string } {
	return typeof error === 'object' && error !== null && 'code' in error;
}

function statusOf(error: unknown): { status: number; code: string; message: string } {
	if (error instanceof MemberCommandError) {
		return { status: error.status, code: error.code, message: error.message };
	}
	if (isPgError(error)) {
		// 42501 : privilège refusé (RLS, fonction d'administration…).
		if (error.code === '42501') {
			return {
				status: 403,
				code: 'forbidden',
				message: 'Action non autorisée par la base de données.'
			};
		}
		// 23505 : violation d'unicité.
		if (error.code === '23505') {
			return { status: 409, code: 'conflict', message: 'Cet enregistrement existe déjà.' };
		}
	}
	return {
		status: 500,
		code: 'server_error',
		message: 'L’action n’a pas pu être enregistrée.'
	};
}

export const POST: RequestHandler = async ({ locals, request, url }) => {
	if (!locals.session || !locals.profile) {
		return json({ message: 'Session requise.', code: 'not_authenticated' }, { status: 401 });
	}
	if (locals.profile.account_status !== 'active') {
		return json({ message: 'Compte inactif.', code: 'account_inactive' }, { status: 403 });
	}
	if (!locals.db) {
		return json({ message: 'Base de données indisponible.' }, { status: 503 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Requête illisible.', code: 'invalid_body' }, { status: 400 });
	}

	const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
	const action = typeof record.action === 'string' ? record.action : '';
	if (!action) {
		return json({ message: 'Action manquante.', code: 'invalid_body' }, { status: 400 });
	}

	const profileId = locals.profile.id;

	try {
		const outcome = await withUserContext(locals.db, profileId, async (tx) => {
			const result = await runMemberCommand(
				tx,
				{ profileId, origin: url.origin },
				action,
				record.payload ?? {}
			);
			const snapshot = await buildMemberSnapshot(tx, profileId);
			return { result, snapshot };
		});

		if (
			(action === 'invitation.create' || action === 'invitation.resend') &&
			isInvitationOutcome(outcome.result) &&
			outcome.result.email &&
			outcome.result.inviteUrl
		) {
			const { email, inviteUrl } = outcome.result;
			try {
				await sendInvitationEmail(email, inviteUrl);
			} catch (error) {
				// L'invitation reste valable : « Renvoyer » régénère un jeton.
				console.error('Envoi de l’e-mail d’invitation impossible :', error);
			}
		}

		return json({ snapshot: outcome.snapshot, result: outcome.result ?? null });
	} catch (error) {
		const { status, code, message } = statusOf(error);
		if (status >= 500) console.error(`Commande membre « ${action} » en échec :`, error);
		return json({ message, code }, { status });
	}
};
