import { db } from '$lib/server/db';
import { invitations, invitationPupitres, pupitres } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Gestion des invitations email à usage unique.
 *
 * Le jeton est empreinté (hash) avant stockage. Une invitation expire après
 * 1 heure. Elle ne peut être utilisée qu'une seule fois.
 */

export interface InvitationWithPupitres {
	id: string;
	email: string;
	token_hash: string;
	expires_at: Date;
	accepted_at: Date | null;
	created_by: string;
	created_at: Date;
	pupitres: { id: string; name: string }[];
}

/**
 * Crée une invitation. Le jeton en clair est retourné pour envoi par email,
 * seul l'empreinte est stockée en base.
 */
export async function createInvitation(data: {
	email: string;
	token: string; // jeton en clair, sera empreinté
	expiresAt: Date;
	createdBy: string;
	pupitreIds: string[];
}) {
	const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.token));
	const hashHex = Array.from(new Uint8Array(tokenHash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	const [invitation] = await db
		.insert(invitations)
		.values({
			email: data.email,
			token_hash: hashHex,
			expires_at: data.expiresAt,
			created_by: data.createdBy
		})
		.returning();

	if (data.pupitreIds.length > 0) {
		await db.insert(invitationPupitres).values(
			data.pupitreIds.map((pupitreId) => ({
				invitation_id: invitation.id,
				pupitre_id: pupitreId
			}))
		);
	}

	return invitation;
}

/**
 * Valide une invitation par jeton et email.
 * Retourne l'invitation si valide et non expirée, null sinon.
 * Le jeton en clair est empreinté pour comparaison.
 */
export async function validateInvitation(token: string, email: string) {
	const tokenHash = Array.from(
		new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
	)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	const [invitation] = await db
		.select()
		.from(invitations)
		.where(and(eq(invitations.token_hash, tokenHash), eq(invitations.email, email)))
		.limit(1);

	if (!invitation) return null;
	if (invitation.accepted_at) return null;
	if (new Date(invitation.expires_at) < new Date()) return null;

	return invitation;
}

/**
 * Marque une invitation comme acceptée.
 */
export async function markInvitationAccepted(invitationId: string) {
	return db
		.update(invitations)
		.set({ accepted_at: new Date() })
		.where(eq(invitations.id, invitationId))
		.returning();
}

/**
 * Récupère les invitations avec leurs pupitres.
 */
export async function getInvitationsWithPupitres() {
	const allInvitations = await db.select().from(invitations);

	const result = await Promise.all(
		allInvitations.map(async (inv) => {
			const assigned = await db
				.select({
					id: pupitres.id,
					name: pupitres.name
				})
				.from(invitationPupitres)
				.innerJoin(pupitres, eq(invitationPupitres.pupitre_id, pupitres.id))
				.where(eq(invitationPupitres.invitation_id, inv.id));

			return { ...inv, pupitres: assigned };
		})
	);

	return result;
}

/**
 * Supprime une invitation (par exemple après création du compte).
 */
export async function deleteInvitation(invitationId: string) {
	return db.delete(invitations).where(eq(invitations.id, invitationId));
}

/**
 * Vérifie si une invitation existe déjà pour une adresse email et n'est pas encore expirée.
 */
export async function getPendingInvitationByEmail(email: string) {
	const [invitation] = await db
		.select()
		.from(invitations)
		.where(and(eq(invitations.email, email), eq(invitations.accepted_at, null as unknown as Date)))
		.limit(1);

	if (!invitation) return null;
	if (new Date(invitation.expires_at) < new Date()) return null;

	return invitation;
}
