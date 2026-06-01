import { describe, expect, it } from 'vitest';
import { newArticleSchema } from './schema';

describe('new article schema', () => {
    it('accepts valid new article data', () => {
        expect(newArticleSchema.safeParse({ title: 'Nouveau', slug: 'nouveau', content: 'Contenu suffisant.' }).success).toBe(true);
    });

    it('rejects invalid slug', () => {
        expect(newArticleSchema.safeParse({ title: 'Nouveau', slug: 'no', content: 'Contenu suffisant.' }).success).toBe(false);
    });
});
