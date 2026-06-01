import { describe, expect, it } from 'vitest';
import { notificationsSchema } from './schema';

describe('notifications schema', () => {
    it('accepts valid notification preferences', () => {
        expect(notificationsSchema.safeParse({ emailNotifications: true }).success).toBe(true);
    });

    it('rejects missing emailNotifications', () => {
        expect(notificationsSchema.safeParse({}).success).toBe(false);
    });
});
