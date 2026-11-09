import { z } from 'zod';

export const agendaSchema = z.object({
	title: z.string().min(3),
	date: z.string().datetime().optional(),
	location: z.string().optional()
});

export type AgendaForm = z.infer<typeof agendaSchema>;
