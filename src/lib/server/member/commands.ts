import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import {
	albums,
	appSettings,
	articles,
	documents,
	eventPupitres,
	eventResponses,
	events,
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
	pupitres
} from '$lib/db/schema';
import type { AppRole, AccountStatus } from '$lib/auth/roles';
import { canInviteAndActivate, isAdmin, isSecretaire } from '$lib/auth/roles';
import {
	canCreateEvent,
	canDeleteDocument,
	canDeleteEvents,
	canDepositDocument,
	canEditMemberPupitres,
	canManageContents,
	canManageEvent,
	canManageSettings,
	canRespondToEvent,
	type MemberActor
} from '$lib/member/permissions';
import { isAllowedPhoto } from '$lib/member/photos';
import type {
	MemberEvent,
	MemberEventType,
	MemberEventVisibility,
	MemberLevel,
	MemberProfilePupitre,
	MemberPupitreId
} from '$lib/member/types';

/**
 * Commandes de l'espace adhérents.
 *
 * Chaque commande s'exécute dans la transaction ouverte par `withUserContext`
 * : PostgreSQL applique les politiques RLS du profil connecté, et le serveur
 * revalide les règles métier avec les mêmes fonctions pures que l'interface.
 * Masquer un bouton ne protège rien : tout est revérifié ici.
 *
 * Les erreurs métier portent un statut HTTP et un code stable, traduits par
 * `/api/member/action`. Une erreur PostgreSQL remonte et provoque le rollback.
 */

export class MemberCommandError extends Error {
	readonly status: number;
	readonly code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = 'MemberCommandError';
		this.status = status;
		this.code = code;
	}
}

function fail(status: number, code: string, message: string): never {
	throw new MemberCommandError(status, code, message);
}

export interface MemberCommandContext {
	/** Profil Better Auth vérifié, jamais fourni par le client. */
	profileId: string;
	/** Origine publique du site, utilisée pour construire les liens d'invitation. */
	origin: string;
}

/* -------------------------------------------------------------------------- */
/* Lecture défensive des charges utiles                                       */
/* -------------------------------------------------------------------------- */

type Payload = Record<string, unknown>;

function asRecord(value: unknown): Payload {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
	return value as Payload;
}

function readString(
	record: Payload,
	key: string,
	options: { min?: number; max?: number; label?: string } = {}
): string {
	const raw = record[key];
	const label = options.label ?? key;
	if (typeof raw !== 'string') {
		fail(400, 'invalid_payload', `Le champ « ${label} » est obligatoire.`);
	}
	const value = raw.trim();
	if (value.length < (options.min ?? 1)) {
		fail(400, 'invalid_payload', `Le champ « ${label} » est trop court.`);
	}
	if (options.max !== undefined && value.length > options.max) {
		fail(400, 'invalid_payload', `Le champ « ${label} » est trop long.`);
	}
	return value;
}

function readOptionalString(record: Payload, key: string, max = 500): string {
	const raw = record[key];
	if (raw === undefined || raw === null) return '';
	if (typeof raw !== 'string') {
		fail(400, 'invalid_payload', `Le champ « ${key} » est invalide.`);
	}
	return raw.trim().slice(0, max);
}

function readBoolean(record: Payload, key: string, fallback = false): boolean {
	const raw = record[key];
	if (raw === undefined || raw === null) return fallback;
	if (typeof raw !== 'boolean') {
		fail(400, 'invalid_payload', `Le champ « ${key} » doit être un booléen.`);
	}
	return raw;
}

