import { z } from 'zod';
import { CONTACT_SUBJECTS } from '$lib/types';

/**
 * Formulaire de contact public.
 *
 * Le schéma est partagé entre le navigateur (messages d'erreur par champ) et
 * l'action serveur (source de vérité). Le jeton Turnstile n'est pas validé ici :
 * il est vérifié séparément auprès de Cloudflare, car il ne fait pas partie du
 * contenu rédigé par la personne qui écrit.
 */
export const contactSchema = z.object({
	lastName: z.string().trim().min(1).max(80),
	firstName: z.string().trim().min(1).max(80),
	email: z.string().trim().email().max(160),
	subject: z.enum(CONTACT_SUBJECTS),
	message: z.string().trim().min(10).max(5000)
});

export type ContactForm = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactForm;

/** Libellés des champs, pour associer un message d'erreur au bon champ. */
export const CONTACT_FIELDS: readonly ContactField[] = [
	'lastName',
	'firstName',
	'email',
	'subject',
	'message'
];
