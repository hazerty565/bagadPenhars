<script lang="ts">
	const handleSubmit = (e: Event) => {
		e.preventDefault();
		const target = e.target as HTMLFormElement;
		if (!target) return;
		const formData = new FormData(target);
		const token = formData.get('token') as string;
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const message = formData.get('message') as string;

		if (!token || !name || !email || !message) {
			alert('Veuillez remplir tous les champs.');
			return;
		}

		fetch('/api/[lang=lang]/contact?/submit', {
			method: 'POST',
			body: formData
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.success) {
					alert('Votre message a Ã©tÃ© envoyÃ© avec succÃ¨s.');
					target.reset();
				} else {
					alert('Erreur : ' + (data.error || 'Inconnu'));
				}
			})
			.catch((err) => {
				console.error('Erreur:', err);
				alert('Erreur de connexion.');
			});
	};
</script>

<h1 class="text-2xl font-bold mb-6">Contact</h1>

<form>
	<div class="mb-4">
		<label class="block text-sm font-medium mb-2" for="name">Nom</label>
		<input type="text" id="name" name="name" required class="shadow-sm rounded border" />
	</div>

	<div class="mb-4">
		<label class="block text-sm font-medium mb-2" for="email">E-mail</label>
		<input type="email" id="email" name="email" required class="shadow-sm rounded border" />
	</div>

	<div class="mb-4">
		<label class="block text-sm font-medium mb-2" for="message">Message</label>
		<textarea id="message" name="message" rows="4" required class="shadow-sm rounded border w-full"></textarea>
	</div>

	<div class="mb-4">
		<div class="flex items-center">
			<token-input name="token"></token-input>
		</div>
	</div>

	<button type="submit" class="btn-primary w-full">
		Envoyer
	</button>
</form>