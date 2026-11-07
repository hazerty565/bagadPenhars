import { db } from '$lib/server/db';
import {
	events,
	eventPupitres,
	eventResponses,
	profiles,
	pupitres
} from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Accès aux données des événements et sondages (events.is_poll).
 *
 * Chaque fonction établit le contexte RLS via set_config(..., true) avant les
 * requêtes métier, dans la même transaction lorsque plusieurs requêtes sont
 * nécessaires. L'identité de l'acteur provient de la session Better Auth
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
 * Établit le contexte RLS pour l'acteur donné dans le cadre d'une transaction.
 */
export async function setRLSContextInTx(
	tx: typeof db,
	actor: Actor
) {
	await tx.execute`SELECT set_config('app.user_id', ${actor.profileId}, true)`;
	await tx.execute`SELECT set_config('app.user_role', ${actor.role}, true)`;
}

/**
 * Liste des événements visibles pour l'utilisateur, selon son rôle et ses
 * pupitres. L'appelant est responsable du guard d'autorisation avant l'appel.
 */
export async function listEvents(actor: Actor, options?: {
	visibility?: 'public' | 'interne' | 'pupitre';
	includePast?: boolean;
	limit?: number;
}) {
	const visibility = options?.visibility;
	const includePast = options?.includePast ?? false;
	const limit = options?.limit;

	return db.transaction(async (tx) => {
		await setRLSContextInTx(tx, actor);

		let q = tx
			.select({
				id: events.id,
				title: events.title,
				description: events.description,
				event_date: events.event_date,
				event_type: events.event_type,
				visibility: events.visibility,
				is_poll: events.is_poll,
				created_by: events.created_by,
				created_at: events.created_at,
				updated_at: events.updated_at
			})
			.from(events);

		if (visibility) {
			q = q.where(eq(events.visibility, visibility));
		}

		if (!includePast) {
			const today = new Date().toISOString().slice(0, 10);
			q = q.where(and(eq(events.event_date, today)));
		}

		q = q.orderBy(desc(events.event_date));

		if (limit) {
			q = q.limit(limit);
		}

		return q;
	});
}

/**
 * Récupère un événement par son identifiant avec ses pupitres ciblés.
 * L'appelant vérifie les permissions avant l'appel (guard).
 */
export async function getEventById(eventId: string) {
	const [event] = await db
		.select()
		.from(events)
		.where(eq(events.id, eventId))
		.limit(1);

	if (!event) return null;

	const assigned = await db
		.select({
			id: pupitres.id,
			name: pupitres.name
		})
		.from(eventPupitres)
		.innerJoin(pupitres, eq(eventPupitres.pupitre_id, pupitres.id))
		.where(eq(eventPupitres.event_id, eventId));

	return { ...event, pupitres: assigned };
}

/**
 * Crée un événement avec ses pupitres ciblés. Retourne l'événement créé.
 * L'acteur doit être authentifié et autorisé (vérifié par le guard).
 */
export async function createEvent(actor: Actor, data: {
	title: string;
	description?: string;
	eventDate: Date;
	eventType: string;
	visibility: 'public' | 'interne' | 'pupitre';
	isPoll?: boolean;
	pupitreIds?: string[];
}) {
	return db.transaction(async (tx) => {
		await setRLSContextInTx(tx, actor);

		const [event] = await tx
			.insert(events)
			.values({
				title: data.title,
				description: data.description ?? null,
				event_date: data.eventDate,
				event_type: data.eventType as any,
				visibility: data.visibility,
				is_poll: data.isPoll ?? false,
				created_by: actor.profileId
			})
			.returning();

		if (data.pupitreIds && data.pupitreIds.length > 0) {
			await tx.insert(eventPupitres).values(
				data.pupitreIds.map((pupitreId) => ({
					event_id: event.id,
					pupitre_id: pupitreId
				}))
			);
		}

		return event;
	});
}

/**
 * Met à jour un événement. L'acteur doit être autorisé (guard).
 */
export async function updateEvent(
	actor: Actor,
	eventId: string,
	data: {
		title?: string;
		description?: string;
		eventDate?: Date;
		eventType?: string;
		visibility?: 'public' | 'interne' | 'pupitre';
		isPoll?: boolean;
		pupitreIds?: string[]; // si fourni, remplace les affectations
	}
) {
	return db.transaction(async (tx) => {
		await setRLSContextInTx(tx, actor);

		const updates: Record<string, unknown> = {};
		if (data.title !== undefined) updates.title = data.title;
		if (data.description !== undefined) updates.description = data.description;
		if (data.eventDate !== undefined) updates.event_date = data.eventDate;
		if (data.eventType !== undefined) updates.event_type = data.eventType;
		if (data.visibility !== undefined) updates.visibility = data.visibility;
		if (data.isPoll !== undefined) updates.is_poll = data.isPoll;
		updates.updated_at = new Date();

		const [event] = await tx
			.update(events)
			.set(updates)
			.where(eq(events.id, eventId))
			.returning();

		if (data.pupitreIds !== undefined) {
			await tx.delete(eventPupitres).where(eq(eventPupitres.event_id, eventId));
			if (data.pupitreIds.length > 0) {
				await tx.insert(eventPupitres).values(
					data.pupitreIds.map((pupitreId) => ({
						event_id: eventId,
						pupitre_id: pupitreId
					}))
				);
			}
		}

		return event;
	});
}

/**
 * Supprime un événement et ses affectations de pupitre. L'acteur doit être
 * autorisé (guard).
 */
export async function deleteEvent(actor: Actor, eventId: string) {
	return db.transaction(async (tx) => {
		await setRLSContextInTx(tx, actor);
		await tx.delete(eventPupitres).where(eq(eventPupitres.event_id, eventId));
		return tx.delete(events).where(eq(events.id, eventId));
	});
}

/**
 * Récupère les réponses à un événement (pour l'affichage du tableau de bord).
 * L'appelant vérifie les permissions (guard).
 */
export async function getEventResponses(eventId: string) {
	return db
		.select({
			id: eventResponses.id,
			profile_id: eventResponses.profile_id,
			status: eventResponses.status,
			created_at: eventResponses.created_at,
			updated_at: eventResponses.updated_at,
			first_name: profiles.first_name,
			last_name: profiles.last_name
		})
		.from(eventResponses)
		.leftJoin(profiles, eq(eventResponses.profile_id, profiles.id))
		.where(eq(eventResponses.event_id, eventId));
}

/**
 * Récupère la réponse d'un profil à un événement.
 */
export async function getResponseByEventAndProfile(eventId: string, profileId: string) {
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
 * L'identité du répondant vient de la session (profileId), jamais du client.
 */
export async function upsertResponse(actor: Actor, data: {
	eventId: string;
	profileId: string;
	status: 'present' | 'absent';
}) {
	// On ne permet de répondre que pour son propre profil (guard vérifié en amont).
	if (data.profileId !== actor.profileId) {
		throw new Error('Vous ne pouvez répondre que pour votre propre profil.');
	}

	const existing = await getResponseByEventAndProfile(
		data.eventId,
		data.profileId
	);

	if (existing) {
		return db
			.update(eventResponses)
			.set({ status: data.status, updated_at: new Date() })
			.where(eq(eventResponses.id, existing.id))
			.returning();
	}

	return db.insert(eventResponses).values({
		event_id: data.eventId,
		profile_id: data.profileId,
		status: data.status
	});
}
