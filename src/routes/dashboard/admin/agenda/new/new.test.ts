import { describe, expect, it } from 'vitest';
import { newAgendaSchema } from './schema';

describe('new agenda schema', () => {
	it('accepts valid agenda creation data', () => {
		expect(
			newAgendaSchema.safeParse({
				title: 'Concert',
				date: '2025-12-20T20:00:00Z',
				location: 'Salle'
			}).success
		).toBe(true);
	});

	it('rejects invalid date', () => {
		expect(newAgendaSchema.safeParse({ title: 'Concert', date: 'invalid-date' }).success).toBe(
			false
		);
	});
});
