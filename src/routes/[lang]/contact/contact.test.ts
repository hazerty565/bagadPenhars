import { describe, expect, it } from 'vitest';
import { contactSchema } from './schema';

describe('contact schema', () => {
    it('accepts valid data', () => {
        expect(contactSchema.safeParse({ name: 'Jean', email: 'jean@example.com', message: 'Bonjour, ceci est un message.' }).success).toBe(true);
    });

    it('rejects invalid email', () => {
        expect(contactSchema.safeParse({ name: 'Jean', email: 'not-an-email', message: 'Bonjour, ceci est un message.' }).success).toBe(false);
    });
});
