import { z } from 'zod';

export const profileSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().optional(),
});

export type ProfileForm = z.infer<typeof profileSchema>;
