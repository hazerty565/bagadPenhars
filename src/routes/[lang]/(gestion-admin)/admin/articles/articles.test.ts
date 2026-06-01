import { describe, expect, it } from 'vitest';
import { articleSchema } from './schema';

describe('article schema', () => {
    it('accepts a valid article', () => {
        expect(articleSchema.safeParse({ title: 'Titre', slug: 'titre', content: 'Contenu détaillé...', published: true }).success).toBe(true);
    });

    it('rejects too short content', () => {
        expect(articleSchema.safeParse({ title: 'Titre', slug: 'titre', content: 'Bref', published: false }).success).toBe(false);
    });
});
