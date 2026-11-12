// Scénario 9 : persistance locale et réinitialisation du jeu de démonstration.
import {
	BASE,
	launch,
	newPage,
	openDemo,
	switchProfile,
	activeProfileName,
	state,
	STORAGE_KEY,
	save,
	check,
	summarize
} from './lib.mjs';

const results = [];
const browser = await launch();
const { context, page, logs } = await newPage(browser);

const responseOf = (st, eventId, profileId) =>
	st?.state.responses.find((r) => r.eventId === eventId && r.profileId === profileId)?.status ??
	null;

await openDemo(page, '/dashboard/agenda');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// --- Persistance d'une réponse RSVP ---------------------------------------
const seedState = await state(page);
check(
	results,
	'I1',
	'État initial : aucun stockage avant mutation',
	seedState === null,
	seedState === null ? 'localStorage vide (seed en mémoire)' : 'déjà persisté',
	'vide'
);

const e01 = await page.evaluate(async () => {
	const store = await import('/src/lib/demo/store.svelte.ts');
	const event = store.demo.events.find((item) => item.id === 'e01');
	const response = store.demo.responses.find((r) => r.eventId === 'e01' && r.profileId === 'p06');
	return { title: event.title, date: event.date, seed: response?.status ?? null };
});
check(
	results,
	'I2',
	'Réponse initiale de p06 sur e01',
	e01.seed === 'present',
	`${e01.title} (${e01.date}) → ${e01.seed}`,
	'present (seed)'
);

await page
	.locator('main')
	.filter({ hasText: e01.title })
	.getByRole('button', { name: 'Absent', exact: true })
	.first()
	.click();
await page.waitForTimeout(500);
const afterAbsent = await state(page);
check(
	results,
	'I3',
	'Changement RSVP persisté immédiatement',
	responseOf(afterAbsent, 'e01', 'p06') === 'absent',
	`réponse=${responseOf(afterAbsent, 'e01', 'p06')}`,
	'absent'
);

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const afterReload = responseOf(await state(page), 'e01', 'p06');
const absentPressed = await page
	.locator('main')
	.filter({ hasText: e01.title })
	.getByRole('button', { name: 'Absent', exact: true })
	.first()
	.getAttribute('class');
check(
	results,
	'I4',
	'RSVP conservé après rechargement',
	afterReload === 'absent' && /bg-danger/.test(absentPressed ?? ''),
	`état=${afterReload} · bouton Absent sélectionné=${/bg-danger/.test(absentPressed ?? '')}`,
	'absent et bouton mis en évidence'
);

// --- Persistance du profil actif ------------------------------------------
await switchProfile(page, 'Bleuenn', 'Le Roux');
await page.waitForTimeout(400);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const profilPersiste = await activeProfileName(page);
check(
	results,
	'I5',
	'Profil actif conservé après rechargement',
	profilPersiste.includes('Bleuenn'),
	profilPersiste.replace(/\s+/g, ' '),
	'Bleuenn Le Roux (p03)'
);

