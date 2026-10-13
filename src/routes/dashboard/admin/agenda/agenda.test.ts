import { describe, expect, it } from 'vitest';
import { agendaSchema } from './schema';

describe('agenda schema', () => {
    it('accepts valid agenda data', () => {
        expect(agendaSchema.safeParse({ title: 'Concert', date: '2025-12-20T20:00:00Z' }).success).toBe(true);
    });

    it('rejects short title', () => {
        expect(agendaSchema.safeParse({ title: 'A', date: '2025-12-20T20:00:00Z' }).success).toBe(false);
    });
});
