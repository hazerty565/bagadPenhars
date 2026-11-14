<script lang="ts">
	import { Check, ShieldCheck, X } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import AccessDenied from '$lib/components/dashboard/AccessDenied.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import { member } from '$lib/member/store.svelte';
	import { actorOf } from '$lib/member/permissions';
	import {
		canCreateEvent,
		canDeleteEvents,
		canDepositDocument,
		canManageAllEvents,
		canManageContents,
		canManageEvent,
		canManageMembers,
		canManageSettings,
		canNotify,
		canSeeAdminSection,
		canSeePupitreSection,
		canViewPermissionMatrix,
		canViewPresenceDetail,
		canChangeRole,
		type MemberActor
	} from '$lib/member/permissions';
	import { canInviteAndActivate } from '$lib/auth/roles';
	import type { AppRole } from '$lib/auth/roles';
	import type { MemberEvent } from '$lib/member/types';

	const actor = $derived(actorOf(member.activeProfile));
	const allowed = $derived(canViewPermissionMatrix(actor));

	type Column = { role: AppRole; label: string; actor: MemberActor };

	const columns: Column[] = [
		{
			role: 'member',
			label: 'Membre',
			actor: {
				id: 'x-member',
				role: 'member',
				pupitres: [{ pupitreId: 'bombarde', isChef: false }]
			}
		},
		{
			role: 'chef_pupitre',
			label: 'Chef de pupitre',
			actor: {
				id: 'x-chef',
				role: 'chef_pupitre',
				pupitres: [{ pupitreId: 'bombarde', isChef: true }]
			}
		},
		{
			role: 'secretaire',
			label: 'Secrétaire',
			actor: { id: 'x-secretaire', role: 'secretaire', pupitres: [] }
		},
		{
			role: 'admin',
			label: 'Administrateur',
			actor: { id: 'x-admin', role: 'admin', pupitres: [] }
		}
	];

	const scopedEvent: MemberEvent = {
		id: 'x-event',
		title: 'Événement de pupitre',
		description: '',
		date: '2026-12-01',
		type: 'repetition',
		visibility: 'pupitre',
		isPoll: false,
		status: 'active',
		pupitreIds: ['bombarde'],
		createdBy: 'p01',
		location: 'Salle 1'
	};

	const rows: { label: string; hint?: string; check: (actor: MemberActor) => boolean }[] = [
		{ label: 'Consulter l’agenda', check: () => true },
		{ label: 'Répondre présent ou absent', check: () => true },
		{
			label: 'Créer un événement de son pupitre',
			hint: 'Un seul pupitre dirigé, jamais de cible globale.',
			check: (candidate) => canCreateEvent(candidate, ['bombarde'])
		},
		{
			label: 'Créer un événement global ou multi-pupitres',
			check: (candidate) => canCreateEvent(candidate, [])
		},
		{
			label: 'Modifier un événement de pupitre',
			check: (candidate) => canManageEvent(candidate, scopedEvent)
		},
		{ label: 'Gérer tous les événements', check: canManageAllEvents },
		{ label: 'Supprimer un événement', check: canDeleteEvents },
		{
			label: 'Voir les présences détaillées',
			hint: 'Le chef ne voit que ses pupitres ; la secrétaire voit tout.',
			check: (candidate) => canViewPresenceDetail(candidate, scopedEvent)
		},
		{
			label: 'Déposer un document de pupitre',
			check: (candidate) => canDepositDocument(candidate, 'bombarde')
		},
		{
			label: 'Déposer un document commun',
			check: (candidate) => canDepositDocument(candidate, null)
		},
		{
			label: 'Notifier un pupitre dirigé',
			check: (candidate) => canNotify(candidate, 'pupitre', ['bombarde'])
		},
		{
			label: 'Notifier tout le bagad',
			check: (candidate) => canNotify(candidate, 'all', [])
		},
		{ label: 'Gérer les articles et albums', check: canManageContents },
		{ label: 'Gérer les membres et les invitations', check: canManageMembers },
		{
			label: 'Inviter et activer un compte',
			check: (candidate) => canInviteAndActivate(candidate.role)
		},
		{ label: 'Attribuer un rôle', check: (candidate) => canChangeRole(candidate) },
		{ label: 'Modifier les réglages globaux', check: canManageSettings },
		{ label: 'Accéder à l’administration', check: canSeeAdminSection },
		{ label: 'Accéder à l’espace pupitre', check: canSeePupitreSection }
	];
