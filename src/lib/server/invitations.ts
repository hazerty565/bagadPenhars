import { createHash, randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import { withAdminDatabase } from './db-admin';
import {
	account,
	invitationPupitres,
	invitations,
	profilePupitres,
	profiles,
	pupitres,
	user
} from '$lib/db/schema';

/**
 * Flux d'invitation.
 *
 * Les invitations sont lues et consommées avec la connexion propriétaire :
 * `bagad_app` n'a pas le droit de lire les invitations d'un tiers, et la
 * création du compte Better Auth précède toute session.
 *
 * Le jeton est stocké haché (SHA-256). Le lien contient le jeton en clair et
 * l'adresse e-mail ; l'acceptation crée le compte Better Auth, le profil
 * `pending` et les affectations de pupitre, puis marque l'invitation acceptée.
 * Un administrateur ou la secrétaire active ensuite le compte.
 */

export interface InvitationDetails {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	expiresAt: Date;
	pupitres: { id: string; name: string; slug: string }[];
}

export class InvitationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvitationError';
	}
}

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function validateInvitationToken(
	platform: App.Platform | undefined,
	token: string,
	email?: string
): Promise<InvitationDetails | null> {
	if (!token) return null;
	const tokenHash = hashToken(token);

	return withAdminDatabase(platform, async ({ db }) => {
		const rows = await db
			.select()
			.from(invitations)
			.where(eq(invitations.token_hash, tokenHash))
			.limit(1);
		const invitation = rows[0];
		if (!invitation) return null;
		if (invitation.accepted_at || invitation.cancelled_at) return null;
		if (invitation.expires_at.getTime() < Date.now()) return null;
		if (email && invitation.email.toLowerCase() !== email.toLowerCase()) return null;

		const assigned = await db
			.select({ id: pupitres.id, name: pupitres.name, slug: pupitres.slug })
			.from(invitationPupitres)
			.innerJoin(pupitres, eq(invitationPupitres.pupitre_id, pupitres.id))
			.where(eq(invitationPupitres.invitation_id, invitation.id));

		return {
			id: invitation.id,
			email: invitation.email,
			firstName: invitation.first_name,
			lastName: invitation.last_name,
			expiresAt: invitation.expires_at,
			pupitres: assigned
		};
	});
}

export async function acceptInvitation(
	platform: App.Platform | undefined,
	token: string,
	password: string
): Promise<{ email: string; firstName: string }> {
	const details = await validateInvitationToken(platform, token);
	if (!details) {
		throw new InvitationError("L'invitation est invalide, expirée ou déjà utilisée.");
	}
	if (password.length < 8) {
		throw new InvitationError('Le mot de passe doit contenir au moins huit caractères.');
	}

	const passwordHash = await hashPassword(password);
	const name = `${details.firstName} ${details.lastName}`.trim() || details.email;

	return withAdminDatabase(platform, async ({ db }) => {
		return db.transaction(async (tx) => {
			const existingUser = await tx
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, details.email))
				.limit(1);
			if (existingUser.length > 0) {
				throw new InvitationError(
					'Un compte existe déjà pour cette adresse. Connectez-vous ou demandez une réinitialisation.'
				);
			}

			const existingProfile = await tx
				.select({ id: profiles.id })
				.from(profiles)
				.where(eq(profiles.email, details.email))
				.limit(1);
			if (existingProfile.length > 0) {
				throw new InvitationError('Un profil existe déjà pour cette adresse.');
			}

			const userId = randomUUID();
			await tx.insert(user).values({
				id: userId,
				name,
				email: details.email,
				emailVerified: true
			});
			await tx.insert(account).values({
				id: randomUUID(),
				accountId: userId,
				providerId: 'credential',
				userId,
				password: passwordHash
			});

			const [profile] = await tx
				.insert(profiles)
				.values({
					auth_user_id: userId,
					email: details.email,
					first_name: details.firstName,
					last_name: details.lastName,
					role: 'member',
					account_status: 'pending',
					email_confirmed: true
				})
				.returning({ id: profiles.id });

			if (details.pupitres.length > 0) {
				await tx.insert(profilePupitres).values(
					details.pupitres.map((pupitre) => ({
						profile_id: profile.id,
						pupitre_id: pupitre.id,
						is_chef: false
					}))
				);
			}

			const updated = await tx
				.update(invitations)
				.set({ accepted_at: new Date() })
				.where(
					and(eq(invitations.id, details.id), eq(invitations.token_hash, hashToken(token)))
				)
				.returning({ id: invitations.id });
			if (updated.length === 0) {
				throw new InvitationError("L'invitation a déjà été consommée.");
			}

			return { email: details.email, firstName: details.firstName };
		});
	});
}
