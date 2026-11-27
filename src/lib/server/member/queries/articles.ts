import { asc, eq, sql } from 'drizzle-orm';
import type { Transaction } from '$lib/db';
import { articles, profiles, profilePupitres, pupitres, bureauPositions } from '$lib/db/schema';
import type {
	MemberArticle,
	DirectoryProfile,
	MemberLevel,
	MemberPupitreId
} from '$lib/member/types';
import { MemberQueryError } from './errors';

export interface ArticlesPageData {
	articles: MemberArticle[];
	authors: DirectoryProfile[];
}

/**
 * Liste les articles de la page d'administration des articles.
 *
 * Garde : secrétaire ou admin uniquement (requireRole avant l'appel).
 * Retourne tous les articles (publiés et brouillons) pour l'édition admin, avec
 * la liste des auteurs distincts (projection DirectoryProfile minimale, sans
 * email/role/accountStatus). Le champ contentMarkdown n'est renvoyé que par
 * cette page.
 *
 * Cette fonction reçoit déjà une transaction portant le contexte RLS
 * (app.profile_id), ouverte par l'appelant via runQuery /
 * withUserContext. Le caller applique requireAuth + requireRole avant la
 * transaction (garde serveur).
 *
 * Requêtes : 1 (profil/statut) + 1 (articles + auteur) + 1 (auteurs distincts)
 * = 3.
 *
 * Erreurs : PROFILE_NOT_FOUND, ACCOUNT_INACTIVE.
 */
export async function listArticlesPage(
	tx: Transaction,
	profileId: string
): Promise<ArticlesPageData> {
	// Relire le rôle et le statut dans la transaction (défense en profondeur)
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

	const articleRows = await tx
		.select({
			id: articles.id,
			title: articles.title,
			slug: articles.slug,
			excerpt: articles.excerpt,
			contentMarkdown: articles.content,
			status: sql<string>`CASE WHEN ${articles.is_published} THEN 'published' ELSE 'draft' END`.as(
				'status'
			),
			authorId: articles.author_id,
			publishedAt: sql<string>`to_char(${articles.published_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`.as(
				'publishedAt'
			),
			updatedAt: sql<string>`to_char(${articles.updated_at}, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`.as(
				'updatedAt'
			)
		})
		.from(articles)
		.orderBy(asc(articles.title));

	const articlesData: MemberArticle[] = articleRows.map((row) => ({
		id: row.id,
		title: row.title,
		slug: row.slug,
		excerpt: row.excerpt,
		contentMarkdown: row.contentMarkdown,
		status: (row.status as 'draft' | 'published') ?? 'draft',
		authorId: row.authorId,
		publishedAt: row.publishedAt ?? null,
		updatedAt: row.updatedAt
	}));

	// Auteurs distincts : projection DirectoryProfile minimale
	// (sans email, role, accountStatus, joinedAt, isChef).
	const authorRows = await tx
		.select({
			id: profiles.id,
			first_name: profiles.first_name,
			last_name: profiles.last_name,
			avatar_url: profiles.avatar_url,
			avatar: profiles.avatar,
			musician_level: profiles.musician_level,
			bureau_title: bureauPositions.title,
			pupitre_slug: pupitres.slug
		})
		.from(articles)
		.innerJoin(profiles, eq(articles.author_id, profiles.id))
		.leftJoin(bureauPositions, eq(profiles.bureau_position_id, bureauPositions.id))
		.leftJoin(profilePupitres, eq(profilePupitres.profile_id, profiles.id))
		.leftJoin(pupitres, eq(profilePupitres.pupitre_id, pupitres.id));

	const authorsById = new Map<string, DirectoryProfile>();
	for (const row of authorRows) {
		let author = authorsById.get(row.id);
		if (!author) {
			author = {
				id: row.id,
				firstName: row.first_name,
				lastName: row.last_name,
				avatar: row.avatar ?? 1,
				avatarUrl: row.avatar_url ?? null,
				pupitres: [],
				level: (row.musician_level ?? 'skolaj') as MemberLevel,
				bureauPosition: row.bureau_title ?? null
			};
			authorsById.set(row.id, author);
		}
		if (row.pupitre_slug && !author.pupitres.some((p) => p.pupitreId === row.pupitre_slug)) {
			author.pupitres.push({
				pupitreId: row.pupitre_slug as MemberPupitreId
			});
		}
	}

	const authors: DirectoryProfile[] = Array.from(authorsById.values()).sort(
		(a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
	);

	return { articles: articlesData, authors };
}
