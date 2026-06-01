import { describe, expect, it } from 'vitest';
import { filesSchema } from './schema';

describe('fichiers schema', () => {
    it('accepts a valid file metadata payload', () => {
        expect(filesSchema.safeParse({ title: 'Partition Bach', description: 'Fichier audio' }).success).toBe(true);
    });

    it('rejects empty title', () => {
        expect(filesSchema.safeParse({ title: '' }).success).toBe(false);
    });
});
