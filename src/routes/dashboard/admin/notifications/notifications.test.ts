import { describe, expect, it } from 'vitest';
import { adminNotificationSchema } from './schema';

describe('admin notification schema', () => {
	it('accepts valid notification data', () => {
		expect(
			adminNotificationSchema.safeParse({
				title: 'Alerte',
				body: 'Message important',
				sendToAll: true
			}).success
		).toBe(true);
	});

	it('rejects short title', () => {
		expect(
			adminNotificationSchema.safeParse({ title: 'A', body: 'Message important' }).success
		).toBe(false);
	});
});
