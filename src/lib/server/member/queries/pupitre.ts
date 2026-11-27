import { and, eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import {
	documents,
	notificationReads,
	notifications,
	profilePupitres,
	profiles,
	pupitres
} from '$lib/db/schema';
import type { AppRole } from '$lib/auth/roles';
import { isSecretaire } from '$lib/auth/roles';
import type { MemberLevel, MemberPupitreId } from '$lib/member/types';
import { MemberQueryError } from './errors';

/**
 * Données de la page espace pupitre.
 *
 * Une seule section est renseignée à la fois. `members` est la seule
 * projection qui porte `isChef` d'un autre profil (autorisé ici et dans
 * `listAdminMembersPage`, décision Q-2026-11-25-01).
 */
export interface PupitrePageData {
	pupitre: { id: MemberPupitreId; name: string };
	members?: PupitreMember[];
	documentsCount?: number;
	unreadCount?: number;
}

/**
 * Membre d'un pupitre : projection DirectoryProfile + affectation au pupitre.
 * `isChef` est exposé ICI uniquement (décision Q-2026-11-25-01).
 */
export interface PupitreMember {
	id: string;
	firstName: string;
	lastName: string;
	avatar: number;
	avatarUrl: string | null;
	pupitres: Array<{ pupitreId: MemberPupitreId; isChef: boolean }>;
	level: MemberLevel | null;
	bureauPosition: string | null;
}

export interface GetPupitrePageInput {
	pupitreId: string; // slug du pupitre (MemberPupitreId)
	section: 'overview' | 'members' | 'documents' | 'notifications';
}

interface DirectoryRow {
	id: string;
	first_name: string;
	last_name: string;
	musician_level: string | null;
	avatar: number;
	avatar_url: string | null;
	pupitres: Array<{ pupitre_id: string }> | string | null;
	bureau_title: string | null;
}

interface PupitreLookupRow {
	id: string;
	slug: string;
	name: string;
}

interface MemberPupitreRow {
	profile_id: string;
	pupitre_id: string;
	is_chef: boolean;
	slug: string;
}

/**
 * Page d'espace pupitre.
 *
 * Vérifie que `pupitreId` appartient aux pupitres dirigés par l'acteur (ou que
 * l'acteur est secrétaire/admin) avant toute lecture — `NOT_CHEF_OF_PUPITRE`
 * sinon.
 */
export async function getPupitrePage(
	tx: Transaction,
	profileId: string,
	input: GetPupitrePageInput
): Promise<PupitrePageData> {
	// ------------------------------------------------------------------
	// 1. Relire le rôle et le statut dans la transaction (défense en profondeur)
	// ------------------------------------------------------------------
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

	const actorRole: AppRole = profileRows[0].role as AppRole;
	const isSecretaireOrAdmin = isSecretaire(actorRole);

	// ------------------------------------------------------------------
	// 2. Résoudre le slug du pupitre vers son UUID
	// ------------------------------------------------------------------
	const pupitreLookup = await tx
		.select({ id: pupitres.id, slug: pupitres.slug, name: pupitres.name })
		.from(pupitres)
		.where(eq(pupitres.slug, input.pupitreId))
		.limit(1);

	if (!pupitreLookup[0]) {
		throw new MemberQueryError(
			'NOT_CHEF_OF_PUPITRE',
			`Pupitre introuvable ou hors périmètre: ${input.pupitreId}`
		);
	}

	const pupitreUuid = pupitreLookup[0].id;
	const pupitreSlug = pupitreLookup[0].slug as MemberPupitreId;
	const pupitreName = pupitreLookup[0].name;

	// ------------------------------------------------------------------
	// 3. Vérifier que l'acteur peut accéder à ce pupitre
	// ------------------------------------------------------------------
	let canAccess = false;

	if (isSecretaireOrAdmin) {
		canAccess = true;
	} else if (actorRole === 'chef_pupitre') {
		const chefRows = await tx
			.select({ is_chef: profilePupitres.is_chef })
			.from(profilePupitres)
			.where(
				and(
					eq(profilePupitres.profile_id, profileId),
					eq(profilePupitres.pupitre_id, pupitreUuid)
				)
			)
			.limit(1);

		canAccess = chefRows[0]?.is_chef === true;
	}

	if (!canAccess) {
		throw new MemberQueryError(
			'NOT_CHEF_OF_PUPITRE',
			`L'acteur n'est pas chef du pupitre: ${input.pupitreId}`
		);
	}

	// ------------------------------------------------------------------
	// 4. Construire la réponse selon la section
	// ------------------------------------------------------------------
	const base = { pupitre: { id: pupitreSlug, name: pupitreName } };

	if (input.section === 'overview') {
		return base as PupitrePageData;
	}

	if (input.section === 'documents') {
		const docResult = await tx.execute(sql`
			select count(*) as cnt
			from documents
			where pupitre_id = ${pupitreUuid}
			  and is_active = true
		`);
		const count = Number(
			((docResult as unknown as { rows: [{ cnt: string }] }).rows?.[0]?.cnt ??
				0)
		);
		return { ...base, documentsCount: count };
	}

	if (input.section === 'notifications') {
		const unreadResult = await tx.execute(sql`
			select count(*) as cnt
			from notifications n
			where not exists (
				select 1 from notification_reads nr
				where nr.notification_id = n.id and nr.profile_id = ${profileId}
			)
		`);
		const count = Number(
			((unreadResult as unknown as { rows: [{ cnt: string }] }).rows?.[0]?.cnt ??
				0)
		);
		return { ...base, unreadCount: count };
	}

	// ------------------------------------------------------------------
	// section === 'members'
	// ------------------------------------------------------------------
	// Profils actifs du pupitre ciblé, via la vue member_directory
	const membersResult = await tx.execute(sql`
		select md.id, md.first_name, md.last_name, md.musician_level, md.avatar,
		       md.avatar_url, md.pupitres, md.bureau_title
		from app.member_directory md
		inner join public.profile_pupitres pp on pp.profile_id = md.id
		where pp.pupitre_id = ${pupitreUuid}
		order by md.last_name, md.first_name
	`);
	const memberRows = ((membersResult as unknown as { rows: DirectoryRow[] }).rows ?? []);

	// Tous les pupitres (avec is_chef et slug) des membres du pupitre ciblé
	const pupilRows: MemberPupitreRow[] = await tx
		.select({
			profile_id: profilePupitres.profile_id,
			pupitre_id: profilePupitres.pupitre_id,
			is_chef: profilePupitres.is_chef,
			slug: pupitres.slug
		})
		.from(profilePupitres)
		.innerJoin(pupitres, eq(profilePupitres.pupitre_id, pupitres.id));

	const memberIdSet = new Set(memberRows.map((row) => row.id));
	const pupilByProfile = new Map<string, MemberPupitreRow[]>();
	for (const row of pupilRows) {
		if (!memberIdSet.has(row.profile_id)) continue;
		const list = pupilByProfile.get(row.profile_id) ?? [];
		list.push(row);
		pupilByProfile.set(row.profile_id, list);
	}

	const members: PupitreMember[] = memberRows.map((row) => {
		const rawPupitres = row.pupitres;
		const pupitreUuids: string[] = Array.isArray(rawPupitres)
			? rawPupitres
					.map((p) => p.pupitre_id)
					.filter((id): id is string => typeof id === 'string')
			: [];

		const ownedPupitres = (pupilByProfile.get(row.id) ?? []).map((r) => ({
			pupitreId: r.slug as MemberPupitreId,
			isChef: r.is_chef === true
		}));

		return {
			id: row.id,
			firstName: row.first_name,
			lastName: row.last_name,
			avatar: row.avatar ?? 1,
			avatarUrl: row.avatar_url ?? null,
			pupitres: ownedPupitres,
			level: row.musician_level as MemberLevel | null,
			bureauPosition: row.bureau_title ?? null
		};
	});

	return { ...base, members };
}
