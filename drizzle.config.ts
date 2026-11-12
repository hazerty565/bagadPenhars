import type { Config } from 'drizzle-kit';

/**
 * Configuration Drizzle pour la génération de migrations PostgreSQL sur Neon.
 *
 * Les migrations sont générées sous drizzle/ avec les métadonnées dans drizzle/meta/.
 * Une migration appliquée ne doit jamais être modifiée : seules des migrations
 * additives sont autorisées.
 */

export default {
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	verbose: true,
	strict: true,
	breakOnError: true,
	metaFolder: './drizzle/meta'
} satisfies Config;
