// Scénarios 8 : espace pupitre et administration (navigation, refus, portée).
import {
	launch,
	newPage,
	openDemo,
	switchProfile,
	state,
	resetViaButton,
	save,
	check,
	summarize,
	BASE
} from './lib.mjs';

const results = [];
const browser = await launch();
const { page, logs } = await newPage(browser);

const PUPITRE_ROUTES = [
	'/dashboard/pupitre',
	'/dashboard/pupitre/membres',
	'/dashboard/pupitre/documents',
	'/dashboard/pupitre/notifications'
];
const ADMIN_ROUTES = [
	'/dashboard/admin',
	'/dashboard/admin/membres',
	'/dashboard/admin/invitations',
	'/dashboard/admin/permissions',
	'/dashboard/admin/agenda',
	'/dashboard/admin/articles',
	'/dashboard/admin/media',
	'/dashboard/admin/notifications',
	'/dashboard/admin/settings'
];

const navLabels = async () =>
	(await page.locator('aside[aria-label], aside nav a').allInnerTexts()).map((t) =>
		t.replace(/\s+/g, ' ').trim()
	);

/** Appelle directement les services de démonstration, sans passer par l'interface. */
const direct = (body) =>
	page.evaluate(async (src) => {
		const [docs, notifs, profiles, settings, store] = await Promise.all([
			import('/src/lib/demo/services/documents.ts'),
			import('/src/lib/demo/services/notifications.ts'),
			import('/src/lib/demo/services/profiles.ts'),
			import('/src/lib/demo/services/settings.ts'),
			import('/src/lib/demo/store.svelte.ts')
		]);
		const api = { docs, notifs, profiles, settings, demo: store.demo };
		try {
			const fn = new Function('api', `return (async () => { ${src} })();`);
			return { ok: true, value: (await fn(api)) ?? null };
		} catch (error) {
			return { ok: false, error: error?.message ?? String(error) };
		}
	}, body);

const deniedCount = async () => page.getByText('Accès non autorisé', { exact: true }).count();

await openDemo(page, '/dashboard');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// --- Membre : navigation et refus ------------------------------------------
const navMembre = await navLabels();
check(
	results,
	'H1',
	'Membre : navigation sans pupitre ni administration',
	!navMembre.some((t) => /Espace pupitre/.test(t)) &&
		!navMembre.some((t) => /^Administration/.test(t)),
	navMembre.filter((t) => /Espace pupitre|Administration/.test(t)).join(' | ') ||
		'aucune entrée pupitre/administration',
	'aucune entrée réservée'
);

const deniedPupitre = [];
for (const route of PUPITRE_ROUTES) {
	await page.goto(BASE + route, { waitUntil: 'networkidle' });
	await page.waitForTimeout(250);
	if ((await deniedCount()) === 0) deniedPupitre.push(route);
}
check(
	results,
	'H2',
	'Membre : 4 routes pupitre refusées',
	deniedPupitre.length === 0,
	deniedPupitre.join(', ') || '4/4 refusées',
	'4/4 refusées avec « Accès non autorisé »'
);

const deniedAdmin = [];
for (const route of ADMIN_ROUTES) {
	await page.goto(BASE + route, { waitUntil: 'networkidle' });
	await page.waitForTimeout(250);
	if ((await deniedCount()) === 0) deniedAdmin.push(route);
}
check(
	results,
	'H3',
	'Membre : 9 routes administration refusées',
	deniedAdmin.length === 0,
	deniedAdmin.join(', ') || '9/9 refusées',
	'9/9 refusées'
);

const extraMember = [
	['/dashboard/agenda/nouveau', 'création d’événement'],
	['/dashboard/agenda/e01/modifier', 'modification d’événement'],
	['/dashboard/admin/agenda/new', 'création via route admin'],
	['/dashboard/admin/articles/new', 'rédaction d’article']
];
const extraMemberOpen = [];
for (const [route, label] of extraMember) {
	await page.goto(BASE + route, { waitUntil: 'networkidle' });
	await page.waitForTimeout(250);
	if ((await deniedCount()) === 0) extraMemberOpen.push(`${route} (${label})`);
}
check(
	results,
	'H3b',
	'Membre : formulaires de création/édition refusés',
	extraMemberOpen.length === 0,
	extraMemberOpen.join(', ') || '4/4 refusés',
	'4/4 refusés'
);

