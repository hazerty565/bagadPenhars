import { describe, expect, it } from 'vitest';
import { editArticleSchema } from './schema';

describe('edit article schema', () => {
    it('accepts valid edited article data', () => {
        expect(editArticleSchema.safeParse({ title: 'Édité', slug: 'edite', content: 'Contenu mis à jour.' }).success).toBe(true);
    });

    it('rejects missing title', () => {
        expect(editArticleSchema.safeParse({ title: '', slug: 'edite', content: 'Contenu mis à jour.' }).success).toBe(false);
    });
});
