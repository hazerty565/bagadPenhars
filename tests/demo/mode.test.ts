import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_MARKER, assertDemoMode, isDemoMode } from '$lib/demo/mode';

/**
 * Détection du mode démonstration.
 *
 * Seul le flag `dev` de `$app/environment` active la démo. Aucune variable
 * d'environnement, aucun cookie et aucune URL ne peuvent l'activer dans un
 * build de production.
 */

const source = readFileSync(join(process.cwd(), 'src/lib/demo/mode.ts'), 'utf8');

describe('mode démonstration', () => {
	it('est actif uniquement en développement ou sous test', () => {
		expect(isDemoMode()).toBe(true);
		expect(() => assertDemoMode()).not.toThrow();
	});

	it('construit le marqueur sans jamais l’écrire en clair dans le source', () => {
		expect(DEMO_MARKER).toBe('__BAGAD_DEMO__');
		expect(source).not.toContain("'__BAGAD_DEMO__'");
		expect(source).not.toContain('"__BAGAD_DEMO__"');
		expect(source).toContain("'__BAGAD_' + 'DEMO__'");
	});
});
