import { z } from 'zod';

export const filesSchema = z.object({
	title: z.string().min(2),
	description: z.string().optional()
});

export type FilesForm = z.infer<typeof filesSchema>;
