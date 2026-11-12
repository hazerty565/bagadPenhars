// Générateur des tableaux Markdown du rapport QA (avec colonne profil).
import { readFileSync, writeFileSync } from 'node:fs';

const P = {
	p01: 'p01 Yann Le Goff (admin)',
	p02: 'p02 Rozenn Kerloc’h (secrétaire)',
	p03: 'p03 Bleuenn Le Roux (chef Bombarde + Cornemuse)',
	p06: 'p06 Maël Kerdraon (membre)'
};

// Plages de cas par profil, déduites de l'ordre réel des bascules dans chaque script.
const MAP = {
	s1: [
		['A', 0, 99, 'p06'],
		['B', 1, 4, 'p01'],
		['B', 5, 8, 'p02'],
		['B', 9, 11, 'p03'],
		['B', 12, 15, 'p06'],
		['B', 16, 16, 'p06']
	],
	s2: [
		['C', 0, 10, 'p06'],
		['C', 11, 18, 'p03'],
		['C', 19, 19, 'p06'],
		['C', 20, 99, 'p02']
	],
	s3: [
		['D', 0, 99, 'p06'],
		['E', 0, 9, 'p06'],
		['E', 10, 99, 'p02']
	],
	s4: [
		['F', 0, 5, 'p06'],
		['F', 6, 16, 'p03'],
		['F', 17, 19, 'p02'],
		['F', 20, 99, 'p01'],
		['G', 0, 8, 'p06'],
		['G', 9, 12, 'p03'],
		['G', 13, 99, 'p02']
	],
	s5: [
		['H', 0, 5, 'p06'],
		['H', 6, 14, 'p03'],
		['H', 15, 22, 'p02'],
		['H', 23, 99, 'p01']
	],
	s6: [
		['I', 0, 4, 'p06'],
		['I', 5, 6, 'p03'],
		['I', 7, 99, 'p06']
	],
	s7: [['J', 0, 99, 'p06']]
};

const profileOf = (scenario, id) => {
	const letter = id[0];
	const number = parseInt(id.slice(1), 10);
	const ranges = MAP[scenario] ?? [];
	const hit = ranges.find(([l, min, max]) => l === letter && number >= min && number <= max);
	return hit ? P[hit[3]] : 'p06 Maël Kerdraon (membre)';
};

const cell = (value) =>
	String(value ?? '')
		.replace(/\r?\n/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/\|/g, '\\|')
		.trim();

const readJson = (path) => {
	const buffer = readFileSync(path);
	const encoding = buffer[0] === 0xff && buffer[1] === 0xfe ? 'utf16le' : 'utf8';
	return JSON.parse(
		buffer
			.toString(encoding)
			.replace(/^\uFEFF/, '')
			.trim()
	);
};

const files = [
	['s1', 'out-s1.json'],
	['s2', 'out-s2.json'],
	['s3', 'out-s3.json'],
	['s4', 'out-s4.json'],
	['s5', 'out-s5.json'],
	['s6', 'out-s6.json'],
	['s7', 'out-s7.json']
];

const LABELS = {
	s1: 'Scénario 1-2 — accès direct, sélecteur permanent, reset, rôles et navigation',
	s2: 'Scénario 3 — agenda et RSVP',
	s3: 'Scénarios 4-5 — trombinoscope et profil',
	s4: 'Scénarios 6-7 — documents et notifications',
	s5: 'Scénario 8 — espace pupitre et administration',
	s6: 'Scénario 9 — persistance et reset du seed',
	s7: 'Scénario 10 — qualité (console, titres, mobile, accessibilité)'
};

let out = '';
const totals = { ok: 0, ko: 0, total: 0 };
for (const [name, file] of files) {
	const data = readJson(`equipe/essais/${file}`);
	totals.ok += data.summary.ok;
	totals.ko += data.summary.ko;
	totals.total += data.summary.total;
	out += `\n#### ${LABELS[name]} (${name}) — ${data.summary.ok} OK / ${data.summary.ko} KO sur ${data.summary.total} cas\n\n`;
	out +=
		'| ID | Cas | Profil actif | Attendu | Constaté | Statut |\n| --- | --- | --- | --- | --- | --- |\n';
	for (const r of data.results) {
		let observed = cell(r.observed);
		if (observed.length > 240) observed = observed.slice(0, 237) + '…';
		out += `| ${cell(r.id)} | ${cell(r.name)} | ${profileOf(name, r.id)} | ${cell(r.expected)} | ${observed} | ${r.status} |\n`;
	}
}
writeFileSync('equipe/essais/tables.md', out.trim() + '\n', 'utf8');
console.log(JSON.stringify(totals));
