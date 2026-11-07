import {
	boolean,
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Énumérations métier (PostgreSQL ENUM)
// ---------------------------------------------------------------------------

export const accountStatusEnum = pgEnum('account_status', [
	'pending',
	'active',
	'suspended'
]);

export const appRoleEnum = pgEnum('app_role', [
	'member',
	'chef_pupitre',
	'secretaire',
	'admin'
]);

export const eventTypeEnum = pgEnum('event_type', [
	'sortie',
	'concert',
	'fest-noz',
	'festival',
	'concours',
	'gala',
	'repetition',
	'reunion',
	'repas'
]);

export const eventVisibilityEnum = pgEnum('event_visibility', [
	'public',
	'interne',
	'pupitre'
]);

export const responseStatusEnum = pgEnum('response_status', ['present', 'absent']);

export const musicianLevelEnum = pgEnum('musician_level', ['skolaj', 'bagadig', 'bagad']);

// ---------------------------------------------------------------------------
// Tables métier
// ---------------------------------------------------------------------------

export const profiles = pgTable(
	'profiles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		auth_user_id: text('auth_user_id').notNull().unique(),
		email: varchar('email', { length: 255 }).notNull(),
		first_name: varchar('first_name', { length: 100 }).notNull(),
		last_name: varchar('last_name', { length: 100 }).notNull(),
		role: appRoleEnum('role').notNull().default('member'),
		account_status: accountStatusEnum('account_status').notNull().default('pending'),
		phone: varchar('phone', { length: 50 }),
		address: text('address'),
		musician_level: musicianLevelEnum('musician_level'),
		bureau_position_id: uuid('bureau_position_id'),
		avatar_url: varchar('avatar_url', { length: 500 }),
		email_confirmed: boolean('email_confirmed').notNull().default(false),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		authUserIdx: index('profiles_auth_user_id_idx').on(table.auth_user_id),
		emailIdx: index('profiles_email_idx').on(table.email),
		roleIdx: index('profiles_role_idx').on(table.role),
		statusIdx: index('profiles_account_status_idx').on(table.account_status)
	})
);

export const pupitres = pgTable(
	'pupitres',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: varchar('name', { length: 100 }).notNull().unique(),
		description: text('description'),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		nameIdx: index('pupitres_name_idx').on(table.name)
	})
);

export const profilePupitres = pgTable(
	'profile_pupitres',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		profile_id: uuid('profile_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		pupitre_id: uuid('pupitre_id')
			.notNull()
			.references(() => pupitres.id, { onDelete: 'cascade' }),
		is_chef: boolean('is_chef').notNull().default(false),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		profileIdx: index('profile_pupitres_profile_id_idx').on(table.profile_id),
		pupitreIdx: index('profile_pupitres_pupitre_id_idx').on(table.pupitre_id),
		chefIdx: index('profile_pupitres_is_chef_idx').on(table.is_chef)
	})
);

export const bureauPositions = pgTable(
	'bureau_positions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: varchar('title', { length: 100 }).notNull().unique(),
		description: text('description'),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		titleIdx: index('bureau_positions_title_idx').on(table.title)
	})
);

export const invitations = pgTable(
	'invitations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		email: varchar('email', { length: 255 }).notNull(),
		token_hash: varchar('token_hash', { length: 255 }).notNull().unique(),
		expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
		accepted_at: timestamp('accepted_at', { withTimezone: true }),
		created_by: uuid('created_by')
			.notNull()
			.references(() => profiles.id, { onDelete: 'restrict' }),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		emailIdx: index('invitations_email_idx').on(table.email),
		tokenIdx: index('invitations_token_hash_idx').on(table.token_hash),
		expiresIdx: index('invitations_expires_at_idx').on(table.expires_at)
	})
);

export const invitationPupitres = pgTable(
	'invitation_pupitres',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		invitation_id: uuid('invitation_id')
			.notNull()
			.references(() => invitations.id, { onDelete: 'cascade' }),
		pupitre_id: uuid('pupitre_id')
			.notNull()
			.references(() => pupitres.id, { onDelete: 'cascade' })
	},
	(table) => ({
		invitationIdx: index('invitation_pupitres_invitation_id_idx').on(
			table.invitation_id
		),
		pupitreIdx: index('invitation_pupitres_pupitre_id_idx').on(table.pupitre_id)
	})
);

