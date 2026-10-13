import { describe, expect, it } from 'vitest';
import { securitySchema } from './schema';

describe('security schema', () => {
    it('accepts matching passwords', () => {
        expect(securitySchema.safeParse({ currentPassword: 'oldpass123', newPassword: 'newpass123', confirmPassword: 'newpass123' }).success).toBe(true);
    });

    it('rejects non-matching passwords', () => {
        expect(securitySchema.safeParse({ currentPassword: 'oldpass123', newPassword: 'newpass123', confirmPassword: 'diffpass123' }).success).toBe(false);
    });
});