function readInteger(record: Payload, key: string): number {
	const raw = record[key];
	if (typeof raw !== 'number' || !Number.isInteger(raw)) {
		fail(400, 'invalid_payload', `Le champ « ${key} » doit être un entier.`);
	}
	return raw;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readUuid(record: Payload, key: string): string {
	const raw = record[key];
	if (typeof raw !== 'string' || !UUID_PATTERN.test(raw)) {
		fail(400, 'invalid_payload', `Identifiant « ${key} » invalide.`);
	}
	return raw;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EVENT_TYPES: MemberEventType[] = [
	'sortie',
	'concert',
	'fest-noz',
	'festival',
	'concours',
	'gala',
	'repetition',
	'reunion',
	'repas'
];
const EVENT_VISIBILITIES: MemberEventVisibility[] = ['public', 'interne', 'pupitre'];
const MEMBER_LEVELS: MemberLevel[] = ['skolaj', 'bagadig', 'bagad'];
const APP_ROLES: AppRole[] = ['member', 'chef_pupitre', 'secretaire', 'admin'];
const PUPITRE_SLUGS: MemberPupitreId[] = ['bombarde', 'cornemuse', 'caisse-claire', 'percussion'];

/* -------------------------------------------------------------------------- */
/* Contexte : acteur, pupitres, événements                                    */
/* -------------------------------------------------------------------------- */

interface PupitreMaps {
	slugById: Map<string, MemberPupitreId>;
	idBySlug: Map<MemberPupitreId, string>;
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

function pupitreUuids(
	slugs: MemberPupitreId[],
	maps: PupitreMaps
): { slug: MemberPupitreId; id: string }[] {
	const unique = [...new Set(slugs)];
	return unique.map((slug) => {
		const id = maps.idBySlug.get(slug);
		if (!id) fail(400, 'invalid_payload', `Pupitre inconnu : ${slug}.`);
		return { slug, id };
	});
}

interface ResolvedActor {
	actor: MemberActor;
	accountStatus: AccountStatus;
}

async function resolveActor(
	tx: Transaction,
	profileId: string,
	maps: PupitreMaps
): Promise<ResolvedActor> {
	const rows = await tx
		.select({ id: profiles.id, role: profiles.role, account_status: profiles.account_status })
		.from(profiles)
		.where(eq(profiles.id, profileId))
		.limit(1);
	const row = rows[0];
	if (!row) fail(401, 'not_authenticated', 'Session invalide.');

	const assignments = await tx
		.select({ pupitre_id: profilePupitres.pupitre_id, is_chef: profilePupitres.is_chef })
		.from(profilePupitres)
		.where(eq(profilePupitres.profile_id, profileId));

	const pupitresOfActor = assignments
		.map((assignment) => {
			const slug = maps.slugById.get(assignment.pupitre_id);
			return slug ? { pupitreId: slug, isChef: assignment.is_chef } : null;
		})
		.filter((item): item is MemberProfilePupitre => item !== null);

	return {
		actor: { id: row.id, role: row.role as AppRole, pupitres: pupitresOfActor },
		accountStatus: row.account_status as AccountStatus
	};
}

function requireActive(resolved: ResolvedActor): MemberActor {
	if (resolved.accountStatus !== 'active') {
		fail(403, 'account_inactive', 'Votre compte n’est pas encore actif.');
	}
	return resolved.actor;
}

function requireSecretary(actor: MemberActor): void {
	if (!isSecretaire(actor.role)) {
		fail(403, 'forbidden', 'Action réservée à la secrétaire et à l’administrateur.');
	}
}

function requireAdmin(actor: MemberActor): void {
	if (!isAdmin(actor.role)) {
		fail(403, 'forbidden', 'Action réservée à l’administrateur.');
	}
}

interface EventRow {
	id: string;
	title: string;
	description: string | null;
	event_date: string;
	event_type: MemberEventType;
	visibility: MemberEventVisibility;
	location: string;
	is_poll: boolean;
	cancelled_at: Date | null;
	created_by: string;
	pupitreIds: MemberPupitreId[];
}

async function loadEvent(tx: Transaction, eventId: string, maps: PupitreMaps): Promise<EventRow> {
	const rows = await tx.select().from(events).where(eq(events.id, eventId)).limit(1);
	const row = rows[0];
	if (!row) fail(404, 'not_found', 'Événement introuvable.');

	const assigned = await tx
		.select({ pupitre_id: eventPupitres.pupitre_id })
		.from(eventPupitres)
		.where(eq(eventPupitres.event_id, eventId));

	return {
		id: row.id,
		title: row.title,
		description: row.description,
		event_date: row.event_date,
		event_type: row.event_type as MemberEventType,
		visibility: row.visibility as MemberEventVisibility,
		location: row.location,
		is_poll: row.is_poll,
		cancelled_at: row.cancelled_at,
		created_by: row.created_by,
		pupitreIds: assigned
			.map((item) => maps.slugById.get(item.pupitre_id))
			.filter((slug): slug is MemberPupitreId => slug !== undefined)
	};
}

function toMemberEvent(row: EventRow): MemberEvent {
	return {
		id: row.id,
		title: row.title,
		description: row.description ?? '',
		date: row.event_date,
		type: row.event_type,
		visibility: row.visibility,
		isPoll: row.is_poll,
		status: row.cancelled_at ? 'cancelled' : 'active',
		pupitreIds: row.pupitreIds,
		createdBy: row.created_by,
		location: row.location
	};
}

interface EventInput {
	title: string;
	description: string;
	date: string;
	type: MemberEventType;
	visibility: MemberEventVisibility;
	isPoll: boolean;
	pupitreIds: MemberPupitreId[];
	location: string;
}

function readEventInput(value: unknown): EventInput {
	const record = asRecord(value);
	const title = readString(record, 'title', { min: 3, max: 200, label: 'titre' });
	const date = readString(record, 'date', { label: 'date' });
	if (!DATE_PATTERN.test(date)) {
		fail(400, 'invalid_payload', 'La date de l’événement est invalide.');
	}
	const location = readString(record, 'location', { min: 2, max: 200, label: 'lieu' });

	const rawType = readString(record, 'type', { label: 'type' });
	if (!EVENT_TYPES.includes(rawType as MemberEventType)) {
		fail(400, 'invalid_payload', 'Type d’événement inconnu.');
	}
	const rawVisibility = readString(record, 'visibility', { label: 'visibilité' });
	if (!EVENT_VISIBILITIES.includes(rawVisibility as MemberEventVisibility)) {
		fail(400, 'invalid_payload', 'Visibilité inconnue.');
	}

	const rawPupitres = record.pupitreIds;
	const pupitreIds: MemberPupitreId[] = Array.isArray(rawPupitres)
		? rawPupitres.map((item) => {
				if (typeof item !== 'string' || !PUPITRE_SLUGS.includes(item as MemberPupitreId)) {
					fail(400, 'invalid_payload', 'Pupitre inconnu dans la sélection.');
				}
				return item as MemberPupitreId;
			})
		: [];

	const visibility = rawVisibility as MemberEventVisibility;
	if (visibility === 'pupitre' && pupitreIds.length === 0) {
		fail(400, 'invalid_payload', 'Un événement de pupitre doit cibler au moins un pupitre.');
	}

	return {
		title,
		description: readOptionalString(record, 'description', 5000),
		date,
		type: rawType as MemberEventType,
		visibility,
		isPoll: readBoolean(record, 'isPoll'),
		pupitreIds: visibility === 'pupitre' ? [...new Set(pupitreIds)] : [],
		location
	};
}

/* -------------------------------------------------------------------------- */
/* Commandes                                                                  */
/* -------------------------------------------------------------------------- */

export async function runMemberCommand(
	tx: Transaction,
	context: MemberCommandContext,
	action: string,
	rawPayload: unknown
): Promise<unknown> {
	const maps = await loadPupitreMaps(tx);
	const resolved = await resolveActor(tx, context.profileId, maps);
	const actor = requireActive(resolved);
	const payload = asRecord(rawPayload);

	switch (action) {
		/* --- Agenda -------------------------------------------------------- */
		case 'event.create': {
			const input = readEventInput(payload.input);
			if (!canCreateEvent(actor, input.pupitreIds)) {
				fail(
					403,
					'forbidden',
					'Vous ne pouvez créer que des événements ciblant un seul de vos pupitres.'
				);
			}
			const [created] = await tx
				.insert(events)
				.values({
					title: input.title,
					description: input.description,
					event_date: input.date,
					event_type: input.type,
					visibility: input.visibility,
					location: input.location,
					is_poll: input.isPoll,
					created_by: actor.id
				})
				.returning({ id: events.id });

			const targets = pupitreUuids(input.pupitreIds, maps);
			if (targets.length > 0) {
				await tx
					.insert(eventPupitres)
					.values(targets.map((target) => ({ event_id: created.id, pupitre_id: target.id })));
			}
			return { id: created.id };
		}

		case 'event.update': {
			const eventId = readUuid(payload, 'eventId');
			const existing = await loadEvent(tx, eventId, maps);
			if (!canManageEvent(actor, toMemberEvent(existing))) {
				fail(403, 'forbidden', 'Vous ne pouvez modifier que les événements de vos pupitres.');
			}
			const input = readEventInput(payload.input);
			if (!canCreateEvent(actor, input.pupitreIds)) {
				fail(
					403,
					'forbidden',
					'Un chef ne peut pas déplacer un événement vers un autre pupitre ou le rendre multi-pupitres.'
				);
			}

			await tx
				.update(events)
				.set({
					title: input.title,
					description: input.description,
					event_date: input.date,
					event_type: input.type,
					visibility: input.visibility,
					location: input.location,
					is_poll: input.isPoll,
					updated_at: new Date()
				})
				.where(eq(events.id, eventId));

			await tx.delete(eventPupitres).where(eq(eventPupitres.event_id, eventId));
			const targets = pupitreUuids(input.pupitreIds, maps);
			if (targets.length > 0) {
				await tx
					.insert(eventPupitres)
					.values(targets.map((target) => ({ event_id: eventId, pupitre_id: target.id })));
			}
			return { id: eventId };
		}

		case 'event.cancel': {
			const eventId = readUuid(payload, 'eventId');
			const existing = await loadEvent(tx, eventId, maps);
			if (!canManageEvent(actor, toMemberEvent(existing))) {
				fail(403, 'forbidden', 'Vous ne pouvez annuler que les événements de vos pupitres.');
			}
			await tx
				.update(events)
				.set({ cancelled_at: new Date(), cancelled_by: actor.id, updated_at: new Date() })
				.where(eq(events.id, eventId));
			return { id: eventId };
		}

		case 'event.reactivate': {
			const eventId = readUuid(payload, 'eventId');
			const existing = await loadEvent(tx, eventId, maps);
			if (!canManageEvent(actor, toMemberEvent(existing))) {
				fail(403, 'forbidden', 'Vous ne pouvez modifier que les événements de vos pupitres.');
			}
			await tx
				.update(events)
				.set({ cancelled_at: null, cancelled_by: null, updated_at: new Date() })
				.where(eq(events.id, eventId));
			return { id: eventId };
		}

		case 'event.delete': {
			const eventId = readUuid(payload, 'eventId');
			if (!canDeleteEvents(actor)) {
				fail(
					403,
					'forbidden',
					'Seuls la secrétaire et l’administrateur peuvent supprimer un événement.'
				);
			}
			// Le chargement garantit un 404 explicite si l'événement n'existe pas.
			await loadEvent(tx, eventId, maps);
			await tx.delete(events).where(eq(events.id, eventId));
			return { id: eventId };
		}

		case 'response.set': {
			const eventId = readUuid(payload, 'eventId');
			const status = readString(payload, 'status');
			if (status !== 'present' && status !== 'absent') {
				fail(400, 'invalid_payload', 'Réponse invalide.');
			}
			const existing = await loadEvent(tx, eventId, maps);
			if (!canRespondToEvent(actor, toMemberEvent(existing))) {
				fail(
					403,
					'event_locked',
					'Cet événement n’est pas ouvert à votre réponse (visibilité, date ou annulation).'
				);
			}
			await tx
				.insert(eventResponses)
				.values({ event_id: eventId, profile_id: actor.id, status })
				.onConflictDoUpdate({
					target: [eventResponses.event_id, eventResponses.profile_id],
					set: { status, updated_at: new Date() }
				});
			return { eventId, status };
		}

		/* --- Documents ----------------------------------------------------- */
		case 'document.create': {
			const title = readString(payload, 'title', { min: 3, max: 200, label: 'titre' });
			const fileName = readString(payload, 'fileName', { min: 3, max: 255, label: 'fichier' });
			const description = readOptionalString(payload, 'description', 2000);
			const pupitreSlug = readOptionalString(payload, 'pupitreId', 50) as MemberPupitreId | '';
			const pupitreId = pupitreSlug ? (pupitreSlug as MemberPupitreId) : null;

			if (!canDepositDocument(actor, pupitreId)) {
				fail(
					403,
					'forbidden',
					'Vous ne pouvez déposer un document que pour un pupitre que vous dirigez.'
				);
			}

			const targets = pupitreId ? pupitreUuids([pupitreId], maps) : [];
			const [created] = await tx
				.insert(documents)
				.values({
					title,
					description,
					file_key: `documents/${actor.id}/${randomUUID()}.pdf`,
					file_name: fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`,
					bucket: 'private',
					mime_type: 'application/pdf',
					size: 0,
					uploaded_by: actor.id,
					pupitre_id: targets[0]?.id ?? null
				})
				.returning({ id: documents.id });
			return { id: created.id };
		}

		case 'document.delete': {
			const documentId = readUuid(payload, 'documentId');
			const rows = await tx
				.select({
					id: documents.id,
					pupitre_id: documents.pupitre_id,
					uploaded_by: documents.uploaded_by
				})
				.from(documents)
				.where(eq(documents.id, documentId))
				.limit(1);
			const document = rows[0];
			if (!document) fail(404, 'not_found', 'Document introuvable.');

			const pupitreSlug = document.pupitre_id
				? (maps.slugById.get(document.pupitre_id) ?? null)
				: null;
			if (
				!canDeleteDocument(actor, pupitreSlug) &&
				!(isSecretaire(actor.role) || document.uploaded_by === actor.id)
			) {
				fail(403, 'forbidden', 'Vous ne pouvez pas supprimer ce document.');
			}

			await tx
				.update(documents)
				.set({ is_active: false, updated_at: new Date() })
				.where(eq(documents.id, documentId));
			return { id: documentId };
		}

		/* --- Articles ------------------------------------------------------ */
		case 'article.save': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les articles.');
			}
			const input = asRecord(payload.input);
			const title = readString(input, 'title', { min: 3, max: 200, label: 'titre' });
			const excerpt = readOptionalString(input, 'excerpt', 500);
			const content = readOptionalString(input, 'contentMarkdown', 50_000);
			const status = readString(input, 'status');
			if (status !== 'draft' && status !== 'published') {
				fail(400, 'invalid_payload', 'Statut d’article invalide.');
			}
			if (status === 'published' && content.length < 10) {
				fail(400, 'invalid_payload', 'Un article publié doit contenir du texte.');
			}

			const rawId = payload.articleId;
			const articleId =
				rawId === null || rawId === undefined ? null : readUuid(payload, 'articleId');

			const slug = await uniqueArticleSlug(tx, title, articleId);
			const published = status === 'published';

			if (articleId) {
				const rows = await tx
					.select({ id: articles.id, published_at: articles.published_at })
					.from(articles)
					.where(eq(articles.id, articleId))
					.limit(1);
				const existing = rows[0];
				if (!existing) fail(404, 'not_found', 'Article introuvable.');

				await tx
					.update(articles)
					.set({
						title,
						slug,
						excerpt,
						content,
						is_published: published,
						published_at: published ? (existing.published_at ?? new Date()) : null,
						updated_at: new Date()
					})
					.where(eq(articles.id, articleId));
				return { id: articleId };
			}

			const [created] = await tx
				.insert(articles)
				.values({
					title,
					slug,
					excerpt,
					content,
					is_published: published,
					published_at: published ? new Date() : null,
					author_id: actor.id
				})
				.returning({ id: articles.id });
			return { id: created.id };
		}

		case 'article.status': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les articles.');
			}
			const articleId = readUuid(payload, 'articleId');
			const status = readString(payload, 'status');
			if (status !== 'draft' && status !== 'published') {
				fail(400, 'invalid_payload', 'Statut d’article invalide.');
			}
			const rows = await tx
				.select({
					id: articles.id,
					content: articles.content,
					published_at: articles.published_at
				})
				.from(articles)
				.where(eq(articles.id, articleId))
				.limit(1);
			const article = rows[0];
			if (!article) fail(404, 'not_found', 'Article introuvable.');
			if (status === 'published' && article.content.trim().length < 10) {
				fail(400, 'invalid_payload', 'Un article vide ne peut pas être publié.');
			}

			const published = status === 'published';
			await tx
				.update(articles)
				.set({
					is_published: published,
					published_at: published ? (article.published_at ?? new Date()) : null,
					updated_at: new Date()
				})
				.where(eq(articles.id, articleId));
			return { id: articleId, status };
		}

		case 'article.delete': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les articles.');
			}
			const articleId = readUuid(payload, 'articleId');
			const deleted = await tx
				.delete(articles)
				.where(eq(articles.id, articleId))
				.returning({ id: articles.id });
			if (deleted.length === 0) fail(404, 'not_found', 'Article introuvable.');
			return { id: articleId };
		}

		/* --- Albums et médias --------------------------------------------- */
		case 'album.save': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les albums.');
			}
			const input = asRecord(payload.input);
			const title = readString(input, 'title', { min: 3, max: 200, label: 'titre' });
			const description = readOptionalString(input, 'description', 2000);
			const date = readString(input, 'date', { label: 'date' });
			if (!DATE_PATTERN.test(date)) {
				fail(400, 'invalid_payload', 'La date de l’album est invalide.');
			}
			const published = readBoolean(input, 'published');

			const rawId = payload.albumId;
			const albumId = rawId === null || rawId === undefined ? null : readUuid(payload, 'albumId');

			if (albumId) {
				const updated = await tx
					.update(albums)
					.set({
						title,
						description,
						album_date: date,
						is_published: published,
						updated_at: new Date()
					})
					.where(eq(albums.id, albumId))
					.returning({ id: albums.id });
				if (updated.length === 0) fail(404, 'not_found', 'Album introuvable.');
				return { id: albumId };
			}

			const [created] = await tx
				.insert(albums)
				.values({
					title,
					description,
					album_date: date,
					is_published: published,
					created_by: actor.id
				})
				.returning({ id: albums.id });
			return { id: created.id };
		}

		case 'album.photo.add': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les albums.');
			}
			const albumId = readUuid(payload, 'albumId');
			const photo = asRecord(payload.photo);
			const src = readString(photo, 'src', { max: 500, label: 'visuel' });
			if (!isAllowedPhoto(src)) {
				fail(400, 'invalid_payload', 'Seuls les visuels de la galerie publique sont autorisés.');
			}
			const alt = readString(photo, 'alt', { min: 5, max: 500, label: 'texte alternatif' });
			const caption = readOptionalString(photo, 'caption', 500) || alt;

			const albumRows = await tx
				.select({ id: albums.id })
				.from(albums)
				.where(eq(albums.id, albumId))
				.limit(1);
			if (albumRows.length === 0) fail(404, 'not_found', 'Album introuvable.');

			const [{ nextPosition }] = await tx
				.select({ nextPosition: sql<number>`coalesce(max(${media.position}), -1) + 1` })
				.from(media)
				.where(eq(media.album_id, albumId));

			const [created] = await tx
				.insert(media)
				.values({
					title: alt.slice(0, 200),
					description: caption,
					file_key: `media/${albumId}/${randomUUID()}.webp`,
					public_url: src,
					alt,
					caption,
					position: Number(nextPosition) || 0,
					bucket: 'public',
					mime_type: 'image/webp',
					size: 0,
					album_id: albumId,
					uploaded_by: actor.id
				})
				.returning({ id: media.id });
			return { id: created.id };
		}

		case 'album.photo.remove': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les albums.');
			}
			const albumId = readUuid(payload, 'albumId');
			const photoId = readUuid(payload, 'photoId');
			const deleted = await tx
				.delete(media)
				.where(and(eq(media.id, photoId), eq(media.album_id, albumId)))
				.returning({ id: media.id });
			if (deleted.length === 0) fail(404, 'not_found', 'Photo introuvable.');
			return { id: photoId };
		}

		case 'album.photo.move': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les albums.');
			}
			const albumId = readUuid(payload, 'albumId');
			const photoId = readUuid(payload, 'photoId');
			const direction = readInteger(payload, 'direction');
			if (direction !== -1 && direction !== 1) {
				fail(400, 'invalid_payload', 'Direction invalide.');
			}

			const rows = await tx
				.select({ id: media.id })
				.from(media)
				.where(eq(media.album_id, albumId))
				.orderBy(asc(media.position), asc(media.created_at));

			const index = rows.findIndex((row) => row.id === photoId);
			if (index === -1) fail(404, 'not_found', 'Photo introuvable.');
			const target = index + direction;
			if (target < 0 || target >= rows.length) return { id: photoId };

			const reordered = [...rows];
			const [moved] = reordered.splice(index, 1);
			reordered.splice(target, 0, moved);
			for (let position = 0; position < reordered.length; position += 1) {
				await tx
					.update(media)
					.set({ position, updated_at: new Date() })
					.where(eq(media.id, reordered[position].id));
			}
			return { id: photoId };
		}

		case 'album.delete': {
			if (!canManageContents(actor)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur gèrent les albums.');
			}
			const albumId = readUuid(payload, 'albumId');
			await tx.delete(media).where(eq(media.album_id, albumId));
			const deleted = await tx
				.delete(albums)
				.where(eq(albums.id, albumId))
				.returning({ id: albums.id });
			if (deleted.length === 0) fail(404, 'not_found', 'Album introuvable.');
			return { id: albumId };
		}

		/* --- Profil --------------------------------------------------------- */
		case 'profile.update': {
			const firstName = readString(payload, 'firstName', { max: 100, label: 'prénom' });
			const lastName = readString(payload, 'lastName', { max: 100, label: 'nom' });
			const level = readString(payload, 'level', { label: 'niveau' });
			if (!MEMBER_LEVELS.includes(level as MemberLevel)) {
				fail(400, 'invalid_payload', 'Niveau musical inconnu.');
			}
			await tx
				.update(profiles)
				.set({
					first_name: firstName,
					last_name: lastName,
					musician_level: level as MemberLevel,
					updated_at: new Date()
				})
				.where(eq(profiles.id, actor.id));
			return { id: actor.id };
		}

		case 'profile.avatar': {
			const avatar = readInteger(payload, 'avatar');
			if (avatar < 1 || avatar > 12) {
				fail(400, 'invalid_payload', 'Portrait invalide.');
			}
			await tx
				.update(profiles)
				.set({ avatar, updated_at: new Date() })
				.where(eq(profiles.id, actor.id));
			return { avatar };
		}

		case 'profile.preferences': {
			const prefs = {
				global_enabled: readBoolean(payload, 'global', true),
				reminders_enabled: readBoolean(payload, 'reminders', true),
				events_enabled: readBoolean(payload, 'events', true),
				updated_at: new Date()
			};
			await tx
				.insert(notificationPreferences)
				.values({ profile_id: actor.id, ...prefs })
				.onConflictDoUpdate({
					target: notificationPreferences.profile_id,
					set: prefs
				});
			return { profileId: actor.id };
		}

		/* --- Gestion des membres ------------------------------------------- */
		case 'member.pupitres': {
			const targetProfileId = readUuid(payload, 'profileId');
			if (!canEditMemberPupitres(actor, targetProfileId)) {
				fail(
					403,
					'forbidden',
					'Seuls la secrétaire et l’administrateur peuvent modifier les pupitres d’un autre membre.'
				);
			}
			const targetRows = await tx
				.select({ id: profiles.id, role: profiles.role })
				.from(profiles)
				.where(eq(profiles.id, targetProfileId))
				.limit(1);
			const targetProfile = targetRows[0];
			if (!targetProfile) fail(404, 'not_found', 'Profil introuvable.');

			const rawPupitres = payload.pupitres;
			if (!Array.isArray(rawPupitres)) {
				fail(400, 'invalid_payload', 'Liste de pupitres invalide.');
			}
			const selection: MemberProfilePupitre[] = rawPupitres.map((item) => {
				const record = asRecord(item);
				const pupitreId = readString(record, 'pupitreId');
				if (!PUPITRE_SLUGS.includes(pupitreId as MemberPupitreId)) {
					fail(400, 'invalid_payload', 'Pupitre inconnu.');
				}
				return { pupitreId: pupitreId as MemberPupitreId, isChef: readBoolean(record, 'isChef') };
			});

			const seen = new Set<MemberPupitreId>();
			for (const item of selection) {
				if (seen.has(item.pupitreId)) {
					fail(400, 'invalid_payload', 'Un pupitre ne peut être affecté qu’une fois.');
				}
				seen.add(item.pupitreId);
			}
			if (targetProfile.role === 'chef_pupitre' && !selection.some((item) => item.isChef)) {
				fail(
					400,
					'chef_without_pupitre',
					'Un chef de pupitre doit conserver au moins un pupitre dirigé. Changez d’abord son rôle.'
				);
			}

			const targets = pupitreUuids(
				selection.map((item) => item.pupitreId),
				maps
			);
			await tx.delete(profilePupitres).where(eq(profilePupitres.profile_id, targetProfileId));
			if (targets.length > 0) {
				await tx.insert(profilePupitres).values(
					selection.map((item) => ({
						profile_id: targetProfileId,
						pupitre_id: maps.idBySlug.get(item.pupitreId) as string,
						is_chef: item.isChef
					}))
				);
			}
			return { profileId: targetProfileId };
		}

		case 'member.level': {
			const targetProfileId = readUuid(payload, 'profileId');
			const level = readString(payload, 'level');
			if (!MEMBER_LEVELS.includes(level as MemberLevel)) {
				fail(400, 'invalid_payload', 'Niveau musical inconnu.');
			}
			if (actor.id !== targetProfileId && !isSecretaire(actor.role)) {
				fail(403, 'forbidden', 'Modification non autorisée.');
			}
			const updated = await tx
				.update(profiles)
				.set({ musician_level: level as MemberLevel, updated_at: new Date() })
				.where(eq(profiles.id, targetProfileId))
				.returning({ id: profiles.id });
			if (updated.length === 0) fail(404, 'not_found', 'Profil introuvable.');
			return { profileId: targetProfileId, level };
		}

		case 'member.role': {
			requireAdmin(actor);
			const targetProfileId = readUuid(payload, 'profileId');
			const role = readString(payload, 'role');
			if (!APP_ROLES.includes(role as AppRole)) {
				fail(400, 'invalid_payload', 'Rôle inconnu.');
			}
			if (actor.id === targetProfileId) {
				fail(403, 'forbidden', 'Vous ne pouvez pas modifier votre propre rôle.');
			}
			await tx.execute(
				sql`select app.set_profile_role(${targetProfileId}::uuid, ${role}::public.app_role)`
			);
			return { profileId: targetProfileId, role };
		}

		case 'member.bureau': {
			requireAdmin(actor);
			const targetProfileId = readUuid(payload, 'profileId');
			const title = readOptionalString(payload, 'position', 100);
			await tx.execute(
				sql`select app.set_profile_bureau_title(${targetProfileId}::uuid, ${title}::text)`
			);
			return { profileId: targetProfileId, position: title || null };
		}

		case 'member.status': {
			requireSecretary(actor);
			const targetProfileId = readUuid(payload, 'profileId');
			const status = readString(payload, 'status');
			if (!['pending', 'active', 'suspended'].includes(status)) {
				fail(400, 'invalid_payload', 'Statut de compte inconnu.');
			}
			if (actor.id === targetProfileId && status !== 'active') {
				fail(403, 'forbidden', 'Vous ne pouvez pas désactiver votre propre compte.');
			}
			await tx.execute(
				sql`select app.set_profile_account_status(${targetProfileId}::uuid, ${status}::public.account_status)`
			);
			return { profileId: targetProfileId, status };
		}

		/* --- Invitations ---------------------------------------------------- */
		case 'invitation.create': {
			if (!canInviteAndActivate(actor.role)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur peuvent inviter.');
			}
			const email = readString(payload, 'email', {
				max: 255,
				label: 'adresse e-mail'
			}).toLowerCase();
			if (!EMAIL_PATTERN.test(email)) {
				fail(400, 'invalid_payload', 'L’adresse e-mail est invalide.');
			}
			const firstName = readString(payload, 'firstName', { max: 100, label: 'prénom' });
			const lastName = readString(payload, 'lastName', { max: 100, label: 'nom' });

			const rawPupitres = payload.pupitreIds;
			const pupitreIds: MemberPupitreId[] = Array.isArray(rawPupitres)
				? rawPupitres.map((item) => {
						if (typeof item !== 'string' || !PUPITRE_SLUGS.includes(item as MemberPupitreId)) {
							fail(400, 'invalid_payload', 'Pupitre inconnu.');
						}
						return item as MemberPupitreId;
					})
				: [];
			if (pupitreIds.length === 0) {
				fail(400, 'invalid_payload', 'Choisissez au moins un pupitre.');
			}

			const pending = await tx
				.select({ id: invitations.id })
				.from(invitations)
				.where(
					and(
						eq(invitations.email, email),
						sql`${invitations.accepted_at} is null`,
						sql`${invitations.cancelled_at} is null`
					)
				)
				.limit(1);
			if (pending.length > 0) {
				fail(409, 'invitation_exists', 'Une invitation est déjà en attente pour cette adresse.');
			}

			const token = randomBytes(32).toString('base64url');
			const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
			const [created] = await tx
				.insert(invitations)
				.values({
					email,
					first_name: firstName,
					last_name: lastName,
					token_hash: hashInvitationToken(token),
					expires_at: expiresAt,
					last_sent_at: new Date(),
					created_by: actor.id
				})
				.returning({ id: invitations.id });

			const targets = pupitreUuids(pupitreIds, maps);
			await tx
				.insert(invitationPupitres)
				.values(targets.map((target) => ({ invitation_id: created.id, pupitre_id: target.id })));

			return {
				id: created.id,
				email,
				inviteUrl: buildInvitationUrl(context.origin, token, email)
			};
		}

		case 'invitation.resend': {
			if (!canInviteAndActivate(actor.role)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur peuvent inviter.');
			}
			const invitationId = readUuid(payload, 'invitationId');
			const rows = await tx
				.select({
					id: invitations.id,
					email: invitations.email,
					accepted_at: invitations.accepted_at,
					cancelled_at: invitations.cancelled_at
				})
				.from(invitations)
				.where(eq(invitations.id, invitationId))
				.limit(1);
			const invitation = rows[0];
			if (!invitation) fail(404, 'not_found', 'Invitation introuvable.');
			if (invitation.accepted_at || invitation.cancelled_at) {
				fail(409, 'invitation_closed', 'Cette invitation ne peut plus être renvoyée.');
			}

			const token = randomBytes(32).toString('base64url');
			await tx
				.update(invitations)
				.set({
					token_hash: hashInvitationToken(token),
					expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					last_sent_at: new Date()
				})
				.where(eq(invitations.id, invitationId));

			return {
				id: invitationId,
				email: invitation.email,
				inviteUrl: buildInvitationUrl(context.origin, token, invitation.email)
			};
		}

		case 'invitation.cancel': {
			if (!canInviteAndActivate(actor.role)) {
				fail(403, 'forbidden', 'Seuls la secrétaire et l’administrateur peuvent inviter.');
			}
			const invitationId = readUuid(payload, 'invitationId');
			const updated = await tx
				.update(invitations)
				.set({ cancelled_at: new Date() })
				.where(and(eq(invitations.id, invitationId), sql`${invitations.cancelled_at} is null`))
				.returning({ id: invitations.id });
			if (updated.length === 0) fail(404, 'not_found', 'Invitation introuvable.');
			return { id: invitationId };
		}

		/* --- Notifications -------------------------------------------------- */
		case 'notification.send': {
			const title = readString(payload, 'title', { min: 3, max: 200, label: 'titre' });
			const body = readString(payload, 'body', { min: 5, max: 5000, label: 'message' });
			const audience = readString(payload, 'audience');
			if (audience !== 'all' && audience !== 'pupitre' && audience !== 'profiles') {
				fail(400, 'invalid_payload', 'Audience inconnue.');
			}

			const rawAudienceIds = Array.isArray(payload.audienceIds) ? payload.audienceIds : [];
			const audienceIds = rawAudienceIds.map((item) => {
				if (typeof item !== 'string') fail(400, 'invalid_payload', 'Destinataire invalide.');
				return item;
			});

			const notificationAudience = audience as 'all' | 'pupitre' | 'profiles';
			if (notificationAudience === 'all') {
				if (!isSecretaire(actor.role)) {
					fail(
						403,
						'forbidden',
						'Seuls la secrétaire et l’administrateur notifient tout le bagad.'
					);
				}
			} else if (notificationAudience === 'profiles') {
				if (!isSecretaire(actor.role)) {
					fail(
						403,
						'forbidden',
						'Seuls la secrétaire et l’administrateur ciblent des membres nommément.'
					);
				}
				if (audienceIds.length === 0) {
					fail(400, 'invalid_payload', 'Choisissez au moins un destinataire.');
				}
			} else {
				const targetSlugs = audienceIds.map((item) => {
					if (!PUPITRE_SLUGS.includes(item as MemberPupitreId)) {
						fail(400, 'invalid_payload', 'Pupitre inconnu.');
					}
					return item as MemberPupitreId;
				});
				if (targetSlugs.length === 0) {
					fail(400, 'invalid_payload', 'Choisissez au moins un destinataire.');
				}
				if (
					!isSecretaire(actor.role) &&
					!targetSlugs.every((slug) =>
						actor.pupitres.some((pupitre) => pupitre.isChef && pupitre.pupitreId === slug)
					)
				) {
					fail(403, 'forbidden', 'Vous ne pouvez notifier que vos pupitres.');
				}
			}

			const [created] = await tx
				.insert(notifications)
				.values({
					title,
					body,
					audience: notificationAudience,
					sent_by: actor.id
				})
				.returning({ id: notifications.id });

			if (notificationAudience === 'pupitre') {
				const targets = pupitreUuids(audienceIds as MemberPupitreId[], maps);
				await tx
					.insert(notificationPupitres)
					.values(
						targets.map((target) => ({ notification_id: created.id, pupitre_id: target.id }))
					);
			} else if (notificationAudience === 'profiles') {
				const validIds = audienceIds.filter((item) => UUID_PATTERN.test(item));
				if (validIds.length === 0) {
					fail(400, 'invalid_payload', 'Aucun destinataire valide.');
				}
				await tx.insert(notificationProfiles).values(
					validIds.map((profileId) => ({
						notification_id: created.id,
						profile_id: profileId
					}))
				);
			}

			return { id: created.id };
		}

		case 'notification.read': {
			const notificationId = readUuid(payload, 'notificationId');
			await tx
				.insert(notificationReads)
				.values({ notification_id: notificationId, profile_id: actor.id })
				.onConflictDoNothing({
					target: [notificationReads.notification_id, notificationReads.profile_id]
				});
			return { id: notificationId };
		}

		case 'notification.unread': {
			const notificationId = readUuid(payload, 'notificationId');
			await tx
				.delete(notificationReads)
				.where(
					and(
						eq(notificationReads.notification_id, notificationId),
						eq(notificationReads.profile_id, actor.id)
					)
				);
			return { id: notificationId };
		}

		case 'notification.readAll': {
			const visible = await tx.select({ id: notifications.id }).from(notifications);
			const existing = await tx
				.select({ notification_id: notificationReads.notification_id })
				.from(notificationReads)
				.where(eq(notificationReads.profile_id, actor.id));
			const readIds = new Set(existing.map((row) => row.notification_id));
			const pending = visible.filter((row) => !readIds.has(row.id));
			if (pending.length > 0) {
				await tx
					.insert(notificationReads)
					.values(pending.map((row) => ({ notification_id: row.id, profile_id: actor.id })))
					.onConflictDoNothing({
						target: [notificationReads.notification_id, notificationReads.profile_id]
					});
			}
			return { count: pending.length };
		}

		case 'notification.delete': {
			const notificationId = readUuid(payload, 'notificationId');
			const rows = await tx
				.select({ id: notifications.id, sent_by: notifications.sent_by })
				.from(notifications)
				.where(eq(notifications.id, notificationId))
				.limit(1);
			const notification = rows[0];
			if (!notification) fail(404, 'not_found', 'Notification introuvable.');
			if (notification.sent_by !== actor.id && !isSecretaire(actor.role)) {
				fail(
					403,
					'forbidden',
					'Seuls l’auteur, la secrétaire et l’administrateur peuvent supprimer une notification.'
				);
			}
			await tx.delete(notifications).where(eq(notifications.id, notificationId));
			return { id: notificationId };
		}

		/* --- Réglages ------------------------------------------------------- */
		case 'settings.update': {
			if (!canManageSettings(actor)) {
				fail(403, 'forbidden', 'Seul l’administrateur peut modifier les réglages.');
			}
			const associationName = readString(payload, 'associationName', {
				max: 200,
				label: 'nom de l’association'
			});
			const email = readOptionalString(payload, 'email', 255);
			if (email && !EMAIL_PATTERN.test(email)) {
				fail(400, 'invalid_payload', 'L’adresse e-mail de contact est invalide.');
			}
			const notifyReminderDays = readInteger(payload, 'notifyReminderDays');
			if (notifyReminderDays < 0 || notifyReminderDays > 30) {
				fail(400, 'invalid_payload', 'Le délai de rappel doit être compris entre 0 et 30 jours.');
			}

			const updated = await tx
				.update(appSettings)
				.set({
					association_name: associationName,
					contact_email: email,
					contact_address: readOptionalString(payload, 'address', 1000),
					website: readOptionalString(payload, 'website', 255),
					notify_on_event_create: readBoolean(payload, 'notifyOnEventCreate', true),
					notify_reminder_days: notifyReminderDays,
					updated_at: new Date()
				})
				.where(eq(appSettings.id, 1))
				.returning({ id: appSettings.id });
			if (updated.length === 0) {
				fail(500, 'settings_missing', 'Les réglages de l’association sont absents.');
			}
			return { id: 1 };
		}

		default:
			fail(400, 'unknown_action', `Action inconnue : ${action}.`);
	}
}

/* -------------------------------------------------------------------------- */
/* Utilitaires                                                                */
/* -------------------------------------------------------------------------- */

function hashInvitationToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function buildInvitationUrl(origin: string, token: string, email: string): string {
	const base = origin.replace(/\/+$/, '');
	return `${base}/auth/invitation?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}

function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

async function uniqueArticleSlug(
	tx: Transaction,
	title: string,
	articleId: string | null
): Promise<string> {
	const base = slugify(title) || 'article';
	let candidate = base;
	let index = 2;
	for (;;) {
		const rows = articleId
			? await tx
					.select({ id: articles.id })
					.from(articles)
					.where(and(eq(articles.slug, candidate), ne(articles.id, articleId)))
					.limit(1)
			: await tx
					.select({ id: articles.id })
					.from(articles)
					.where(eq(articles.slug, candidate))
					.limit(1);
		if (rows.length === 0) return candidate;
		candidate = `${base}-${index}`;
		index += 1;
	}
}
