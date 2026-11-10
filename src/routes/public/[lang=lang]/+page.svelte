<script lang="ts">
	import { onMount } from 'svelte';

	// Chargement des données au mount
	onMount(async () => {
		// TODO: Récupérer les données publiques via fetch
		// - 2 prochains événements public
		// - 3 photos publiques
		// - 4 pupitres
	});
</script>

<main class="max-w-4xl mx-auto py-12">
	<h1 class="text-3xl font-bold mb-6">Bienvenue sur le site de Bagad Penhars</h1>

	<p class="text-lg mb-8">
		L'association Bagad Penhars vous souhaite la bienvenue. Découvrez notre histoire, nos pupitres
		et nos prochains événements.
	</p>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<div class="border rounded p-4">
			<h3>Pupitres</h3>
			<p>Bombarde, Cornemuse, Caisse claire, Percussion</p>
		</div>
		<div class="border rounded p-4">
			<h3>Dates prochaines</h3>
			<p>À venir</p>
		</div>
		<div class="border rounded p-4">
			<h3>Photos</h3>
			<p>Galerie</p>
		</div>
		<div class="border rounded p-4">
			<h3>Bagad</h3>
			<p>Histoire</p>
		</div>
	</div>
</main>
