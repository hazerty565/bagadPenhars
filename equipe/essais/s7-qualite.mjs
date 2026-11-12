// Scénario 10 : qualité (console, titre de page, mobile, accessibilité de base).
import { launch, newPage, openDemo, check, summarize, save, BASE } from './lib.mjs';

const results = [];
const browser = await launch();

const { page, logs } = await newPage(browser, { width: 1280, height: 900 });
const badResponses = [];
page.on('response', (res) => {
	if (res.status() >= 400)
		badResponses.push({ url: res.url(), status: res.status(), type: res.request().resourceType() });
});

await openDemo(page, '/dashboard');
await page.evaluate(() => localStorage.clear());

const ROUTES = [
	['/dashboard', 'Tableau de bord'],
	['/dashboard/agenda', 'Agenda'],
	['/dashboard/agenda/e01', 'Détail événement'],
	['/dashboard/membres', 'Trombinoscope'],
	['/dashboard/documents', 'Documents'],
	['/dashboard/notifications', 'Notifications'],
	['/dashboard/profil', 'Profil'],
	['/dashboard/securite', 'Sécurité'],
	['/dashboard/pupitre', 'Espace pupitre (refus)'],
	['/dashboard/admin', 'Administration (refus)']
];
const titles = [];
for (const [route, label] of ROUTES) {
	await page.goto(BASE + route, { waitUntil: 'networkidle' });
	await page.waitForTimeout(350);
	titles.push({
		route,
		label,
		title: await page.title(),
		h1: await page
			.locator('main h1')
			.first()
			.innerText()
			.catch(() => '')
	});
}

check(
	results,
	'J1',
	'Erreurs console sur les parcours',
	logs.console.filter((m) => m.type === 'error').length === 0,
	logs.console
		.filter((m) => m.type === 'error')
		.map((m) => m.text)
		.join(' | ') || 'aucune erreur',
	'aucune erreur console'
);
check(
	results,
	'J2',
	'Erreurs JavaScript non gérées',
	logs.pageerror.length === 0,
	logs.pageerror.join(' | ') || 'aucune',
	'aucune'
);
check(
	results,
	'J3',
	'Réponses HTTP en erreur identifiées',
	badResponses.length === 0,
	badResponses.map((r) => `${r.status} ${r.type} ${r.url}`).join(' | ') || 'aucune réponse >= 400',
	'aucune ressource manquante'
);
check(
	results,
	'J4',
	'Titre de page renseigné',
	titles.every((t) => t.title.trim().length > 0),
	titles.map((t) => `${t.route}: « ${t.title} »`).join(' · '),
	'titre propre à chaque page (WCAG 2.4.2)'
);
check(
	results,
	'J5',
	'Un titre h1 par page',
	titles.every((t) => t.h1.trim().length > 0),
	titles.map((t) => `${t.route}: « ${t.h1} »`).join(' · '),
	'h1 présent sur chaque page'
);

