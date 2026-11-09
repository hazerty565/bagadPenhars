import { describe, expect, it } from 'vitest';
import { loginSchema } from './schema';

describe('login schema', () => {
	it('accepts valid credentials', () => {
		expect(
			loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success
		).toBe(true);
	});

	it('rejects short password', () => {
		expect(loginSchema.safeParse({ email: 'user@example.com', password: '123' }).success).toBe(
			false
		);
	});
});
