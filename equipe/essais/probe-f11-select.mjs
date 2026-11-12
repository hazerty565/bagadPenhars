// Preuve complémentaire : état initial du sélecteur de pupitre du formulaire de dépôt (chef).
import { launch, newPage, openDemo, switchProfile, save, BASE } from './lib.mjs';

const browser = await launch();
const { page } = await newPage(browser);
await openDemo(page, '/dashboard/documents');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await switchProfile(page, 'Bleuenn', 'Le Roux');
await page.goto(BASE + '/dashboard/documents', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Déposer un document' }).click();
await page.waitForTimeout(400);

const info = await page.evaluate(() => {
	const select = document.querySelector('main form select');
	if (!select) return null;
	return {
		value: select.value,
		selectedIndex: select.selectedIndex,
		optionCount: select.options.length,
		options: [...select.options].map((o) => ({
			value: o.value,
			label: o.textContent.trim(),
			selected: o.selected
		})),
		outerHTML: select.outerHTML.slice(0, 400)
	};
});
save('probe-f11-select', { info });
await browser.close();
