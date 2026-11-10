import { Resend } from 'resend';

/**
 * Envoi d'emails via Resend.
 *
 * La clé API Resend est strictement côté serveur et ne doit jamais être
 * exposée au navigateur.
 */

let resend: Resend | null = null;

function getResend(): Resend {
	if (!resend) {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			throw new Error("RESEND_API_KEY n'est pas configurée.");
		}
		resend = new Resend(apiKey);
	}
	return resend;
}

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	/** Adresse à laquelle la personne qui reçoit peut répondre directement. */
	replyTo?: string;
}

/**
 * Envoie un email. Retourne l'identifiant de l'envoi Resend.
 */
export async function sendEmail(options: EmailOptions) {
	const resendClient = getResend();
	const from =
		process.env.CONTACT_FROM || process.env.CONTACT_EMAIL || 'noreply@bagadpenhars.fr';

	const result = await resendClient.emails.send({
		from,
		to: options.to,
		subject: options.subject,
		html: options.html,
		text: options.text,
		replyTo: options.replyTo
	});

	return result;
}

/**
 * Envoie un email d'invitation.
 */
export async function sendInvitationEmail(to: string, invitationLink: string) {
	return sendEmail({
		to,
		subject: 'Invitation à rejoindre Bagad Penhars',
		html: `
			<h1>Invitation à rejoindre Bagad Penhars</h1>
			<p>Vous avez été invité à rejoindre l'espace adhérents de Bagad Penhars.</p>
			<p><a href="${invitationLink}">Confirmer votre email et définir votre mot de passe</a></p>
			<p>Ce lien expire dans 1 heure.</p>
		`,
		text: `Invitation à rejoindre Bagad Penhars. Ouvrez ce lien : ${invitationLink}. Ce lien expire dans 1 heure.`
	});
}

/**
 * Envoie un email de réinitialisation de mot de passe.
 */
export async function sendPasswordResetEmail(to: string, resetLink: string) {
	return sendEmail({
		to,
		subject: 'Réinitialisation de votre mot de passe - Bagad Penhars',
		html: `
			<h1>Réinitialisation de votre mot de passe</h1>
			<p>Cliquez sur le lien pour définir un nouveau mot de passe :</p>
			<p><a href="${resetLink}">Réinitialiser le mot de passe</a></p>
			<p>Ce lien expire dans 1 heure.</p>
		`,
		text: `Réinitialisation de votre mot de passe. Ouvrez ce lien : ${resetLink}. Ce lien expire dans 1 heure.`
	});
}

/**
 * Envoie un accusé de réception du formulaire de contact.
 */
export async function sendContactConfirmation(to: string) {
	return sendEmail({
		to,
		subject: 'Accusé de réception - Bagad Penhars',
		html: `
			<h1>Votre message a été envoyé</h1>
			<p>Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.</p>
		`,
		text: 'Votre message a été envoyé. Nous vous répondrons dans les plus brefs délais.'
	});
}
