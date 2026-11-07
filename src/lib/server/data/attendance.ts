import { db } from '$lib/server/db';
import {
	eventResponses,
	events,
	profiles
} from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Accès aux données des réponses de présence/absence aux événements.
 *
 * Chaque fonction établit le contexte RLS via set_config(..., true) avant les
 * requêtes métier. L'identité du répondant provient de la session Better Auth
 * (validée par le guard), jamais du client.
 */

/**
 * Contexte d'acteur requis par les fonctions de données.
 */
export interface Actor {
	profileId: string;
	role: string;
}

/**
 * Établit le contexte RLS pour l'acteur donné.
 */
export async function setRLSContext(tx: typeof db, actor: Actor) {
	await tx.execute`SELECT set_config('app.user_id', ${actor.profileId}, true)`;
	await tx.execute`SELECT set_config('app.user_role', ${actor.role}, true)`;
}

/**
 * Récupère toutes les réponses d'un événement.
 * L'appelant vérifie les permissions (guard) avant l'appel.
 */
export async function listResponses(eventId: string) {
	return db
		.select({
			id: eventResponses.id,
			profile_id: eventResponses.profile_id,
			status: eventResponses.status,
			created_at: eventResponses.created_at,
			updated_at: eventResponses.updated_at,
			first_name: profiles.first_name,
			last_name: profiles.last_name,
			email: profiles.email
		})
		.from(eventResponses)
		.leftJoin(profiles, eq(eventResponses.profile_id, profiles.id))
		.where(eq(eventResponses.event_id, eventId));
}

/**
 * Récupère la réponse d'un profil à un événement.
 */
export async function getResponse(eventId: string, profileId: string) {
	const [response] = await db
		.select()
		.from(eventResponses)
		.where(
			and(
				eq(eventResponses.event_id, eventId),
				eq(eventResponses.profile_id, profileId)
			)
		)
		.limit(1);
	return response ?? null;
}

/**
 * Crée ou met à jour la réponse d'un profil à un événement (upsert).
 * Seul son propre profil peut être mis à jour (vérifié en amont par le guard).
 */
export async function upsertResponse(actor: Actor, data: {
	eventId: string;
	profileId: string;
	status: 'present' | 'absent';
}) {
	if (data.profileId !== actor.profileId) {
		throw new Error('Vous ne pouvez répondre que pour votre propre profil.');
	}

	return db.transaction(async (tx) => {
		await setRLSContext(tx, actor);

		const existing = await getResponse(data.eventId, data.profileId);

		if (existing) {
			return tx
				.update(eventResponses)
				.set({ status: data.status, updated_at: new Date() })
				.where(eq(eventResponses.id, existing.id))
				.returning();
		}

		return tx.insert(eventResponses).values({
			event_id: data.eventId,
			profile_id: data.profileId,
			status: data.status
		});
	});
}

/**
 * Récupère les réponses d'un profil (pour son historique personnel).
 * L'appelant vérifie les permissions (guard) avant l'appel.
 */
export async function listResponsesByProfile(profileId: string) {
	return db
		.select({
			id: eventResponses.id,
			event_id: eventResponses.event_id,
			status: eventResponses.status,
			created_at: eventResponses.created_at,
			updated_at: eventResponses.updated_at,
			title: events.title,
			event_date: events.event_date,
			visibility: events.visibility
		})
		.from(eventResponses)
		.innerJoin(events, eq(eventResponses.event_id, events.id))
		.where(eq(eventResponses.profile_id, profileId));
}
