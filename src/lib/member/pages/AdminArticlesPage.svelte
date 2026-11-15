<script lang="ts">
	import { resolve } from '$app/paths';
	import { Eye, Pencil, Plus, Trash } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import InlineConfirm from '$lib/components/dashboard/InlineConfirm.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import { primaryButtonClass, secondaryButtonClass } from '$lib/components/dashboard/form';
	import { member } from '$lib/member/store.svelte';
	import { actorOf, canManageContents } from '$lib/member/permissions';
	import { deleteArticle, setArticleStatus } from '$lib/member/services/articles';
	import { formatDateShort } from '$lib/member/clock';
	import { ARTICLE_STATUS_LABELS } from '$lib/member/labels';
	import type { MemberArticleStatus } from '$lib/member/types';

	const actor = $derived(actorOf(member.activeProfile));
	const allowed = $derived(canManageContents(actor));

	let filter = $state<MemberArticleStatus | 'all'>('all');

	const articles = $derived(
		[...member.articles]
			.filter((article) => filter === 'all' || article.status === filter)
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
	);

	async function publish(id: string) {
		try {
			await setArticleStatus(member.activeProfileId, id, 'published');
			member.notify('success', 'Article publié.');
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Publication impossible.');
		}
	}

	async function unpublish(id: string) {
		try {
			await setArticleStatus(member.activeProfileId, id, 'draft');
			member.notify('info', 'Article repassé en brouillon.');
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Dépublication impossible.');
		}
	}

	async function remove(id: string) {
		try {
			await deleteArticle(member.activeProfileId, id);
			member.notify('success', 'Article supprimé.');
		} catch (error) {
			member.notify('error', error instanceof Error ? error.message : 'Suppression impossible.');
		}
	}

	function authorName(id: string): string {
		const author = member.profiles.find((profile) => profile.id === id);
		return author ? `${author.firstName} ${author.lastName}` : 'Auteur inconnu';
	}
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="la gestion des articles"
		message="Seuls la secrétaire et l’administrateur peuvent gérer les articles."
	/>
{:else}
	<PageHeader
		eyebrow="Administration"
		title="Articles"
		description="Rédigez, publiez ou dépubliez les actualités de l’espace membre. La page publique Actualités est figée : ces articles fictifs restent internes à la démonstration."
	>
		{#snippet actions()}
			<a href={resolve('/dashboard/admin/articles/new')} class={primaryButtonClass}>
				<Plus size={16} />
				Nouvel article
			</a>
		{/snippet}
	</PageHeader>

	<div class="mt-6 flex flex-wrap gap-1" role="group" aria-label="Filtrer les articles">
		{#each [['all', 'Tous'], ['published', 'Publiés'], ['draft', 'Brouillons']] as [value, label] (value)}
			<button
				type="button"
				class="border px-3 py-1.5 text-xs font-semibold {filter === value
					? 'border-marine bg-marine text-white'
					: 'border-marine/20 bg-white text-marine hover:border-marine'}"
				aria-pressed={filter === value}
				onclick={() => (filter = value as MemberArticleStatus | 'all')}
			>
				{label}
			</button>
		{/each}
	</div>

	<ul class="mt-3 divide-y divide-marine/10 border border-marine/10 bg-white">
		{#each articles as article (article.id)}
			<li class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<h2 class="font-serif text-lg text-marine">{article.title}</h2>
						<Badge tone={article.status === 'published' ? 'success' : 'muted'}>
							{ARTICLE_STATUS_LABELS[article.status]}
						</Badge>
					</div>
					<p class="mt-1 text-xs leading-relaxed text-ardoise">
						{article.excerpt || 'Aucun chapeau.'}
					</p>
					<p class="mt-1 text-[0.68rem] text-ardoise/80">
						{authorName(article.authorId)} · modifié le {formatDateShort(
							article.updatedAt.slice(0, 10)
						)}
						{#if article.publishedAt}
							· publié le {formatDateShort(article.publishedAt)}
						{/if}
					</p>
				</div>
				<div class="flex shrink-0 flex-wrap items-center gap-3">
					<a
						href={resolve('/dashboard/admin/articles/[id]/edit', { id: article.id })}
						class="inline-flex items-center gap-1.5 text-xs font-semibold text-marine underline underline-offset-4"
					>
						<Pencil size={13} />
						Modifier
					</a>
					{#if article.status === 'published'}
						<button
							type="button"
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-marine underline underline-offset-4"
							onclick={() => unpublish(article.id)}
						>
							<Eye size={13} />
							Dépublier
						</button>
					{:else}
						<button
							type="button"
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-marine underline underline-offset-4"
							onclick={() => publish(article.id)}
						>
							<Eye size={13} />
							Publier
						</button>
					{/if}
					<InlineConfirm
						label="Supprimer"
						confirmLabel="Supprimer définitivement"
						message="L’article sera retiré de la démonstration."
						onconfirm={() => remove(article.id)}
					>
						<Trash size={13} />
					</InlineConfirm>
				</div>
			</li>
		{:else}
			<li class="p-4">
				<EmptyState title="Aucun article" description="Aucun article ne correspond à ce filtre." />
			</li>
		{/each}
	</ul>

	<div class="mt-4 flex flex-wrap gap-3">
		<a href={resolve('/dashboard/admin')} class={secondaryButtonClass}>Retour à l’administration</a>
	</div>
{/if}
