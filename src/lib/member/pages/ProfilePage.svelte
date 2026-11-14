<script lang="ts">
	import { Check, Save } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import RoleBadge from '$lib/components/dashboard/RoleBadge.svelte';
	import {
		inputClass,
		labelClass,
		primaryButtonClass,
		secondaryButtonClass
	} from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import { updateAvatar, updateOwnProfile, updatePreferences } from '$lib/demo/services/profiles';
	import { ROLE_LABELS, LEVEL_LABELS } from '$lib/demo/labels';
	import { formatDemoDate } from '$lib/demo/clock';
	import { pupitreName } from '$lib/demo/fixtures/pupitres';
	import type { DemoLevel } from '$lib/demo/types';

	const profile = $derived(demo.activeProfile);

	let syncedId = $state('');
	let firstName = $state(profile.firstName);
	let lastName = $state(profile.lastName);
	let email = $state(profile.email);
	let level = $state<DemoLevel>(profile.level);
	let global = $state(true);
	let reminders = $state(true);
	let events = $state(true);
	let feedback = $state<string | null>(null);

	$effect(() => {
		const current = demo.activeProfile;
		if (current.id !== syncedId) {
			syncedId = current.id;
			firstName = current.firstName;
			lastName = current.lastName;
			email = current.email;
			level = current.level;
			const preferences = demo.preferences.find((item) => item.profileId === current.id);
			global = preferences?.global ?? true;
			reminders = preferences?.reminders ?? true;
			events = preferences?.events ?? true;
			feedback = null;
		}
	});

	function saveIdentity(event: SubmitEvent) {
		event.preventDefault();
		try {
			updateOwnProfile(profile.id, { firstName, lastName, email, level });
			feedback = 'Vos informations ont été enregistrées.';
			demo.notify('success', 'Profil mis à jour.');
		} catch (error) {
			feedback = error instanceof Error ? error.message : 'Enregistrement impossible.';
			demo.notify('error', feedback);
		}
	}

	function chooseAvatar(avatar: number) {
		try {
			updateAvatar(profile.id, avatar);
			demo.notify('success', 'Portrait mis à jour.');
		} catch (error) {
			demo.notify('error', error instanceof Error ? error.message : 'Portrait non modifié.');
		}
	}

	function savePreferences() {
		try {
			updatePreferences(profile.id, { global, reminders, events });
			demo.notify('success', 'Préférences de notifications enregistrées.');
		} catch (error) {
			demo.notify(
				'error',
				error instanceof Error ? error.message : 'Préférences non enregistrées.'
			);
		}
	}
</script>

<PageHeader
	eyebrow="Mon compte"
	title="Mon profil"
	description="Modifiez vos informations autorisées et votre portrait. Le rôle, les pupitres et la fonction au bureau restent en lecture seule : ils sont gérés par la secrétaire ou l’administrateur."
