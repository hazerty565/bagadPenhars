// Scénarios 1 et 2 : accès direct, sélecteur permanent, reset, quatre rôles et navigation.
import {
	launch,
	newPage,
	openDemo,
	switchProfile,
	activeProfileName,
	state,
	resetViaButton,
	check,
	summarize,
	save
} from './lib.mjs';

const results = [];
const browser = await launch();
const { page, logs } = await newPage(browser);

// --- S1 : accès direct -----------------------------------------------------
const resp = await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
await page.locator('main#contenu-dashboard').waitFor();
await page.waitForTimeout(500);

check(
	results,
	'A1',
	'Accès direct /dashboard',
	resp.status() === 200,
	`HTTP ${resp.status()}`,
	'HTTP 200'
);
check(
	results,
	'A2',
	'Aucune redirection vers la connexion',
	page.url().endsWith('/dashboard'),
	page.url(),
	'reste sur /dashboard'
);
const banner = await page.locator('text=Mode démonstration').first().isVisible();
check(results, 'A3', 'Bandeau de démonstration visible', banner, `${banner}`, 'visible');
const switcherBtn = page.getByRole('button', { name: 'Changer de profil', exact: true });
check(
	results,
	'A4',
	'Bouton « Changer de profil » présent',
	(await switcherBtn.count()) > 0 && (await switcherBtn.first().isVisible()),
	`${await switcherBtn.count()} occurrence(s)`,
	'1 visible'
);
const resetBtns = page.getByRole('button', { name: 'Réinitialiser', exact: true });
check(
	results,
	'A5',
	'Bouton « Réinitialiser » présent',
	(await resetBtns.count()) > 0 && (await resetBtns.first().isVisible()),
	`${await resetBtns.count()} occurrence(s)`,
	'1 visible'
);
const defaultName = await activeProfileName(page);
check(
	results,
	'A6',
	'Profil par défaut',
	/Ma.l Kerdraon/i.test(defaultName),
	defaultName,
	'Maël Kerdraon (membre)'
);

// sélecteur permanent sur les pages principales
const pages = [
	'/dashboard/agenda',
	'/dashboard/membres',
	'/dashboard/documents',
	'/dashboard/notifications',
	'/dashboard/profil',
	'/dashboard/securite'
];
const persistent = [];
for (const p of pages) {
	await page.goto('http://localhost:5173' + p, { waitUntil: 'networkidle' });
	await page.waitForTimeout(350);
	const okBanner = await page.locator('text=Mode démonstration').first().isVisible();
	const okBtn = await page
		.getByRole('button', { name: 'Changer de profil', exact: true })
		.first()
		.isVisible();
	persistent.push(`${p}:${okBanner && okBtn ? 'OK' : 'KO'}`);
}
check(
	results,
	'A7',
	'Sélecteur permanent sur les pages',
	persistent.every((x) => x.endsWith('OK')),
	persistent.join(' '),
	'présent partout'
);

// --- S2 : rôles ------------------------------------------------------------
await openDemo(page, '/dashboard');
await switchProfile(page, 'Yann', 'Le Goff');
const adminNav = await page.locator('aside nav').innerText();
const adminName = await activeProfileName(page);
check(
	results,
	'B1',
	'Changement immédiat admin',
	/Yann/.test(adminName) && /ADMIN/.test(adminName),
	adminName,
	'Yann Le Goff · Admin'
);
check(
	results,
	'B2',
	'Menu admin visible',
	/Administration/.test(adminNav) && /Espace pupitre/.test(adminNav),
	adminNav.replace(/\s+/g, ' '),
	'Administration + Espace pupitre'
);
const persistedAdmin = await state(page);
check(
	results,
	'B3',
	'Profil actif persisté',
	persistedAdmin?.state?.activeProfileId === 'p01',
	persistedAdmin?.state?.activeProfileId,
	'p01'
);

