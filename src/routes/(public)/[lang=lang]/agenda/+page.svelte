<script lang="ts">
	let {
		data
	}: {
		data: {
			events?: { id: string; title: string; date: string }[];
			user?: Record<string, unknown>;
		};
	} = $props();

	let events = $derived(data.events ?? []);
	let user = $derived(data.user);
</script>

<h1>Agenda public</h1>

{#if events.length === 0}
	<p>Aucun événement pour le moment.</p>
{:else}
	<ul>
		{#each events as ev (ev.id)}
			<li>
				<h2>{ev.title}</h2>
				<p>Date: {ev.date}</p>

				{#if user}
					<form method="post" action="?/rsvp">
						<input type="hidden" name="eventId" value={ev.id} />
						<label>
							<input type="radio" name="rsvp" value="present" /> Présent
						</label>
						<label>
							<input type="radio" name="rsvp" value="absent" /> Absent
						</label>
						<button type="submit">Envoyer</button>
					</form>
				{:else}
					<p>Connectez-vous pour indiquer votre présence.</p>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
