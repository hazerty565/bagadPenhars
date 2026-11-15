import { Client } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { serverEnv } from '$lib/server/env';
import * as schema from './schema';

/**
 * Connexion PostgreSQL via `pg` et Cloudflare Hyperdrive (décision
 * Q-2026-11-08-01).
 *
 * Le rôle applicatif `bagad_app` est obligatoire : il ne possède pas les
 * tables, ne dispose pas de `BYPASSRLS` et n'a que les privilèges CRUD
 * nécessaires. Les migrations, le seed et les invitations utilisent une
 * connexion propriétaire séparée (`db-admin`).
 *
 * En local, `DATABASE_URL_APP` pointe vers la branche Neon `test`. Sur
 * Cloudflare, `platform.env.HYPERDRIVE.connectionString` est fourni par le
 * binding Hyperdrive, qui pointe vers la branche de l'environnement.
 *
 * Une connexion est ouverte par requête : les objets d'E/S d'un Worker ne
 * doivent pas être partagés entre requêtes. Hyperdrive assure le pooling.
 *
 * Ce module est réservé au serveur. Il ne doit jamais être importé dans le
 * navigateur.
 */

export type DB = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0];
/** Tout objet capable d'exécuter des requêtes : la connexion ou une transaction. */
export type Executor = DB | Transaction;

export interface DatabaseConnection {
	db: DB;
	client: Client;
}

export function resolveDatabaseUrl(platform: App.Platform | undefined): string | null {
	const hyperdrive = platform?.env?.HYPERDRIVE;
	if (hyperdrive?.connectionString) return hyperdrive.connectionString;
	const local = serverEnv('DATABASE_URL_APP');
	return local && local.trim().length > 0 ? local : null;
}

export async function connectDatabase(connectionString: string): Promise<DatabaseConnection> {
	const client = new Client({
		connectionString,
		ssl: { rejectUnauthorized: false }
	});
	await client.connect();
	const db = drizzle(client, { schema });
	return { db, client };
}

/**
 * Ouvre une transaction PostgreSQL, y établit le contexte RLS du profil,
 * exécute les requêtes métier dans cette même transaction, puis commit ou
 * rollback.
 *
 * Le `profileId` provient de la session Better Auth vérifiée côté serveur. Le
 * paramètre `true` de `set_config` rend le contexte local à la transaction :
 * aucune identité ne subsiste sur une connexion rendue au pool Hyperdrive.
 */
export async function withUserContext<T>(
	db: DB,
	profileId: string,
	callback: (tx: Transaction) => Promise<T>
): Promise<T> {
	if (!profileId) {
		throw new Error('withUserContext exige un profileId vérifié.');
	}

	return db.transaction(async (tx) => {
		await tx.execute(sql`select set_config('app.profile_id', ${profileId}, true)`);
		return callback(tx);
	});
}
