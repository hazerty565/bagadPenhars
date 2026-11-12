// Scénarios 4 et 5 : trombinoscope (filtres, champs, confidentialité) et profil.
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

const cards = () => page.getByRole('button', { name: /^Voir la fiche de / }).count();

await openDemo(page, '/dashboard/membres');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// --- Trombinoscope ---------------------------------------------------------
const total = await cards();
const summaryText = await page.locator('main').innerText();
check(
	results,
	'D1',
	'Trombinoscope : 24 membres',
	total === 24 && /24 membres affichés/.test(summaryText),
	`${total} cartes`,
	'24'
);

await page.locator('main select').nth(0).selectOption('bombarde');
await page.waitForTimeout(300);
const bombarde = await cards();
check(results, 'D2', 'Filtre pupitre Bombarde', bombarde === 8, `${bombarde} membres`, '8');
await page.locator('main select').nth(0).selectOption('all');

await page.locator('main select').nth(1).selectOption('skolaj');
await page.waitForTimeout(300);
const skolaj = await cards();
check(results, 'D3', 'Filtre niveau Skolaj', skolaj === 4, `${skolaj} membres`, '4');
await page.locator('main select').nth(1).selectOption('all');

await page.getByPlaceholder('Nom ou prénom…').fill('Kerdraon');
await page.waitForTimeout(300);
const search = await cards();
check(results, 'D4', 'Recherche par nom', search === 1, `${search} membre`, '1 (Maël Kerdraon)');
const searchText = await page.locator('main').innerText();
check(
	results,
	'D5',
	'Recherche insensible aux accents/casse',
	/Ma.l Kerdraon/.test(searchText),
	'nom trouvé',
	'Maël Kerdraon affiché'
);

