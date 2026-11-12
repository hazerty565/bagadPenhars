import { z } from 'zod';

export const membersSchema = z.object({
	query: z.string().optional()
});

export type MembersForm = z.infer<typeof membersSchema>;
