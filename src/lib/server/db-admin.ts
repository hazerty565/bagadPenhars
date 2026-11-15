import { Client } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { serverEnv } from '$lib/server/env';
import * as schema from '../db/schema';

/**
 * Connexion PostgreSQL propriétaire (rôle `neondb_owner`) réservée aux
 * opérations privilégiées côté serveur : acceptation d'invitation, seed,
 * migrations ponctuelles et tâches d'administration.
 *
 * Le rôle applicatif `bagad_app` reste la connexion par défaut de
 * l'application : il est soumis à RLS et ne peut ni créer de compte Better
 * Auth, ni lire les invitations d'un autre membre.
 *
 * En local la chaîne vient de `.env` (`DATABASE_URL`). Sur Cloudflare, le
 * secret `DATABASE_URL_ADMIN` doit être configuré ; en son absence la
 * connexion propriétaire n'est pas disponible et les flux qui en dépendent
 * renvoient une erreur explicite.
 *
 * Ce module est strictement réservé au serveur.
 */

export type AdminDB = NodePgDatabase<typeof schema>;

export function resolveAdminDatabaseUrl(platform: App.Platform | undefined): string | null {
	const fromPlatform = platform?.env?.DATABASE_URL_ADMIN ?? platform?.env?.DATABASE_URL;
	if (typeof fromPlatform === 'string' && fromPlatform.trim().length > 0) return fromPlatform;
	const fromProcess = serverEnv('DATABASE_URL_ADMIN') ?? serverEnv('DATABASE_URL');
	return fromProcess && fromProcess.trim().length > 0 ? fromProcess : null;
}

export interface AdminConnection {
	db: AdminDB;
	client: Client;
}

export async function connectAdminDatabase(
	platform: App.Platform | undefined
): Promise<AdminConnection> {
	const connectionString = resolveAdminDatabaseUrl(platform);
	if (!connectionString) {
		throw new Error(
			'Connexion propriétaire indisponible : DATABASE_URL_ADMIN (ou DATABASE_URL en local) est absente.'
		);
	}
	const client = new Client({
		connectionString,
		ssl: { rejectUnauthorized: false }
	});
	await client.connect();
	return { db: drizzle(client, { schema }), client };
}

/**
 * Ouvre une connexion propriétaire, exécute le rappel puis ferme la connexion.
 * Une connexion par opération : aucun pool partagé entre requêtes.
 */
export async function withAdminDatabase<T>(
	platform: App.Platform | undefined,
	callback: (connection: AdminConnection) => Promise<T>
): Promise<T> {
	const connection = await connectAdminDatabase(platform);
	try {
		return await callback(connection);
	} finally {
		await connection.client.end().catch(() => undefined);
	}
}
