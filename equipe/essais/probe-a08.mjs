// Preuve complémentaire : attributs ARIA de l'avertissement de stockage local.
import { launch, newPage, openDemo, save, STORAGE_KEY, BASE } from './lib.mjs';

const browser = await launch();
const { page } = await newPage(browser);
await openDemo(page, '/dashboard');
await page.evaluate((key) => localStorage.setItem(key, '{donnees corrompues'), STORAGE_KEY);
await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const node = await page.evaluate(() => {
	const candidates = [...document.querySelectorAll('body *')].filter((el) =>
		/Les données enregistrées étaient corrompues/.test(el.textContent ?? '')
	);
	const deepest = candidates[candidates.length - 1];
	if (!deepest) return null;
	let el = deepest;
	const chain = [];
	for (let i = 0; i < 4 && el; i += 1) {
		chain.push({
			tag: el.tagName.toLowerCase(),
			role: el.getAttribute('role'),
			ariaLive: el.getAttribute('aria-live'),
			class: (el.getAttribute('class') ?? '').slice(0, 80)
		});
		el = el.parentElement;
	}
	return { text: deepest.textContent.trim().slice(0, 120), chain };
});

save('probe-a08', { node });
await browser.close();
