<script lang="ts">
	import { resolve } from '$app/paths';
	import { Database, KeyRound, Lock, RotateCcw, ShieldCheck, UserRound } from '@lucide/svelte';
	import PageHeader from '$lib/components/dashboard/PageHeader.svelte';
	import Badge from '$lib/components/dashboard/Badge.svelte';
	import RoleBadge from '$lib/components/dashboard/RoleBadge.svelte';
	import InlineConfirm from '$lib/components/dashboard/InlineConfirm.svelte';
	import Avatar from '$lib/components/dashboard/Avatar.svelte';
	import { secondaryButtonClass } from '$lib/components/dashboard/form';
	import { demo, DEMO_STORAGE_KEY } from '$lib/demo/store.svelte';
	import { actorOf, canSeeAdminSection, chefPupitreIds } from '$lib/demo/permissions';
	import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '$lib/demo/labels';
	import { pupitreName } from '$lib/demo/fixtures/pupitres';

	const profile = $derived(demo.activeProfile);
	const actor = $derived(actorOf(profile));
	const chefs = $derived(chefPupitreIds(actor));

	function reset() {
		demo.reset();
	}
</script>

<PageHeader
	eyebrow="Mon compte"
	title="Sécurité et session"
	description="Vue de la session simulée de la démonstration. Aucun mot de passe, cookie ou jeton réel n’est utilisé ici."
/>

<div class="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
	<div class="space-y-6">
		<section class="border border-marine/10 bg-white p-5" aria-labelledby="session-titre">
			<h2 id="session-titre" class="flex items-center gap-2 font-serif text-xl text-marine">
				<ShieldCheck size={18} />
				Session simulée
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
						<Badge tone="muted">Démonstration</Badge>
					</p>
				</div>
			</div>
			<dl class="mt-5 grid gap-4 text-sm sm:grid-cols-2">
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Identifiant fictif
					</dt>
					<dd class="mt-1 font-mono text-xs text-ink">{profile.id}</dd>
				</div>
				<div>
					<dt class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ardoise">
						Adresse fictive
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
				Le profil actif est stocké dans les données de démonstration, pas dans un cookie de session.
				Les futurs guards Better Auth s’appuieront sur une session serveur vérifiée et resteront
				seuls autoritaires.
			</p>
		</section>

		<section class="border border-marine/10 bg-white p-5" aria-labelledby="mot-de-passe">
			<h2 id="mot-de-passe" class="flex items-center gap-2 font-serif text-xl text-marine">
				<Lock size={18} />
				Mot de passe
			</h2>
			<p class="mt-2 text-sm leading-relaxed text-ardoise">
				La modification du mot de passe est volontairement désactivée en démonstration : il n’existe
				aucun compte réel, aucun secret et aucune table d’authentification. Le formulaire de
				sécurité sera branché sur Better Auth lors de l’intégration Neon.
			</p>
			<ul class="mt-3 list-disc space-y-1 pl-5 text-xs text-ardoise">
				<li>Aucun mot de passe n’est demandé ni conservé.</li>
				<li>Aucun e-mail de réinitialisation n’est envoyé.</li>
				<li>Aucun jeton de vérification n’est généré.</li>
			</ul>
		</section>

		<section class="border border-marine/10 bg-white p-5" aria-labelledby="stockage-local">
			<h2 id="stockage-local" class="flex items-center gap-2 font-serif text-xl text-marine">
				<Database size={18} />
				Données locales
			</h2>
			<p class="mt-2 text-sm leading-relaxed text-ardoise">
				Toutes les modifications de la démonstration sont conservées dans le
				<code class="bg-ivoire px-1 py-0.5 text-xs">localStorage</code> de ce navigateur, sous la
				clé
				<code class="bg-ivoire px-1 py-0.5 text-xs">{DEMO_STORAGE_KEY}</code>.
			</p>
			<ul class="mt-3 list-disc space-y-1 pl-5 text-xs text-ardoise">
				<li>Les données sont fictives et ne quittent pas le navigateur.</li>
				<li>Elles sont partagées entre les onglets ouverts du site en développement.</li>
				<li>La réinitialisation recharge le jeu de données d’origine.</li>
				<li>Vider le stockage du site produit le même effet.</li>
			</ul>
			<div class="mt-4 flex flex-wrap items-center gap-4">
				<InlineConfirm
					label="Réinitialiser la démonstration"
					confirmLabel="Confirmer la réinitialisation"
					message="Toutes les modifications locales seront perdues."
					tone="neutral"
					onconfirm={reset}
				>
					<RotateCcw size={14} />
				</InlineConfirm>
				<a href={resolve('/(public)/[lang=lang]', { lang: 'fr' })} class={secondaryButtonClass}>
					Quitter l’espace adhérents
				</a>
			</div>
		</section>
	</div>

	<aside class="space-y-4">
		<section class="border border-marine/15 bg-marine p-5 text-ivoire">
			<h2 class="flex items-center gap-2 font-serif text-xl text-white">
				<KeyRound size={18} />
				Ce qui protège réellement
			</h2>
			<ul class="mt-3 space-y-2 text-xs leading-relaxed text-ivoire/80">
				<li>
					Les services de démonstration refusent les actions interdites, même si un bouton est
					forcé.
				</li>
				<li>En production, chaque load et chaque action revérifiera la session côté serveur.</li>
				<li>Masquer un bouton n’est jamais considéré comme une protection.</li>
				<li>Les données sensibles ne seront jamais envoyées au client sans contrôle.</li>
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
