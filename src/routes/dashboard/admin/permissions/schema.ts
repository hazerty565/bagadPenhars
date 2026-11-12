import { z } from 'zod';

export const settingsSchema = z.object({
	siteName: z.string().min(2),
	supportEmail: z.string().email()
});

export type SettingsForm = z.infer<typeof settingsSchema>;
