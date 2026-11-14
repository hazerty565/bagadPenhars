<script lang="ts">
	import { Pencil, Search } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import RoleBadge from '$lib/components/dashboard/RoleBadge.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import {
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import { actorOf, canChangeRole, canManageMembers } from '$lib/demo/permissions';
	import {
		assignRole,
		updateBureauPosition,
		updateMemberLevel,
		updateMemberPupitres
	} from '$lib/demo/services/profiles';
	import { ROLE_DESCRIPTIONS, ROLE_LABELS, LEVEL_LABELS } from '$lib/demo/labels';
	import { DEMO_PUPITRES, pupitreName } from '$lib/demo/fixtures/pupitres';
	import type { AppRole } from '$lib/auth/roles';
	import type { DemoLevel, DemoProfilePupitre, DemoPupitreId } from '$lib/demo/types';

	const actor = $derived(actorOf(demo.activeProfile));
	const allowed = $derived(canManageMembers(actor));

	let search = $state('');
	let roleFilter = $state<AppRole | 'all'>('all');
	let pupitreFilter = $state<DemoPupitreId | 'all'>('all');
	let expandedId = $state<string | null>(null);
	let editPupitres = $state<DemoProfilePupitre[]>([]);
	let editLevel = $state<DemoLevel>('bagad');
	let editBureau = $state('');
	let editError = $state<string | null>(null);

	const members = $derived(
		demo.profiles
			.filter((profile) => {
				if (roleFilter !== 'all' && profile.role !== roleFilter) return false;
				if (
					pupitreFilter !== 'all' &&
					!profile.pupitres.some((pupitre) => pupitre.pupitreId === pupitreFilter)
				) {
					return false;
				}
				const needle = search.trim().toLowerCase();
				if (!needle) return true;
				return `${profile.firstName} ${profile.lastName} ${profile.email}`
					.toLowerCase()
					.includes(needle);
			})
			.sort((a, b) =>
				`${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr')
			)
	);

	function openEditor(profileId: string) {
		const profile = demo.profiles.find((item) => item.id === profileId);
		if (!profile) return;
		expandedId = expandedId === profileId ? null : profileId;
		editPupitres = profile.pupitres.map((pupitre) => ({ ...pupitre }));
		editLevel = profile.level;
		editBureau = profile.bureauPosition ?? '';
		editError = null;
	}

	function togglePupitre(id: DemoPupitreId, checked: boolean) {
		if (checked) {
			editPupitres = [...editPupitres, { pupitreId: id, isChef: false }];
		} else {
			editPupitres = editPupitres.filter((pupitre) => pupitre.pupitreId !== id);
		}
	}

	function toggleChef(id: DemoPupitreId, checked: boolean) {
		editPupitres = editPupitres.map((pupitre) =>
			pupitre.pupitreId === id ? { ...pupitre, isChef: checked } : pupitre
		);
	}

	function save(profileId: string) {
		editError = null;
		try {
			if (profileId !== demo.activeProfileId) {
				updateMemberPupitres(demo.activeProfileId, profileId, editPupitres);
			}
			updateMemberLevel(demo.activeProfileId, profileId, editLevel);
			if (canChangeRole(actor)) {
				updateBureauPosition(demo.activeProfileId, profileId, editBureau);
			}
			demo.notify('success', 'Fiche membre mise à jour.');
			expandedId = null;
		} catch (error) {
			editError = error instanceof Error ? error.message : 'Enregistrement impossible.';
			demo.notify('error', editError);
		}
	}

	function changeRole(profileId: string, role: AppRole) {
		try {
			assignRole(demo.activeProfileId, profileId, role);
			demo.notify('success', `Rôle modifié : ${ROLE_LABELS[role]}.`);
		} catch (error) {
			demo.notify(
				'error',
				error instanceof Error ? error.message : 'Changement de rôle impossible.'
			);
		}
	}
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="la gestion des membres"
		message="Seuls la secrétaire et l’administrateur peuvent gérer les membres."
	/>
{:else}
	<PageHeader
		eyebrow="Administration"
		title="Membres"
		description="Modifiez les pupitres, le niveau et la fonction au bureau. Seul l’administrateur attribue les rôles. Chaque membre peut modifier son propre profil depuis « Mon profil »."
	/>

	<section class="mt-6 border border-marine/10 bg-white p-4" aria-label="Filtres des membres">
		<div class="grid gap-3 sm:grid-cols-3">
			<label>
				<span class={labelClass}>Rechercher</span>
				<span class="relative mt-1 block">
					<Search
						size={15}
						class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ardoise"
					/>
					<input
						type="search"
						bind:value={search}
						placeholder="Nom, prénom, e-mail…"
						class="{inputClass} pl-9"
					/>
				</span>
			</label>
			<label>
				<span class={labelClass}>Rôle</span>
				<select bind:value={roleFilter} class="{inputClass} mt-1">
					<option value="all">Tous les rôles</option>
					{#each Object.entries(ROLE_LABELS) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</label>
			<label>
				<span class={labelClass}>Pupitre</span>
				<select bind:value={pupitreFilter} class="{inputClass} mt-1">
					<option value="all">Tous les pupitres</option>
					{#each DEMO_PUPITRES as pupitre (pupitre.id)}
						<option value={pupitre.id}>{pupitre.name}</option>
					{/each}
				</select>
			</label>
		</div>
		<p class="mt-3 text-xs text-ardoise">{members.length} membre(s) affiché(s).</p>
	</section>

	<div class="mt-4 overflow-x-auto border border-marine/10 bg-white">
		<table class="w-full min-w-[52rem] text-left text-sm">
			<thead
				class="border-b border-marine/10 bg-ivoire/70 text-[0.65rem] uppercase tracking-[0.14em] text-ardoise"
			>
				<tr>
					<th scope="col" class="px-4 py-3">Membre</th>
					<th scope="col" class="px-4 py-3">Rôle</th>
					<th scope="col" class="px-4 py-3">Pupitres</th>
					<th scope="col" class="px-4 py-3">Niveau</th>
					<th scope="col" class="px-4 py-3">Bureau</th>
					<th scope="col" class="px-4 py-3 text-right">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-marine/10">
				{#each members as profile (profile.id)}
					{@const isSelf = profile.id === demo.activeProfileId}
					<tr class="align-top">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<Avatar {profile} size="sm" decorative />
								<div class="min-w-0">
									<p class="font-semibold text-marine">{profile.firstName} {profile.lastName}</p>
									<p class="text-xs text-ardoise">{profile.email}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-3">
							{#if canChangeRole(actor) && !isSelf}
								<select
									class="border border-marine/20 bg-white px-2 py-1 text-xs text-ink"
									value={profile.role}
									onchange={(event) => changeRole(profile.id, event.currentTarget.value as AppRole)}
									aria-label={`Rôle de ${profile.firstName} ${profile.lastName}`}
								>
									{#each Object.entries(ROLE_LABELS) as [value, label] (value)}
										<option {value}>{label}</option>
									{/each}
								</select>
							{:else}
								<RoleBadge role={profile.role} />
								{#if isSelf}<span class="mt-1 block text-[0.62rem] text-ardoise">Votre profil</span
									>{/if}
							{/if}
						</td>
						<td class="px-4 py-3">
							<div class="flex max-w-48 flex-wrap gap-1">
								{#each profile.pupitres as pupitre (pupitre.pupitreId)}
									<Badge tone="muted"
										>{pupitreName(pupitre.pupitreId)}{pupitre.isChef ? ' · chef' : ''}</Badge
									>
								{:else}
									<span class="text-xs text-ardoise">Aucun</span>
								{/each}
							</div>
						</td>
						<td class="px-4 py-3 text-xs text-ink">{LEVEL_LABELS[profile.level]}</td>
						<td class="px-4 py-3 text-xs text-ink">{profile.bureauPosition ?? '—'}</td>
						<td class="px-4 py-3 text-right">
							<button
								type="button"
								class="inline-flex items-center gap-1 text-xs font-semibold text-marine underline underline-offset-4"
								onclick={() => openEditor(profile.id)}
							>
								<Pencil size={13} />
								{expandedId === profile.id ? 'Fermer' : 'Gérer'}
							</button>
						</td>
					</tr>
					{#if expandedId === profile.id}
						<tr class="bg-ivoire/50">
							<td colspan="6" class="px-4 py-4">
								<div class="grid gap-5 lg:grid-cols-3">
									<fieldset>
										<legend class={labelClass}>Pupitres et direction</legend>
										{#if isSelf}
											<p class="mt-2 text-xs text-ardoise">
												Vous ne pouvez pas modifier vos propres pupitres ici.
											</p>
										{:else}
											<div class="mt-2 space-y-2">
												{#each DEMO_PUPITRES as pupitre (pupitre.id)}
													{@const assigned = editPupitres.find(
														(item) => item.pupitreId === pupitre.id
													)}
													<div
														class="flex flex-wrap items-center gap-4 border border-marine/15 bg-white px-3 py-2 text-sm"
													>
														<label class="flex items-center gap-2">
															<input
																type="checkbox"
																class="h-4 w-4 accent-marine"
																checked={!!assigned}
																onchange={(event) =>
																	togglePupitre(pupitre.id, event.currentTarget.checked)}
															/>
															{pupitre.name}
														</label>
														{#if assigned}
															<label class="flex items-center gap-2 text-xs text-ardoise">
																<input
																	type="checkbox"
																	class="h-3.5 w-3.5 accent-or"
																	checked={assigned.isChef}
																	onchange={(event) =>
																		toggleChef(pupitre.id, event.currentTarget.checked)}
																/>
																Chef de ce pupitre
															</label>
														{/if}
													</div>
												{/each}
											</div>
										{/if}
									</fieldset>

									<div class="space-y-4">
										<label class="block">
											<span class={labelClass}>Niveau musical</span>
											<select class="{inputClass} mt-1" bind:value={editLevel}>
												{#each Object.entries(LEVEL_LABELS) as [value, label] (value)}
													<option {value}>{label}</option>
												{/each}
											</select>
										</label>
										<label class="block">
											<span class={labelClass}>Fonction au bureau</span>
											<input
												class="{inputClass} mt-1"
												bind:value={editBureau}
												disabled={!canChangeRole(actor)}
												placeholder="Président, secrétaire…"
											/>
											<span class="mt-1 block text-xs text-ardoise"
												>Fonction informative : aucun droit supplémentaire.</span
											>
										</label>
									</div>

									<div class="text-xs leading-relaxed text-ardoise">
										<p class="font-semibold text-marine">
											Rôle actuel : {ROLE_LABELS[profile.role]}
										</p>
										<p class="mt-1">{ROLE_DESCRIPTIONS[profile.role]}</p>
										{#if editError}
											<p class="mt-2 text-danger" role="alert">{editError}</p>
										{/if}
										<div class="mt-3 flex flex-wrap gap-2">
											<button
												type="button"
												class={primaryButtonClass}
												onclick={() => save(profile.id)}
											>
												Enregistrer
											</button>
											<button
												type="button"
												class={secondaryButtonClass}
												onclick={() => (expandedId = null)}
											>
												Annuler
											</button>
										</div>
									</div>
								</div>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	</div>

	<p class="mt-4 text-xs leading-relaxed text-ardoise">
		Un chef de pupitre doit conserver au moins un pupitre dirigé : le service refuse de retirer tous
		ses pupitres de chef tant que son rôle n’a pas changé.
	</p>
{/if}
