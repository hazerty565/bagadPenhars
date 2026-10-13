import { z } from 'zod';

export const inviteMemberSchema = z.object({
	email: z.string().email(),
	role: z.string().min(2),
});

export type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

export type InviteMemberForm = z.infer<typeof inviteMemberSchema>;
