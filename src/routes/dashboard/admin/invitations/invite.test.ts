import { describe, expect, it } from 'vitest';
import { inviteMemberSchema } from './schema';

describe('invite member schema', () => {
	it('accepts valid invitation data', () => {
		expect(
			inviteMemberSchema.safeParse({ email: 'invite@example.com', role: 'admin' }).success
		).toBe(true);
	});

	it('rejects invalid email', () => {
		expect(inviteMemberSchema.safeParse({ email: 'invite', role: 'admin' }).success).toBe(false);
	});
});