export const events = pgTable(
	'events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: varchar('title', { length: 200 }).notNull(),
		description: text('description'),
		event_date: date('event_date').notNull(),
		event_type: eventTypeEnum('event_type').notNull(),
		visibility: eventVisibilityEnum('visibility').notNull().default('public'),
		is_poll: boolean('is_poll').notNull().default(false),
		created_by: uuid('created_by')
			.notNull()
			.references(() => profiles.id, { onDelete: 'restrict' }),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		dateIdx: index('events_event_date_idx').on(table.event_date),
		typeIdx: index('events_event_type_idx').on(table.event_type),
		visibilityIdx: index('events_visibility_idx').on(table.visibility),
		pollIdx: index('events_is_poll_idx').on(table.is_poll),
		creatorIdx: index('events_created_by_idx').on(table.created_by)
	})
);

export const eventPupitres = pgTable(
	'event_pupitres',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		event_id: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		pupitre_id: uuid('pupitre_id')
			.notNull()
			.references(() => pupitres.id, { onDelete: 'cascade' })
	},
	(table) => ({
		eventIdx: index('event_pupitres_event_id_idx').on(table.event_id),
		pupitreIdx: index('event_pupitres_pupitre_id_idx').on(table.pupitre_id)
	})
);

export const eventResponses = pgTable(
	'event_responses',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		event_id: uuid('event_id')
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		profile_id: uuid('profile_id')
			.references(() => profiles.id, { onDelete: 'set null' }),
		status: responseStatusEnum('status').notNull(),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		eventIdx: index('event_responses_event_id_idx').on(table.event_id),
		profileIdx: index('event_responses_profile_id_idx').on(table.profile_id),
		statusIdx: index('event_responses_status_idx').on(table.status),
		eventProfileUnique: index('event_responses_event_id_profile_id_idx').on(
			table.event_id,
			table.profile_id
		).unique()
	})
);

export const documents = pgTable(
	'documents',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: varchar('title', { length: 200 }).notNull(),
		description: text('description'),
		file_key: varchar('file_key', { length: 500 }).notNull().unique(),
		bucket: varchar('bucket', { length: 50 }).notNull(),
		mime_type: varchar('mime_type', { length: 100 }).notNull(),
		size: integer('size').notNull(),
		uploaded_by: uuid('uploaded_by')
			.notNull()
			.references(() => profiles.id, { onDelete: 'restrict' }),
		pupitre_id: uuid('pupitre_id').references(() => pupitres.id, {
			onDelete: 'set null'
		}),
		is_active: boolean('is_active').notNull().default(true),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		fileKeyIdx: index('documents_file_key_idx').on(table.file_key),
		bucketIdx: index('documents_bucket_idx').on(table.bucket),
		activeIdx: index('documents_is_active_idx').on(table.is_active),
		uploaderIdx: index('documents_uploaded_by_idx').on(table.uploaded_by),
		pupitreIdx: index('documents_pupitre_id_idx').on(table.pupitre_id)
	})
);

export const articles = pgTable(
	'articles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: varchar('title', { length: 200 }).notNull(),
		slug: varchar('slug', { length: 200 }).notNull().unique(),
		content: text('content').notNull(),
		is_published: boolean('is_published').notNull().default(false),
		published_at: timestamp('published_at', { withTimezone: true }),
		author_id: uuid('author_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'restrict' }),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		slugIdx: index('articles_slug_idx').on(table.slug),
		publishedIdx: index('articles_is_published_idx').on(table.is_published),
		authorIdx: index('articles_author_id_idx').on(table.author_id)
	})
);

export const albums = pgTable(
	'albums',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: varchar('title', { length: 200 }).notNull(),
		description: text('description'),
		is_published: boolean('is_published').notNull().default(false),
		created_by: uuid('created_by')
			.notNull()
			.references(() => profiles.id, { onDelete: 'restrict' }),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		publishedIdx: index('albums_is_published_idx').on(table.is_published),
		creatorIdx: index('albums_created_by_idx').on(table.created_by)
	})
);

