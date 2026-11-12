// Scénario 3 : agenda, visibilités, RSVP, verrouillage, annulation, présences, gestion.
import {
	launch,
	newPage,
	openDemo,
	switchProfile,
	state,
	resetViaButton,
	check,
	summarize,
	save,
	BASE
} from './lib.mjs';

const results = [];
const browser = await launch();
const { page, logs } = await newPage(browser);

const countArticles = () => page.locator('main article').count();
const card = (title) => page.locator('main article').filter({ hasText: title }).first();

await openDemo(page, '/dashboard/agenda');
// état de départ (le premier chargement a pu persister un profil)
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const count = await countArticles();
check(
	results,
	'C1',
	'Agenda membre : événements visibles',
	count === 12,
	`${count} cartes affichées`,
	'12 événements à venir visibles (sur 16)'
);
const body = await page.locator('main').innerText();
check(
	results,
	'C2',
	'Visibilité pupitre respectée',
	/Répétition bombarde/.test(body) &&
		!/Répétition cornemuse/.test(body) &&
		!/Répétition percussion/.test(body) &&
		!/Répétition caisse claire/.test(body.replace(/Répétition bombarde et caisse claire/, '')),
	`bombarde=${/Répétition bombarde/.test(body)} · cornemuse=${/Répétition cornemuse/.test(body)} · percussion=${/Répétition percussion/.test(body)}`,
	'membre bombarde : voit la sienne, pas les 3 autres'
);
const counters = body.match(/(\d+) présent[s]? · (\d+) absent[s]?/g)?.slice(0, 3) ?? [];
check(
	results,
	'C3',
	'Compteurs présents / absents',
	counters.length > 0,
	counters.join(' | '),
	'compteurs affichés par carte'
);

// RSVP présent puis absent
await card('Réunion du bureau').getByRole('button', { name: 'Présent', exact: true }).click();
await page.waitForTimeout(300);
let st = await state(page);
let resp = st.state.responses.find((r) => r.eventId === 'e11' && r.profileId === 'p06');
const toast = await page
	.locator('[role="status"]')
	.first()
	.innerText()
	.catch(() => '');
check(
	results,
	'C4',
	'Réponse présent enregistrée',
	resp?.status === 'present',
	`state=${resp?.status} · message=${toast.replace(/\s+/g, ' ').slice(0, 50)}`,
	'present + confirmation'
);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const afterReload = await card('Réunion du bureau').innerText();
check(
	results,
	'C5',
	'Réponse persistée après rechargement',
	/Vous êtes présent/.test(afterReload),
	afterReload.replace(/\s+/g, ' ').slice(0, 140),
	'badge « Vous êtes présent »'
);

await card('Réunion du bureau').getByRole('button', { name: 'Absent', exact: true }).click();
await page.waitForTimeout(300);
st = await state(page);
resp = st.state.responses.find((r) => r.eventId === 'e11' && r.profileId === 'p06');
check(
	results,
	'C6',
	'Réponse modifiable (absent)',
	resp?.status === 'absent' && /Vous êtes absent/.test(await card('Réunion du bureau').innerText()),
	`state=${resp?.status}`,
	'absent après modification'
);

