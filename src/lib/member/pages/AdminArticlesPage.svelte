<script lang="ts">
	import { resolve } from '$app/paths';
	import { Eye, Pencil, Plus, Trash } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import InlineConfirm from '$lib/components/dashboard/InlineConfirm.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import { primaryButtonClass, secondaryButtonClass } from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import { actorOf, canManageContents } from '$lib/demo/permissions';
	import { deleteArticle, setArticleStatus } from '$lib/demo/services/articles';
	import { formatDemoDateShort } from '$lib/demo/clock';
	import { ARTICLE_STATUS_LABELS } from '$lib/demo/labels';
	import type { DemoArticleStatus } from '$lib/demo/types';

	const actor = $derived(actorOf(demo.activeProfile));
	const allowed = $derived(canManageContents(actor));

	let filter = $state<DemoArticleStatus | 'all'>('all');

	const articles = $derived(
		[...demo.articles]
			.filter((article) => filter === 'all' || article.status === filter)
			.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
	);

	function publish(id: string) {
		try {
			setArticleStatus(demo.activeProfileId, id, 'published');
			demo.notify('success', 'Article publié.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Publication impossible.');
		}
	}

	function unpublish(id: string) {
		try {
			setArticleStatus(demo.activeProfileId, id, 'draft');
			demo.notify('info', 'Article repassé en brouillon.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Dépublication impossible.');
		}
	}

	function remove(id: string) {
		try {
			deleteArticle(demo.activeProfileId, id);
			demo.notify('success', 'Article supprimé.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Suppression impossible.');
		}
	}

	function authorName(id: string): string {
		const author = demo.profiles.find((profile) => profile.id === id);
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
				onclick={() => (filter = value as DemoArticleStatus | 'all')}
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
						{authorName(article.authorId)} · modifié le {formatDemoDateShort(
							article.updatedAt.slice(0, 10)
						)}
						{#if article.publishedAt}
							· publié le {formatDemoDateShort(article.publishedAt)}
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
