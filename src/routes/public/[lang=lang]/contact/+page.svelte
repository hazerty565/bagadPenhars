<script lang="ts">
	import { getDict } from '$lib/i18n';
	import { site } from '$lib/data/site';
	import type { Lang } from '$lib/i18n';

	let { data }: { data: { lang: Lang; turnstileSiteKey: string } } = $props();

	const t = $derived(getDict(data.lang));
</script>

<div class="grid gap-8 md:grid-cols-2">
	<div>
		<h1 class="text-2xl font-bold mb-6">{t.contact.title}</h1>
		<p class="mb-6 text-base leading-relaxed text-ink/65">{t.contact.lead}</p>

		<div class="space-y-4">
			<div>
				<h2 class="font-semibold text-ink">{t.contact.details.title}</h2>
				<address class="mt-2 not-italic text-sm text-ink/65 space-y-1">
					<span>{site.address.street}</span>
					<span>{site.address.postalCode} {site.address.city}</span>
					<a
						href={`mailto:${site.email}`}
						class="break-all transition-colors hover:text-marine"
					>
						{site.email.replace('@', '(@)')}
					</a>
				</address>
			</div>
		</div>
	</div>

	<div>
		<form class="space-y-4">
			<div>
				<label class="block text-sm font-medium mb-2" for="name">{t.contact.form.lastName}</label>
				<input type="text" id="name" name="name" required class="shadow-sm rounded border w-full" />
			</div>

			<div>
				<label class="block text-sm font-medium mb-2" for="email">{t.contact.form.email}</label>
				<input type="email" id="email" name="email" required class="shadow-sm rounded border w-full" />
			</div>

			<div>
				<label class="block text-sm font-medium mb-2" for="subject">{t.contact.form.subject}</label>
				<select id="subject" name="subject" required class="shadow-sm rounded border w-full">
					<option value="">{t.contact.form.subjectPlaceholder}</option>
					<option value="adhesion">{t.contact.form.subjects.adhesion}</option>
					<option value="information">{t.contact.form.subjects.information}</option>
					<option value="partenariat">{t.contact.form.subjects.partenariat}</option>
					<option value="prestation">{t.contact.form.subjects.prestation}</option>
					<option value="autre">{t.contact.form.subjects.autre}</option>
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium mb-2" for="message">{t.contact.form.message}</label>
				<textarea
					id="message"
					name="message"
					rows="4"
					required
					class="shadow-sm rounded border w-full"
					placeholder={t.contact.form.messageHint}
				></textarea>
			</div>

			<div class="flex items-center">
				<token-input name="token"></token-input>
			</div>

			<button type="submit" class="btn-primary w-full">{t.contact.form.submit}</button>
		</form>
	</div>
</div>
