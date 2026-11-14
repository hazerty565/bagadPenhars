import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

/**
 * Applique les migrations Drizzle sur la branche Neon `test` uniquement.
 *
 * Garde-fou : le script refuse toute chaîne dont l'hôte n'est pas la branche
 * de test ou qui pointe vers la branche de production. Les migrations sont
 * exécutées avec le rôle propriétaire (`neondb_owner`), jamais avec le rôle
 * applicatif `bagad_app`.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readEnv(file) {
	const raw = fs.readFileSync(file, 'utf8');
	const values = {};
	for (const line of raw.split(/\r?\n/)) {
		const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
		if (!match) continue;
		let value = match[2].trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		values[match[1]] = value;
	}
	return values;
}

function assertTestTarget(url) {
	const parsed = new URL(url);
	const host = parsed.hostname;
	if (host.includes('ep-ancient-morning')) {
		throw new Error('Refus : la chaîne pointe vers la branche production.');
	}
	if (!host.includes('ep-spring-sunset')) {
		throw new Error(`Refus : hôte inattendu (${host}).`);
	}
	if (parsed.pathname !== '/neondb') {
		throw new Error(`Refus : base inattendue (${parsed.pathname}).`);
	}
	return { host, database: parsed.pathname };
}

const env = readEnv(path.join(root, '.env'));
const connectionString = env.DATABASE_URL;
if (!connectionString) {
	throw new Error('DATABASE_URL est absente de .env.');
}

const target = assertTestTarget(connectionString);
console.log(`Cible : ${target.host}${target.database} (branche test)`);

const client = new pg.Client({
	connectionString,
	ssl: { rejectUnauthorized: false }
});

try {
	await client.connect();
	const db = drizzle(client);
	await migrate(db, { migrationsFolder: path.join(root, 'drizzle') });

	const applied = await client.query(
		'select count(*)::int as total from drizzle.__drizzle_migrations'
	);
	const tables = await client.query(
		"select count(*)::int as total from pg_tables where schemaname = 'public'"
	);
	console.log(`Migrations enregistrées : ${applied.rows[0].total}`);
	console.log(`Tables publiques : ${tables.rows[0].total}`);
} finally {
	await client.end().catch(() => {});
}
