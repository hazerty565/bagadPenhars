// Scénarios 6 et 7 : documents/partitions et centre de notifications.
import {
	launch,
	newPage,
	openDemo,
	switchProfile,
	activeProfileName,
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

const external = [];
page.on('request', (req) => {
	const url = req.url();
	if (!/^https?:/i.test(url)) return;
	const host = new URL(url).hostname;
	if (!['localhost', '127.0.0.1', '::1'].includes(host)) external.push(url);
});

const docItems = () => page.locator('main ul > li').count();
const notifItems = () => page.locator('main ul > li').count();

await openDemo(page, '/dashboard/documents');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(500);
check(
	results,
	'F0',
	'Profil initial de la démo',
	(await activeProfileName(page)).includes('Maël'),
	await activeProfileName(page),
	'p06 Maël Kerdraon (membre)'
);

// --- Documents : membre ----------------------------------------------------
const totalMembre = await docItems();
const depositMembre = await page.getByRole('button', { name: 'Déposer un document' }).count();
const deleteMembre = await page.getByRole('button', { name: 'Supprimer' }).count();
check(
	results,
	'F1',
	'Membre : 6 documents consultables',
	totalMembre === 6,
	`${totalMembre} documents`,
	'6'
);
check(
	results,
	'F2',
	'Membre : aucun bouton de dépôt',
	depositMembre === 0,
	`${depositMembre} bouton`,
	'0'
);
check(
	results,
	'F3',
	'Membre : aucun bouton de suppression',
	deleteMembre === 0,
	`${deleteMembre} bouton`,
	'0'
);

await page.getByRole('button', { name: 'Télécharger' }).first().click();
await page.waitForTimeout(300);
const downloadNotice = await page.getByRole('status').innerText();
check(
	results,
	'F4',
	'Membre : téléchargement simulé explicite',
	/Téléchargement simulé/i.test(downloadNotice) && /Aucun fichier réel/i.test(downloadNotice),
	downloadNotice.replace(/\s+/g, ' ').slice(0, 140),
	'message « Téléchargement simulé », aucun fichier produit'
);

await page.getByPlaceholder('Titre, fichier, description…').fill('partition');
await page.waitForTimeout(300);
const filtered = await docItems();
check(
	results,
	'F5',
	'Recherche de documents',
	filtered === 2,
	`${filtered} documents`,
	'2 (bombarde + cornemuse)'
);
await page.getByPlaceholder('Titre, fichier, description…').fill('');

// --- Documents : chef de pupitre -------------------------------------------
await switchProfile(page, 'Bleuenn', 'Le Roux');
await page.goto(BASE + '/dashboard/documents', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
check(
	results,
	'F6',
	'Chef : profil actif Bleuenn Le Roux',
	(await activeProfileName(page)).includes('Bleuenn'),
	await activeProfileName(page),
	'p03 chef de pupitre'
);

const totalChef = await docItems();
const deleteChef = await page.getByRole('button', { name: 'Supprimer' }).count();
check(
	results,
	'F7',
	'Chef : tous les documents restent consultables',
	totalChef === 6,
	`${totalChef} documents`,
	'6'
);
check(
	results,
	'F8',
	'Chef : suppression limitée à ses 2 pupitres',
	deleteChef === 2,
	`${deleteChef} boutons Supprimer`,
	'2 (Bombarde + Cornemuse)'
);

const depositChef = await page.getByRole('button', { name: 'Déposer un document' }).count();
check(
	results,
	'F9',
	'Chef : bouton de dépôt présent',
	depositChef === 1,
	`${depositChef} bouton`,
	'1'
);
await page.getByRole('button', { name: 'Déposer un document' }).click();
await page.waitForTimeout(300);

const form = page.locator('main form');
const pupitreOptions = await form.locator('select option').allInnerTexts();
check(
	results,
	'F10',
	'Chef : pupitres proposés limités à son périmètre',
	pupitreOptions.length === 2 &&
		pupitreOptions.some((t) => /Bombarde/.test(t)) &&
		pupitreOptions.some((t) => /Cornemuse/.test(t)) &&
		!pupitreOptions.some((t) => /Tous les pupitres/.test(t)),
	pupitreOptions.join(' | '),
	'Bombarde | Cornemuse, sans « Tous les pupitres »'
);

// Soumission sans toucher au sélecteur : le chef doit obtenir une valeur par
// défaut valide (premier pupitre qu'il dirige), jamais une erreur de permission.
const defaultValue = await form.locator('select').inputValue();
await form.getByPlaceholder('Partitions du set de concours').fill('QA dépôt chef défaut');
await form.getByPlaceholder('partitions-concours.pdf').fill('qa-chef-defaut.pdf');
await form.getByRole('button', { name: 'Enregistrer le document' }).click();
await page.waitForTimeout(500);
const defaultSubmitText = await page.locator('main').innerText();
const stateAfterDefault = await state(page);
const defaultAdded = stateAfterDefault.state.documents.some(
	(d) => d.title === 'QA dépôt chef défaut'
);
check(
	results,
	'F11',
	'Chef : dépôt par défaut sans choisir de pupitre',
	defaultAdded === true && defaultValue === 'bombarde',
	`document créé=${defaultAdded} · sélecteur=${defaultValue} · message=${(defaultSubmitText.match(/Vous ne pouvez déposer[^\n]*/) ?? ['(aucun)'])[0]}`,
	'dépôt cohérent : le sélecteur propose le premier pupitre dirigé dès l’ouverture'
);

// Le document créé par F11 est retiré pour que les compteurs suivants restent
// sur la base de 6 documents + le seul document explicite de F12.
if (defaultAdded) {
	await page.locator('main ul > li').first().getByRole('button', { name: 'Supprimer' }).click();
	await page.waitForTimeout(200);
	await page.getByRole('button', { name: 'Confirmer' }).click();
	await page.waitForTimeout(400);
}

// Reprise : dépôt explicite pour Bombarde. Si F11 a réussi, le formulaire est
// refermé et il faut le rouvrir ; sinon il est resté affiché.
if (!(await page.locator('main form').count())) {
	await page.getByRole('button', { name: 'Déposer un document' }).click();
	await page.waitForTimeout(300);
}
const form2 = page.locator('main form');
if (!defaultAdded) {
	await form2.locator('select').selectOption('bombarde');
}
await form2.getByPlaceholder('Partitions du set de concours').fill('QA partitions bombarde');
await form2.getByPlaceholder('partitions-concours.pdf').fill('qa-partitions-bombarde.pdf');
await form2
	.getByPlaceholder('Contenu, consignes, version…')
	.fill('Document de test QA, à supprimer.');
await form2.getByRole('button', { name: 'Enregistrer le document' }).click();
await page.waitForTimeout(600);

const stChef = await state(page);
const created = stChef.state.documents.find((d) => d.title === 'QA partitions bombarde');
check(
	results,
	'F12',
	'Chef : dépôt simulé pour Bombarde',
	!!created &&
		created.pupitreId === 'bombarde' &&
		created.fileName === 'qa-partitions-bombarde.pdf' &&
		created.uploadedBy === 'p03',
	created
		? `${created.title} · ${created.pupitreId} · ${created.fileName} · ${created.sizeBytes} octets`
		: 'non créé',
	'document créé, pupitre bombarde, aucune donnée binaire'
);
const successNotice = await page.getByRole('status').innerText();
check(
	results,
	'F13',
	'Chef : dépôt annoncé comme simulation',
	/simulation/i.test(successNotice) && /aucun fichier/i.test(successNotice),
	successNotice.replace(/\s+/g, ' ').slice(0, 140),
	'mention explicite « aucun fichier »'
);

const chefAfter = await docItems();
check(
	results,
	'F14',
	'Chef : document ajouté en tête de liste',
	chefAfter === 7,
	`${chefAfter} documents`,
	'7'
);
const listText = await page.locator('main ul').innerText();
check(
	results,
	'F15',
	'Chef : badge du pupitre affiché',
	/QA partitions bombarde[\s\S]{0,200}Bombarde/.test(listText),
	'badge Bombarde présent',
	'badge Bombarde'
);

// Suppression du document de test par son auteur.
await page.locator('main ul > li').first().getByRole('button', { name: 'Supprimer' }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Confirmer' }).click();
await page.waitForTimeout(500);
const stAfterDelete = await state(page);
check(
	results,
	'F16',
	'Chef : suppression de son propre document',
	!stAfterDelete.state.documents.some((d) => d.title === 'QA partitions bombarde') &&
		(await docItems()) === 6,
	`${stAfterDelete.state.documents.length} documents restants`,
	'6 documents, aucun résidu de test'
);

// --- Documents : secrétaire ------------------------------------------------
await switchProfile(page, 'Rozenn', "Kerloc'h");
await page.goto(BASE + '/dashboard/documents', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const deleteSecretaire = await page.getByRole('button', { name: 'Supprimer' }).count();
check(
	results,
	'F17',
	'Secrétaire : suppression sur tous les documents',
	deleteSecretaire === 6,
	`${deleteSecretaire} boutons`,
	'6'
);
await page.getByRole('button', { name: 'Déposer un document' }).click();
await page.waitForTimeout(300);
const secOptions = await page.locator('main form select option').allInnerTexts();
check(
	results,
	'F18',
	'Secrétaire : dépôt possible pour tous les pupitres',
	secOptions.some((t) => /Tous les pupitres/.test(t)) && secOptions.length === 5,
	secOptions.join(' | '),
	'Tous les pupitres + 4 pupitres'
);
await page
	.locator('main form')
	.getByPlaceholder('Partitions du set de concours')
	.fill('QA note globale');
await page.locator('main form').getByPlaceholder('partitions-concours.pdf').fill('qa-note-globale');
await page.locator('main form').getByRole('button', { name: 'Enregistrer le document' }).click();
await page.waitForTimeout(600);
const stSec = await state(page);
const globalDoc = stSec.state.documents.find((d) => d.title === 'QA note globale');
check(
	results,
	'F19',
	'Secrétaire : dépôt global simulé',
	!!globalDoc && globalDoc.pupitreId === null && globalDoc.fileName === 'qa-note-globale.pdf',
	globalDoc ? `${globalDoc.pupitreId ?? 'tous'} · ${globalDoc.fileName}` : 'non créé',
	'document global, extension .pdf ajoutée'
);
await page.locator('main ul > li').first().getByRole('button', { name: 'Supprimer' }).click();
await page.waitForTimeout(200);
await page.getByRole('button', { name: 'Confirmer' }).click();
await page.waitForTimeout(400);

// --- Documents : administrateur -------------------------------------------
await switchProfile(page, 'Yann', 'Le Goff');
await page.goto(BASE + '/dashboard/documents', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const deleteAdmin = await page.getByRole('button', { name: 'Supprimer' }).count();
check(
	results,
	'F20',
	'Administrateur : mêmes droits que la secrétaire',
	deleteAdmin === 6 &&
		(await page.getByRole('button', { name: 'Déposer un document' }).count()) === 1,
	`${deleteAdmin} suppressions · dépôt présent`,
	'6 suppressions + dépôt'
);

// --- Notifications : membre ------------------------------------------------
await switchProfile(page, 'Maël', 'Kerdraon');
await page.goto(BASE + '/dashboard/notifications', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const notifCount = await notifItems();
const notifText = await page.locator('main').innerText();
check(
	results,
	'G1',
	'Membre : notifications reçues',
	notifCount === 7,
	`${notifCount} notifications`,
	'7 (dont 2 non lues)'
);
check(
	results,
	'G2',
	'Membre : compteur de non lues',
	/2 non lues/.test(notifText),
	(notifText.match(/\d+ non lues? · \d+ affichées?/) ?? ['(absent)'])[0],
	'2 non lues · 7 affichées'
);
const composeMembre = await page.getByRole('button', { name: 'Composer' }).count();
check(
	results,
	'G3',
	'Membre : aucun accès au composeur',
	composeMembre === 0,
	`${composeMembre} bouton`,
	'0'
);

// Marquer une notification non lue comme lue.
await page.getByRole('button', { name: 'Marquer lue' }).first().click();
await page.waitForTimeout(400);
const afterRead = await page.locator('main').innerText();
const stRead = await state(page);
const readCount = stRead.state.notifications.filter((n) => n.readBy.includes('p06')).length;
check(
	results,
	'G4',
	'Membre : marquer une notification comme lue',
	/1 non lue/.test(afterRead) && readCount === 6,
	`${(afterRead.match(/\d+ non lues?/) ?? ['?'])[0]} · lues par p06=${readCount}`,
	'1 non lue, état persisté'
);
const badgeNav = await page
	.locator('nav[aria-label="Navigation de l’espace adhérents"] a[href*="notifications"]')
	.innerText();
check(
	results,
	'G5',
	'Membre : badge de navigation à jour',
	/1/.test(badgeNav),
	badgeNav.replace(/\s+/g, ' '),
	'badge « 1 »'
);

// Repasser en non lue (notification n03 ciblée explicitement).
await page
	.locator('main ul > li')
	.filter({ hasText: 'Rappel : concert du 21 novembre' })
	.getByRole('button', { name: 'Marquer non lue' })
	.click();
await page.waitForTimeout(400);
const stUnread = await state(page);
check(
	results,
	'G6',
	'Membre : marquer non lue',
	/2 non lues/.test(await page.locator('main').innerText()) &&
		!stUnread.state.notifications.find((n) => n.id === 'n03').readBy.includes('p06'),
	`${(await page.locator('main').innerText()).match(/\d+ non lues?/)?.[0]} · n03 relue par p06=${stUnread.state.notifications.find((n) => n.id === 'n03').readBy.includes('p06')}`,
	'2 non lues, n03 retirée des lues par p06'
);

await page.getByRole('button', { name: 'Non lues' }).click();
await page.waitForTimeout(300);
const filteredUnread = await notifItems();
check(
	results,
	'G7',
	'Membre : filtre « Non lues »',
	filteredUnread === 2,
	`${filteredUnread} notifications`,
	'2'
);
await page.getByRole('button', { name: 'Toutes', exact: true }).click();
await page.waitForTimeout(300);

await page.getByRole('button', { name: 'Tout marquer comme lu' }).click();
await page.waitForTimeout(400);
const allReadText = await page.locator('main').innerText();
const allReadDisabled = await page
	.getByRole('button', { name: 'Tout marquer comme lu' })
	.isDisabled();
check(
	results,
	'G8',
	'Membre : tout marquer comme lu',
	/0 non lue/.test(allReadText) && allReadDisabled,
	`0 non lue · bouton désactivé=${allReadDisabled}`,
	'0 non lue, bouton désactivé'
);

// --- Notifications : chef de pupitre ---------------------------------------
await switchProfile(page, 'Bleuenn', 'Le Roux');
await page.goto(BASE + '/dashboard/notifications', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Composer' }).click();
await page.waitForTimeout(400);
const chefAudience = await page
	.locator('main form select')
	.first()
	.locator('option')
	.allInnerTexts();
check(
	results,
	'G9',
	'Chef : audience limitée, pas de « Tout le bagad »',
	chefAudience.length === 1 && /Pupitres/.test(chefAudience[0]),
	chefAudience.join(' | '),
	'Pupitres uniquement'
);
const chefPupitreInputs = page.locator('main form fieldset input[name="notify-pupitre"]');
const chefRadioCount = await chefPupitreInputs.count();
const chefRadioTypes = await chefPupitreInputs.evaluateAll((els) => els.map((e) => e.type));
check(
	results,
	'G10',
	'Chef : pupitres de son périmètre en choix unique',
	chefRadioCount === 2 && chefRadioTypes.every((t) => t === 'radio'),
	`${chefRadioCount} cases de type ${[...new Set(chefRadioTypes)].join('/')}`,
	'2 radios (Bombarde, Cornemuse)'
);

await page.locator('main form').getByPlaceholder('Rappel de répétition').fill('QA rappel bombarde');
await page
	.locator('main form')
	.getByPlaceholder('Texte de la notification…')
	.fill('Message de test QA, non envoyé réellement.');
await page
	.locator('main form fieldset label')
	.filter({ hasText: 'Bombarde' })
	.locator('input')
	.check();
await page.locator('main form').getByRole('button', { name: 'Envoyer (simulation)' }).click();
await page.waitForTimeout(600);
const stNotifChef = await state(page);
const chefNotif = stNotifChef.state.notifications.find((n) => n.title === 'QA rappel bombarde');
check(
	results,
	'G11',
	'Chef : envoi simulé vers son pupitre',
	!!chefNotif &&
		chefNotif.audience === 'pupitre' &&
		chefNotif.audienceIds.join(',') === 'bombarde' &&
		chefNotif.sentBy === 'p03',
	chefNotif
		? `${chefNotif.audience} → ${chefNotif.audienceIds.join(',')} · expéditeur ${chefNotif.sentBy}`
		: 'non créée',
	'notification pupitre bombarde, expéditeur p03, aucun envoi réel'
);
const chefNotifNotice = await page.getByRole('status').innerText();
check(
	results,
	'G12',
	'Chef : envoi annoncé comme simulation',
	/aucun envoi réel/i.test(chefNotifNotice),
	chefNotifNotice.replace(/\s+/g, ' ').slice(0, 140),
	'mention « aucun envoi réel »'
);

// --- Notifications : secrétaire -------------------------------------------
await switchProfile(page, 'Rozenn', "Kerloc'h");
await page.goto(BASE + '/dashboard/notifications', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Composer' }).click();
await page.waitForTimeout(400);
const secAudience = await page
	.locator('main form select')
	.first()
	.locator('option')
	.allInnerTexts();
check(
	results,
	'G13',
	'Secrétaire : audiences complètes',
	secAudience.length === 3 && secAudience.some((t) => /Tout le bagad/.test(t)),
	secAudience.join(' | '),
	'Tout le bagad | Membres choisis | Pupitres'
);
await page
	.locator('main form')
	.getByPlaceholder('Rappel de répétition')
	.fill('QA annonce générale');
await page
	.locator('main form')
	.getByPlaceholder('Texte de la notification…')
	.fill('Annonce de test QA pour tout le bagad.');
await page.locator('main form select').first().selectOption('all');
await page.waitForTimeout(200);
await page.locator('main form').getByRole('button', { name: 'Envoyer (simulation)' }).click();
await page.waitForTimeout(600);
const stNotifSec = await state(page);
const secNotif = stNotifSec.state.notifications.find((n) => n.title === 'QA annonce générale');
check(
	results,
	'G14',
	'Secrétaire : envoi simulé à tout le bagad',
	!!secNotif &&
		secNotif.audience === 'all' &&
		secNotif.audienceIds.length === 0 &&
		secNotif.sentBy === 'p02',
	secNotif ? `${secNotif.audience} · ${secNotif.audienceIds.length} ciblés` : 'non créée',
	'audience all, expéditeur p02'
);

const externalNotif = external.filter((url) =>
	/onesignal|push|mail|email|smtp|sendgrid|mailgun|postmark/i.test(url)
);
check(
	results,
	'G15',
	'Aucune requête vers un service de notification ou d’e-mail',
	externalNotif.length === 0,
	externalNotif.length ? externalNotif.slice(0, 3).join(', ') : '0 requête push/e-mail',
	'0 requête push/e-mail malgré les envois simulés'
);
const externalFonts = external.filter((url) => /fonts\.(googleapis|gstatic)\.com/i.test(url));
check(
	results,
	'G16',
	'Bilan des requêtes tierces (information)',
	true,
	`${externalFonts.length} requête(s) Google Fonts, ${external.length - externalFonts.length} autre(s) origine(s) tierce(s)`,
	'information : polices chargées depuis Google Fonts, hors périmètre notification'
);

await resetViaButton(page);
await browser.close();
save('s4', { results, summary: summarize(results), logs, external });
