import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

/**
 * Connexion Drizzle via `pg` et Cloudflare Hyperdrive (décision Q-2026-11-08-01).
 *
 * DATABASE_URL doit être la chaîne de connexion PostgreSQL fournie par
 * Hyperdrive (pooling uniquement — pas de cache partagé pour les lectures
 * privées dépendantes de l'identité).
 *
 * `drizzle-orm/neon-serverless` n'est pas utilisé : le driver WebSocket Neon
 * n'est pas destiné à fonctionner au-dessus d'Hyperdrive.
 *
 * Ce module est réservé au serveur. Il ne doit jamais être importé dans le navigateur.
 */

const connectionString =
	process.env.DATABASE_URL ?? 'postgres://user:pass@localhost:5432/placeholder';

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export type DB = typeof db;
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0];
/**
 * Tout objet capable d'exécuter des requêtes : la connexion ou une transaction.
 */
export type Executor = DB | Transaction;

/**
 * Ouvre une transaction PostgreSQL, y établit le contexte RLS de l'utilisateur,
 * exécute les requêtes métier dans cette même transaction, puis commit ou rollback.
 *
 * Le `profileId` doit provenir de la session Better Auth vérifiée côté serveur.
 * Toutes les requêtes protégées du callback doivent utiliser exclusivement
 * l'objet transactionnel fourni.
 */
export async function withUserContext<T>(
	profileId: string,
	callback: (tx: Transaction) => Promise<T>
): Promise<T> {
	if (!profileId) {
		throw new Error('withUserContext exige un profileId vérifié.');
	}

	return db.transaction(async (tx) => {
		await tx.execute(sql`select set_config('app.user_id', ${profileId}, true)`);
		return callback(tx);
	});
}
