import { z } from 'zod';

export const articleSchema = z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    content: z.string().min(10),
    published: z.boolean().optional(),
});

export type ArticleForm = z.infer<typeof articleSchema>;
