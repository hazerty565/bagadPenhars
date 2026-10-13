import { z } from 'zod';

export const notificationsSchema = z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean().optional(),
});

export type NotificationsForm = z.infer<typeof notificationsSchema>;