// Contournement : services appelés directement, sans interface.
const p06add = await direct(
	`return api.docs.addDocument(api.demo.activeProfileId, { title: 'QA interdit membre', description: '', fileName: 'qa.pdf', pupitreId: null });`
);
const p06del = await direct(`return api.docs.deleteDocument(api.demo.activeProfileId, 'd01');`);
const p06notif = await direct(
	`return api.notifs.sendNotification(api.demo.activeProfileId, { title: 'QA interdit', body: 'Message interdit', audience: 'all', pupitreIds: [], profileIds: [] });`
);
const p06role = await direct(
	`return api.profiles.assignRole(api.demo.activeProfileId, 'p24', 'admin');`
);
const p06settings = await direct(
	`return api.settings.updateSettings(api.demo.activeProfileId, api.demo.settings);`
);
check(
	results,
	'H4',
	'Membre : services refusent les actions réservées',
	[p06add, p06del, p06notif, p06role, p06settings].every((r) => r.ok === false),
	[
		`dépôt: ${p06add.error ?? 'ACCEPTÉ'}`,
		`suppression: ${p06del.error ?? 'ACCEPTÉ'}`,
		`notification: ${p06notif.error ?? 'ACCEPTÉ'}`,
		`rôle: ${p06role.error ?? 'ACCEPTÉ'}`,
		`réglages: ${p06settings.error ?? 'ACCEPTÉ'}`
	].join(' · '),
	'5 refus explicites malgré l’appel direct'
);
const stAfterBypass = await state(page);
check(
	results,
	'H5',
	'Membre : aucun effet de bord après les appels directs',
	stAfterBypass === null ||
		(stAfterBypass.state.documents.length === 6 &&
			stAfterBypass.state.profiles.find((p) => p.id === 'p24').role === 'member'),
	`documents=${stAfterBypass?.state.documents.length ?? 'seed non persisté'} · rôle p24=${stAfterBypass?.state.profiles.find((p) => p.id === 'p24').role ?? 'member'}`,
	'état inchangé'
);

