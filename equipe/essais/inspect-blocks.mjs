// Outil QA : liste les changements de profil et les cas de chaque script.
import { readFileSync } from 'node:fs';

const files = [
	's2-agenda',
	's3-membres-profil',
	's4-documents-notifications',
	's5-pupitre-admin',
	's6-persistance-reset',
	's7-qualite'
];

for (const f of files) {
	console.log('===== ' + f);
	const lines = readFileSync(`equipe/essais/${f}.mjs`, 'utf8').split(/\n/);
	lines.forEach((line, index) => {
		if (
			/switchProfile\(|check\(results/.test(line) ||
			/^\s*'[A-Z][0-9]/.test(line) ||
			/^\s*'[A-Z][0-9][a-z]?'/.test(line)
		) {
			console.log(String(index + 1).padStart(4) + ': ' + line.trim().slice(0, 130));
		}
	});
}
