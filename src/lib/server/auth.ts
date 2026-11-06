/**
 * Instance Better Auth (côté serveur uniquement — jamais importer depuis le client).
 *
 * TODO avant la mise en prod :
 * - brancher Drizzle + Neon (database: drizzleAdapter(db, ...)) une fois la couche DB posée ;
 * - définir BETTER_AUTH_SECRET et BETTER_AUTH_URL dans l'environnement ;
 * - compléter le model user (nom, prénom) et la table profiles (role, account_status).
 */
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
	// TODO: database: drizzleAdapter(db, { provider: 'pg' })
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 jours
		updateAge: 60 * 60 * 24 // rafraîchi une fois par jour
	}
	// advanced: { cookiePrefix: 'bagad' }
});

export type Session = typeof auth.$Infer.Session;