// --- Chef de pupitre -------------------------------------------------------
await switchProfile(page, 'Bleuenn', 'Le Roux');
await page.goto(BASE + '/dashboard/pupitre', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const navChef = await navLabels();
check(
	results,
	'H6',
	'Chef : entrée pupitre visible, pas l’administration',
	navChef.some((t) => /Espace pupitre/.test(t)) && !navChef.some((t) => /^Administration/.test(t)),
	navChef.join(' | ').slice(0, 220),
	'Espace pupitre présent, Administration absente'
);
const chefSections = await page
	.locator('main section[aria-labelledby^="pupitre-"] h2')
	.allInnerTexts();
check(
	results,
	'H7',
	'Chef : espace pupitre limité à ses 2 pupitres',
	chefSections.length === 2 && chefSections.every((t) => /Bombarde|Cornemuse/.test(t)),
	chefSections.join(' | '),
	'Bombarde | Cornemuse'
);
const chefBadges = await page.getByText('Vous dirigez', { exact: true }).count();
check(
	results,
	'H8',
	'Chef : badge « Vous dirigez » sur ses pupitres',
	chefBadges === 2,
	`${chefBadges} badges`,
	'2'
);

await page.goto(BASE + '/dashboard/pupitre/membres', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const chefMembers = await page.getByRole('button', { name: /^Voir la fiche de / }).count();
const expectedChefMembers = await page.evaluate(async () => {
	const store = await import('/src/lib/demo/store.svelte.ts');
	return store.demo.profiles.filter((p) =>
		p.pupitres.some((x) => ['bombarde', 'cornemuse'].includes(x.pupitreId))
	).length;
});
check(
	results,
	'H9',
	'Chef : membres limités à ses pupitres',
	chefMembers === expectedChefMembers,
	`${chefMembers} membres affichés, attendu ${expectedChefMembers}`,
	`${expectedChefMembers} membres des 2 pupitres`
);
const membersText = await page.locator('main').innerText();
const emailsPupitre = membersText.match(/[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
check(
	results,
	'H10',
	'Chef : aucune coordonnée dans la liste de ses pupitres',
	emailsPupitre.length === 0,
	`e-mails=${emailsPupitre.length}`,
	'0'
);

await page.goto(BASE + '/dashboard/pupitre/documents', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const chefPupitreDocs = await page.locator('main ul > li').count();
const chefDocsText = await page.locator('main ul').innerText();
check(
	results,
	'H11',
	'Chef : documents limités à ses pupitres',
	chefPupitreDocs === 5 && !/Caisse claire/.test(chefDocsText),
	`${chefPupitreDocs} documents`,
	'5 (3 communs + 2 pupitres), aucun de caisse claire'
);

await page.goto(BASE + '/dashboard/pupitre/notifications', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const chefPupitreNotifs = await page.locator('main ul > li').count();
check(
	results,
	'H12',
	'Chef : notifications limitées à ses pupitres',
	chefPupitreNotifs === 1,
	`${chefPupitreNotifs} notification`,
	'1 (n02 bombarde)'
);

await page.goto(BASE + '/dashboard/admin', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
check(
	results,
	'H13',
	'Chef : administration refusée',
	(await deniedCount()) === 1,
	'Accès non autorisé',
	'refus'
);

await page.goto(BASE + '/dashboard/agenda/e02/modifier', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const chefEditOwn = (await deniedCount()) === 0;
await page.goto(BASE + '/dashboard/agenda/e01/modifier', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const chefEditGlobal = (await deniedCount()) === 0;
await page.goto(BASE + '/dashboard/admin/agenda/new', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const chefAdminNew = (await deniedCount()) === 0;
check(
	results,
	'H13b',
	'Chef : portée des formulaires d’événement',
	chefEditOwn && !chefEditGlobal,
	`édition e02 (son pupitre)=${chefEditOwn} · édition e01 (global)=${chefEditGlobal}`,
	'e02 autorisé, e01 refusé'
);
check(
	results,
	'H13c',
	'Chef : route /dashboard/admin/agenda/new',
	chefAdminNew === false,
	`formulaire affiché=${chefAdminNew}`,
	'refusée (le plan réserve admin/* à la secrétaire et à l’admin)'
);

const p03delGlobal = await direct(
	`return api.docs.deleteDocument(api.demo.activeProfileId, 'd01');`
);
const p03delAutre = await direct(
	`return api.docs.deleteDocument(api.demo.activeProfileId, 'd04');`
);
const p03depotAutre = await direct(
	`return api.docs.addDocument(api.demo.activeProfileId, { title: 'QA hors périmètre', description: '', fileName: 'qa.pdf', pupitreId: 'caisse-claire' });`
);
const p03notifAll = await direct(
	`return api.notifs.sendNotification(api.demo.activeProfileId, { title: 'QA interdit chef', body: 'Message interdit', audience: 'all', pupitreIds: [], profileIds: [] });`
);
check(
	results,
	'H14',
	'Chef : services refusent hors de son périmètre',
	[p03delGlobal, p03delAutre, p03depotAutre, p03notifAll].every((r) => r.ok === false),
	[
		`suppr. globale: ${p03delGlobal.error ?? 'ACCEPTÉ'}`,
		`suppr. caisse claire: ${p03delAutre.error ?? 'ACCEPTÉ'}`,
		`dépôt caisse claire: ${p03depotAutre.error ?? 'ACCEPTÉ'}`,
		`notif. tout le bagad: ${p03notifAll.error ?? 'ACCEPTÉ'}`
	].join(' · '),
	'4 refus explicites'
);

// --- Secrétaire ------------------------------------------------------------
await switchProfile(page, 'Rozenn', "Kerloc'h");
await page.goto(BASE + '/dashboard/admin', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const navSecretaire = await navLabels();
check(
	results,
	'H15',
	'Secrétaire : administration accessible',
	navSecretaire.some((t) => /^Administration/.test(t)) && (await deniedCount()) === 0,
	navSecretaire.join(' | ').slice(0, 200),
	'Administration visible, page autorisée'
);
const adminLinks = await page.locator('main a[href^="/dashboard/admin"]').count();
check(
	results,
	'H16',
	'Secrétaire : 8 modules d’administration',
	adminLinks >= 8,
	`${adminLinks} liens`,
	'8 modules'
);
const adminText = await page.locator('main').innerText();
check(
	results,
	'H17',
	'Secrétaire : périmètre annoncé sans rôles/réglages',
	/L’attribution des rôles, les réglages globaux et les suppressions restent réservés à l’administrateur/.test(
		adminText
	),
	(adminText.match(/Secrétaire :[^\n]*/) ?? ['(texte non trouvé)'])[0],
	'mention explicite des limites'
);

await page.goto(BASE + '/dashboard/admin/settings', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
check(
	results,
	'H18',
	'Secrétaire : réglages globaux refusés',
	(await deniedCount()) === 1,
	'Accès non autorisé',
	'refus'
);

await page.goto(BASE + '/dashboard/admin/membres', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const roleSelectsSecretaire = await page.getByLabel('Rôle de Hugo Berthou').count();
const roleBadges = await page.locator('main table tbody tr td:nth-child(2)').count();
check(
	results,
	'H19',
	'Secrétaire : rôles non modifiables',
	roleSelectsSecretaire === 0 && roleBadges === 24,
	`${roleSelectsSecretaire} sélecteur de rôle · ${roleBadges} lignes`,
	'0 sélecteur, 24 lignes en lecture'
);
const canEditSecretaire = await page.getByRole('button', { name: 'Gérer' }).count();
check(
	results,
	'H20',
	'Secrétaire : peut gérer pupitres/niveau/fonction',
	canEditSecretaire === 24,
	`${canEditSecretaire} boutons Gérer`,
	'24'
);

const p02role = await direct(
	`return api.profiles.assignRole(api.demo.activeProfileId, 'p24', 'admin');`
);
const p02settings = await direct(
	`return api.settings.updateSettings(api.demo.activeProfileId, api.demo.settings);`
);
check(
	results,
	'H21',
	'Secrétaire : services refusent rôles et réglages',
	p02role.ok === false && p02settings.ok === false,
	`rôle: ${p02role.error ?? 'ACCEPTÉ'} · réglages: ${p02settings.error ?? 'ACCEPTÉ'}`,
	'2 refus explicites'
);
const p02del = await direct(`return api.docs.deleteDocument(api.demo.activeProfileId, 'd01');`);
check(
	results,
	'H22',
	'Secrétaire : suppression autorisée sur un document global',
	p02del.ok === true,
	p02del.ok ? 'suppression acceptée' : p02del.error,
	'autorisée'
);

// --- Administrateur --------------------------------------------------------
await switchProfile(page, 'Yann', 'Le Goff');
await page.goto(BASE + '/dashboard/admin/membres', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const roleSelectsAdmin = await page.getByLabel(/^Rôle de /).count();
check(
	results,
	'H23',
	'Administrateur : rôles modifiables sauf le sien',
	roleSelectsAdmin === 23,
	`${roleSelectsAdmin} sélecteurs`,
	'23 (24 − son propre profil)'
);
await page.getByLabel('Rôle de Hugo Berthou').selectOption('secretaire');
await page.waitForTimeout(500);
const stRole = await state(page);
check(
	results,
	'H24',
	'Administrateur : attribution de rôle effective',
	stRole.state.profiles.find((p) => p.id === 'p24').role === 'secretaire',
	`rôle de p24 = ${stRole.state.profiles.find((p) => p.id === 'p24').role}`,
	'secretaire'
);

await page.goto(BASE + '/dashboard/admin/settings', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const settingsAllowed =
	(await deniedCount()) === 0 &&
	(await page.getByRole('button', { name: /Enregistrer/ }).count()) > 0;
check(
	results,
	'H25',
	'Administrateur : réglages accessibles',
	settingsAllowed,
	`refus=${await deniedCount()} · bouton Enregistrer présent`,
	'page autorisée'
);
const p01settings = await direct(
	`return api.settings.updateSettings(api.demo.activeProfileId, api.demo.settings);`
);
check(
	results,
	'H26',
	'Administrateur : service de réglages autorisé',
	p01settings.ok === true,
	p01settings.ok ? 'accepté' : p01settings.error,
	'autorisé'
);
const p01selfRole = await direct(
	`return api.profiles.assignRole(api.demo.activeProfileId, api.demo.activeProfileId, 'secretaire');`
);
check(
	results,
	'H27',
	'Administrateur : impossible de changer son propre rôle',
	p01selfRole.ok === false,
	p01selfRole.error ?? 'ACCEPTÉ',
	'refus explicite'
);

await page.goto(BASE + '/dashboard/pupitre', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const adminSections = await page
	.locator('main section[aria-labelledby^="pupitre-"] h2')
	.allInnerTexts();
check(
	results,
	'H28',
	'Administrateur : vue consolidée des 4 pupitres',
	adminSections.length === 4,
	adminSections.join(' | '),
	'4 pupitres'
);

await resetViaButton(page);
await browser.close();
save('s5', { results, summary: summarize(results), logs });
