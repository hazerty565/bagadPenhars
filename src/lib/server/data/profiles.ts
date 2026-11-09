import { db } from '$lib/server/db';
import { profiles, profilePupitres, pupitres } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Accès aux données des profils membres.
 *
 * Toutes les fonctions établissent le contexte RLS via set_config(..., true)
 * avant les requêtes métier, dans la même transaction.
 */

export interface ProfileWithPupitres {
	id: string;
	auth_user_id: string;
	email: string;
	first_name: string;
	last_name: string;
	role: string;
	account_status: string;
	phone: string | null;
	address: string | null;
	musician_level: string | null;
	bureau_position_id: string | null;
	avatar_url: string | null;
	email_confirmed: boolean;
	created_at: Date;
	updated_at: Date;
	pupitres: {
		id: string;
		name: string;
		is_chef: boolean;
	}[];
}

/**
 * Récupère un profil par son identifiant (Better Auth user id).
 * Le contexte RLS doit déjà être établi par l'appelant.
 */
export async function getProfileByAuthUserId(authUserId: string) {
	return db.select().from(profiles).where(eq(profiles.auth_user_id, authUserId)).limit(1);
}

/**
 * Récupère un profil complet avec ses affectations de pupitre.
 */
export async function getProfileWithPupitres(
	profileId: string
): Promise<ProfileWithPupitres | null> {
	const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);

	if (!profile) return null;

	const pupitreAssignments = await db
		.select({
			id: pupitres.id,
			name: pupitres.name,
			is_chef: profilePupitres.is_chef
		})
		.from(profilePupitres)
		.innerJoin(pupitres, eq(profilePupitres.pupitre_id, pupitres.id))
		.where(eq(profilePupitres.profile_id, profileId));

	return {
		...profile,
		pupitres: pupitreAssignments
	};
}

/**
 * Met à jour les champs modifiables d'un profil (hors rôle et pupitres).
 * Le contexte RLS et l'identifiant de l'acteur doivent être établis par l'appelant.
 */
export async function updateOwnProfile(
	profileId: string,
	updates: Partial<
		Pick<
			typeof profiles.$inferInsert,
			'first_name' | 'last_name' | 'phone' | 'address' | 'musician_level' | 'bureau_position_id'
		>
	>
) {
	return db
		.update(profiles)
		.set({ ...updates, updated_at: new Date() })
		.where(eq(profiles.id, profileId))
		.returning();
}

/**
 * Crée un profil associé à un utilisateur Better Auth.
 * account_status = 'pending', role = 'member' par défaut.
 */
export async function createProfile(data: {
	authUserId: string;
	email: string;
	firstName: string;
	lastName: string;
}) {
	return db.insert(profiles).values({
		auth_user_id: data.authUserId,
		email: data.email,
		first_name: data.firstName,
		last_name: data.lastName,
		role: 'member',
		account_status: 'pending'
	});
}

/**
 * Active un compte (passage pending -> active). Réservé à admin/secretaire.
 * Le contexte RLS de l'acteur doit être établi.
 */
export async function activateProfile(profileId: string) {
	return db
		.update(profiles)
		.set({ account_status: 'active', updated_at: new Date() })
		.where(eq(profiles.id, profileId))
		.returning();
}

/**
 * Suspend un compte. Réservé à admin/secretaire.
 */
export async function suspendProfile(profileId: string) {
	return db
		.update(profiles)
		.set({ account_status: 'suspended', updated_at: new Date() })
		.where(eq(profiles.id, profileId))
		.returning();
}

/**
 * Établit le contexte RLS pour l'utilisateur donné.
 * À appeler en début de transaction, avec le troisième argument true pour
 * limiter le contexte à la transaction (connexion poolée).
 */
export async function setRLSContext(userId: string, userRole: string) {
	await db.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
	await db.execute(sql`SELECT set_config('app.user_role', ${userRole}, true)`);
}
