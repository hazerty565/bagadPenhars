import { z } from 'zod';

export const newAgendaSchema = z.object({
    title: z.string().min(3),
    date: z.string().datetime(),
    location: z.string().optional(),
});

export type NewAgendaForm = z.infer<typeof newAgendaSchema>;