</script>

{#if !allowed}
	<AccessDenied
		{actor}
		required="la matrice des permissions"
		message="La matrice des permissions est réservée à la secrétaire et à l’administrateur."
	/>
{:else}
	<PageHeader
		eyebrow="Administration"
		title="Rôles et permissions"
		description="Matrice de référence, en lecture seule. Les mêmes fonctions sont utilisées par l’interface et par les services : masquer un bouton ne protège rien."
	/>

	<div class="mt-6 border border-marine/15 bg-white p-4 text-xs leading-relaxed text-ardoise">
		<p class="flex items-center gap-2 font-semibold text-marine">
			<ShieldCheck size={16} />
			Hiérarchie : administrateur &gt; secrétaire &gt; chef de pupitre &gt; membre
		</p>
		<p class="mt-2">
			Chaque droit ci-dessous est évalué par une fonction pure de <code>$lib/member/permissions</code
			>. Le profil actif est <Badge tone="marine">{actor.role}</Badge> ; les colonnes servent de référence.
		</p>
	</div>

	<div class="mt-4 overflow-x-auto border border-marine/10 bg-white">
		<table class="w-full min-w-[46rem] text-left text-sm">
			<thead class="border-b border-marine/10 bg-ivoire/70">
				<tr>
					<th scope="col" class="px-4 py-3 text-[0.65rem] uppercase tracking-[0.14em] text-ardoise"
						>Capacité</th
					>
					{#each columns as column (column.role)}
						<th
							scope="col"
							class="px-3 py-3 text-center text-[0.65rem] uppercase tracking-[0.14em] text-ardoise"
						>
							{column.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-marine/10">
				{#each rows as row (row.label)}
					<tr>
						<td class="px-4 py-2.5">
							<p class="text-ink">{row.label}</p>
							{#if row.hint}
								<p class="mt-0.5 text-[0.68rem] text-ardoise">{row.hint}</p>
							{/if}
						</td>
						{#each columns as column (column.role)}
							{@const granted = row.check(column.actor)}
							<td class="px-3 py-2.5 text-center">
								{#if granted}
									<span
										class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700/10 text-emerald-800"
										title="Autorisé"
									>
										<Check size={14} />
										<span class="sr-only">Autorisé</span>
									</span>
								{:else}
									<span
										class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-marine/5 text-ardoise/60"
										title="Refusé"
									>
										<X size={14} />
										<span class="sr-only">Refusé</span>
									</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<section class="mt-6 grid gap-4 lg:grid-cols-2">
		<div class="border border-marine/10 bg-white p-5">
			<h2 class="font-serif text-xl text-marine">Ce que le chef ne peut pas faire</h2>
			<ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ardoise">
				<li>Créer ou modifier un événement global ou multi-pupitres.</li>
				<li>Gérer un événement d’un pupitre qu’il ne dirige pas.</li>
				<li>Consulter les réponses détaillées d’un autre pupitre.</li>
				<li>Déposer un document commun ou notifier tout le bagad.</li>
				<li>Inviter, changer un rôle ou modifier les réglages.</li>
			</ul>
		</div>
		<div class="border border-marine/10 bg-white p-5">
			<h2 class="font-serif text-xl text-marine">Ce que la secrétaire ne peut pas faire</h2>
			<ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ardoise">
				<li>Attribuer ou retirer un rôle applicatif.</li>
				<li>Modifier les réglages globaux de l’association.</li>
				<li>Supprimer un compte ou modifier son propre rôle.</li>
			</ul>
			<p class="mt-3 text-xs text-ardoise">Ces actions restent réservées à l’administrateur.</p>
		</div>
	</section>

	<p class="mt-4 text-xs leading-relaxed text-ardoise">
		Cette matrice décrit la démonstration. En production, les mêmes règles seront vérifiées côté
		serveur, après validation de la session Better Auth ; l’interface ne sera jamais l’autorité.
	</p>
{/if}
