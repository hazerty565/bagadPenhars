import { z } from 'zod';

export const editArticleSchema = z.object({
	title: z.string().min(3),
	slug: z.string().min(3),
	content: z.string().min(10)
});

export type EditArticleForm = z.infer<typeof editArticleSchema>;
