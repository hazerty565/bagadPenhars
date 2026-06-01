import { z } from 'zod';

export const pupitreNotificationSchema = z.object({
    title: z.string().min(2),
    body: z.string().min(5),
});

export type PupitreNotificationForm = z.infer<typeof pupitreNotificationSchema>;
