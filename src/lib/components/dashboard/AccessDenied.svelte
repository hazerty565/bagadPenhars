<script lang="ts">
	import { resolve } from '$app/paths';
	import { Lock } from '@lucide/svelte';
	import { secondaryButtonClass } from './form';
	import type { DemoActor } from '$lib/demo/permissions';
	import { ROLE_LABELS } from '$lib/demo/labels';

	interface Props {
		actor: DemoActor;
		required?: string;
		message?: string;
	}

	let {
		actor,
		required = 'cette section',
		message = 'Votre rôle ne donne pas accès à cette section.'
	}: Props = $props();
</script>

<div class="border border-marine/15 bg-white p-8 text-center">
	<Lock size={28} class="mx-auto text-ardoise/60" />
	<h1 class="mt-4 font-serif text-2xl text-marine">Accès non autorisé</h1>
	<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ardoise">
		{message} Votre profil actif est <strong>{ROLE_LABELS[actor.role]}</strong> et n’a pas les
		droits nécessaires pour {required}.
	</p>
	<p class="mt-3 text-xs text-ardoise/80">
		Cette page existe malgré tout : masquer un lien ne protège rien, les services refusent aussi
		l’action.
	</p>
	<a href={resolve('/dashboard')} class="{secondaryButtonClass} mt-6">Retour à l’accueil</a>
</div>
