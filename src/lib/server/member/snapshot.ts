import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import {
	albums,
	appSettings,
	articles,
	bureauPositions,
	documents,
	events,
	eventPupitres,
	eventResponses,
	invitationPupitres,
	invitations,
	media,
	notificationPreferences,
	notificationPupitres,
	notificationProfiles,
	notificationReads,
	notifications,
	profilePupitres,
	profiles,
	pupitres,
	storageUsage
} from '$lib/db/schema';
import type { AppRole } from '$lib/auth/roles';
import type {
	MemberAlbum,
	MemberArticle,
	MemberDocument,
	MemberEvent,
	MemberInvitation,
	MemberMedia,
	MemberNotification,
	MemberPreferences,
	MemberProfile,
	MemberProfilePupitre,
	MemberResponse,
	MemberSettings,
	MemberSnapshot,
	MemberPupitreId
} from '$lib/member/types';

/**
 * Construction de l'instantané de l'espace adhérents.
 *
 * Toutes les requêtes s'exécutent dans la transaction ouverte par
 * `withUserContext` : PostgreSQL applique les politiques RLS du profil
 * connecté. Le serveur ne décide donc pas seul de ce qui est visible, il ne
 * peut pas lire davantage que ce que la base autorise.
 */

/**
 * Sections de données pouvant être chargées sélectivement dans l'instantané membre.
 * Lorsqu'aucune section n'est spécifiée, toutes sont chargées (comportement par défaut).
 */
export type SnapshotSection =
	| 'profiles'
	| 'events'
	| 'responses'
	| 'notifications'
	| 'documents'
	| 'articles'
	| 'albums'
	| 'invitations'
	| 'preferences'
	| 'settings';

interface PupitreMaps {
	slugById: Map<string, MemberPupitreId>;
	idBySlug: Map<MemberPupitreId, string>;
}

interface DirectoryRow {
	id: string;
	first_name: string;
	last_name: string;
	musician_level: string | null;
	avatar: number;
	avatar_url: string | null;
	pupitres: { pupitre_id: string }[] | string | null;
	/** Titre du bureau joint par `app.member_directory` (0006 §8, Q-A5). */
	bureau_title: string | null;
}

async function loadPupitreMaps(tx: Transaction): Promise<PupitreMaps> {
	const rows = await tx.select({ id: pupitres.id, slug: pupitres.slug }).from(pupitres);
	const slugById = new Map<string, MemberPupitreId>();
	const idBySlug = new Map<MemberPupitreId, string>();
	for (const row of rows) {
		const slug = row.slug as MemberPupitreId;
		slugById.set(row.id, slug);
		idBySlug.set(slug, row.id);
	}
	return { slugById, idBySlug };
}

function parseDirectoryPupitres(
	value: DirectoryRow['pupitres'],
	slugById: Map<string, MemberPupitreId>,
	pupitresByProfile: Map<string, MemberProfilePupitre[]>,
	profileId: string
): MemberProfilePupitre[] {
	let list: { pupitre_id: string }[] = [];
	if (Array.isArray(value)) {
		list = value;
	} else if (typeof value === 'string') {
		try {
			list = JSON.parse(value);
		} catch {
			list = [];
		}
	}
	return list
		.map((item) => {
			const pupitreId = slugById.get(item.pupitre_id);
			// Chercher le statut isChef pour ce profil et ce pupitre.
			const profilePupitres = pupitresByProfile.get(profileId);
			const found = profilePupitres?.find(p => p.pupitreId === pupitreId);
			// `isChef` transmis tel quel : le trombonoscope est réservé aux
			// membres connectés, chacun doit voir qui est chef de pupitre.
			const isChef = found ? found.isChef : false;
			return pupitreId ? { pupitreId, isChef } : null;
		})
		.filter((item): item is MemberProfilePupitre => item !== null);
}

function toDateTimeString(value: Date | string | null): string {
	if (!value) return '';
	return typeof value === 'string' ? value : value.toISOString();
}

function toDateString(value: Date | string | null): string {
	if (!value) return '';
	const iso = typeof value === 'string' ? value : value.toISOString();
	return iso.slice(0, 10);
}

