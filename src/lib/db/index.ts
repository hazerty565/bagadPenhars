import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Connexion Drizzle via le driver @neondatabase/serverless et Cloudflare Hyperdrive.
 *
 * DATABASE_URL doit être une chaîne de connexion PostgreSQL fournie par Hyperdrive
 * (pooling uniquement — pas de cache partagé pour les lectures privées dépendantes
 * de l'identité).
 *
 * Ce module est réservé au serveur. Il ne doit jamais être importé dans le navigateur.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		'DATABASE_URL est requise pour la connexion à Neon via Hyperdrive.'
	);
}

export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export type DB = typeof db;
