import { and, eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import {
	eventPupitres,
	events as eventsTable,
	eventResponses,
	profilePupitres,
	profiles,
	pupitres
} from '$lib/db/schema';
import type {
	EventDetailPageData,
	EventFormPageData,
	EventPageContext,
	MemberEventPageItem,
	MemberResponseStatus
} from '$lib/member/types';
import type { AppRole } from '$lib/auth/roles';

/**
 * Détail d'un événement pour la page d'affichage.
 *
 * Retourne null si l'événement est invisible ou inexistant (ne pas révéler
 * son existence).
 *
 * myResponse = réponse du profileId courant (null si aucune).
 * Respecte Q-A3 : liste nominative des réponses uniquement pour
 * secrétaire/admin, ou chef sur événement mono-pupitre de son pupitre.
 */
export async function getEventDetail(
	tx: Transaction,
	profileId: string,
	eventId: string
): Promise<EventDetailPageData | null> {
	// Relire le rôle et le statut dans la transaction
	const roleRows = await tx
		.select({ role: profiles.role })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	if (!roleRows[0]) return null;

	const actorRole: AppRole = roleRows[0].role;

	// Récupère l'événement (RLS filtre déjà par visibilité)
	const eventRows = await tx
		.select({
			id: eventsTable.id,
			title: eventsTable.title,
			description: eventsTable.description,
			eventDate: sql<string>`to_char(${eventsTable.event_date}, 'YYYY-MM-DD')`.as('eventDate'),
			eventType: eventsTable.event_type,
			visibility: eventsTable.visibility,
			isPoll: eventsTable.is_poll,
			cancelledAt: eventsTable.cancelled_at,
			createdBy: eventsTable.created_by,
			location: eventsTable.location
		})
		.from(eventsTable)
		.where(eq(eventsTable.id, eventId))
		.limit(1);

	if (!eventRows[0]) return null;

	const eventRow = eventRows[0];

	// Vérification supplémentaire de visibilité côté serveur (défense en profondeur)
	let visible = false;
	if (actorRole === 'admin' || actorRole === 'secretaire') {
		visible = true;
	} else if (eventRow.visibility === 'public' || eventRow.visibility === 'interne') {
		visible = true;
	} else if (eventRow.visibility === 'pupitre') {
		const eventPupitreRows = await tx
			.select({ pupitreId: eventPupitres.pupitre_id })
			.from(eventPupitres)
			.where(eq(eventPupitres.event_id, eventId));

		const eventPupitreIds = eventPupitreRows.map((row) => row.pupitreId);

		if (eventPupitreIds.length > 0) {
			const actorPupitreRows = await tx
				.select({ pupitreId: profilePupitres.pupitre_id })
				.from(profilePupitres)
				.where(eq(profilePupitres.profile_id, profileId));

			const actorPupitreIds = actorPupitreRows.map((row) => row.pupitreId);

			visible = eventPupitreIds.some((p) => actorPupitreIds.includes(p));
		}
	}

	if (!visible) return null;

	// Pupitres de l'événement
	const eventPupitreRows2 = await tx
		.select({
			pupitreId: eventPupitres.pupitre_id
		})
		.from(eventPupitres)
		.where(eq(eventPupitres.event_id, eventId));

	const pupitreIds = eventPupitreRows2.map((row) => row.pupitreId);

	// myResponse : réponse du profileId courant
	const myResponseRows = await tx
		.select({ status: eventResponses.status })
		.from(eventResponses)
		.where(and(eq(eventResponses.event_id, eventId), eq(eventResponses.profile_id, profileId)))
		.limit(1);

	const myResponse = myResponseRows[0]?.status ?? null;

	// Agrégats de réponse
	const summaryResult = await tx.execute(sql`
		select
			count(*) filter (where status = 'present') as present_count,
			count(*) filter (where status = 'absent') as absent_count
		from event_responses
		where event_id = ${eventId}
	`);

	const summary = (
		summaryResult as unknown as Array<{
			present_count: string;
			absent_count: string;
		}>
	)[0];
	const presentCount = Number(summary?.present_count ?? 0);
	const absentCount = Number(summary?.absent_count ?? 0);

	const eventPageItem: MemberEventPageItem = {
		id: eventRow.id,
		title: eventRow.title,
		description: eventRow.description ?? '',
		date: rowEventDate(eventRow.eventDate),
		type: eventRow.eventType,
		visibility: eventRow.visibility,
		isPoll: eventRow.isPoll,
		status: eventRow.cancelledAt ? 'cancelled' : 'active',
		pupitreIds: pupitreIds as unknown as MemberEventPageItem['pupitreIds'],
		createdBy: eventRow.createdBy,
		location: eventRow.location,
		myResponse: myResponse as MemberResponseStatus | null,
		responseSummary: {
			present: presentCount,
			absent: absentCount,
			total: presentCount + absentCount
		}
	};

	// Profils de l'audience (DirectoryProfile minimal - vide pour l'instant)
	const audienceProfiles: EventDetailPageData['profiles'] = [];

	// Réponses nominatives (Q-A3)
	let responses: EventDetailPageData['responses'] = [];
	if (
		actorRole === 'admin' ||
		actorRole === 'secretaire' ||
		(actorRole === 'chef_pupitre' &&
			pupitreIds.length === 1 &&
			(await isChefOfPupitre(tx, profileId, pupitreIds[0] as unknown as string)))
	) {
		const responseRows = await tx
			.select({
				eventId: eventResponses.event_id,
				profileId: eventResponses.profile_id,
				status: eventResponses.status,
				updatedAt:
					sql<string>`to_char(${eventResponses.updated_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`.as(
						'updatedAt'
					)
			})
			.from(eventResponses)
			.where(eq(eventResponses.event_id, eventId));

		responses = responseRows as unknown as EventDetailPageData['responses'];
	}

	return {
		event: eventPageItem,
		profiles: audienceProfiles,
		responses
	};
}

/**
 * Données pour la page d'édition d'un événement.
 *
 * Chef : événement mono-pupitre de son pupitre, visibility interne imposée.
 * Secrétaire/admin : tout événement.
 * Retourne null si hors périmètre (le +page.server.ts traduit en 403).
 */
export async function getEventForEdit(
	tx: Transaction,
	profileId: string,
	eventId: string
): Promise<EventFormPageData | null> {
	const roleRows = await tx
		.select({ role: profiles.role })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	if (!roleRows[0]) return null;

	const actorRole: AppRole = roleRows[0].role;

	const eventRows = await tx
		.select({
			id: eventsTable.id,
			title: eventsTable.title,
			description: eventsTable.description,
			eventDate: sql<string>`to_char(${eventsTable.event_date}, 'YYYY-MM-DD')`.as('eventDate'),
			eventType: eventsTable.event_type,
			visibility: eventsTable.visibility,
			isPoll: eventsTable.is_poll,
			cancelledAt: eventsTable.cancelled_at,
			createdBy: eventsTable.created_by,
			location: eventsTable.location
		})
		.from(eventsTable)
		.where(eq(eventsTable.id, eventId))
		.limit(1);

	if (!eventRows[0]) return null;

	const eventRow = eventRows[0];

	// Pupitres de l'événement
	const eventPupitreRows = await tx
		.select({ pupitreId: eventPupitres.pupitre_id })
		.from(eventPupitres)
		.where(eq(eventPupitres.event_id, eventId));

	const pupitreIds = eventPupitreRows.map((row) => row.pupitreId);

	// Vérification des droits
	let canManage = false;
	let canEditVisibility = false;
	let canEditPupitres = false;
	let canDelete = false;

	if (actorRole === 'admin' || actorRole === 'secretaire') {
		canManage = true;
		canEditVisibility = true;
		canEditPupitres = true;
		canDelete = true;
	} else if (actorRole === 'chef_pupitre') {
		// Chef : seulement mono-pupitre de son pupitre
		if (pupitreIds.length === 1) {
			const chefOk = await isChefOfPupitre(tx, profileId, pupitreIds[0] as unknown as string);
			if (chefOk) {
				canManage = true;
				canDelete = true;
				// Chef ne peut pas modifier visibility ni pupitres
				canEditVisibility = false;
				canEditPupitres = false;
			}
		}
	}

	if (!canManage) return null;

	const eventPageItem: MemberEventPageItem = {
		id: eventRow.id,
		title: eventRow.title,
		description: eventRow.description ?? '',
		date: rowEventDate(eventRow.eventDate),
		type: eventRow.eventType,
		visibility: eventRow.visibility,
		isPoll: eventRow.isPoll,
		status: eventRow.cancelledAt ? 'cancelled' : 'active',
		pupitreIds: pupitreIds as unknown as MemberEventPageItem['pupitreIds'],
		createdBy: eventRow.createdBy,
		location: eventRow.location,
		myResponse: null,
		responseSummary: { present: 0, absent: 0, total: 0 }
	};

	return {
		event: eventPageItem,
		canManage,
		canEditVisibility,
		canEditPupitres,
		canDelete
	};
}

/**
 * Contexte minimal pour la création d'événement (/admin/agenda/new et /agenda/nouveau).
 *
 * Retourne les pupitres disponibles selon le rôle. Aucune section de données lourdes.
 */
export async function getPageContext(
	tx: Transaction,
	profileId: string
): Promise<EventPageContext> {
	const roleRows = await tx
		.select({ role: profiles.role })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	if (!roleRows[0]) {
		throw new Error('Profil introuvable.');
	}

	const actorRole: AppRole = roleRows[0].role;

	let pupitreRows: Array<{ id: string; name: string; slug: string }> = [];

	if (actorRole === 'admin' || actorRole === 'secretaire') {
		const allPupitres = await tx
			.select({
				id: pupitres.id,
				name: pupitres.name,
				slug: pupitres.slug
			})
			.from(pupitres);

		pupitreRows = allPupitres.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug
		}));
	} else if (actorRole === 'chef_pupitre') {
		const chefPupitres = await tx
			.select({
				id: pupitres.id,
				name: pupitres.name,
				slug: pupitres.slug
			})
			.from(profilePupitres)
			.innerJoin(pupitres, eq(profilePupitres.pupitre_id, pupitres.id))
			.where(and(eq(profilePupitres.profile_id, profileId), eq(profilePupitres.is_chef, true)));

		pupitreRows = chefPupitres.map((row) => ({
			id: row.id,
			name: row.name,
			slug: row.slug
		}));
	}

	return {
		role: actorRole,
		pupitres: pupitreRows
	};
}

/* -------------------------------------------------------------------------- */
/* Helpers locaux (non exportés)                                              */
/* -------------------------------------------------------------------------- */

function rowEventDate(value: unknown): string {
	if (typeof value === 'string') return value;
	return String(value);
}

async function isChefOfPupitre(
	tx: Transaction,
	profileId: string,
	pupitreId: string
): Promise<boolean> {
	const rows = await tx
		.select({ is_chef: profilePupitres.is_chef })
		.from(profilePupitres)
		.where(
			and(eq(profilePupitres.profile_id, profileId), eq(profilePupitres.pupitre_id, pupitreId))
		)
		.limit(1);

	return rows[0]?.is_chef === true;
}
