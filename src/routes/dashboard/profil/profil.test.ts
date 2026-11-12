import { describe, expect, it } from 'vitest';
import { profileSchema } from './schema';

describe('profile schema', () => {
	it('accepts valid profile data', () => {
		expect(
			profileSchema.safeParse({ fullName: 'Jean Dupont', phone: '+33123456789' }).success
		).toBe(true);
	});

	it('rejects too short name', () => {
		expect(profileSchema.safeParse({ fullName: 'J' }).success).toBe(false);
	});
});
