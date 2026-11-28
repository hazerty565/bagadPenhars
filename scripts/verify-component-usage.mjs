/**
 * Vérification non destructive — intégrateur.
 *
 * Compte les imports de chaque composant de `src/lib/components/**` pour
 * repérer les doublons de nom et les composants orphelins (fichier mort).
 * Le comptage reconnaît les imports `$lib/...` et les imports relatifs
 * (`./Nom.svelte`, `../dir/Nom.svelte`).
 * Lecture seule : ne modifie aucun fichier du dépôt.
 *
 * Usage : node scripts/verify-component-usage.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

function walk(dir, acc = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, acc);
		else if (/\.(svelte|ts|js)$/.test(entry.name)) acc.push(full);
	}
	return acc;
}

const files = walk(join(root, 'src'));
const sources = files.map((file) => ({ file, text: readFileSync(file, 'utf8') }));

const componentDir = join(root, 'src', 'lib', 'components');
const components = walk(componentDir)
	.filter((f) => f.endsWith('.svelte'))
	.map((f) => relative(join(root, 'src', 'lib'), f).replace(/\\/g, '/'));

function importCount(rel) {
	const base = rel.split('/').pop();
	let count = 0;
	for (const { file, text } of sources) {
		if (file.endsWith(base)) continue; // ne pas se compter lui-même
		const imports = [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
		for (const spec of imports) {
			if (spec.endsWith('/' + base) || spec === './' + base || spec === '../' + base) count += 1;
		}
	}
	return count;
}

const rows = components.map((rel) => ({ rel, count: importCount(rel) }));
rows.sort((a, b) => a.rel.localeCompare(b.rel));

const orphans = rows.filter((r) => r.count === 0);
for (const row of rows) {
	console.log(
		`${row.count === 0 ? 'ORPHELIN' : '        '} ${String(row.count).padStart(3)}  ${row.rel}`
	);
}

const byName = new Map();
for (const row of rows) {
	const name = row.rel.split('/').pop();
	if (!byName.has(name)) byName.set(name, []);
	byName.get(name).push(row.rel);
}
console.log('\n--- Doublons de nom de fichier ---');
for (const [name, list] of byName) {
	if (list.length > 1) console.log(`${name}: ${list.join(' | ')}`);
}
console.log(`\nComposants : ${rows.length} — orphelins : ${orphans.length}`);
