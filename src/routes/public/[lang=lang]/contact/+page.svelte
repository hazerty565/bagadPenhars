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
		<textarea id="message" name="message" rows="4" required class="shadow-sm rounded border w-full"
		></textarea>
	</div>

	<div class="mb-4">
		<div class="flex items-center">
			<token-input name="token"></token-input>
		</div>
	</div>

	<button type="submit" class="btn-primary w-full"> Envoyer </button>
</form>
