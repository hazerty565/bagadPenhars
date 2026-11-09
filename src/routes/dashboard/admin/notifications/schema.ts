import { z } from 'zod';

export const adminNotificationSchema = z.object({
	title: z.string().min(3),
	body: z.string().min(5),
	sendToAll: z.boolean().optional()
});

export type AdminNotificationForm = z.infer<typeof adminNotificationSchema>;
