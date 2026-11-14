<script lang="ts">
	import { ArrowDown, ArrowUp, ImagePlus, Images, Plus, Trash } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import EmptyState from '$lib/components/dashboard/EmptyState.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import InlineConfirm from '$lib/components/dashboard/InlineConfirm.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import {
		errorClass,
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import { actorOf, canManageContents } from '$lib/demo/permissions';
	import {
		DEMO_PHOTO_LIBRARY,
		addPhoto,
		deleteAlbum,
		movePhoto,
		removePhoto,
		saveAlbum
	} from '$lib/demo/services/albums';
	import { formatDemoDate } from '$lib/demo/clock';

	const actor = $derived(actorOf(demo.activeProfile));
	const allowed = $derived(canManageContents(actor));

	let showForm = $state(false);
	let formTitle = $state('');
	let formDescription = $state('');
	let formDate = $state('2026-11-11');
	let formPublished = $state(false);
	let formError = $state<string | null>(null);

	let photoAlbumId = $state<string | null>(null);
	let photoSrc = $state(DEMO_PHOTO_LIBRARY[0].src);
	let photoAlt = $state('');
	let photoCaption = $state('');
	let photoError = $state<string | null>(null);

	const albums = $derived([...demo.albums].sort((a, b) => b.date.localeCompare(a.date)));

	function submitAlbum(event: SubmitEvent) {
		event.preventDefault();
		formError = null;
		try {
			saveAlbum(demo.activeProfileId, {
				title: formTitle,
				description: formDescription,
				date: formDate,
				published: formPublished
			});
			demo.notify('success', 'Album créé.');
			formTitle = '';
			formDescription = '';
			formPublished = false;
			showForm = false;
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Création impossible.';
		}
	}

	function openPhotoForm(albumId: string) {
		photoAlbumId = photoAlbumId === albumId ? null : albumId;
		photoAlt = '';
		photoCaption = '';
		photoSrc = DEMO_PHOTO_LIBRARY[0].src;
		photoError = null;
	}

	function submitPhoto(albumId: string, event: SubmitEvent) {
		event.preventDefault();
		photoError = null;
		try {
			addPhoto(demo.activeProfileId, albumId, {
				src: photoSrc,
				alt: photoAlt,
				caption: photoCaption
			});
			demo.notify('success', 'Photo ajoutée (visuel public existant).');
			photoAlbumId = null;
		} catch (error) {
			photoError = error instanceof Error ? error.message : 'Ajout impossible.';
		}
	}

	function move(albumId: string, photoId: string, direction: -1 | 1) {
		try {
			movePhoto(demo.activeProfileId, albumId, photoId, direction);
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Déplacement impossible.');
		}
	}

	function remove(albumId: string, photoId: string) {
		try {
			removePhoto(demo.activeProfileId, albumId, photoId);
			demo.notify('success', 'Photo retirée.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Retrait impossible.');
		}
	}

	function removeAlbum(albumId: string) {
		try {
			deleteAlbum(demo.activeProfileId, albumId);
			demo.notify('success', 'Album supprimé.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Suppression impossible.');
		}
	}

	function togglePublished(albumId: string) {
		const album = demo.albums.find((item) => item.id === albumId);
		if (!album) return;
		try {
			saveAlbum(
				demo.activeProfileId,
				{
					title: album.title,
					description: album.description,
					date: album.date,
					published: !album.published
				},
				album.id
			);
			demo.notify('success', album.published ? 'Album dépublié.' : 'Album publié.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Action impossible.');
		}
	}
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="la gestion des médias"
		message="Seuls la secrétaire et l’administrateur gèrent les albums."
	/>
{:else}
	<PageHeader
		eyebrow="Administration"
		title="Médias"
		description="Albums de démonstration. Les visuels disponibles sont uniquement des photographies déjà publiques du site : aucun téléversement réel n’est effectué."
	>
		{#snippet actions()}
			<button type="button" class={primaryButtonClass} onclick={() => (showForm = !showForm)}>
				<Plus size={16} />
				{showForm ? 'Fermer' : 'Nouvel album'}
			</button>
		{/snippet}
	</PageHeader>

	{#if showForm}
		<form class="mt-5 border border-or/40 bg-or/10 p-5" onsubmit={submitAlbum} novalidate>
			<h2 class="font-serif text-xl text-marine">Nouvel album</h2>
			{#if formError}
				<p class={errorClass} role="alert">{formError}</p>
			{/if}
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<label class="sm:col-span-2">
					<span class={labelClass}>Titre *</span>
					<input class="{inputClass} mt-1" bind:value={formTitle} required minlength="3" />
				</label>
				<label>
					<span class={labelClass}>Date</span>
					<input type="date" class="{inputClass} mt-1" bind:value={formDate} />
				</label>
				<label class="flex items-end gap-2 pb-2 text-sm">
					<input type="checkbox" bind:checked={formPublished} class="h-4 w-4 accent-marine" />
					Publier immédiatement
				</label>
				<label class="sm:col-span-2">
					<span class={labelClass}>Description</span>
					<textarea class="{inputClass} mt-1" bind:value={formDescription}></textarea>
				</label>
			</div>
			<div class="mt-4 flex flex-wrap gap-3">
				<button type="submit" class={primaryButtonClass}>Créer l’album</button>
				<button type="button" class={secondaryButtonClass} onclick={() => (showForm = false)}
					>Annuler</button
				>
			</div>
		</form>
	{/if}

	<div class="mt-6 space-y-4">
		{#each albums as album (album.id)}
			<section class="border border-marine/10 bg-white" aria-labelledby={`album-${album.id}`}>
				<header
					class="flex flex-col gap-3 border-b border-marine/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h2 id={`album-${album.id}`} class="font-serif text-xl text-marine">{album.title}</h2>
							<Badge tone={album.published ? 'success' : 'muted'}
								>{album.published ? 'Publié' : 'Brouillon'}</Badge
							>
							<Badge tone="muted"
								>{album.photos.length} photo{album.photos.length > 1 ? 's' : ''}</Badge
							>
						</div>
						<p class="mt-1 text-xs text-ardoise">
							{album.description} · {formatDemoDate(album.date)}
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<button
							type="button"
							class="inline-flex items-center gap-1.5 text-xs font-semibold text-marine underline underline-offset-4"
							onclick={() => openPhotoForm(album.id)}
						>
							<ImagePlus size={13} />
							Ajouter une photo
						</button>
						<button
							type="button"
							class="text-xs font-semibold text-marine underline underline-offset-4"
							onclick={() => togglePublished(album.id)}
						>
							{album.published ? 'Dépublier' : 'Publier'}
						</button>
						<InlineConfirm
							label="Supprimer l’album"
							confirmLabel="Confirmer"
							message="L’album et ses photos seront retirés."
							onconfirm={() => removeAlbum(album.id)}
						>
							<Trash size={13} />
						</InlineConfirm>
					</div>
				</header>

				{#if photoAlbumId === album.id}
					<form
						class="border-b border-marine/10 bg-ivoire/50 p-4"
						onsubmit={(event) => submitPhoto(album.id, event)}
						novalidate
					>
						<h3 class="font-serif text-lg text-marine">Ajouter une photo</h3>
						{#if photoError}
							<p class={errorClass} role="alert">{photoError}</p>
						{/if}
						<div class="mt-3 grid gap-3 sm:grid-cols-2">
							<label>
								<span class={labelClass}>Visuel de la galerie publique *</span>
								<select class="{inputClass} mt-1" bind:value={photoSrc}>
									{#each DEMO_PHOTO_LIBRARY as photo (photo.src)}
										<option value={photo.src}>{photo.src.replace('/', '')}</option>
									{/each}
								</select>
							</label>
							<label>
								<span class={labelClass}>Texte alternatif *</span>
								<input
									class="{inputClass} mt-1"
									bind:value={photoAlt}
									required
									minlength="5"
									placeholder="Description pour l’accessibilité"
								/>
							</label>
							<label class="sm:col-span-2">
								<span class={labelClass}>Légende</span>
								<input class="{inputClass} mt-1" bind:value={photoCaption} />
							</label>
						</div>
						<div class="mt-3 flex flex-wrap gap-3">
							<button type="submit" class={primaryButtonClass}>Ajouter</button>
							<button
								type="button"
								class={secondaryButtonClass}
								onclick={() => (photoAlbumId = null)}>Annuler</button
							>
						</div>
					</form>
				{/if}

				{#if album.photos.length}
					<ul class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each album.photos as photo (photo.id)}
							<li class="border border-marine/10">
								<img
									src={photo.src}
									alt={photo.alt}
									class="aspect-[4/3] w-full object-cover"
									loading="lazy"
								/>
								<div class="p-3">
									<p class="text-sm text-ink">{photo.caption}</p>
									<p class="mt-1 text-[0.65rem] text-ardoise">Ordre {photo.order} · {photo.src}</p>
									<div class="mt-2 flex flex-wrap gap-2">
										<button
											type="button"
											class="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-marine disabled:opacity-40"
											disabled={photo.order === 1}
											onclick={() => move(album.id, photo.id, -1)}
										>
											<ArrowUp size={12} />
											Monter
										</button>
										<button
											type="button"
											class="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-marine disabled:opacity-40"
											disabled={photo.order === album.photos.length}
											onclick={() => move(album.id, photo.id, 1)}
										>
											<ArrowDown size={12} />
											Descendre
										</button>
										<button
											type="button"
											class="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-danger"
											onclick={() => remove(album.id, photo.id)}
										>
											<Trash size={12} />
											Retirer
										</button>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="p-4">
						<EmptyState
							title="Album vide"
							description="Ajoutez un visuel depuis la galerie publique du site."
						>
							{#snippet icon()}<Images size={28} />{/snippet}
						</EmptyState>
					</div>
				{/if}
			</section>
		{:else}
			<EmptyState title="Aucun album" description="Créez un premier album de démonstration." />
		{/each}
	</div>
{/if}
