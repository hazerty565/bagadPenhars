import { z } from 'zod';

export const securitySchema = z
	.object({
		currentPassword: z.string().min(6),
		newPassword: z.string().min(6),
		confirmPassword: z.string().min(6)
	})
	.superRefine((data, ctx) => {
		if (data.newPassword !== data.confirmPassword) {
			ctx.addIssue({
				code: 'custom',
				message: 'Les mots de passe ne correspondent pas.',
				path: ['confirmPassword']
			});
		}
	});

export type SecurityForm = z.infer<typeof securitySchema>;
