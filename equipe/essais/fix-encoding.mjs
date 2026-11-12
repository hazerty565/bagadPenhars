// Réparation ponctuelle : annule le double encodage CP1252 -> UTF-8 des scripts QA.
import { readFileSync, writeFileSync } from 'node:fs';

const CP1252 = new Map([
	[0x80, 0x20ac],
	[0x82, 0x201a],
	[0x83, 0x0192],
	[0x84, 0x201e],
	[0x85, 0x2026],
	[0x86, 0x2020],
	[0x87, 0x2021],
	[0x88, 0x02c6],
	[0x89, 0x2030],
	[0x8a, 0x0160],
	[0x8b, 0x2039],
	[0x8c, 0x0152],
	[0x8e, 0x017d],
	[0x91, 0x2018],
	[0x92, 0x2019],
	[0x93, 0x201c],
	[0x94, 0x201d],
	[0x95, 0x2022],
	[0x96, 0x2013],
	[0x97, 0x2014],
	[0x98, 0x02dc],
	[0x99, 0x2122],
	[0x9a, 0x0161],
	[0x9b, 0x203a],
	[0x9c, 0x0153],
	[0x9e, 0x017e],
	[0x9f, 0x0178]
]);
const reverse = new Map([...CP1252].map(([byte, code]) => [code, byte]));

function toBytes(text) {
	const bytes = [];
	for (const char of text) {
		const code = char.codePointAt(0);
		if (code <= 0xff) bytes.push(code);
		else if (reverse.has(code)) bytes.push(reverse.get(code));
		else throw new Error(`Caractère non réversible : ${char} (U+${code.toString(16)})`);
	}
	return Buffer.from(bytes);
}

for (const path of process.argv.slice(2)) {
	const current = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
	const fixed = toBytes(current).toString('utf8');
	writeFileSync(path, fixed, 'utf8');
	console.log(`réparé : ${path} (${current.length} -> ${fixed.length} caractères)`);
}
