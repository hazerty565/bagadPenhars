import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { hashPassword } from 'better-auth/crypto';

/**
 * Réinitialise et remplit la branche Neon `test` avec le jeu de données de
 * démonstration, désormais stocké en base (plus de localStorage).
 *
 * Garde-fou : refuse toute chaîne qui ne pointe pas vers la branche test.
 * Le mot de passe des comptes de test est lu dans `.env`
 * (`SEED_USER_PASSWORD`) et généré au premier lancement ; il n'est jamais
 * affiché ni committé.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

function readEnv(file) {
	const raw = fs.readFileSync(file, 'utf8');
	const values = {};
	for (const line of raw.split(/\r?\n/)) {
		const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!match) continue;
		let value = match[2].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		values[match[1]] = value;
	}
	return values;
}

function upsertEnvValue(file, key, value) {
	const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
	let replaced = false;
	const out = lines.map((line) => {
		if (new RegExp(`^${key}=`).test(line)) {
			replaced = true;
			return `${key}=${value}`;
		}
		return line;
	});
	if (!replaced) out.push(`${key}=${value}`);
	fs.writeFileSync(file, out.join('\r\n'), 'utf8');
}

function assertTestTarget(url) {
	const parsed = new URL(url);
	const host = parsed.hostname;
	if (host.includes('ep-ancient-morning')) {
		throw new Error('Refus : la chaîne pointe vers la branche production.');
	}
	if (!host.includes('ep-spring-sunset')) {
		throw new Error(`Refus : hôte inattendu (${host}).`);
	}
	if (parsed.pathname !== '/neondb') {
		throw new Error(`Refus : base inattendue (${parsed.pathname}).`);
	}
	return { host, database: parsed.pathname };
}

function uuid(group, index) {
	const g = group.repeat(8);
	const idx = String(index).padStart(12, '0');
	return `${g}-${g.slice(0, 4)}-4${g.slice(0, 3)}-8${g.slice(0, 3)}-${idx}`;
}

const PROFILE_GROUP = '1';
const EVENT_GROUP = '2';
const PUPITRE_GROUP = '3';
const DOCUMENT_GROUP = '4';
const ARTICLE_GROUP = '5';
const ALBUM_GROUP = '6';
const MEDIA_GROUP = '7';
const NOTIFICATION_GROUP = '8';
const INVITATION_GROUP = '9';
const BUREAU_GROUP = 'a';
const STORAGE_ID = 'dddddddd-dddd-4ddd-8ddd-000000000001';

const PUPITRE_SLUGS = {
	bombarde: 1,
	cornemuse: 2,
	'caisse-claire': 3,
	percussion: 4
};
const PUPITRE_NAMES = {
	bombarde: 'Bombarde',
	cornemuse: 'Cornemuse',
	'caisse-claire': 'Caisse claire',
	percussion: 'Percussion'
};
const AUTH_PROFILES = new Set(['p01', 'p02', 'p03', 'p04', 'p05', 'p06']);

const fixture = JSON.parse(fs.readFileSync(path.join(root, 'scripts/seed-fixtures.json'), 'utf8'));

const env = readEnv(envPath);
if (!env.DATABASE_URL) throw new Error('DATABASE_URL est absente de .env.');
const target = assertTestTarget(env.DATABASE_URL);

let seedPassword = env.SEED_USER_PASSWORD;
if (!seedPassword) {
	seedPassword = crypto.randomBytes(18).toString('base64url');
	upsertEnvValue(envPath, 'SEED_USER_PASSWORD', seedPassword);
	console.log('SEED_USER_PASSWORD généré dans .env (valeur non affichée).');
}

const client = new pg.Client({
	connectionString: env.DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});

const profileUuid = (fixtureId) => uuid(PROFILE_GROUP, Number(fixtureId.slice(1)));
const eventUuid = (fixtureId) => uuid(EVENT_GROUP, Number(fixtureId.slice(1)));
const pupitreUuid = (slug) => uuid(PUPITRE_GROUP, PUPITRE_SLUGS[slug]);
const documentUuid = (fixtureId) => uuid(DOCUMENT_GROUP, Number(fixtureId.slice(1)));
const articleUuid = (fixtureId) => uuid(ARTICLE_GROUP, Number(fixtureId.slice(1)));
const albumUuid = (fixtureId) => uuid(ALBUM_GROUP, Number(fixtureId.slice(2)));
const mediaUuid = (fixtureId) => uuid(MEDIA_GROUP, Number(fixtureId.slice(1)));
const notificationUuid = (fixtureId) => uuid(NOTIFICATION_GROUP, Number(fixtureId.slice(1)));
const invitationUuid = (fixtureId) => uuid(INVITATION_GROUP, Number(fixtureId.slice(1)));

const bureauTitles = [
	...new Set(fixture.profiles.map((profile) => profile.bureauPosition).filter(Boolean))
];
const bureauUuid = (title) => uuid(BUREAU_GROUP, bureauTitles.indexOf(title) + 1);

const authUserId = (fixtureId) =>
	AUTH_PROFILES.has(fixtureId) ? `user-${fixtureId}` : `seed-${fixtureId}`;

function dateOrNull(value) {
	return value ? new Date(value) : null;
}

try {
	await client.connect();
	await client.query('BEGIN');

	// Réinitialisation complète du jeu de données de test.
	await client.query(`
		TRUNCATE TABLE
			public.activity_log,
			public.account_deletion_requests,
			public.member_loans,
			public.notification_reads,
			public.notification_profiles,
			public.notification_pupitres,
			public.notifications,
			public.notification_log,
			public.notification_preferences,
			public.push_subscriptions,
			public.media,
			public.albums,
			public.articles,
			public.documents,
			public.event_responses,
			public.event_pupitres,
			public.events,
			public.invitation_pupitres,
			public.invitations,
			public.profile_pupitres,
			public.profiles,
			public.pupitres,
			public.bureau_positions,
			public.app_settings,
			public.storage_usage,
			public.session,
			public.account,
			public."user",
			public.verification
		RESTART IDENTITY CASCADE
	`);

	for (const [slug, index] of Object.entries(PUPITRE_SLUGS)) {
		await client.query(
			'INSERT INTO public.pupitres (id, name, slug) VALUES ($1, $2, $3)',
			[uuid(PUPITRE_GROUP, index), PUPITRE_NAMES[slug], slug]
		);
	}

	for (const [index, title] of bureauTitles.entries()) {
		await client.query('INSERT INTO public.bureau_positions (id, title) VALUES ($1, $2)', [
			uuid(BUREAU_GROUP, index + 1),
			title
		]);
	}

	const passwordHash = await hashPassword(seedPassword);
	for (const profile of fixture.profiles) {
		if (!AUTH_PROFILES.has(profile.id)) continue;
		const userId = authUserId(profile.id);
		const name = `${profile.firstName} ${profile.lastName}`;
		await client.query(
			`INSERT INTO public."user" (id, name, email, email_verified)
			 VALUES ($1, $2, $3, true)`,
			[userId, name, profile.email]
		);
		await client.query(
			`INSERT INTO public.account (id, account_id, provider_id, user_id, password)
			 VALUES ($1, $2, 'credential', $3, $4)`,
			[`account-${profile.id}`, userId, userId, passwordHash]
		);
	}

	for (const profile of fixture.profiles) {
		await client.query(
			`INSERT INTO public.profiles
				(id, auth_user_id, email, first_name, last_name, role, account_status,
				 musician_level, bureau_position_id, avatar, email_confirmed, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)`,
			[
				profileUuid(profile.id),
				authUserId(profile.id),
				profile.email,
				profile.firstName,
				profile.lastName,
				profile.role,
				profile.accountStatus,
				profile.level,
				profile.bureauPosition ? bureauUuid(profile.bureauPosition) : null,
				profile.avatar,
				dateOrNull(profile.joinedAt)
			]
		);
	}

	for (const profile of fixture.profiles) {
		for (const assignment of profile.pupitres) {
			await client.query(
				`INSERT INTO public.profile_pupitres (profile_id, pupitre_id, is_chef)
				 VALUES ($1, $2, $3)`,
				[profileUuid(profile.id), pupitreUuid(assignment.pupitreId), assignment.isChef]
			);
		}
	}

	for (const event of fixture.events) {
		await client.query(
			`INSERT INTO public.events
				(id, title, description, event_date, event_type, visibility, location, is_poll,
				 cancelled_at, created_by)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			[
				eventUuid(event.id),
				event.title,
				event.description,
				event.date,
				event.type,
				event.visibility,
				event.location,
				event.isPoll,
				event.status === 'cancelled' ? new Date(`${event.date}T12:00:00.000Z`) : null,
				profileUuid(event.createdBy)
			]
		);
		for (const pupitreId of event.pupitreIds) {
			await client.query(
				'INSERT INTO public.event_pupitres (event_id, pupitre_id) VALUES ($1, $2)',
				[eventUuid(event.id), pupitreUuid(pupitreId)]
			);
		}
	}

	for (const response of fixture.responses) {
		await client.query(
			`INSERT INTO public.event_responses (event_id, profile_id, status, updated_at)
			 VALUES ($1, $2, $3, $4)`,
			[
				eventUuid(response.eventId),
				profileUuid(response.profileId),
				response.status,
				dateOrNull(response.updatedAt)
			]
		);
	}

	for (const document of fixture.documents) {
		await client.query(
			`INSERT INTO public.documents
				(id, title, description, file_key, file_name, bucket, mime_type, size,
				 uploaded_by, pupitre_id, is_active, created_at)
			 VALUES ($1, $2, $3, $4, $5, 'private', $6, $7, $8, $9, true, $10)`,
			[
				documentUuid(document.id),
				document.title,
				document.description,
				`seed/documents/${document.id}/${document.fileName}`,
				document.fileName,
				document.mimeType,
				document.sizeBytes,
				profileUuid(document.uploadedBy),
				document.pupitreId ? pupitreUuid(document.pupitreId) : null,
				dateOrNull(document.uploadedAt)
			]
		);
	}

	for (const article of fixture.articles) {
		await client.query(
			`INSERT INTO public.articles
				(id, title, slug, excerpt, content, is_published, published_at, author_id, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			[
				articleUuid(article.id),
				article.title,
				article.slug,
				article.excerpt,
				article.contentMarkdown,
				article.status === 'published',
				dateOrNull(article.publishedAt),
				profileUuid(article.authorId),
				dateOrNull(article.updatedAt)
			]
		);
	}

	for (const album of fixture.albums) {
		await client.query(
			`INSERT INTO public.albums
				(id, title, description, album_date, is_published, created_by)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				albumUuid(album.id),
				album.title,
				album.description,
				album.date,
				album.published,
				profileUuid('p02')
			]
		);
		for (const photo of album.photos) {
			await client.query(
				`INSERT INTO public.media
					(id, title, description, file_key, public_url, alt, caption, position,
					 bucket, mime_type, size, album_id, uploaded_by)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'public', 'image/webp', 0, $9, $10)`,
				[
					mediaUuid(photo.id),
					photo.caption || photo.alt,
					photo.caption,
					`seed/media/${photo.src.replace(/^\//, '')}`,
					photo.src,
					photo.alt,
					photo.caption,
					photo.order,
					albumUuid(album.id),
					profileUuid('p02')
				]
			);
		}
	}

	for (const notification of fixture.notifications) {
		await client.query(
			`INSERT INTO public.notifications (id, title, body, audience, sent_by, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				notificationUuid(notification.id),
				notification.title,
				notification.body,
				notification.audience,
				profileUuid(notification.sentBy),
				dateOrNull(notification.createdAt)
			]
		);
		if (notification.audience === 'pupitre') {
			for (const pupitreId of notification.audienceIds) {
				await client.query(
					'INSERT INTO public.notification_pupitres (notification_id, pupitre_id) VALUES ($1, $2)',
					[notificationUuid(notification.id), pupitreUuid(pupitreId)]
				);
			}
		}
		if (notification.audience === 'profiles') {
			for (const profileId of notification.audienceIds) {
				await client.query(
					'INSERT INTO public.notification_profiles (notification_id, profile_id) VALUES ($1, $2)',
					[notificationUuid(notification.id), profileUuid(profileId)]
				);
			}
		}
		for (const profileId of notification.readBy) {
			await client.query(
				'INSERT INTO public.notification_reads (notification_id, profile_id) VALUES ($1, $2)',
				[notificationUuid(notification.id), profileUuid(profileId)]
			);
		}
	}

	for (const invitation of fixture.invitations) {
		const tokenHash = crypto
			.createHash('sha256')
			.update(`seed-invitation-${invitation.id}`)
			.digest('hex');
		await client.query(
			`INSERT INTO public.invitations
				(id, email, first_name, last_name, token_hash, expires_at, accepted_at,
				 cancelled_at, last_sent_at, created_by)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, null, $8, $9)`,
			[
				invitationUuid(invitation.id),
				invitation.email,
				invitation.firstName,
				invitation.lastName,
				tokenHash,
				dateOrNull(invitation.expiresAt),
				invitation.status === 'accepted' ? dateOrNull(invitation.expiresAt) : null,
				dateOrNull(invitation.sentAt),
				profileUuid(invitation.invitedBy)
			]
		);
		for (const pupitreId of invitation.pupitreIds) {
			await client.query(
				'INSERT INTO public.invitation_pupitres (invitation_id, pupitre_id) VALUES ($1, $2)',
				[invitationUuid(invitation.id), pupitreUuid(pupitreId)]
			);
		}
	}

	for (const preference of fixture.preferences) {
		await client.query(
			`INSERT INTO public.notification_preferences
				(profile_id, global_enabled, events_enabled, reminders_enabled, no_response_reminder_enabled)
			 VALUES ($1, $2, $3, $4, true)`,
			[profileUuid(preference.profileId), preference.global, preference.events, preference.reminders]
		);
	}

	await client.query(
		`INSERT INTO public.app_settings
			(id, association_name, contact_email, contact_address, website,
			 notify_on_event_create, notify_reminder_days)
		 VALUES (1, $1, $2, $3, $4, $5, $6)`,
		[
			fixture.settings.associationName,
			fixture.settings.email,
			fixture.settings.address,
			fixture.settings.website,
			fixture.settings.notifyOnEventCreate,
			fixture.settings.notifyReminderDays
		]
	);

	await client.query(
		`INSERT INTO public.storage_usage
			(id, public_bytes, private_bytes, reserved_bytes, quota_bytes,
			 alert_threshold_bytes, block_threshold_bytes)
		 VALUES ($1, $2, $3, 0, $4, $5, $6)`,
		[
			STORAGE_ID,
			2_147_483_648,
			3_623_555_072,
			fixture.settings.storageQuotaBytes,
			fixture.settings.storageAlertBytes,
			fixture.settings.storageQuotaBytes
		]
	);

	await client.query('COMMIT');
	console.log(`Cible : ${target.host}${target.database} (branche test)`);
	console.log(
		`Seed terminé : ${fixture.profiles.length} profils, ${fixture.events.length} événements, ${fixture.responses.length} réponses.`
	);
	console.log('Comptes de test (mot de passe dans .env, SEED_USER_PASSWORD) :');
	for (const id of AUTH_PROFILES) {
		const profile = fixture.profiles.find((item) => item.id === id);
		console.log(`  ${profile.role.padEnd(12)} ${profile.email}`);
	}
} catch (error) {
	await client.query('ROLLBACK').catch(() => {});
	console.error('Seed échoué :', error.message);
	process.exitCode = 1;
} finally {
	await client.end().catch(() => {});
}
