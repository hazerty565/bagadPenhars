import { describe, expect, it } from 'vitest';
import { pupitreNotificationSchema } from './schema';

describe('pupitre notification schema', () => {
	it('accepts valid notification data', () => {
		expect(
			pupitreNotificationSchema.safeParse({ title: 'Flash', body: 'Notif urgente' }).success
		).toBe(true);
	});

	it('rejects short body', () => {
		expect(pupitreNotificationSchema.safeParse({ title: 'Flash', body: 'Hi' }).success).toBe(false);
	});
});