await page.goto('http://localhost:5173/dashboard/agenda', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
let agendaText = await page.locator('main').innerText();
check(
	results,
	'B4',
	'Agenda admin : gestion complète',
	/Gestion/.test(agendaText) && /Nouvel événement/.test(agendaText),
	agendaText.slice(0, 200),
	'liens Gestion + Nouvel événement'
);

await switchProfile(page, 'Rozenn', "Kerloc'h");
const secrName = await activeProfileName(page);
const secrNav = await page.locator('aside nav').innerText();
check(
	results,
	'B5',
	'Changement immédiat secrétaire',
	/Rozenn/.test(secrName) && /SECR/.test(secrName),
	secrName,
	'Rozenn Kerloc’h · Secrétaire'
);
check(
	results,
	'B6',
	'Menu secrétaire',
	/Administration/.test(secrNav) && /Espace pupitre/.test(secrNav),
	secrNav.replace(/\s+/g, ' '),
	'Administration + Espace pupitre'
);
await page.goto('http://localhost:5173/dashboard/admin', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const secrAdmin = await page.locator('main').innerText();
check(
	results,
	'B7',
	'Secrétaire autorisée dans admin',
	!/Accès non autorisé/.test(secrAdmin) && /Administration du bagad/.test(secrAdmin),
	secrAdmin.slice(0, 120),
	'page admin affichée'
);
await page.goto('http://localhost:5173/dashboard/admin/settings', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const secrSettings = await page.locator('main').innerText();
check(
	results,
	'B8',
	'Secrétaire refusée sur les réglages',
	/Accès non autorisé/.test(secrSettings),
	secrSettings.slice(0, 160),
	'Accès non autorisé'
);

await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
await switchProfile(page, 'Bleuenn', 'Le Roux');
const chefName = await activeProfileName(page);
const chefNav = await page.locator('aside nav').innerText();
check(
	results,
	'B9',
	'Changement immédiat chef',
	/Bleuenn/.test(chefName) && /CHEF/.test(chefName),
	chefName,
	'Bleuenn Le Roux · Chef de pupitre'
);
check(
	results,
	'B10',
	'Menu chef sans administration',
	/Espace pupitre/.test(chefNav) && !/Administration/.test(chefNav),
	chefNav.replace(/\s+/g, ' '),
	'Espace pupitre seul'
);
await page.goto('http://localhost:5173/dashboard/admin/membres', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const chefAdmin = await page.locator('main').innerText();
check(
	results,
	'B11',
	'Chef refusé dans admin',
	/Accès non autorisé/.test(chefAdmin),
	chefAdmin.slice(0, 160),
	'Accès non autorisé'
);

await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
await switchProfile(page, 'Maël', 'Kerdraon');
const memberNav = await page.locator('aside nav').innerText();
const memberName = await activeProfileName(page);
check(
	results,
	'B12',
	'Changement immédiat membre',
	/Ma.l/.test(memberName) && /MEMBRE/.test(memberName),
	memberName,
	'Maël Kerdraon · Membre'
);
check(
	results,
	'B13',
	'Menu membre limité',
	!/Administration/.test(memberNav) && !/Espace pupitre/.test(memberNav),
	memberNav.replace(/\s+/g, ' '),
	'ni admin ni pupitre'
);
await page.goto('http://localhost:5173/dashboard/admin', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const memberAdmin = await page.locator('main').innerText();
check(
	results,
	'B14',
	'Membre refusé dans admin',
	/Accès non autorisé/.test(memberAdmin),
	memberAdmin.slice(0, 160),
	'Accès non autorisé'
);
await page.goto('http://localhost:5173/dashboard/pupitre', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const memberPupitre = await page.locator('main').innerText();
check(
	results,
	'B15',
	'Membre refusé espace pupitre',
	/Accès non autorisé/.test(memberPupitre),
	memberPupitre.slice(0, 160),
	'Accès non autorisé'
);

// reset depuis le bandeau, après une mutation locale
await page.goto('http://localhost:5173/dashboard/notifications', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Marquer lue' }).first().click();
await page.waitForTimeout(400);
const before = await state(page);
await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
await resetViaButton(page);
const after = await state(page);
const notice = await page
	.getByRole('status')
	.first()
	.innerText()
	.catch(() => '');
check(
	results,
	'B16',
	'Réinitialisation du seed',
	after?.state?.activeProfileId === 'p06' &&
		JSON.stringify(before) !== JSON.stringify(after) &&
		/La démonstration a été réinitialisée/.test(notice),
	`profil=${after?.state?.activeProfileId} · mutation effacée=${JSON.stringify(before) !== JSON.stringify(after)} · message=${notice.replace(/\s+/g, ' ').slice(0, 60)}`,
	'état de départ + message de confirmation'
);

await browser.close();

const summary = summarize(results);
save('s1', { results, summary, logs });
