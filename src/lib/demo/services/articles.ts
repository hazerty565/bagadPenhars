import { demo } from '../store.svelte';
import type { DemoArticle, DemoArticleStatus } from '../types';
import { canManageContents, DemoPermissionError } from '../permissions';
import { actorFor, isNonEmpty, nextId, nowIso, slugify } from './helpers';

export interface DemoArticleInput {
	title: string;
	excerpt: string;
	contentMarkdown: string;
	status: DemoArticleStatus;
}

function uniqueSlug(title: string, articleId: string | null): string {
	const base = slugify(title) || 'article';
	let candidate = base;
	let index = 2;
	while (demo.articles.some((article) => article.slug === candidate && article.id !== articleId)) {
		candidate = `${base}-${index}`;
		index += 1;
	}
	return candidate;
}

export function saveArticle(
	actorProfileId: string,
	input: DemoArticleInput,
	articleId: string | null = null
): DemoArticle {
	const actor = actorFor(actorProfileId);
	if (!canManageContents(actor)) {
		throw new DemoPermissionError('Seuls la secrétaire et l’administrateur gèrent les articles.');
	}
	if (!isNonEmpty(input.title, 3)) {
		throw new DemoPermissionError('Le titre doit contenir au moins trois caractères.');
	}
	if (input.status === 'published' && !isNonEmpty(input.contentMarkdown, 10)) {
		throw new DemoPermissionError('Un article publié doit contenir du texte.');
	}

	const today = nowIso().slice(0, 10);
	const existing = articleId ? demo.articles.find((article) => article.id === articleId) : null;
	if (articleId && !existing) throw new DemoPermissionError('Article introuvable.');

	if (existing) {
		existing.title = input.title.trim();
		existing.slug = uniqueSlug(input.title, existing.id);
		existing.excerpt = input.excerpt.trim();
		existing.contentMarkdown = input.contentMarkdown;
		existing.status = input.status;
		existing.updatedAt = nowIso();
		if (input.status === 'published' && !existing.publishedAt) {
			existing.publishedAt = today;
		}
		if (input.status === 'draft') {
			existing.publishedAt = null;
		}
		demo.persist();
		return existing;
	}

	const article: DemoArticle = {
		id: nextId('a', demo.articles),
		title: input.title.trim(),
		slug: uniqueSlug(input.title, null),
		excerpt: input.excerpt.trim(),
		contentMarkdown: input.contentMarkdown,
		status: input.status,
		authorId: actor.id,
		publishedAt: input.status === 'published' ? today : null,
		updatedAt: nowIso()
	};
	demo.articles = [article, ...demo.articles];
	demo.persist();
	return article;
}

export function setArticleStatus(
	actorProfileId: string,
	articleId: string,
	status: DemoArticleStatus
): void {
	const actor = actorFor(actorProfileId);
	if (!canManageContents(actor)) {
		throw new DemoPermissionError('Seuls la secrétaire et l’administrateur gèrent les articles.');
	}
	const article = demo.articles.find((item) => item.id === articleId);
	if (!article) throw new DemoPermissionError('Article introuvable.');
	if (status === 'published' && !isNonEmpty(article.contentMarkdown, 10)) {
		throw new DemoPermissionError('Un article vide ne peut pas être publié.');
	}
	article.status = status;
	article.publishedAt =
		status === 'published' ? (article.publishedAt ?? nowIso().slice(0, 10)) : null;
	article.updatedAt = nowIso();
	demo.persist();
}

export function deleteArticle(actorProfileId: string, articleId: string): void {
	const actor = actorFor(actorProfileId);
	if (!canManageContents(actor)) {
		throw new DemoPermissionError('Seuls la secrétaire et l’administrateur gèrent les articles.');
	}
	demo.articles = demo.articles.filter((article) => article.id !== articleId);
	demo.persist();
}
