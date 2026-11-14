<script lang="ts">
	import { resolve } from '$app/paths';
	import { KeyRound, Lock, LogOut, ShieldCheck, UserRound } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import RoleBadge from '$lib/components/dashboard/RoleBadge.svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import { secondaryButtonClass } from '$lib/components/dashboard/form';
	import { member } from '$lib/member/store.svelte';
	import { actorOf, canSeeAdminSection, chefPupitreIds } from '$lib/member/permissions';
	import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '$lib/member/labels';
	import { pupitreName } from '$lib/member/fixtures/pupitres';

	const profile = $derived(member.activeProfile);
	const actor = $derived(actorOf(profile));
	const chefs = $derived(chefPupitreIds(actor));

	const loginHref = resolve('/auth/login');
	const logoutHref = resolve('/auth/logout');
</script>

<PageHeader
	eyebrow="Mon compte"
	title="Sécurité et session"
	description="Votre session Better Auth, votre rôle et les droits associés. Les rôles métier sont lus dans la base, jamais dans le navigateur."
/>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
	<div class="space-y-6">
		<section class="border border-marine/10 bg-white p-5" aria-labelledby="session-titre">
			<h2 id="session-titre" class="flex items-center gap-2 font-serif text-xl text-marine">
				<ShieldCheck size={18} />
				Session active
			</h2>
			<div class="mt-4 flex items-center gap-4">
				<Avatar {profile} size="lg" />
				<div>
					<p class="font-serif text-xl leading-tight text-marine">
						{profile.firstName}
						{profile.lastName}
					</p>
					<p class="mt-1 flex flex-wrap items-center gap-2">
						<RoleBadge role={profile.role} size="md" />
						<Badge tone="success">Compte actif</Badge>
					</p>
				</div>
			</div>
			<dl class="mt-5 grid gap-4 text-sm sm:grid-cols-2">
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Identifiant de profil
					</dt>
					<dd class="mt-1 font-mono text-xs text-ink">{profile.id}</dd>
				</div>
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Adresse e-mail
					</dt>
					<dd class="mt-1 text-ink">{profile.email}</dd>
				</div>
				<div class="sm:col-span-2">
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Droits du rôle
					</dt>
					<dd class="mt-1 text-ink">{ROLE_DESCRIPTIONS[profile.role]}</dd>
				</div>
				{#if chefs.length}
					<div class="sm:col-span-2">
						<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
							Pupitres dirigés
						</dt>
						<dd class="mt-1 flex flex-wrap gap-1.5">
							{#each chefs as id (id)}
								<Badge tone="gold">{pupitreName(id)}</Badge>
							{/each}
						</dd>
					</div>
				{/if}
			</dl>
			<p
				class="mt-4 border border-marine/10 bg-ivoire/70 px-3 py-2 text-xs leading-relaxed text-ardoise"
			>
				La session est un cookie Better Auth vérifié à chaque requête. Le rôle et le statut du
				compte sont relus dans <code class="bg-white px-1 py-0.5">profiles</code> : modifier le
				navigateur ne change aucun droit.
			</p>
			<form method="POST" action={logoutHref} class="mt-4">
				<button type="submit" class={secondaryButtonClass}>
					<LogOut size={15} />
					Se déconnecter
				</button>
			</form>
		</section>

		<section class="border border-marine/10 bg-white p-5" aria-labelledby="mot-de-passe">
			<h2 id="mot-de-passe" class="flex items-center gap-2 font-serif text-xl text-marine">
				<Lock size={18} />
				Mot de passe
			</h2>
			<p class="mt-2 text-sm leading-relaxed text-ardoise">
				Le mot de passe est géré par Better Auth : il n’est jamais stocké en clair ni transmis au
				navigateur. Pour le réinitialiser, utilisez le lien « Mot de passe oublié ? » depuis la page
				de connexion : un e-mail signé est envoyé à votre adresse.
			</p>
			<a href={loginHref} class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-marine underline underline-offset-4">
				<KeyRound size={14} />
				Ouvrir la page de connexion
			</a>
		</section>
	</div>

	<aside class="space-y-4">
		<section class="border border-marine/15 bg-marine p-5 text-ivoire">
			<h2 class="flex items-center gap-2 font-serif text-xl text-white">
				<ShieldCheck size={18} />
				Ce qui protège réellement
			</h2>
			<ul class="mt-3 space-y-2 text-xs leading-relaxed text-ivoire/80">
				<li>Chaque commande est revalidée côté serveur, puis soumise aux politiques RLS.</li>
				<li>Les rôles et statuts viennent de <code>profiles.role</code> et <code>profiles.account_status</code>.</li>
				<li>Masquer un bouton n’est jamais considéré comme une protection.</li>
				<li>Le client ne reçoit que les données que PostgreSQL l’autorise à lire.</li>
			</ul>
		</section>

		<section class="border border-marine/10 bg-white p-5 text-xs leading-relaxed text-ardoise">
			<h2 class="font-serif text-lg text-marine">Périmètre du profil</h2>
			<p class="mt-2">
				Vous êtes <strong class="text-marine">{ROLE_LABELS[profile.role]}</strong>.
				{#if canSeeAdminSection(actor)}
					Vous pouvez ouvrir l’administration et consulter la matrice des permissions.
				{:else if profile.role === 'chef_pupitre'}
					Vous pouvez ouvrir l’espace pupitre, mais uniquement pour les pupitres que vous dirigez.
				{:else}
					Vous n’avez accès ni à l’administration ni à l’espace pupitre.
				{/if}
			</p>
			<div class="mt-3 flex flex-col gap-2">
				<a
					href={resolve('/dashboard/profil')}
					class="inline-flex items-center gap-2 font-semibold text-marine underline underline-offset-4"
				>
					<UserRound size={14} />
					Modifier mon profil
				</a>
				{#if canSeeAdminSection(actor)}
					<a
						href={resolve('/dashboard/admin/permissions')}
						class="inline-flex items-center gap-2 font-semibold text-marine underline underline-offset-4"
					>
						<ShieldCheck size={14} />
						Voir la matrice des permissions
					</a>
				{/if}
			</div>
		</section>
	</aside>
</div>
