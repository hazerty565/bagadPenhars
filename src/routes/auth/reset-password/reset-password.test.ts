import { describe, expect, it } from 'vitest';
import { resetPasswordSchema } from './schema';

describe('reset-password schema', () => {
	it('accepts valid email', () => {
		expect(resetPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
	});

	it('rejects invalid email', () => {
		expect(resetPasswordSchema.safeParse({ email: 'invalid-email' }).success).toBe(false);
	});
});
