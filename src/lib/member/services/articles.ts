import { member } from '../store.svelte';
import type { MemberArticleStatus } from '../types';
import { actorOf, canManageContents, MemberPermissionError } from '../permissions';
import { isNonEmpty } from './helpers';

export interface MemberArticleInput {
	title: string;
	excerpt: string;
	contentMarkdown: string;
	status: MemberArticleStatus;
}

export async function saveArticle(
	_actorProfileId: string,
	input: MemberArticleInput,
	articleId: string | null = null
): Promise<void> {
	if (!canManageContents(actorOf(member.profile))) {
		throw new MemberPermissionError('Seuls la secrétaire et l’administrateur gèrent les articles.');
	}
	if (!isNonEmpty(input.title, 3)) {
		throw new MemberPermissionError('Le titre doit contenir au moins trois caractères.');
	}
	if (input.status === 'published' && !isNonEmpty(input.contentMarkdown, 10)) {
		throw new MemberPermissionError('Un article publié doit contenir du texte.');
	}

	await member.request('article.save', {
		articleId,
		input: {
			title: input.title.trim(),
			excerpt: input.excerpt.trim(),
			contentMarkdown: input.contentMarkdown,
			status: input.status
		}
	});
}

export async function setArticleStatus(
	_actorProfileId: string,
	articleId: string,
	status: MemberArticleStatus
): Promise<void> {
	if (!canManageContents(actorOf(member.profile))) {
		throw new MemberPermissionError('Seuls la secrétaire et l’administrateur gèrent les articles.');
	}
	const article = member.articles.find((item) => item.id === articleId);
	if (!article) throw new MemberPermissionError('Article introuvable.');
	if (status === 'published' && !isNonEmpty(article.contentMarkdown, 10)) {
		throw new MemberPermissionError('Un article vide ne peut pas être publié.');
	}
	await member.request('article.status', { articleId, status });
}

export async function deleteArticle(_actorProfileId: string, articleId: string): Promise<void> {
	if (!canManageContents(actorOf(member.profile))) {
		throw new MemberPermissionError('Seuls la secrétaire et l’administrateur gèrent les articles.');
	}
	await member.request('article.delete', { articleId });
}
