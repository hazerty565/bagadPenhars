import { z } from 'zod';

export const loginSchema = z.object({
	// Une adresse saisie avec des espaces ou en majuscules reste valide : on la
	// normalise avant l'appel à Better Auth.
	email: z.string().trim().toLowerCase().email(),
	password: z.string().min(6)
});

export type LoginForm = z.infer<typeof loginSchema>;
