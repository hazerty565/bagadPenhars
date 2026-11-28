import { asc, eq } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { invitationPupitres, invitations, pupitres, profiles } from '$lib/db/schema';
import type { MemberInvitation } from '$lib/member/types';
import { MemberQueryError } from './errors';

export interface InvitationsPageData {
	invitations: MemberInvitation[];
}

/**
 * Liste les invitations avec leur statut calculé.
 *
 * Garde : secrétaire ou admin uniquement (requireRole avant l'appel).
 * Statut : cancelled / accepted / expired / pending (expires_at vs now).
 *
 * Requêtes : 1 (profil/statut) + 1 (invitations + créateur + pupitres) = 2.
 */
export async function listInvitationsPage(
	tx: Transaction,
	profileId: string
): Promise<InvitationsPageData> {
	// Relire le rôle et le statut dans la transaction (défense en profondeur)
	const profileRows = await tx
		.select({
			role: profiles.role,
			account_status: profiles.account_status
		})
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	if (!profileRows[0]) {
		throw new MemberQueryError('PROFILE_NOT_FOUND', 'Profil introuvable.');
	}

	if (profileRows[0].account_status !== 'active') {
		throw new MemberQueryError('ACCOUNT_INACTIVE', 'Compte non actif.');
	}

	const invitationRows = await tx
		.select({
			id: invitations.id,
			email: invitations.email,
			first_name: invitations.first_name,
			last_name: invitations.last_name,
			expires_at: invitations.expires_at,
			last_sent_at: invitations.last_sent_at,
			cancelled_at: invitations.cancelled_at,
			accepted_at: invitations.accepted_at,
			created_by: invitations.created_by,
			invited_by_first_name: profiles.first_name,
			invited_by_last_name: profiles.last_name
		})
		.from(invitations)
		.leftJoin(profiles, eq(invitations.created_by, profiles.id))
		.orderBy(asc(invitations.created_at));

	// Pupitres par invitation
	const pupitreRows = await tx
		.select({
			invitationId: invitationPupitres.invitation_id,
			pupitreId: pupitres.slug
		})
		.from(invitationPupitres)
		.innerJoin(pupitres, eq(invitationPupitres.pupitre_id, pupitres.id));

	const pupitreByInvitation = new Map<string, string[]>();
	for (const row of pupitreRows) {
		const list = pupitreByInvitation.get(row.invitationId) ?? [];
		list.push(row.pupitreId);
		pupitreByInvitation.set(row.invitationId, list);
	}

	const now = new Date();

	const invitationsList: MemberInvitation[] = invitationRows.map((row) => {
		let status: MemberInvitation['status'] = 'pending';
		if (row.cancelled_at) {
			status = 'cancelled';
		} else if (row.accepted_at) {
			status = 'accepted';
		} else if (row.expires_at && new Date(row.expires_at) < now) {
			status = 'expired';
		}

		const invitedBy =
			row.invited_by_first_name || row.invited_by_last_name
				? `${row.invited_by_first_name ?? ''} ${row.invited_by_last_name ?? ''}`.trim()
				: row.created_by;

		return {
			id: row.id,
			email: row.email,
			firstName: row.first_name,
			lastName: row.last_name,
			pupitreIds: (pupitreByInvitation.get(row.id) ?? []) as MemberInvitation['pupitreIds'],
			status,
			sentAt: toISOString(row.last_sent_at),
			expiresAt: toISOString(row.expires_at),
			invitedBy
		};
	});

	return { invitations: invitationsList };
}

function toISOString(value: Date | string | null | undefined): string {
	if (!value) return '';
	const d = typeof value === 'string' ? new Date(value) : value;
	return isNaN(d.getTime()) ? '' : d.toISOString();
}
