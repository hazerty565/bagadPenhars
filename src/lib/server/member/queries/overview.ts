import { and, desc, eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import {
	eventPupitres,
	events as eventsTable,
	eventResponses,
	profiles,
	documents,
	notificationReads,
	notifications
} from '$lib/db/schema';
import type { MemberEventPageItem, OverviewPageData } from '$lib/member/types';
import { MemberQueryError } from './errors';

export async function getOverviewPage(
	tx: Transaction,
	profileId: string
): Promise<OverviewPageData> {
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
		.where(sql`${eventsTable.cancelled_at} IS NULL`)
		.orderBy(eventsTable.event_date)
		.limit(10);

	if (!eventRows.length) {
		return { events: [], notifications: [], documentsCount: 0 };
	}

	const eventIds = eventRows.map((row) => row.id);

	const eventPupitreRows = await tx
		.select({
			eventId: eventPupitres.event_id,
			pupitreId: eventPupitres.pupitre_id
		})
		.from(eventPupitres)
		.where(sql`${eventPupitres.event_id} IN (${sql.join(eventIds, sql`,`)})`);
	const eventPupitreMap = new Map<string, string[]>();
	for (const row of eventPupitreRows) {
		const ids = eventPupitreMap.get(row.eventId) ?? [];
		ids.push(row.pupitreId);
		eventPupitreMap.set(row.eventId, ids);
	}

	const myResponseRows = await tx
		.select({
			eventId: eventResponses.event_id,
			status: eventResponses.status
		})
		.from(eventResponses)
		.where(
			and(
				sql`${eventResponses.event_id} IN (${sql.join(eventIds, sql`,`)})`,
				eq(eventResponses.profile_id, profileId)
			)
		);

	const myResponseMap = new Map<string, string>();
	for (const row of myResponseRows) {
		myResponseMap.set(row.eventId, row.status);
	}

	const summaryResult = await tx.execute(sql`
		select
			event_id as event_id,
			count(*) filter (where status = 'present') as present_count,
			count(*) filter (where status = 'absent') as absent_count
		from event_responses
		where event_id IN (${sql.join(eventIds, sql`,`)})
		group by event_id
	`);

	const summaryMap = new Map<string, { present: number; absent: number; total: number }>();
	for (const row of summaryResult as unknown as Array<{
		event_id: string;
		present_count: string;
		absent_count: string;
	}>) {
		const present = Number(row.present_count ?? 0);
		const absent = Number(row.absent_count ?? 0);
		summaryMap.set(row.event_id, { present, absent, total: present + absent });
	}

	const events: MemberEventPageItem[] = eventRows.map((row) => {
		const pupitreIds = (eventPupitreMap.get(row.id) ?? []).filter(
			(id): id is string => typeof id === 'string'
		);

		const myResponse = myResponseMap.get(row.id) ?? null;
		const summary = summaryMap.get(row.id) ?? { present: 0, absent: 0, total: 0 };

		return {
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
	});

	const notificationRows = await tx
		.select({
			id: notifications.id,
			title: notifications.title,
			body: notifications.body,
			created_at: notifications.created_at
		})
		.from(notifications)
		.orderBy(desc(notifications.created_at))
		.limit(3);

	const notificationIds = notificationRows.map((row) => row.id);

	const readRows = notificationIds.length
		? await tx
				.select({
					notificationId: notificationReads.notification_id
				})
				.from(notificationReads)
				.where(
					and(
						sql`${notificationReads.notification_id} IN (${sql.join(notificationIds, sql`,`)})`,
						eq(notificationReads.profile_id, profileId)
					)
				)
		: [];

	const readSet = new Set(
		(readRows as { notificationId: string }[])
			.map((row: { notificationId: string }) => row.notificationId)
			.filter((id: string): id is string => typeof id === 'string')
	);

	const notificationsData = notificationRows.map((row) => ({
		id: row.id,
		title: row.title,
		body: row.body,
		createdAt: toDateTimeString(row.created_at),
		audience: 'all' as const,
		audienceIds: [],
		sentBy: '',
		readBy: readSet.has(row.id) ? [profileId] : []
	}));

	const documentsResult = await tx.execute(
		sql`select count(*) as cnt from ${documents} where is_active = true`
	);
	const documentsCount = Number(
		(documentsResult as unknown as { rows: [{ cnt: string }] }).rows?.[0]?.cnt ?? 0
	);

	return { events, notifications: notificationsData, documentsCount };
}

function toDateTimeString(value: Date | string | null): string {
	if (!value) return '';
	return typeof value === 'string' ? value : new Date(value).toISOString();
}
