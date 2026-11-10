import { describe, expect, it } from 'vitest';
import { contactSchema } from './schema';

const valid = {
	lastName: 'Le Bris',
	firstName: 'Jean',
	email: 'jean@example.com',
	subject: 'information' as const,
	message: 'Bonjour, ceci est un message de test suffisamment long.'
};

describe('contact schema', () => {
	it('accepts a complete message', () => {
		expect(contactSchema.safeParse(valid).success).toBe(true);
	});

	it('trims the fields before storing them', () => {
		const parsed = contactSchema.safeParse({
			...valid,
			lastName: '  Le Bris  ',
			message: '  Bonjour, ceci est un message suffisamment long.  '
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.lastName).toBe('Le Bris');
			expect(parsed.data.message).toBe('Bonjour, ceci est un message suffisamment long.');
		}
	});

	it('rejects an invalid email address', () => {
		expect(contactSchema.safeParse({ ...valid, email: 'pas-une-adresse' }).success).toBe(false);
	});

	it('rejects an unknown subject', () => {
		expect(contactSchema.safeParse({ ...valid, subject: 'publicite' }).success).toBe(false);
	});

	it('rejects a message that is too short', () => {
		expect(contactSchema.safeParse({ ...valid, message: 'Bonjour' }).success).toBe(false);
	});

	it('rejects empty names and messages made only of spaces', () => {
		expect(contactSchema.safeParse({ ...valid, firstName: '   ' }).success).toBe(false);
		expect(contactSchema.safeParse({ ...valid, message: '          ' }).success).toBe(false);
	});
});
