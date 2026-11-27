import { eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import {
	eventPupitres,
	events as eventsTable,
	eventResponses,
	profilePupitres,
	profiles,
	pupitres
} from '$lib/db/schema';
import type { AgendaPageData, MemberEventPageItem } from '$lib/member/types';

export interface AgendaEventFilters {
	from?: string;
	to?: string;
	page?: number;
	pageSize?: number;
}

/**
 * Liste les événements d'agenda visibles pour le profil connecté.
 *
 * La visibilité est filtrée par RLS (contexte app.profile_id établi par
 * withUserContext). Chaque lecture relit le rôle dans la transaction.
 *
 * Tri : date croissante (à venir) / décroissante (passés).
 */
export async function listAgendaEvents(
	tx: Transaction,
	profileId: string,
	filters?: AgendaEventFilters
): Promise<AgendaPageData> {
	// Relire le rôle dans la transaction (défense en profondeur)
	const roleRows = await tx
		.select({ role: profiles.role })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);

	if (!roleRows[0]) {
		return { events: [] };
	}

	const actorRole = roleRows[0].role;

	// Pupitres de l'acteur (pour marquer myResponse et responseSummary)
	const actorPupitreRows = await tx
		.select({ pupitreId: profilePupitres.pupitre_id })
		.from(profilePupitres)
		.where(eq(profilePupitres.profile_id, profileId));

	const actorPupitreIds = new Set(actorPupitreRows.map((row) => row.pupitreId));

	// Récupère tous les événements non annulés (RLS filtre par visibilité)
	const eventRows = await tx
		.select({
			id: eventsTable.id,
			title: eventsTable.title,
			description: eventsTable.description,
			eventDate: sql<string>`to_char(${eventsTable.event_date}, 'YYYY-MM-DD')`.as(
				'eventDate'
			),
			eventType: eventsTable.event_type,
			visibility: eventsTable.visibility,
			isPoll: eventsTable.is_poll,
			cancelledAt: eventsTable.cancelled_at,
			createdBy: eventsTable.created_by,
			location: eventsTable.location
		})
		.from(eventsTable)
		.where(sql`${eventsTable.cancelled_at} IS NULL`);

	// Pupitres ciblés par événement
	const eventPupitreRows = await tx
		.select({
			eventId: eventPupitres.event_id,
			pupitreId: eventPupitres.pupitre_id
		})
		.from(eventPupitres);

	const eventPupitreMap = new Map<string, string[]>();
	for (const row of eventPupitreRows) {
		const ids = eventPupitreMap.get(row.eventId) ?? [];
		ids.push(row.pupitreId);
		eventPupitreMap.set(row.eventId, ids);
	}

	// Réponses de l'acteur
	const myResponseRows = await tx
		.select({
			eventId: eventResponses.event_id,
			status: eventResponses.status
		})
		.from(eventResponses)
		.where(eq(eventResponses.profile_id, profileId));

	const myResponseMap = new Map<string, string>();
	for (const row of myResponseRows) {
		myResponseMap.set(row.eventId, row.status);
	}

	// Agrégats de réponse par événement
	const summaryRows = await tx.execute(sql`
		select
			event_id as event_id,
			count(*) filter (where status = 'present') as present_count,
			count(*) filter (where status = 'absent') as absent_count
		from event_responses
		group by event_id
	`);

	const summaryMap = new Map<
		string,
		{ present: number; absent: number; total: number }
	>();
	for (const row of summaryRows as unknown as Array<{
		event_id: string;
		present_count: string;
		absent_count: string;
	}>) {
		const present = Number(row.present_count ?? 0);
		const absent = Number(row.absent_count ?? 0);
		summaryMap.set(row.event_id, {
			present,
			absent,
			total: present + absent
		});
	}

	const now = new Date();
	const parisToday = now.toISOString().slice(0, 10);

	const upcoming: MemberEventPageItem[] = [];
	const past: MemberEventPageItem[] = [];

	for (const row of eventRows) {
		const pupitreIds = (eventPupitreMap.get(row.id) ?? []).filter(
			(id): id is string => typeof id === 'string'
		);

		const myResponse = myResponseMap.get(row.id) ?? null;
		const summary = summaryMap.get(row.id) ?? {
			present: 0,
			absent: 0,
			total: 0
		};

		const isPast = row.eventDate < parisToday;

		const item: MemberEventPageItem = {
			id: row.id,
			title: row.title,
			description: row.description ?? '',
			date: row.eventDate,
			type: row.eventType,
			visibility: row.visibility,
			isPoll: row.isPoll,
			status: row.cancelledAt ? 'cancelled' : 'active',
			pupitreIds: pupitreIds as unknown as MemberEventPageItem['pupitreIds'],
			createdBy: row.createdBy,
			location: row.location,
			myResponse: myResponse as MemberEventPageItem['myResponse'],
			responseSummary: summary
		};

		if (isPast) {
			past.push(item);
		} else {
			upcoming.push(item);
		}
	}

	// À venir : croissant ; passés : décroissant
	upcoming.sort((a, b) => a.date.localeCompare(b.date));
	past.sort((a, b) => b.date.localeCompare(a.date));

	const resultEvents = [...upcoming, ...past];

	// Pagination optionnelle
	if (filters?.page && filters.pageSize) {
		const offset = (filters.page - 1) * filters.pageSize;
		const paginated = resultEvents.slice(offset, offset + filters.pageSize);
		return { events: paginated };
	}

	return { events: resultEvents };
}
