<script lang="ts">
	import { BellRing, Database, HardDrive, Save } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import StatCard from '$lib/components/dashboard/StatCard.svelte';
	import { inputClass, labelClass, primaryButtonClass } from '$lib/components/dashboard/form';
	import { demo } from '$lib/demo/store.svelte';
	import { actorOf, canManageSettings } from '$lib/demo/permissions';
	import { storagePercent, updateSettings } from '$lib/demo/services/settings';
	import { formatBytes } from '$lib/demo/clock';
	import type { DemoSettings } from '$lib/demo/types';

	const actor = $derived(actorOf(demo.activeProfile));
	const allowed = $derived(canManageSettings(actor));

	let form = $state<DemoSettings>({ ...demo.settings });
	let feedback = $state<string | null>(null);
	let error = $state<string | null>(null);

	const percent = $derived(storagePercent());

	function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		try {
			updateSettings(demo.activeProfileId, form);
			feedback = 'Réglages enregistrés dans la démonstration.';
			demo.notify('success', 'Réglages enregistrés.');
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'Enregistrement impossible.';
			demo.notify('error', error);
		}
	}
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="les réglages globaux"
		message="Seul l’administrateur peut modifier les réglages globaux."
	/>
{:else}
	<PageHeader
		eyebrow="Administration"
		title="Réglages"
		description="Réglages fictifs de l’association. Aucune donnée réelle, aucun envoi de notification, aucun stockage externe."
	/>

	<section class="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Stockage simulé">
		<StatCard
			label="Stockage utilisé"
			value={formatBytes(demo.settings.storageUsedBytes)}
			hint={`${percent} % du quota`}
			tone="marine"
		>
			{#snippet icon()}<HardDrive size={18} />{/snippet}
		</StatCard>
		<StatCard
			label="Quota"
			value={formatBytes(demo.settings.storageQuotaBytes)}
			hint="Capacité fictive du bucket R2"
		/>
		<StatCard
			label="Seuil d’alerte"
			value={formatBytes(demo.settings.storageAlertBytes)}
			hint="Alerte simulée avant saturation"
		/>
	</section>

	<div class="mt-4 border border-marine/10 bg-white p-4">
		<div class="flex items-center justify-between gap-3 text-xs text-ardoise">
			<span>Occupation simulée</span>
			<span>{percent} %</span>
		</div>
		<div
			class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ivoire"
			role="img"
			aria-label={`${percent} % de stockage utilisé`}
		>
			<div class="h-full bg-marine" style={`width: ${Math.min(percent, 100)}%`}></div>
		</div>
		<p class="mt-2 text-xs text-ardoise">
			En production, cette jauge refléterait l’usage réel du bucket R2. En démonstration, la valeur
			est figée.
		</p>
	</div>

	{#if feedback}
		<p class="mt-4 border border-or/50 bg-or/10 px-4 py-3 text-sm text-ink" role="status">
			{feedback}
		</p>
	{/if}
	{#if error}
		<p class="mt-4 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
			{error}
		</p>
	{/if}

	<form class="mt-6 space-y-6" onsubmit={submit} novalidate>
		<section class="border border-marine/10 bg-white p-5">
			<h2 class="font-serif text-xl text-marine">Association</h2>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				<label class="sm:col-span-2">
					<span class={labelClass}>Nom de l’association</span>
					<input class="{inputClass} mt-1" bind:value={form.associationName} required />
				</label>
				<label>
					<span class={labelClass}>Adresse e-mail de contact</span>
					<input type="email" class="{inputClass} mt-1" bind:value={form.email} required />
				</label>
				<label>
					<span class={labelClass}>Site web</span>
					<input type="url" class="{inputClass} mt-1" bind:value={form.website} />
				</label>
				<label class="sm:col-span-2">
					<span class={labelClass}>Adresse postale</span>
					<input class="{inputClass} mt-1" bind:value={form.address} />
				</label>
			</div>
		</section>

		<section class="border border-marine/10 bg-white p-5">
			<h2 class="flex items-center gap-2 font-serif text-xl text-marine">
				<BellRing size={18} />
				Notifications
			</h2>
			<div class="mt-4 space-y-3">
				<label class="flex items-start gap-3 text-sm">
					<input
						type="checkbox"
						bind:checked={form.notifyOnEventCreate}
						class="mt-0.5 h-4 w-4 accent-marine"
					/>
					<span>
						<span class="block font-medium">Créer une notification à chaque nouvel événement</span>
						<span class="block text-xs text-ardoise"
							>Notification interne simulée, sans push OneSignal.</span
						>
					</span>
				</label>
				<label class="block max-w-xs">
					<span class={labelClass}>Rappel avant événement (jours)</span>
					<input
						type="number"
						min="0"
						max="30"
						class="{inputClass} mt-1"
						bind:value={form.notifyReminderDays}
					/>
					<span class="mt-1 block text-xs text-ardoise">Entre 0 et 30 jours.</span>
				</label>
			</div>
		</section>

		<section class="border border-marine/10 bg-ivoire/60 p-5 text-xs leading-relaxed text-ardoise">
			<h2 class="flex items-center gap-2 font-serif text-xl text-marine">
				<Database size={18} />
				Neon et stockage
			</h2>
			<p class="mt-2">
				En production, ces réglages seront enregistrés dans PostgreSQL (Neon) via Drizzle, et les
				fichiers dans Cloudflare R2. En démonstration, tout reste dans le <code>localStorage</code>
				du navigateur et disparaît à la réinitialisation.
			</p>
		</section>

		<button type="submit" class={primaryButtonClass}>
			<Save size={16} />
			Enregistrer les réglages
		</button>
	</form>
{/if}
