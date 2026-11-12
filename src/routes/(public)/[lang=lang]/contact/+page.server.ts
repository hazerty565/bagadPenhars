import { fail } from '@sveltejs/kit';
import { site } from '$lib/data/site';
import { getDict, isLang } from '$lib/i18n';
import { contactInbox, turnstileSiteKey } from '$lib/server/data/contact';
import { sendContactConfirmation, sendEmail } from '$lib/server/email';
import { clientIp, verifyTurnstile } from '$lib/server/turnstile';
import { contactSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

/**
 * Page Contact : la clé publique Turnstile est chargée ici pour que la clé
 * secrète ne quitte jamais le serveur.
 */
export const load: PageServerLoad = async () => ({
	turnstileSiteKey: turnstileSiteKey()
});

type ContactErrorCode = 'invalid' | 'captcha' | 'send' | 'unavailable';

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

export const actions: Actions = {
	/**
	 * Envoi du formulaire de contact.
	 *
	 * Ordre volontaire : validation des champs, puis vérification Turnstile,
	 * puis envoi à l'association, puis accusé de réception à l'expéditeur. Si
	 * l'envoi à l'association échoue, aucun accusé de réception n'est envoyé.
	 */
	send: async ({ request, params }) => {
		const form = await request.formData();
		const values = {
			lastName: String(form.get('lastName') ?? ''),
			firstName: String(form.get('firstName') ?? ''),
			email: String(form.get('email') ?? ''),
			subject: String(form.get('subject') ?? ''),
			message: String(form.get('message') ?? '')
		};

		const parsed = contactSchema.safeParse(values);
		if (!parsed.success) {
			return fail(400, {
				code: 'invalid' satisfies ContactErrorCode,
				fieldErrors: parsed.error.flatten().fieldErrors,
				values
			});
		}

		const rawToken = form.get('token');
		const captcha = await verifyTurnstile(
			typeof rawToken === 'string' ? rawToken : undefined,
			clientIp(request)
		);

		if (!captcha.ok) {
			console.warn(`[contact] envoi refusé (${captcha.reason}).`);
			return fail(400, {
				code: (captcha.reason === 'unconfigured'
					? 'unavailable'
					: 'captcha') satisfies ContactErrorCode,
				values
			});
		}

		const inbox = contactInbox() ?? site.email;
		const lang = isLang(params.lang) ? params.lang : 'fr';
		const labels = getDict(lang).contact.form.subjects;
		const { lastName, firstName, email, subject, message } = parsed.data;
		const subjectLabel = labels[subject];
		const fullName = `${firstName} ${lastName}`;

		try {
			const sent = await sendEmail({
				to: inbox,
				replyTo: email,
				subject: `[Site] ${subjectLabel} — ${fullName}`,
				text: [
					`Sujet : ${subjectLabel}`,
					`Nom : ${fullName}`,
					`Courriel : ${email}`,
					'',
					message
				].join('\n'),
				html: `
					<h1>Nouveau message depuis le site</h1>
					<p><strong>Sujet :</strong> ${escapeHtml(subjectLabel)}</p>
					<p><strong>Nom :</strong> ${escapeHtml(fullName)}</p>
					<p><strong>Courriel :</strong> ${escapeHtml(email)}</p>
					<hr>
					<p>${escapeHtml(message).replace(/\r?\n/g, '<br>')}</p>
				`
			});

			if (sent.error) {
				console.error('[contact] Resend a refusé l’envoi :', sent.error);
				return fail(502, { code: 'send' satisfies ContactErrorCode, values });
			}
		} catch (error) {
			console.error('[contact] envoi à l’association impossible :', error);
			return fail(502, { code: 'send' satisfies ContactErrorCode, values });
		}

		// L'accusé de réception ne part qu'après un envoi réussi à l'association,
		// et son échec ne doit pas faire croire que le message s'est perdu.
		try {
			const confirmation = await sendContactConfirmation(email);
			if (confirmation.error) {
				console.error('[contact] accusé de réception refusé :', confirmation.error);
			}
		} catch (error) {
			console.error('[contact] accusé de réception impossible :', error);
		}

		return { success: true as const };
	}
};