export const media = pgTable(
	'media',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		title: varchar('title', { length: 200 }).notNull(),
		description: text('description'),
		file_key: varchar('file_key', { length: 500 }).notNull().unique(),
		bucket: varchar('bucket', { length: 50 }).notNull(),
		mime_type: varchar('mime_type', { length: 100 }).notNull(),
		size: integer('size').notNull(),
		album_id: uuid('album_id').references(() => albums.id, {
			onDelete: 'set null'
		}),
		uploaded_by: uuid('uploaded_by')
			.notNull()
			.references(() => profiles.id, { onDelete: 'restrict' }),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		fileKeyIdx: index('media_file_key_idx').on(table.file_key),
		bucketIdx: index('media_bucket_idx').on(table.bucket),
		albumIdx: index('media_album_id_idx').on(table.album_id),
		uploaderIdx: index('media_uploaded_by_idx').on(table.uploaded_by)
	})
);

export const notificationPreferences = pgTable(
	'notification_preferences',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		profile_id: uuid('profile_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' })
			.unique(),
		events_enabled: boolean('events_enabled').notNull().default(true),
		reminders_enabled: boolean('reminders_enabled').notNull().default(true),
		no_response_reminder_enabled: boolean('no_response_reminder_enabled')
			.notNull()
			.default(true),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		profileIdx: index('notification_preferences_profile_id_idx').on(table.profile_id)
	})
);

export const notificationLog = pgTable(
	'notification_log',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		recipient_profile_id: uuid('recipient_profile_id').references(
			() => profiles.id,
			{ onDelete: 'set null' }
		),
		type: varchar('type', { length: 50 }).notNull(),
		title: varchar('title', { length: 200 }).notNull(),
		content: text('content').notNull(),
		sent_at: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
		status: varchar('status', { length: 50 }).notNull().default('sent')
	},
	(table) => ({
		recipientIdx: index('notification_log_recipient_profile_id_idx').on(
			table.recipient_profile_id
		),
		typeIdx: index('notification_log_type_idx').on(table.type),
		sentAtIdx: index('notification_log_sent_at_idx').on(table.sent_at)
	})
);

export const activityLog = pgTable(
	'activity_log',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		actor_profile_id: uuid('actor_profile_id').references(() => profiles.id, {
			onDelete: 'set null'
		}),
		action: varchar('action', { length: 100 }).notNull(),
		target_table: varchar('target_table', { length: 100 }),
		target_id: uuid('target_id'),
		details: text('details'),
		created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => ({
		actorIdx: index('activity_log_actor_profile_id_idx').on(table.actor_profile_id),
		actionIdx: index('activity_log_action_idx').on(table.action),
		createdAtIdx: index('activity_log_created_at_idx').on(table.created_at)
	})
);

export const accountDeletionRequests = pgTable(
	'account_deletion_requests',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		profile_id: uuid('profile_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		requested_at: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
		processed_at: timestamp('processed_at', { withTimezone: true }),
		status: varchar('status', { length: 50 }).notNull().default('pending'),
		admin_note: text('admin_note')
	},
	(table) => ({
		profileIdx: index('account_deletion_requests_profile_id_idx').on(
			table.profile_id
		),
		statusIdx: index('account_deletion_requests_status_idx').on(table.status)
	})
);

export const memberLoans = pgTable(
	'member_loans',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		profile_id: uuid('profile_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		item: varchar('item', { length: 200 }).notNull(),
		loaned_at: timestamp('loaned_at', { withTimezone: true }).notNull().defaultNow(),
		due_at: timestamp('due_at', { withTimezone: true }),
		returned_at: timestamp('returned_at', { withTimezone: true })
	},
	(table) => ({
		profileIdx: index('member_loans_profile_id_idx').on(table.profile_id),
		itemIdx: index('member_loans_item_idx').on(table.item)
	})
);

export const storageUsage = pgTable(
	'storage_usage',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		public_bytes: integer('public_bytes').notNull().default(0),
		private_bytes: integer('private_bytes').notNull().default(0),
		reserved_bytes: integer('reserved_bytes').notNull().default(0),
		updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	}
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const profilesRelations = relations(profiles, ({ many, one }) => ({
	pupitres: many(profilePupitres),
	createdInvitations: many(invitations),
	createdEvents: many(events),
	uploadedDocuments: many(documents),
	authoredArticles: many(articles),
	createdAlbums: many(albums),
	uploadedMedia: many(media),
	eventResponses: many(eventResponses),
	notificationPreference: one(notificationPreferences),
	notificationLog: many(notificationLog),
	activityLog: many(activityLog),
	deletionRequests: many(accountDeletionRequests),
	loans: many(memberLoans)
}));