await page.getByPlaceholder('Nom ou prénom…').fill('');
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Voir la fiche de Maël Kerdraon' }).click();
const dialog = page.getByRole('dialog', { name: 'Fiche membre' });
await dialog.waitFor();
const fiche = await dialog.innerText();
check(
	results,
	'D6',
	'Fiche membre : champs autorisés',
	/Ma.l/.test(fiche) &&
		/Kerdraon/.test(fiche) &&
		/Bombarde/.test(fiche) &&
		/Bagad/.test(fiche) &&
		!/membre depuis/i.test(fiche) &&
		!/administrateur|secrétaire|chef de pupitre/i.test(fiche),
	fiche.replace(/\s+/g, ' ').slice(0, 220),
	'nom, prénom, pupitres, niveau, fonction — sans rôle applicatif ni ancienneté'
);
const pageAll = await page.locator('main').innerText();
const emails = pageAll.match(/[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
const phones = pageAll.match(/\b0[1-9](?:[ .-]?\d{2}){4}\b/g) ?? [];
check(
	results,
	'D7',
	'Aucune coordonnée privée dans le trombinoscope',
	emails.length === 0 && phones.length === 0,
	`e-mails=${emails.length} · téléphones=${phones.length}`,
	'0 / 0'
);
const ficheEmails = fiche.match(/[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
check(
	results,
	'D8',
	'Aucune coordonnée dans la fiche',
	ficheEmails.length === 0,
	`e-mails=${ficheEmails.length}`,
	'0'
);
const extraFields = [];
if (/Administrateur|Secrétaire|Chef de pupitre/.test(fiche))
	extraFields.push('rôle applicatif affiché');
await dialog.getByRole('button', { name: 'Fermer la fiche' }).click();

// rôle affiché dans la fiche de p01 ?
await page.getByPlaceholder('Nom ou prénom…').fill('Le Goff');
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Voir la fiche de Yann Le Goff' }).click();
const ficheAdmin = await page.getByRole('dialog', { name: 'Fiche membre' }).innerText();
check(
	results,
	'D9',
	'Fiche : rôle applicatif affiché hors liste autorisée',
	!/administrateur/i.test(ficheAdmin),
	ficheAdmin.replace(/\s+/g, ' ').slice(0, 160),
	'champs limités à la liste du brief'
);

// recherche avec et sans accents
await page.getByRole('dialog', { name: 'Fiche membre' }).getByLabel('Fermer la fiche').click();
await page.getByPlaceholder('Nom ou prénom…').fill('mael');
await page.waitForTimeout(300);
const noAccent = await cards();
await page.getByPlaceholder('Nom ou prénom…').fill('Kerloch');
await page.waitForTimeout(300);
const noApostrophe = await cards();
check(
	results,
	'D10',
	'Recherche insensible aux accents et apostrophes',
	noAccent === 1 && noApostrophe >= 1,
	`mael=${noAccent} · Kerloch=${noApostrophe}`,
	'1 dans les deux cas'
);
await page.getByPlaceholder('Nom ou prénom…').fill('');

// --- Profil ---------------------------------------------------------------
await page.goto(BASE + '/dashboard/profil', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// validation : nom vide
const lastName = page.locator('main form input').nth(1);
await lastName.fill('');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.waitForTimeout(300);
const emptyError = await page.locator('main').innerText();
check(
	results,
	'E1',
	'Profil : nom obligatoire',
	/Le prénom et le nom sont obligatoires/.test(emptyError),
	emptyError.match(/Le prénom et le nom sont obligatoires[^\n]*/)?.[0] ?? 'pas de message',
	'erreur explicite, aucune modification'
);

// validation : e-mail invalide
await lastName.fill('Kerdraon');
const email = page.locator('main form input[type="email"]');
await email.fill('pas-un-email');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.waitForTimeout(300);
check(
	results,
	'E2',
	'Profil : e-mail invalide refusé',
	/adresse e-mail est invalide/.test(await page.locator('main').innerText()),
	'message d’erreur',
	'erreur explicite'
);

// validation : e-mail déjà utilisé
await email.fill('rozenn.kerloch@example.com');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.waitForTimeout(300);
check(
	results,
	'E3',
	'Profil : e-mail déjà utilisé refusé',
	/déjà utilisée/.test(await page.locator('main').innerText()),
	'message d’erreur',
	'erreur explicite'
);

// modification valide
await page.locator('main form input').nth(0).fill('Maël-QA');
await email.fill('mael.qa@example.com');
await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
await page.waitForTimeout(500);
let st = await state(page);
const edited = st.state.profiles.find((p) => p.id === 'p06');
check(
	results,
	'E4',
	'Profil : modification enregistrée',
	edited.firstName === 'Maël-QA' && edited.email === 'mael.qa@example.com',
	`${edited.firstName} · ${edited.email}`,
	'valeurs enregistrées'
);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const firstInput = await page.locator('main form input').nth(0).inputValue();
check(
	results,
	'E5',
	'Profil : persistance après rechargement',
	firstInput === 'Maël-QA',
	firstInput,
	'Maël-QA'
);

// avatar
await page.getByRole('button', { name: 'Choisir le portrait 12' }).click();
await page.waitForTimeout(400);
st = await state(page);
const avatar = st.state.profiles.find((p) => p.id === 'p06').avatar;
check(results, 'E6', 'Profil : changement de portrait', avatar === 12, `avatar=${avatar}`, '12');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
check(
	results,
	'E7',
	'Profil : portrait persisté',
	(await page
		.getByRole('button', { name: 'Choisir le portrait 12' })
		.getAttribute('aria-pressed')) === 'true',
	'aria-pressed=true',
	'portrait 12 sélectionné'
);

// préférences
const reminders = page.getByLabel('Rappels avant les événements');
await reminders.uncheck();
await page.getByRole('button', { name: 'Enregistrer les préférences' }).click();
await page.waitForTimeout(400);
st = await state(page);
const pref = st.state.preferences.find((p) => p.profileId === 'p06');
check(
	results,
	'E8',
	'Profil : préférences enregistrées',
	pref?.reminders === false,
	`reminders=${pref?.reminders}`,
	'false'
);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const persistedReminders = await page.getByLabel('Rappels avant les événements').isChecked();
check(
	results,
	'E9',
	'Profil : préférences persistées',
	persistedReminders === false,
	`coché=${persistedReminders}`,
	'non coché'
);

// changement de profil : le formulaire suit le profil actif
await switchProfile(page, 'Rozenn', "Kerloc'h");
await page.waitForTimeout(500);
const secrFirst = await page.locator('main form input').nth(0).inputValue();
check(
	results,
	'E10',
	'Profil : formulaire du profil actif',
	secrFirst === 'Rozenn',
	secrFirst,
	'Rozenn'
);
const roleReadonly = await page.locator('main').innerText();
check(
	results,
	'E11',
	'Profil : rôle et pupitres en lecture seule',
	/Lecture seule/.test(roleReadonly) && !/Attribuer un rôle/.test(roleReadonly),
	'bloc Lecture seule',
	'aucun champ rôle modifiable'
);

await resetViaButton(page);
await browser.close();
save('s3', { results, summary: summarize(results), logs, extraFields });
