import { describe, expect, it } from 'vitest';
import { membersSchema } from './schema';

describe('members schema', () => {
    it('accepts optional query field', () => {
        expect(membersSchema.safeParse({ query: 'Jean' }).success).toBe(true);
    });

    it('accepts no query', () => {
        expect(membersSchema.safeParse({}).success).toBe(true);
    });
});
