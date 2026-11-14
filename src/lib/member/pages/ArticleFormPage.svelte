<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Save } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import MarkdownView from '$lib/components/dashboard/MarkdownView.svelte';
	import {
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import { actorOf, canManageContents } from '$lib/demo/permissions';
	import { saveArticle } from '$lib/demo/services/articles';
	import type { DemoArticleStatus } from '$lib/demo/types';

	interface Props {
		articleId?: string | null;
	}

	let { articleId = null }: Props = $props();

	const actor = $derived(actorOf(demo.activeProfile));
	const allowed = $derived(canManageContents(actor));
	const existing = $derived(
		articleId ? (demo.articles.find((article) => article.id === articleId) ?? null) : null
	);

	let title = $state(existing?.title ?? '');
	let excerpt = $state(existing?.excerpt ?? '');
	let contentMarkdown = $state(existing?.contentMarkdown ?? '');
	let status = $state<DemoArticleStatus>(existing?.status ?? 'draft');
	let error = $state<string | null>(null);
	let preview = $state(true);
	let submitting = $state(false);

	// Réinitialise le formulaire quand on change d’article sans démonter la page.
	let syncedArticleId = $state<string | null | undefined>(undefined);
	$effect(() => {
		const id = existing?.id ?? null;
		if (id === syncedArticleId) return;
		syncedArticleId = id;
		title = existing?.title ?? '';
		excerpt = existing?.excerpt ?? '';
		contentMarkdown = existing?.contentMarkdown ?? '';
		status = existing?.status ?? 'draft';
		error = null;
	});

	const placeholderMarkdown =
		'## Sous-titre\n\nParagraphe de texte.\n\n- élément de liste\n- autre élément\n\n> Citation';

	function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		submitting = true;
		try {
			saveArticle(
				demo.activeProfileId,
				{ title, excerpt, contentMarkdown, status },
				existing?.id ?? null
			);
			demo.notify('success', existing ? 'Article mis à jour.' : 'Article créé.');
			goto(resolve('/dashboard/admin/articles'));
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'Enregistrement impossible.';
		} finally {
			submitting = false;
		}
	}
</script>

<a
	href={resolve('/dashboard/admin/articles')}
	class="inline-flex items-center gap-2 text-xs font-semibold text-marine underline underline-offset-4"
>
	<ArrowLeft size={14} />
	Retour aux articles
</a>

{#if !allowed}
	<div class="mt-6">
		<AccessDenied
			{actor}
			required="la rédaction d’articles"
			message="Seuls la secrétaire et l’administrateur rédigent les articles."
		/>
	</div>
{:else if articleId && !existing}
	<div class="mt-6 border border-marine/15 bg-white p-8 text-center">
		<p class="font-serif text-2xl text-marine">Article introuvable</p>
		<p class="mt-2 text-sm text-ardoise">Cet article n’existe pas ou a été supprimé.</p>
		<a href={resolve('/dashboard/admin/articles')} class="{secondaryButtonClass} mt-5"
			>Retour à la liste</a
		>
	</div>
{:else}
	<PageHeader
		eyebrow="Article"
		title={existing ? `Modifier « ${existing.title} »` : 'Nouvel article'}
		description="Le contenu est écrit en Markdown simple et rendu sans HTML brut : aucune balise saisie n’est interprétée. Milkdown n’est pas installé à ce stade."
	/>

	{#if error}
		<p class="mt-4 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
			{error}
		</p>
	{/if}

	<form class="mt-6 space-y-6" onsubmit={submit} novalidate>
		<section class="border border-marine/10 bg-white p-5">
			<h2 class="font-serif text-xl text-marine">Informations</h2>
			<div class="mt-4 grid gap-4">
				<label>
					<span class={labelClass}>Titre *</span>
					<input
						class="{inputClass} mt-1"
						bind:value={title}
						required
						minlength="3"
						placeholder="Retour sur le concert…"
					/>
				</label>
				<label>
					<span class={labelClass}>Chapeau</span>
					<textarea
						class="{inputClass} mt-1 min-h-20"
						bind:value={excerpt}
						placeholder="Résumé affiché dans la liste des articles."
					></textarea>
				</label>
				<label>
					<span class={labelClass}>Statut</span>
					<select class="{inputClass} mt-1" bind:value={status}>
						<option value="draft">Brouillon</option>
						<option value="published">Publié</option>
					</select>
				</label>
			</div>
		</section>

		<section class="border border-marine/10 bg-white p-5">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="font-serif text-xl text-marine">Contenu Markdown</h2>
				<button
					type="button"
					class="text-xs font-semibold text-marine underline underline-offset-4"
					onclick={() => (preview = !preview)}
				>
					{preview ? 'Masquer l’aperçu' : 'Afficher l’aperçu'}
				</button>
			</div>
			<div class="mt-3 grid gap-4 {preview ? 'lg:grid-cols-2' : ''}">
				<textarea
					class="{inputClass} min-h-72 font-mono text-xs leading-relaxed"
					bind:value={contentMarkdown}
					placeholder={placeholderMarkdown}
				></textarea>
				{#if preview}
					<div class="border border-marine/10 bg-ivoire/40 p-4">
						<p class="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
							Aperçu
						</p>
						{#if contentMarkdown.trim()}
							<MarkdownView markdown={contentMarkdown} />
						{:else}
							<p class="text-sm italic text-ardoise">L’aperçu apparaîtra ici.</p>
						{/if}
					</div>
				{/if}
			</div>
			<p class="mt-3 text-xs text-ardoise">
				Syntaxe prise en charge : titres `#` à `###`, paragraphes, listes `-` ou `1.`, citations
				`&gt;`, gras `**`, italique `*` et liens `[texte](url)` (le lien est affiché en texte, pas
				rendu cliquable).
			</p>
		</section>

		<div class="flex flex-wrap gap-3">
			<button type="submit" class={primaryButtonClass} disabled={submitting}>
				<Save size={16} />
				{submitting
					? 'Enregistrement…'
					: existing
						? 'Enregistrer les modifications'
						: 'Créer l’article'}
			</button>
			<a href={resolve('/dashboard/admin/articles')} class={secondaryButtonClass}>Annuler</a>
		</div>
	</form>
{/if}