// --- Accessibilité desktop --------------------------------------------------
await page.goto(BASE + '/dashboard/agenda', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const skip = page.getByRole('link', { name: 'Aller au contenu principal' });
await page.keyboard.press('Tab');
const firstFocused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
const skipVisible = await skip.isVisible();
check(
	results,
	'J6',
	'Lien d’évitement accessible au clavier',
	skipVisible && /Aller au contenu principal/.test(firstFocused),
	`premier focus : « ${firstFocused} »`,
	'lien d’évitement en premier'
);

const labelsMissing = await page.evaluate(() => {
	const fields = [...document.querySelectorAll('main input, main select, main textarea')];
	return fields
		.filter((el) => {
			if (el.type === 'hidden') return false;
			const id = el.getAttribute('id');
			const hasLabel = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
			const wrapped = el.closest('label');
			const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
			return !hasLabel && !wrapped && !aria;
		})
		.map((el) => `${el.tagName.toLowerCase()}[type=${el.type}]`);
});
check(
	results,
	'J7',
	'Champs de formulaire étiquetés',
	labelsMissing.length === 0,
	labelsMissing.join(', ') || 'aucun champ sans étiquette',
	'aucun'
);

const focusStyle = await page.evaluate(() => {
	const link = document.querySelector('aside nav a');
	if (!link) return null;
	link.focus();
	const style = getComputedStyle(link);
	return {
		outlineStyle: style.outlineStyle,
		outlineWidth: style.outlineWidth,
		boxShadow: style.boxShadow
	};
});
check(
	results,
	'J8',
	'Focus visible sur les éléments interactifs',
	!!focusStyle &&
		(focusStyle.outlineStyle !== 'none'
			? parseFloat(focusStyle.outlineWidth) > 0
			: focusStyle.boxShadow !== 'none'),
	JSON.stringify(focusStyle),
	'indicateur de focus visible (contour ou ombre)'
);

const imgWithoutAlt = await page.evaluate(
	() => [...document.querySelectorAll('main img')].filter((img) => !img.hasAttribute('alt')).length
);
check(
	results,
	'J9',
	'Images avec attribut alt',
	imgWithoutAlt === 0,
	`${imgWithoutAlt} image(s) sans alt`,
	'0'
);

const a11y = await page.evaluate(() => {
	const parse = (value) => {
		const m = value.match(/rgba?\(([^)]+)\)/);
		if (!m) return null;
		const parts = m[1].split(',').map((v) => parseFloat(v));
		return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
	};
	const lum = ({ r, g, b }) => {
		const f = (v) => {
			const c = v / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		};
		return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
	};
	const bgOf = (el) => {
		let node = el;
		while (node && node !== document.documentElement) {
			const bg = parse(getComputedStyle(node).backgroundColor);
			if (bg && bg.a >= 0.95) return bg;
			node = node.parentElement;
		}
		return { r: 255, g: 255, b: 255, a: 1 };
	};
	const out = [];
	for (const el of document.querySelectorAll(
		'main p, main h1, main h2, main a, main button, main td, main li'
	)) {
		if (!el.textContent?.trim()) continue;
		if (el.querySelector('p, h1, h2, a, button, td, li')) continue;
		const style = getComputedStyle(el);
		if (style.visibility === 'hidden' || style.display === 'none') continue;
		const fg = parse(style.color);
		if (!fg || fg.a < 0.9) continue;
		const bg = bgOf(el);
		const L1 = lum(fg);
		const L2 = lum(bg);
		const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
		const size = parseFloat(style.fontSize);
		const bold = parseInt(style.fontWeight, 10) >= 700;
		const large = size >= 24 || (bold && size >= 18.66);
		if (ratio < (large ? 3 : 4.5)) {
			out.push({
				text: el.textContent.trim().slice(0, 40),
				ratio: Number(ratio.toFixed(2)),
				size,
				fg: style.color,
				bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`
			});
		}
	}
	return out;
});
check(
	results,
	'J10',
	'Contraste texte/fond (échantillon automatique)',
	a11y.length === 0,
	a11y.length
		? JSON.stringify(a11y.slice(0, 5))
		: 'aucun écart détecté sur les textes échantillonnés',
	'aucun contraste insuffisant'
);

// --- Mobile ---------------------------------------------------------------
const mobile = await newPage(browser, { width: 390, height: 844 });
await mobile.page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await mobile.page.evaluate(() => localStorage.clear());
await mobile.page.reload({ waitUntil: 'networkidle' });
await mobile.page.waitForTimeout(600);
const mp = mobile.page;

const menuButton = mp.getByRole('button', { name: 'Ouvrir le menu' });
const bottomNav = mp.locator('nav[aria-label="Navigation rapide"]');
const bottomLabels = (await bottomNav.locator('a').allInnerTexts()).map((t) =>
	t.replace(/\s+/g, ' ').trim()
);
const desktopAsideVisible = await mp.locator('aside').first().isVisible();
check(
	results,
	'J11',
	'Mobile : barre supérieure et menu',
	(await menuButton.isVisible()) && !desktopAsideVisible,
	`bouton menu visible=${await menuButton.isVisible()} · aside desktop visible=${desktopAsideVisible}`,
	'menu mobile visible, sidebar desktop masquée'
);
check(
	results,
	'J12',
	'Mobile : navigation basse à 4 entrées',
	bottomLabels.length === 4 && bottomLabels[0] === 'Accueil',
	bottomLabels.join(' | '),
	'Accueil | Agenda | Membres | Documents'
);

const resetVisibleMobile = await mp
	.getByRole('button', { name: 'Réinitialiser', exact: true })
	.isVisible()
	.catch(() => false);
check(
	results,
	'J13',
	'Mobile : réinitialisation hors du bandeau (accès par le tiroir)',
	resetVisibleMobile === false,
	`bouton bandeau visible=${resetVisibleMobile}`,
	'masqué sous 640 px, présent dans le tiroir'
);

const overflow = await mp.evaluate(() => ({
	scrollWidth: document.documentElement.scrollWidth,
	innerWidth: window.innerWidth
}));
check(
	results,
	'J14',
	'Mobile : aucun débordement horizontal',
	overflow.scrollWidth <= overflow.innerWidth + 1,
	`scrollWidth=${overflow.scrollWidth} · viewport=${overflow.innerWidth}`,
	'largeur contenue'
);

await menuButton.click();
await mp.waitForTimeout(400);
const drawer = mp.locator('nav[aria-label="Navigation mobile"]');
const drawerLabels = (await drawer.locator('a').allInnerTexts()).map((t) =>
	t.replace(/\s+/g, ' ').trim()
);
const drawerReset = await mp.getByRole('button', { name: 'Réinitialiser la démo' }).isVisible();
check(
	results,
	'J15',
	'Mobile : tiroir complet',
	drawerLabels.length >= 7 && drawerLabels.some((t) => /Notifications/.test(t)) && drawerReset,
	`${drawerLabels.length} entrées (${drawerLabels.join(' | ')}) · reset=${drawerReset}`,
	'au moins 7 entrées + réinitialisation'
);

await mp.locator('nav[aria-label="Navigation mobile"] a', { hasText: 'Agenda' }).first().click();
await mp.waitForTimeout(500);
check(
	results,
	'J16',
	'Mobile : navigation par le tiroir',
	mp.url().endsWith('/dashboard/agenda'),
	mp.url(),
	'arrivée sur /dashboard/agenda, tiroir refermé'
);

const overflowAgenda = await mp.evaluate(() => ({
	scrollWidth: document.documentElement.scrollWidth,
	innerWidth: window.innerWidth
}));
check(
	results,
	'J17',
	'Mobile : agenda sans débordement',
	overflowAgenda.scrollWidth <= overflowAgenda.innerWidth + 1,
	`scrollWidth=${overflowAgenda.scrollWidth} · viewport=${overflowAgenda.innerWidth}`,
	'largeur contenue'
);

await mp.goto(BASE + '/dashboard/agenda/e01', { waitUntil: 'networkidle' });
await mp.waitForTimeout(400);
const overflowDetail = await mp.evaluate(() => ({
	scrollWidth: document.documentElement.scrollWidth,
	innerWidth: window.innerWidth
}));
check(
	results,
	'J18',
	'Mobile : détail d’événement sans débordement',
	overflowDetail.scrollWidth <= overflowDetail.innerWidth + 1,
	`scrollWidth=${overflowDetail.scrollWidth} · viewport=${overflowDetail.innerWidth}`,
	'largeur contenue'
);

const mobileConsole = mobile.logs.console.filter((m) => m.type === 'error');
check(
	results,
	'J19',
	'Mobile : aucune erreur console',
	mobileConsole.length === 0,
	mobileConsole.map((m) => m.text).join(' | ') || 'aucune',
	'aucune'
);

await page.goto(BASE + '/dashboard/documents', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Télécharger' }).first().click();
await page.waitForTimeout(400);
const toast = page.getByRole('status');
const toastCount = await toast.count();
const toastLive = toastCount ? await toast.getAttribute('aria-live') : null;
check(
	results,
	'J20',
	'Messages de retour annoncés aux lecteurs d’écran',
	toastCount === 1 && toastLive === 'polite',
	`role=status présent=${toastCount === 1} · aria-live=${toastLive}`,
	'message global en role="status" avec aria-live="polite"'
);

await browser.close();
save('s7', { results, summary: summarize(results), logs, badResponses, titles });
