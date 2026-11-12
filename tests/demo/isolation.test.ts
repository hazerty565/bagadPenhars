import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Isolation démo / production.
 *
 * Le code de démonstration ne doit jamais être importé statiquement par les
 * routes ni par du code partagé, sans quoi il entrerait dans le bundle de
 * production. Les routes chargent uniquement des modules `$lib/demo/pages/*`
 * et `$lib/demo/components/*` par `import()` gardé par `dev`, et le build les
 * remplace par un module vide (voir `vite.config.ts`).
 */

const root = process.cwd();
const srcRoot = join(root, 'src');
const demoRoot = join(srcRoot, 'lib', 'demo');

function filesUnder(directory: string): string[] {
	return readdirSync(directory).flatMap((entry) => {
		const path = join(directory, entry);
		return statSync(path).isDirectory() ? filesUnder(path) : [path];
	});
}

const sourceFiles = filesUnder(srcRoot).filter((path) => /\.(ts|js|svelte)$/.test(path));

interface Match {
	file: string;
	line: number;
	text: string;
}

/** Import statique de `$lib/demo` (les imports de type et dynamiques sont admis). */
function staticDemoImports(): Match[] {
	const matches: Match[] = [];

	for (const file of sourceFiles) {
		const lines = readFileSync(file, 'utf8').split(/\r?\n/);
		let statement: string | null = null;
		let start = 0;

		lines.forEach((text, index) => {
			if (statement === null) {
				if (!/^\s*import\b/.test(text)) return;
				statement = text;
				start = index;
			} else {
				statement += `\n${text}`;
			}

			if (!/from\s+['"][^'"]+['"]\s*;?\s*$/.test(text) && !/^\s*import\s*\(/.test(text)) {
				return;
			}

			const current = statement;
			statement = null;

			if (/^\s*import\s+type\b/.test(current)) return;
			if (/^\s*import\s*\(/.test(current)) return;
			if (!/from\s+['"]\$lib\/demo\//.test(current)) return;

			matches.push({ file: relative(root, file), line: start + 1, text: current.trim() });
		});
	}

	return matches;
}

describe('isolation du code de démonstration', () => {
	it('aucune route n’importe statiquement $lib/demo', () => {
		const offenders = staticDemoImports().filter((match) =>
			match.file.startsWith(`src${sep}routes${sep}`)
		);
		expect(offenders).toEqual([]);
	});

	it('pages et coquille ne sont importées que depuis $lib/demo', () => {
		const offenders = staticDemoImports().filter((match) => {
			if (match.file.startsWith(`src${sep}lib${sep}demo${sep}`)) return false;
			return /\$lib\/demo\/(pages|components)\//.test(match.text);
		});
		expect(offenders).toEqual([]);
	});

	it('les routes chargent les pages de démonstration par import dynamique', () => {
		const dashboardIndex = readFileSync(
			join(srcRoot, 'routes', 'dashboard', '+page.svelte'),
			'utf8'
		);
		expect(dashboardIndex).toContain("import('$lib/demo/pages/OverviewPage.svelte')");
		expect(dashboardIndex).toContain('DemoRoute');
	});

	it('la démonstration ne touche ni au serveur, ni à la base, ni aux secrets', () => {
		const forbidden = /\$lib\/server|\$lib\/db|\$env\/|\$app\/server|process\.env/;
		const offenders: Match[] = [];

		for (const file of sourceFiles.filter((path) => path.startsWith(demoRoot))) {
			readFileSync(file, 'utf8')
				.split(/\r?\n/)
				.forEach((text, index) => {
					if (forbidden.test(text)) {
						offenders.push({ file: relative(root, file), line: index + 1, text: text.trim() });
					}
				});
		}

		expect(offenders).toEqual([]);
	});

	it('le build de production remplace les modules de démonstration', () => {
		const config = readFileSync(join(root, 'vite.config.ts'), 'utf8');
		expect(config).toContain('bagad-exclude-demo-from-build');
		expect(config).toContain('excludeDemoFromBuild');
	});
});
