// Preuves complémentaires : contenu réel des routes non gardées pour un membre.
import { launch, newPage, openDemo, check, summarize, save, BASE } from './lib.mjs';

const results = [];
const browser = await launch();
const { page, logs } = await newPage(browser);
await openDemo(page, '/dashboard');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const routes = [
	'/dashboard/pupitre/membres',
	'/dashboard/pupitre/documents',
	'/dashboard/pupitre/notifications',
	'/dashboard/admin/agenda',
	'/dashboard/admin/notifications'
];
const rows = [];
for (const route of routes) {
	await page.goto(BASE + route, { waitUntil: 'networkidle' });
	await page.waitForTimeout(300);
	const title = await page
		.locator('main h1')
		.first()
		.innerText()
		.catch(() => '(aucun h1)');
	const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
	rows.push({
		route,
		title: title.replace(/\s+/g, ' '),
		denied: /Accès non autorisé/.test(text),
		cards: await page.getByRole('button', { name: /^Voir la fiche de / }).count(),
		docs: await page.getByRole('button', { name: 'Télécharger' }).count(),
		notifs: await page.locator('main ul > li').count(),
		deposit: await page.getByRole('button', { name: 'Déposer un document' }).count(),
		compose: await page.getByRole('button', { name: 'Composer' }).count(),
		createEvent: await page.getByRole('link', { name: 'Nouvel événement' }).count(),
		manageLink: await page.getByRole('link', { name: 'Gestion' }).count(),
		excerpt: text.slice(0, 160)
	});
}
check(
	results,
	'P1',
	'Routes non gardées : inventaire',
	true,
	rows.map((r) => `${r.route} → « ${r.title} »${r.denied ? ' (refusée)' : ''}`).join(' ; '),
	'information'
);
await browser.close();
save('probe-routes', { results, summary: summarize(results), rows, logs });
