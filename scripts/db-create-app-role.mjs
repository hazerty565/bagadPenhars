import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

/**
 * Crée (ou met à jour) le rôle applicatif `bagad_app` sur la branche test.
 *
 * - LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS.
 * - Le mot de passe est généré aléatoirement et écrit uniquement dans `.env`
 *   (`DATABASE_URL_APP`), jamais dans le dépôt.
 * - Le rôle propriétaire (`neondb_owner`) reste réservé aux migrations, au seed
 *   et aux opérations d'administration serveur.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');

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

function upsertEnvValue(file, key, value) {
	const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
	let replaced = false;
	const out = lines.map((line) => {
		if (new RegExp(`^${key}=`).test(line)) {
			replaced = true;
			return `${key}=${value}`;
		}
		return line;
	});
	if (!replaced) out.push(`${key}=${value}`);
	fs.writeFileSync(file, out.join('\r\n'), 'utf8');
}

const env = readEnv(envPath);
if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL est absente de .env.');
}

const target = assertTestTarget(env.DATABASE_URL);
console.log(`Cible : ${target.host}${target.database} (branche test)`);

const password = crypto.randomBytes(32).toString('base64url');
const client = new pg.Client({
	connectionString: env.DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});

try {
	await client.connect();
	await client.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bagad_app') THEN
				CREATE ROLE bagad_app LOGIN PASSWORD '${password}'
					NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
			ELSE
				ALTER ROLE bagad_app LOGIN PASSWORD '${password}'
					NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
			END IF;
		END
		$$;
		ALTER ROLE bagad_app SET search_path = public;
	`);

	const check = await client.query(
		"select rolname, rolbypassrls, rolsuper, rolcreatedb, rolcreaterole from pg_roles where rolname = 'bagad_app'"
	);
	console.log('Rôle applicatif :', check.rows[0]);

	const appUrl = new URL(env.DATABASE_URL);
	appUrl.username = 'bagad_app';
	appUrl.password = password;
	upsertEnvValue(envPath, 'DATABASE_URL_APP', appUrl.toString());
	console.log('DATABASE_URL_APP mise à jour dans .env (valeur non affichée).');
} finally {
	await client.end().catch(() => {});
}