/>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
	<div class="space-y-6">
		{#if feedback}
			<p class="border border-or/50 bg-or/10 px-4 py-3 text-sm text-ink" role="status">
				{feedback}
			</p>
		{/if}

		<form class="border border-marine/10 bg-white p-5" onsubmit={saveIdentity} novalidate>
			<h2 class="font-serif text-xl text-marine">Identité</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<label>
					<span class={labelClass}>Prénom *</span>
					<input class="{inputClass} mt-1" bind:value={firstName} required />
				</label>
				<label>
					<span class={labelClass}>Nom *</span>
					<input class="{inputClass} mt-1" bind:value={lastName} required />
				</label>
				<label class="sm:col-span-2">
					<span class={labelClass}>Adresse e-mail *</span>
					<input type="email" class="{inputClass} mt-1" bind:value={email} required />
					<span class="mt-1 block text-xs text-ardoise"
						>Adresse fictive : le domaine example.com est réservé.</span
					>
				</label>
				<label>
					<span class={labelClass}>Niveau musical</span>
					<select class="{inputClass} mt-1" bind:value={level}>
						{#each Object.entries(LEVEL_LABELS) as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
				</label>
			</div>
			<button type="submit" class="{primaryButtonClass} mt-5">
				<Save size={16} />
				Enregistrer
			</button>
		</form>

		<section class="border border-marine/10 bg-white p-5" aria-labelledby="portrait-titre">
			<h2 id="portrait-titre" class="font-serif text-xl text-marine">Portrait illustré</h2>
			<p class="mt-1 text-xs text-ardoise">
				Douze portraits vectoriels fictifs. Vous ne pouvez modifier que le vôtre.
			</p>
			<div class="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
				{#each Array.from({ length: 12 }, (_, index) => index + 1) as avatar (avatar)}
					{@const preview = { ...profile, avatar }}
					<button
						type="button"
						class="flex flex-col items-center gap-1 border p-2 transition-colors {profile.avatar ===
						avatar
							? 'border-or bg-or/10'
							: 'border-marine/15 hover:border-marine/40'}"
						aria-pressed={profile.avatar === avatar}
						aria-label={`Choisir le portrait ${avatar}`}
						onclick={() => chooseAvatar(avatar)}
					>
						<Avatar profile={preview} size="md" decorative />
						{#if profile.avatar === avatar}
							<span class="inline-flex items-center gap-1 text-[0.6rem] font-semibold text-or-dark"
								><Check size={11} /> Actuel</span
							>
						{:else}
							<span class="text-[0.6rem] text-ardoise">Portrait {avatar}</span>
						{/if}
					</button>
				{/each}
			</div>
		</section>

		<section class="border border-marine/10 bg-white p-5" aria-labelledby="preferences-titre">
			<h2 id="preferences-titre" class="font-serif text-xl text-marine">
				Préférences de notifications
			</h2>
			<p class="mt-1 text-xs text-ardoise">
				Simulation uniquement : aucune notification push n’est envoyée.
			</p>
			<div class="mt-4 space-y-3">
				<label class="flex items-start gap-3 text-sm text-ink">
					<input type="checkbox" bind:checked={global} class="mt-0.5 h-4 w-4 accent-marine" />
					<span>
						<span class="block font-medium">Informations générales de l’association</span>
						<span class="block text-xs text-ardoise"
							>Annonces, comptes rendus, messages du bureau.</span
						>
					</span>
				</label>
				<label class="flex items-start gap-3 text-sm text-ink">
					<input type="checkbox" bind:checked={reminders} class="mt-0.5 h-4 w-4 accent-marine" />
					<span>
						<span class="block font-medium">Rappels avant les événements</span>
						<span class="block text-xs text-ardoise"
							>Rappel simulé quelques jours avant la date.</span
						>
					</span>
				</label>
				<label class="flex items-start gap-3 text-sm text-ink">
					<input type="checkbox" bind:checked={events} class="mt-0.5 h-4 w-4 accent-marine" />
					<span>
						<span class="block font-medium">Événements de mes pupitres</span>
						<span class="block text-xs text-ardoise"
							>Nouvelles répétitions, documents, consignes.</span
						>
					</span>
				</label>
			</div>
			<button type="button" class="{secondaryButtonClass} mt-5" onclick={savePreferences}>
				Enregistrer les préférences
			</button>
		</section>
	</div>

	<aside class="space-y-4">
		<section class="border border-marine/10 bg-white p-5">
			<div class="flex items-center gap-4">
				<Avatar {profile} size="lg" />
				<div>
					<p class="font-serif text-xl leading-tight text-marine">
						{profile.firstName}
						{profile.lastName}
					</p>
					<p class="mt-1"><RoleBadge role={profile.role} size="md" /></p>
				</div>
			</div>
			<p class="mt-3 text-xs leading-relaxed text-ardoise">
				{ROLE_LABELS[profile.role]} · membre depuis {formatDemoDate(profile.joinedAt)}.
			</p>
		</section>

		<section class="border border-marine/10 bg-white p-5">
			<h2 class="font-serif text-lg text-marine">Lecture seule</h2>
			<dl class="mt-3 space-y-3 text-sm">
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Rôle
					</dt>
					<dd class="mt-1 text-ink">{ROLE_LABELS[profile.role]}</dd>
				</div>
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Pupitres
					</dt>
					<dd class="mt-1 flex flex-wrap gap-1.5">
						{#each profile.pupitres as pupitre (pupitre.pupitreId)}
							<Badge tone="marine"
								>{pupitreName(pupitre.pupitreId)}{pupitre.isChef ? ' · chef' : ''}</Badge
							>
						{:else}
							<span class="text-ardoise">Aucun</span>
						{/each}
					</dd>
				</div>
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Fonction au bureau
					</dt>
					<dd class="mt-1 text-ink">{profile.bureauPosition ?? 'Aucune'}</dd>
				</div>
			</dl>
		</section>

		<p class="border border-marine/10 bg-ivoire/70 p-4 text-xs leading-relaxed text-ardoise">
			Le rôle et les pupitres ne sont pas modifiables ici. En démonstration, changez de profil pour
			voir les droits d’une secrétaire ou d’un administrateur.
		</p>
	</aside>
</div>