export async function buildMemberSnapshot(
	tx: Transaction,
	profileId: string,
	sections?: SnapshotSection[]
): Promise<MemberSnapshot> {
	const { slugById } = await loadPupitreMaps(tx);

	const ownRows = await tx
		.select({
			id: profiles.id,
			email: profiles.email,
			first_name: profiles.first_name,
			last_name: profiles.last_name,
			role: profiles.role,
			account_status: profiles.account_status,
			musician_level: profiles.musician_level,
			avatar: profiles.avatar,
			joined_at: profiles.created_at,
			bureau_title: bureauPositions.title
		})
		.from(profiles)
		.leftJoin(bureauPositions, eq(profiles.bureau_position_id, bureauPositions.id))
		.where(eq(profiles.id, profileId))
		.limit(1);

	const ownRow = ownRows[0];
	if (!ownRow) {
		throw new Error('Profil introuvable pour la session courante.');
	}

	const role = ownRow.role as AppRole;
	const isSecretary = role === 'secretaire' || role === 'admin';

	// Déterminer quelles sections charger
	const loadProfiles = sections === undefined || sections.includes('profiles');
	const loadEvents = sections === undefined || sections.includes('events');
	const loadResponses = sections === undefined || sections.includes('responses');
	const loadNotifications = sections === undefined || sections.includes('notifications');
	const loadDocuments = sections === undefined || sections.includes('documents');
	const loadArticles = sections === undefined || sections.includes('articles');
	const loadAlbums = sections === undefined || sections.includes('albums');
	const loadInvitations = sections === undefined || sections.includes('invitations');
	const loadPreferences = sections === undefined || sections.includes('preferences');
	const loadSettings = sections === undefined || sections.includes('settings');

	const pupitreRows = await tx
		.select({
			profile_id: profilePupitres.profile_id,
			pupitre_id: profilePupitres.pupitre_id,
			is_chef: profilePupitres.is_chef
		})
		.from(profilePupitres);

	const pupitresByProfile = new Map<string, MemberProfilePupitre[]>();
	for (const row of pupitreRows) {
		const slug = slugById.get(row.pupitre_id);
		if (!slug) continue;
		const list = pupitresByProfile.get(row.profile_id) ?? [];
		list.push({ pupitreId: slug, isChef: row.is_chef });
		pupitresByProfile.set(row.profile_id, list);
	}

	const profile: MemberProfile = {
		id: ownRow.id,
		firstName: ownRow.first_name,
		lastName: ownRow.last_name,
		email: ownRow.email,
		role,
		accountStatus: ownRow.account_status,
		level: (ownRow.musician_level ?? 'bagad') as MemberProfile['level'],
		bureauPosition: ownRow.bureau_title ?? null,
		pupitres: pupitresByProfile.get(ownRow.id) ?? [],
		avatar: ownRow.avatar,
		joinedAt: toDateString(ownRow.joined_at)
	};

	let visibleProfiles: MemberProfile[] = [];

	if (loadProfiles) {
		if (isSecretary) {
			const rows = await tx
				.select({
					id: profiles.id,
					email: profiles.email,
					first_name: profiles.first_name,
					last_name: profiles.last_name,
					role: profiles.role,
					account_status: profiles.account_status,
					musician_level: profiles.musician_level,
					avatar: profiles.avatar,
					joined_at: profiles.created_at,
					bureau_title: bureauPositions.title
				})
				.from(profiles)
				.leftJoin(bureauPositions, eq(profiles.bureau_position_id, bureauPositions.id));

			visibleProfiles = rows.map((row) => ({
				id: row.id,
				firstName: row.first_name,
				lastName: row.last_name,
				email: row.email,
				role: row.role as AppRole,
				accountStatus: row.account_status,
				level: (row.musician_level ?? 'bagad') as MemberProfile['level'],
				bureauPosition: row.bureau_title ?? null,
				pupitres: pupitresByProfile.get(row.id) ?? [],
				avatar: row.avatar,
				joinedAt: toDateString(row.joined_at)
			}));
		} else {
			// Annuaire restreint : la table `profiles` n'est pas lisible pour les
			// autres membres. La vue `app.member_directory` n'expose que les
			// colonnes du trombinoscope, pour les comptes actifs.
			const directory = await tx.execute(
				sql`select id, first_name, last_name, musician_level, avatar, avatar_url, pupitres, bureau_title from app.member_directory`
			);
			const rows = ((directory as unknown as { rows?: DirectoryRow[] }).rows ?? []) as DirectoryRow[];

			visibleProfiles = rows.map((row) => {
				if (row.id === profileId) return profile;
				return {
					id: row.id,
					firstName: row.first_name,
					lastName: row.last_name,
					email: '',
					role: 'member' as AppRole,
					accountStatus: 'active',
					level: (row.musician_level ?? 'bagad') as MemberProfile['level'],
					// Étape 55 (Q-A5, contrat §12.3) : `bureauPosition` provient de la
					// jointure `bureau_positions` rétablie dans `app.member_directory`.
					// La branche secrétaire/admin lit la même colonne : les deux chemins
					// produisent donc exactement la même valeur.
					bureauPosition: row.bureau_title ?? null,
					pupitres: parseDirectoryPupitres(row.pupitres, slugById, pupitresByProfile, row.id),
					avatar: row.avatar,
					joinedAt: ''
				};
			});

			if (!visibleProfiles.some((item) => item.id === profileId)) {
				visibleProfiles.push(profile);
			}
		}

		visibleProfiles.sort((a, b) =>
			`${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr')
		);
	}

	// --- Événements ---------------------------------------------------------
	let memberEvents: MemberEvent[] = [];
	if (loadEvents) {
		const eventRows = await tx
			.select()
			.from(events)
			.orderBy(asc(events.event_date), asc(events.title));
		const eventIds = eventRows.map((row) => row.id);
		const eventPupitreRows = eventIds.length
			? await tx
					.select({ event_id: eventPupitres.event_id, pupitre_id: eventPupitres.pupitre_id })
					.from(eventPupitres)
					.where(inArray(eventPupitres.event_id, eventIds))
			: [];

		const eventPupitreMap = new Map<string, MemberPupitreId[]>();
		for (const row of eventPupitreRows) {
			const slug = slugById.get(row.pupitre_id);
			if (!slug) continue;
			const list = eventPupitreMap.get(row.event_id) ?? [];
			list.push(slug);
			eventPupitreMap.set(row.event_id, list);
		}

		memberEvents = eventRows.map((row) => ({
			id: row.id,
			title: row.title,
			description: row.description ?? '',
			date: row.event_date,
			type: row.event_type,
			visibility: row.visibility,
			isPoll: row.is_poll,
			status: row.cancelled_at ? 'cancelled' : 'active',
			pupitreIds: eventPupitreMap.get(row.id) ?? [],
			createdBy: row.created_by,
			location: row.location
		}));
	}

	// --- Réponses -----------------------------------------------------------
	let memberResponses: MemberResponse[] = [];
	if (loadResponses) {
		const responseRows = await tx.select().from(eventResponses);
		memberResponses = responseRows.map((row) => ({
			eventId: row.event_id,
			profileId: row.profile_id ?? '',
			status: row.status,
			updatedAt: toDateTimeString(row.updated_at)
		}));
	}

	// --- Notifications ------------------------------------------------------
	let memberNotifications: MemberNotification[] = [];
	if (loadNotifications) {
		const notificationRows = await tx
			.select()
			.from(notifications)
			.orderBy(desc(notifications.created_at));
		const notificationIds = notificationRows.map((row) => row.id);

		const notificationPupitreRows = notificationIds.length
			? await tx
					.select({
						notification_id: notificationPupitres.notification_id,
						pupitre_id: notificationPupitres.pupitre_id
					})
					.from(notificationPupitres)
					.where(inArray(notificationPupitres.notification_id, notificationIds))
			: [];
		const notificationProfileRows = notificationIds.length
			? await tx
					.select({
						notification_id: notificationProfiles.notification_id,
						profile_id: notificationProfiles.profile_id
					})
					.from(notificationProfiles)
					.where(inArray(notificationProfiles.notification_id, notificationIds))
			: [];
		const notificationReadRows = notificationIds.length
			? await tx
					.select({
						notification_id: notificationReads.notification_id,
						profile_id: notificationReads.profile_id
					})
					.from(notificationReads)
					.where(inArray(notificationReads.notification_id, notificationIds))
			: [];

		const notificationPupitreMap = new Map<string, string[]>();
		for (const row of notificationPupitreRows) {
			const slug = slugById.get(row.pupitre_id);
			if (!slug) continue;
			const list = notificationPupitreMap.get(row.notification_id) ?? [];
			list.push(slug);
			notificationPupitreMap.set(row.notification_id, list);
		}
		const notificationProfileMap = new Map<string, string[]>();
		for (const row of notificationProfileRows) {
			const list = notificationProfileMap.get(row.notification_id) ?? [];
			list.push(row.profile_id);
			notificationProfileMap.set(row.notification_id, list);
		}
		const notificationReadMap = new Map<string, string[]>();
		for (const row of notificationReadRows) {
			const list = notificationReadMap.get(row.notification_id) ?? [];
			list.push(row.profile_id);
			notificationReadMap.set(row.notification_id, list);
		}

		memberNotifications = notificationRows.map((row) => ({
			id: row.id,
			title: row.title,
			body: row.body,
			createdAt: toDateTimeString(row.created_at),
			audience: row.audience,
			audienceIds:
				row.audience === 'pupitre'
					? (notificationPupitreMap.get(row.id) ?? [])
					: row.audience === 'profiles'
						? (notificationProfileMap.get(row.id) ?? [])
						: [],
			sentBy: row.sent_by,
			readBy: notificationReadMap.get(row.id) ?? []
		}));
	}

	// --- Documents ----------------------------------------------------------
	let memberDocuments: MemberDocument[] = [];
	if (loadDocuments) {
		const documentRows = await tx
			.select()
			.from(documents)
			.where(eq(documents.is_active, true))
			.orderBy(desc(documents.created_at));
		memberDocuments = documentRows.map((row) => ({
			id: row.id,
			title: row.title,
			description: row.description ?? '',
			pupitreId: row.pupitre_id ? (slugById.get(row.pupitre_id) ?? null) : null,
			fileName: row.file_name,
			mimeType: row.mime_type,
			sizeBytes: row.size,
			uploadedBy: row.uploaded_by,
			uploadedAt: toDateString(row.created_at)
		}));
	}

	// --- Articles -----------------------------------------------------------
	let memberArticles: MemberArticle[] = [];
	if (loadArticles) {
		const articleRows = await tx.select().from(articles).orderBy(desc(articles.updated_at));
		memberArticles = articleRows.map((row) => ({
			id: row.id,
			title: row.title,
			slug: row.slug,
			excerpt: row.excerpt,
			contentMarkdown: row.content,
			status: row.is_published ? 'published' : 'draft',
			authorId: row.author_id,
			publishedAt: row.published_at ? toDateString(row.published_at) : null,
			updatedAt: toDateTimeString(row.updated_at)
		}));
	}

	// --- Albums et médias ---------------------------------------------------
	let memberAlbums: MemberAlbum[] = [];
	if (loadAlbums) {
		const albumRows = await tx.select().from(albums).orderBy(desc(albums.album_date));
		const albumIds = albumRows.map((row) => row.id);
		const mediaRows = albumIds.length
			? await tx
					.select()
					.from(media)
					.where(inArray(media.album_id, albumIds))
					.orderBy(asc(media.position))
			: [];

		const mediaByAlbum = new Map<string, MemberMedia[]>();
		for (const row of mediaRows) {
			if (!row.album_id) continue;
			const list = mediaByAlbum.get(row.album_id) ?? [];
			list.push({
				id: row.id,
				albumId: row.album_id,
				src: row.public_url ?? '',
				alt: row.alt,
				caption: row.caption,
				order: row.position
			});
			mediaByAlbum.set(row.album_id, list);
		}

		memberAlbums = albumRows.map((row) => ({
			id: row.id,
			title: row.title,
			description: row.description ?? '',
			date: row.album_date,
			published: row.is_published,
			photos: mediaByAlbum.get(row.id) ?? []
		}));
	}

	// --- Invitations --------------------------------------------------------
	let memberInvitations: MemberInvitation[] = [];
	if (loadInvitations && isSecretary) {
		const invitationRows = await tx
			.select()
			.from(invitations)
			.orderBy(desc(invitations.created_at));
		const invitationIds = invitationRows.map((row) => row.id);
		const invitationPupitreRows = invitationIds.length
			? await tx
					.select({
						invitation_id: invitationPupitres.invitation_id,
						pupitre_id: invitationPupitres.pupitre_id
					})
					.from(invitationPupitres)
					.where(inArray(invitationPupitres.invitation_id, invitationIds))
			: [];

		const invitationPupitreMap = new Map<string, MemberPupitreId[]>();
		for (const row of invitationPupitreRows) {
			const slug = slugById.get(row.pupitre_id);
			if (!slug) continue;
			const list = invitationPupitreMap.get(row.invitation_id) ?? [];
			list.push(slug);
			invitationPupitreMap.set(row.invitation_id, list);
		}

		const now = Date.now();
		memberInvitations = invitationRows.map((row) => ({
			id: row.id,
			email: row.email,
			firstName: row.first_name,
			lastName: row.last_name,
			pupitreIds: invitationPupitreMap.get(row.id) ?? [],
			status: row.cancelled_at
				? 'cancelled'
				: row.accepted_at
					? 'accepted'
					: row.expires_at.getTime() < now
						? 'expired'
						: 'pending',
			sentAt: toDateString(row.last_sent_at),
			expiresAt: toDateString(row.expires_at),
			invitedBy: row.created_by
		}));
	}

	// --- Préférences --------------------------------------------------------
	let memberPreferences: MemberPreferences[] = [];
	if (loadPreferences) {
		const preferenceRows = await tx
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.profile_id, profileId));
		memberPreferences = preferenceRows.map((row) => ({
			profileId: row.profile_id,
			global: row.global_enabled,
			reminders: row.reminders_enabled,
			events: row.events_enabled
		}));
	}

	// --- Réglages et stockage ----------------------------------------------
	let settings: MemberSettings = {
		associationName: 'Bagad Penhars',
		email: '',
		address: '',
		website: '',
		storageUsedBytes: 0,
		storageQuotaBytes: 0,
		storageAlertBytes: 0,
		notifyOnEventCreate: true,
		notifyReminderDays: 3
	};
	if (loadSettings) {
		const settingsRows = await tx.select().from(appSettings).limit(1);
		const settingsRow = settingsRows[0];

		// `storage_usage` n'est lisible que par la secrétaire et l'administrateur :
		// pour les autres profils la requête ne renvoie aucune ligne, et les
		// valeurs restent à zéro (aucune erreur RLS).
		const storageRows = await tx.select().from(storageUsage).limit(1);
		const storageRow = storageRows[0];

		settings = {
			associationName: settingsRow?.association_name ?? 'Bagad Penhars',
			email: settingsRow?.contact_email ?? '',
			address: settingsRow?.contact_address ?? '',
			website: settingsRow?.website ?? '',
			storageUsedBytes: storageRow
				? storageRow.public_bytes + storageRow.private_bytes + storageRow.reserved_bytes
				: 0,
			storageQuotaBytes: storageRow?.quota_bytes ?? 0,
			storageAlertBytes: storageRow?.alert_threshold_bytes ?? 0,
			notifyOnEventCreate: settingsRow?.notify_on_event_create ?? true,
			notifyReminderDays: settingsRow?.notify_reminder_days ?? 3
		};
	}

	return {
		profile,
		profiles: visibleProfiles,
		events: memberEvents,
		responses: memberResponses,
		notifications: memberNotifications,
		documents: memberDocuments,
		articles: memberArticles,
		albums: memberAlbums,
		invitations: memberInvitations,
		preferences: memberPreferences,
		settings
	};
}
