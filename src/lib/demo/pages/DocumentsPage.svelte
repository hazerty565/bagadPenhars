<script lang="ts">
	import { Download, FolderOpen, Plus, Upload } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import InlineConfirm from '$lib/components/dashboard/InlineConfirm.svelte';
	import {
		errorClass,
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import {
		actorOf,
		canDeleteDocument,
		canDepositDocument,
		canSeePupitreSection,
		chefPupitreIds,
		isChefOf,
		scopedPupitreIds
	} from '$lib/demo/permissions';
	import { addDocument, deleteDocument, simulateDownload } from '$lib/demo/services/documents';
	import { formatBytes } from '$lib/demo/clock';
	import { DEMO_PUPITRES, pupitreName } from '$lib/demo/fixtures/pupitres';
	import type { DemoPupitreId } from '$lib/demo/types';

	interface Props {
		pupitreScope?: DemoPupitreId[];
		/** Mode espace pupitre : le périmètre est calculé depuis le rôle actif. */
		pupitreMode?: boolean;
		title?: string;
		description?: string;
	}

	let {
		pupitreScope = [],
		pupitreMode = false,
		title = 'Documents et partitions',
		description = 'Tous les membres peuvent consulter les documents. Les chefs déposent pour leurs pupitres, la secrétaire et l’administrateur pour tous.'
	}: Props = $props();

	let search = $state('');
	let pupitreFilter = $state<DemoPupitreId | 'all'>('all');
	let showForm = $state(false);
	let formTitle = $state('');
	let formDescription = $state('');
	let formFileName = $state('');
	let formPupitre = $state<DemoPupitreId | 'all'>('all');
	let formError = $state<string | null>(null);

	const actor = $derived(actorOf(demo.activeProfile));
	const denied = $derived(pupitreMode && !canSeePupitreSection(actor));
	const scope = $derived(pupitreMode ? scopedPupitreIds(actor) : pupitreScope);
	const scoped = $derived(scope.length > 0);

	const availablePupitres = $derived(
		scoped
			? DEMO_PUPITRES.filter((pupitre) => scope.includes(pupitre.id))
			: actor.role === 'chef_pupitre'
				? DEMO_PUPITRES.filter((pupitre) => isChefOf(actor, pupitre.id))
				: DEMO_PUPITRES
	);

	// Un chef ne dispose pas de l’option « tous les pupitres » : le sélecteur
	// doit s’ouvrir sur le premier pupitre qu’il dirige, jamais sur une valeur
	// vide (selectedIndex = -1).
	$effect(() => {
		const ids = availablePupitres.map((pupitre) => pupitre.id);
		if (formPupitre !== 'all' && !ids.includes(formPupitre)) {
			formPupitre = ids[0] ?? 'all';
		} else if (formPupitre === 'all' && actor.role === 'chef_pupitre') {
			formPupitre = ids[0] ?? 'all';
		}
	});

	const canDepositSomewhere = $derived(
		scoped
			? availablePupitres.some((pupitre) => canDepositDocument(actor, pupitre.id))
			: actor.role === 'chef_pupitre'
				? chefPupitreIds(actor).length > 0
				: canDepositDocument(actor, null)
	);

	const documents = $derived(
		demo.documents
			.filter((document) => {
				if (scoped && document.pupitreId !== null && !scope.includes(document.pupitreId)) {
					return false;
				}
				if (
					pupitreFilter !== 'all' &&
					document.pupitreId !== null &&
					document.pupitreId !== pupitreFilter
				) {
					return false;
				}
				const needle = search.trim().toLowerCase();
				if (!needle) return true;
				return `${document.title} ${document.description} ${document.fileName}`
					.toLowerCase()
					.includes(needle);
			})
			.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
	);

	function download(fileName: string, sizeBytes: number) {
		const document = demo.documents.find((item) => item.fileName === fileName);
		demo.notify(
			'info',
			document
				? simulateDownload(document)
				: `Téléchargement simulé de ${fileName} (${formatBytes(sizeBytes)}).`
		);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		formError = null;
		try {
			addDocument(demo.activeProfileId, {
				title: formTitle,
				description: formDescription,
				fileName: formFileName,
				pupitreId: formPupitre === 'all' ? null : formPupitre
			});
			demo.notify('success', 'Document déposé (simulation : aucun fichier n’a été envoyé).');
			formTitle = '';
			formDescription = '';
			formFileName = '';
			formPupitre = 'all';
			showForm = false;
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Dépôt impossible.';
			demo.notify('error', formError);
		}
	}

	function remove(documentId: string) {
		try {
			deleteDocument(demo.activeProfileId, documentId);
			demo.notify('success', 'Document supprimé.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Suppression impossible.');
		}
	}
</script>

{#if denied}
	<div class="mt-6">
		<AccessDenied
			{actor}
			required="l’espace pupitre"
			message="L’espace pupitre est réservé aux chefs de pupitre, à la secrétaire et à l’administrateur."
		/>
	</div>
{:else}
	<PageHeader {title} {description}>
		{#snippet actions()}
			{#if canDepositSomewhere}
				<button type="button" class={primaryButtonClass} onclick={() => (showForm = !showForm)}>
					<Plus size={16} />
					{showForm ? 'Fermer le formulaire' : 'Déposer un document'}
				</button>
			{/if}
		{/snippet}
	</PageHeader>

	{#if showForm && canDepositSomewhere}
		<form class="mt-5 border border-or/40 bg-or/10 p-5" onsubmit={submit} novalidate>
			<h2 class="font-serif text-xl text-marine">Dépôt simulé</h2>
			<p class="mt-1 text-xs text-ardoise">
				Seules les métadonnées sont enregistrées. Aucun fichier n’est lu, téléversé ou stocké.
			</p>
			{#if formError}
				<p class="{errorClass} mt-3" role="alert">{formError}</p>
			{/if}
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<label class="sm:col-span-2">
					<span class={labelClass}>Titre *</span>
					<input
						class="{inputClass} mt-1"
						bind:value={formTitle}
						required
						placeholder="Partitions du set de concours"
					/>
				</label>
				<label>
					<span class={labelClass}>Nom du fichier *</span>
					<input
						class="{inputClass} mt-1"
						bind:value={formFileName}
						required
						placeholder="partitions-concours.pdf"
					/>
				</label>
				<label>
					<span class={labelClass}>Pupitre</span>
					<select class="{inputClass} mt-1" bind:value={formPupitre}>
						{#if actor.role !== 'chef_pupitre'}
							<option value="all">Tous les pupitres</option>
						{/if}
						{#each availablePupitres as pupitre (pupitre.id)}
							<option value={pupitre.id}>{pupitre.name}</option>
						{/each}
					</select>
				</label>
				<label class="sm:col-span-2">
					<span class={labelClass}>Description</span>
					<textarea
						class="{inputClass} mt-1"
						bind:value={formDescription}
						placeholder="Contenu, consignes, version…"
					></textarea>
				</label>
			</div>
			<div class="mt-4 flex flex-wrap gap-3">
				<button type="submit" class={primaryButtonClass}>
					<Upload size={16} />
					Enregistrer le document
				</button>
				<button type="button" class={secondaryButtonClass} onclick={() => (showForm = false)}
					>Annuler</button
				>
			</div>
		</form>
	{/if}

	<section class="mt-6 border border-marine/10 bg-white p-4" aria-label="Filtres des documents">
		<div class="grid gap-3 sm:grid-cols-2">
			<label>
				<span class={labelClass}>Rechercher</span>
				<input
					type="search"
					bind:value={search}
					placeholder="Titre, fichier, description…"
					class="{inputClass} mt-1"
				/>
			</label>
			<label>
				<span class={labelClass}>Pupitre</span>
				<select bind:value={pupitreFilter} class="{inputClass} mt-1">
					<option value="all">Tous les documents</option>
					{#each availablePupitres as pupitre (pupitre.id)}
						<option value={pupitre.id}>{pupitre.name}</option>
					{/each}
				</select>
			</label>
		</div>
	</section>

	<ul class="mt-4 divide-y divide-marine/10 border border-marine/10 bg-white">
		{#each documents as document (document.id)}
			<li class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
				<div class="flex min-w-0 gap-3">
					<span
						class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center bg-ivoire text-marine"
					>
						<FolderOpen size={19} />
					</span>
					<div class="min-w-0">
						<p class="font-semibold text-marine">{document.title}</p>
						<p class="mt-1 text-xs text-ardoise">{document.description}</p>
						<p class="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-ardoise/80">
							<span>{document.fileName}</span>
							<span>·</span>
							<span>{formatBytes(document.sizeBytes)}</span>
							<span>·</span>
							<span>{document.uploadedAt}</span>
							{#if document.pupitreId}
								<Badge tone="marine">{pupitreName(document.pupitreId)}</Badge>
							{:else}
								<Badge tone="muted">Tous les pupitres</Badge>
							{/if}
						</p>
					</div>
				</div>
				<div class="flex shrink-0 items-center gap-3">
					<button
						type="button"
						class="inline-flex items-center gap-1.5 text-xs font-semibold text-marine underline underline-offset-4"
						onclick={() => download(document.fileName, document.sizeBytes)}
					>
						<Download size={13} />
						Télécharger
					</button>
					{#if canDeleteDocument(actor, document.pupitreId)}
						<InlineConfirm
							label="Supprimer"
							confirmLabel="Confirmer"
							message="Le document sera retiré de la démonstration."
							onconfirm={() => remove(document.id)}
						/>
					{/if}
				</div>
			</li>
		{:else}
			<li class="p-4">
				<EmptyState
					title="Aucun document"
					description="Aucun document ne correspond à votre recherche ou à ce périmètre."
				>
					{#snippet icon()}<FolderOpen size={28} />{/snippet}
				</EmptyState>
			</li>
		{/each}
	</ul>

	<p class="mt-4 text-xs leading-relaxed text-ardoise">
		Les documents sont fictifs. En production, les PDF seront stockés dans R2 et servis après
		vérification du compte ; le mode démonstration ne simule aucune sécurité de fichier.
	</p>
{/if}