// événement passé verrouillé
await page.goto(BASE + '/dashboard/agenda/e14', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const past = await page.locator('main').innerText();
check(
	results,
	'C7',
	'Événement passé verrouillé',
	/Passé/.test(past) &&
		/Les réponses sont closes depuis le lendemain de l’événement/.test(past) &&
		!/Je serai présent/.test(past) &&
		/Votre réponse conservée : présent/.test(past),
	past.replace(/\s+/g, ' ').slice(180, 520),
	'badge Passé, message de clôture, réponse conservée'
);
const pastButtons = await page.getByRole('button', { name: /Je serai/ }).count();
check(
	results,
	'C8',
	'Aucun bouton de réponse sur un passé',
	pastButtons === 0,
	`${pastButtons} bouton(s)`,
	'0'
);

// événement annulé
await page.goto(BASE + '/dashboard/agenda/e15', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const cancelled = await page.locator('main').innerText();
check(
	results,
	'C9',
	'Événement annulé en lecture seule',
	/Annulé/.test(cancelled) &&
		/Cet événement est annulé/.test(cancelled) &&
		!/Je serai présent/.test(cancelled) &&
		/Votre réponse conservée : présent/.test(cancelled),
	cancelled.replace(/\s+/g, ' ').slice(180, 520),
	'badge Annulé, message, réponse conservée'
);

// présences agrégées vs nominatives
await page.goto(BASE + '/dashboard/agenda/e01', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const p06e01 = await page.locator('main').innerText();
check(
	results,
	'C10',
	'Membre : présences agrégées seulement',
	/Présences/.test(p06e01) && !/Présences détaillées/.test(p06e01) && !/Annaïg/.test(p06e01),
	`détaillé=${/Présences détaillées/.test(p06e01)} · noms=${/Annaïg/.test(p06e01)}`,
	'agrégats, aucun nom'
);

await switchProfile(page, 'Bleuenn', 'Le Roux');
await page.goto(BASE + '/dashboard/agenda/e02', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const p03e02 = await page.locator('main').innerText();
check(
	results,
	'C11',
	'Chef : présences nominatives de son pupitre',
	/Présences détaillées/.test(p03e02) && /Annaïg Jaffré/.test(p03e02),
	`détaillé=${/Présences détaillées/.test(p03e02)} · nom=${/Annaïg Jaffré/.test(p03e02)}`,
	'liste nominative'
);
await page.goto(BASE + '/dashboard/agenda/e01', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const p03e01 = await page.locator('main').innerText();
check(
	results,
	'C12',
	'Chef : pas de nominatif sur un événement global',
	!/Présences détaillées/.test(p03e01),
	`détaillé=${/Présences détaillées/.test(p03e01)}`,
	'agrégats uniquement'
);
await page.goto(BASE + '/dashboard/agenda/e03', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const p03e03 = await page.locator('main').innerText();
check(
	results,
	'C13',
	'Chef : nominatif sur son autre pupitre',
	/Présences détaillées/.test(p03e03),
	`détaillé=${/Présences détaillées/.test(p03e03)}`,
	'liste nominative (Cornemuse)'
);

// gestion : chef
await page.goto(BASE + '/dashboard/agenda', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const chefModifier = await page.getByRole('link', { name: 'Modifier' }).count();
const chefDelete = await page.getByRole('button', { name: 'Supprimer' }).count();
check(
	results,
	'C14',
	'Chef : modifier limité à ses pupitres',
	chefModifier === 2,
	`${chefModifier} lien(s) Modifier`,
	'2 (Bombarde + Cornemuse)'
);
check(
	results,
	'C15',
	'Chef : pas de suppression',
	chefDelete === 0,
	`${chefDelete} bouton(s) Supprimer`,
	'0'
);
await page.goto(BASE + '/dashboard/agenda/e06/modifier', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const chefMulti = await page.locator('main').innerText();
check(
	results,
	'C16',
	'Chef : modification multi-pupitres refusée',
	/Accès non autorisé/.test(chefMulti),
	chefMulti.slice(0, 120),
	'Accès non autorisé'
);

// création par un chef
await page.goto(BASE + '/dashboard/agenda/nouveau', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const visibilityDisabled = await page
	.locator('main select')
	.nth(1)
	.isDisabled()
	.catch(() => null);
const radios = await page.locator('main fieldset input[type="radio"]').count();
await page.getByLabel('Titre *').fill('Répétition QA bombarde');
await page.getByRole('button', { name: 'Créer l’événement' }).click();
await page.waitForTimeout(700);
st = await state(page);
const created = st.state.events.find((e) => e.title === 'Répétition QA bombarde');
check(
	results,
	'C17',
	'Chef : création sur son pupitre',
	!!created &&
		created.pupitreIds.length === 1 &&
		created.pupitreIds[0] === 'bombarde' &&
		created.visibility === 'pupitre',
	JSON.stringify(created ?? null).slice(0, 160),
	'1 cible Bombarde, visibilité pupitre'
);
check(
	results,
	'C18',
	'Chef : formulaire contraint',
	visibilityDisabled === true && radios === 2,
	`visibilité désactivée=${visibilityDisabled} · pupitres proposés=${radios}`,
	'visibilité verrouillée, 2 pupitres'
);

// membre : aucune action de gestion
await switchProfile(page, 'Maël', 'Kerdraon');
await page.goto(BASE + '/dashboard/agenda', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const memberNew = await page.getByRole('link', { name: 'Nouvel événement' }).count();
const memberMod = await page.getByRole('link', { name: 'Modifier' }).count();
check(
	results,
	'C19',
	'Membre : aucune action de gestion',
	memberNew === 0 && memberMod === 0,
	`nouveau=${memberNew} · modifier=${memberMod}`,
	'0 / 0'
);

// secrétaire : gestion complète
await switchProfile(page, 'Rozenn', "Kerloc'h");
await page.goto(BASE + '/dashboard/agenda', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const secrMod = await page.getByRole('link', { name: 'Modifier' }).count();
const secrDel = await page.getByRole('button', { name: 'Supprimer' }).count();
const secrCards = await countArticles();
check(
	results,
	'C20',
	'Secrétaire : modifier/supprimer partout',
	secrMod === secrCards && secrDel === secrCards,
	`cartes=${secrCards} · modifier=${secrMod} · supprimer=${secrDel}`,
	'actions sur chaque carte'
);
await page.goto(BASE + '/dashboard/agenda/e06/modifier', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
check(
	results,
	'C21',
	'Secrétaire : modification multi-pupitres',
	!/Accès non autorisé/.test(await page.locator('main').innerText()),
	'formulaire affiché',
	'formulaire accessible'
);

// filtre période passés
await page.goto(BASE + '/dashboard/agenda', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('main select').first().selectOption('past');
await page.waitForTimeout(300);
const pastCount = await countArticles();
const pastText = await page.locator('main').innerText();
check(
	results,
	'C22',
	'Filtre « Passés »',
	pastCount === 1 && /Répétition du 4 novembre/.test(pastText),
	`${pastCount} carte(s)`,
	'1 (4 novembre)'
);

await resetViaButton(page);
await browser.close();
save('s2', { results, summary: summarize(results), logs });