export const pupitresRelations = relations(pupitres, ({ many }) => ({
	members: many(profilePupitres),
	invitationAssignments: many(invitationPupitres),
	eventAssignments: many(eventPupitres),
	documents: many(documents)
}));

export const profilePupitresRelations = relations(profilePupitres, ({ one }) => ({
	profile: one(profiles, {
		fields: [profilePupitres.profile_id],
		references: [profiles.id]
	}),
	pupitre: one(pupitres, {
		fields: [profilePupitres.pupitre_id],
		references: [pupitres.id]
	})
}));

export const bureauPositionsRelations = relations(bureauPositions, ({ many }) => ({
	profiles: many(profiles)
}));

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
	creator: one(profiles, {
		fields: [invitations.created_by],
		references: [profiles.id]
	}),
	pupitres: many(invitationPupitres)
}));

export const invitationPupitresRelations = relations(invitationPupitres, ({ one }) => ({
	invitation: one(invitations, {
		fields: [invitationPupitres.invitation_id],
		references: [invitations.id]
	}),
	pupitre: one(pupitres, {
		fields: [invitationPupitres.pupitre_id],
		references: [pupitres.id]
	})
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
	creator: one(profiles, {
		fields: [events.created_by],
		references: [profiles.id]
	}),
	pupitres: many(eventPupitres),
	responses: many(eventResponses)
}));

export const eventPupitresRelations = relations(eventPupitres, ({ one }) => ({
	event: one(events, {
		fields: [eventPupitres.event_id],
		references: [events.id]
	}),
	pupitre: one(pupitres, {
		fields: [eventPupitres.pupitre_id],
		references: [pupitres.id]
	})
}));

export const eventResponsesRelations = relations(eventResponses, ({ one }) => ({
	event: one(events, {
		fields: [eventResponses.event_id],
		references: [events.id]
	}),
	profile: one(profiles, {
		fields: [eventResponses.profile_id],
		references: [profiles.id]
	})
}));

export const documentsRelations = relations(documents, ({ one }) => ({
	uploader: one(profiles, {
		fields: [documents.uploaded_by],
		references: [profiles.id]
	}),
	pupitre: one(pupitres, {
		fields: [documents.pupitre_id],
		references: [pupitres.id]
	})
}));

export const articlesRelations = relations(articles, ({ one }) => ({
	author: one(profiles, {
		fields: [articles.author_id],
		references: [profiles.id]
	})
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
	creator: one(profiles, {
		fields: [albums.created_by],
		references: [profiles.id]
	}),
	media: many(media)
}));

export const mediaRelations = relations(media, ({ one }) => ({
	album: one(albums, {
		fields: [media.album_id],
		references: [albums.id]
	}),
	uploader: one(profiles, {
		fields: [media.uploaded_by],
		references: [profiles.id]
	})
}));

export const notificationPreferencesRelations = relations(
	notificationPreferences,
	({ one }) => ({
		profile: one(profiles, {
			fields: [notificationPreferences.profile_id],
			references: [profiles.id]
		})
	})
);

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
	recipient: one(profiles, {
		fields: [notificationLog.recipient_profile_id],
		references: [profiles.id]
	})
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
	actor: one(profiles, {
		fields: [activityLog.actor_profile_id],
		references: [profiles.id]
	})
}));

export const accountDeletionRequestsRelations = relations(
	accountDeletionRequests,
	({ one }) => ({
		profile: one(profiles, {
			fields: [accountDeletionRequests.profile_id],
			references: [profiles.id]
		})
	})
);

export const memberLoansRelations = relations(memberLoans, ({ one }) => ({
	profile: one(profiles, {
		fields: [memberLoans.profile_id],
		references: [profiles.id]
	})
}));

// ---------------------------------------------------------------------------
// Export de toutes les tables pour drizzle-kit
// ---------------------------------------------------------------------------

export const tables = {
	profiles,
	pupitres,
	profilePupitres,
	bureauPositions,
	invitations,
	invitationPupitres,
	events,
	eventPupitres,
	eventResponses,
	documents,
	articles,
	albums,
	media,
	notificationPreferences,
	notificationLog,
	activityLog,
	accountDeletionRequests,
	memberLoans,
	storageUsage
} as const;
