import { describe, expect, it } from 'vitest';
import { settingsSchema } from './schema';

describe('settings schema', () => {
    it('accepts valid settings data', () => {
        expect(settingsSchema.safeParse({ siteName: 'Bagad', supportEmail: 'support@example.com' }).success).toBe(true);
    });

    it('rejects invalid support email', () => {
        expect(settingsSchema.safeParse({ siteName: 'Bagad', supportEmail: 'support' }).success).toBe(false);
    });
});