// Mutation supplémentaire pour vérifier la remise à zéro complète.
await page.goto(BASE + '/dashboard/profil', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.locator('main form input').nth(0).fill('Bleuenn-QA');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.waitForTimeout(500);
const beforeReset = await state(page);
check(
	results,
	'I6',
	'Mutation de profil avant réinitialisation',
	beforeReset.state.profiles.find((p) => p.id === 'p03').firstName === 'Bleuenn-QA',
	beforeReset.state.profiles.find((p) => p.id === 'p03').firstName,
	'Bleuenn-QA'
);

// --- Réinitialisation par le bouton ---------------------------------------
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Réinitialiser la démo' }).click();
await page.waitForTimeout(700);

const noticeText = await page.getByRole('status').innerText();
check(
	results,
	'I7',
	'Message de confirmation de réinitialisation',
	/La démonstration a été réinitialisée/.test(noticeText),
	noticeText.replace(/\s+/g, ' '),
	'« La démonstration a été réinitialisée. »'
);

const reset = await state(page);
check(
	results,
	'I8',
	'Réinitialisation : réponse RSVP revenue au seed',
	responseOf(reset, 'e01', 'p06') === 'present',
	`e01/p06=${responseOf(reset, 'e01', 'p06')}`,
	'present'
);
check(
	results,
	'I9',
	'Réinitialisation : profil modifié restauré',
	reset.state.profiles.find((p) => p.id === 'p03').firstName === 'Bleuenn' &&
		reset.state.profiles.find((p) => p.id === 'p06').firstName === 'Maël',
	`p03=${reset.state.profiles.find((p) => p.id === 'p03').firstName} · p06=${reset.state.profiles.find((p) => p.id === 'p06').firstName}`,
	'Bleuenn · Maël'
);
check(
	results,
	'I10',
	'Réinitialisation : profil actif revenu à p06',
	reset.state.activeProfileId === 'p06',
	reset.state.activeProfileId,
	'p06'
);
check(
	results,
	'I11',
	'Réinitialisation : jeu de données complet',
	reset.state.documents.length === 6 &&
		reset.state.notifications.length === 8 &&
		reset.state.profiles.length === 24,
	`${reset.state.documents.length} documents · ${reset.state.notifications.length} notifications · ${reset.state.profiles.length} profils`,
	'6 · 8 · 24'
);

const profileNameAfterReset = await activeProfileName(page);
check(
	results,
	'I12',
	'Réinitialisation : interface synchronisée',
	profileNameAfterReset.includes('Maël'),
	profileNameAfterReset.replace(/\s+/g, ' '),
	'Maël Kerdraon'
);

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const afterResetReload = await state(page);
check(
	results,
	'I13',
	'Réinitialisation persistée après rechargement',
	afterResetReload.state.activeProfileId === 'p06' &&
		responseOf(afterResetReload, 'e01', 'p06') === 'present',
	`profil=${afterResetReload.state.activeProfileId} · e01/p06=${responseOf(afterResetReload, 'e01', 'p06')}`,
	'seed stable'
);

// --- Robustesse du stockage local -----------------------------------------
await page.evaluate((key) => localStorage.setItem(key, '{donnees corrompues'), STORAGE_KEY);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const corruptText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
const storageAlert = await page
	.locator('text=/Les données enregistrées étaient corrompues/')
	.count();
check(
	results,
	'I14',
	'Stockage corrompu : seed rechargé avec avertissement',
	storageAlert > 0 && /corrompues/.test(corruptText),
	`alerte=${storageAlert} · ${(corruptText.match(/Les données enregistrées étaient corrompues[^.]*\./) ?? ['(absente)'])[0]}`,
	'avertissement explicite et jeu de démonstration rechargé'
);
check(
	results,
	'I15',
	'Stockage corrompu : application utilisable',
	(await page.locator('main#contenu-dashboard').count()) === 1 &&
		(await activeProfileName(page)).includes('Maël'),
	'interface fonctionnelle, profil p06',
	'aucun écran bloqué'
);

await page.evaluate(
	(key) => localStorage.setItem(key, JSON.stringify({ version: 999, state: {} })),
	STORAGE_KEY
);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const versionAlert = await page
	.locator('text=/Les données enregistrées étaient illisibles/')
	.count();
check(
	results,
	'I16',
	'Version inconnue : seed rechargé avec avertissement',
	versionAlert > 0,
	`alerte=${versionAlert}`,
	'avertissement « données illisibles »'
);

// Nettoyage : retour au seed.
await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Réinitialiser la démo' }).click();
await page.waitForTimeout(400);

const pages = context.pages().length;
check(
	results,
	'I17',
	'Session de test unique (information)',
	pages === 1,
	`${pages} onglet(s)`,
	'1'
);

await browser.close();
save('s6', { results, summary: summarize(results), logs });
