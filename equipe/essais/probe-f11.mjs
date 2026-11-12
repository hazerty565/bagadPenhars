// Preuve : état du sélecteur « Pupitre » du formulaire de dépôt pour un chef.
import { launch, newPage, openDemo, switchProfile, BASE } from './lib.mjs';

const browser = await launch();
const { page } = await newPage(browser);
await openDemo(page, '/dashboard/documents');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await switchProfile(page, 'Bleuenn', 'Le Roux');
await page.goto(BASE + '/dashboard/documents', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Déposer un document' }).click();
await page.waitForTimeout(400);
const selectState = await page.locator('main form select').evaluate((el) => ({
	value: el.value,
	selectedIndex: el.selectedIndex,
	selectedText: el.selectedOptions[0]?.textContent?.trim() ?? null,
	optionCount: el.options.length
}));
const formText = await page.locator('main form').innerText();
await page.screenshot({ path: 'equipe/essais/preuve-f11-chef-depot.png', fullPage: false });
console.log(
	JSON.stringify({ selectState, formText: formText.replace(/\s+/g, ' ').slice(0, 300) }, null, 2)
);
await browser.close();
