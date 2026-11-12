// Helpers QA pour l'espace membre en mode démonstration (Playwright + Chrome local).
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

export const BASE = 'http://localhost:5173';
export const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const STORAGE_KEY = 'bagadpenhars.demo.v1';

/** Écrit la sortie d'un scénario en UTF-8, sans passer par la redirection PowerShell. */
export function save(name, data) {
	writeFileSync(
		new URL(`./out-${name}.json`, import.meta.url),
		JSON.stringify(data, null, 2),
		'utf8'
	);
}

export async function launch() {
	return chromium.launch({ executablePath: CHROME, headless: true });
}

export async function newPage(browser, viewport = { width: 1280, height: 900 }) {
	const context = await browser.newContext({ viewport });
	const page = await context.newPage();
	const logs = { console: [], pageerror: [], failed: [], requests: [] };
	page.on('console', (msg) => {
		const type = msg.type();
		if (type === 'debug' || type === 'info') return;
		logs.console.push({ type, text: msg.text() });
	});
	page.on('pageerror', (err) => logs.pageerror.push(String(err)));
	page.on('requestfailed', (req) =>
		logs.failed.push({ url: req.url(), error: req.failure()?.errorText })
	);
	page.on('response', async (res) => {
		if (res.status() >= 400) logs.requests.push({ url: res.url(), status: res.status() });
	});
	return { context, page, logs };
}

export async function openDemo(page, path = '/dashboard') {
	await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
	await page.locator('main#contenu-dashboard').waitFor({ timeout: 20000 });
	await page.waitForTimeout(400);
}

export async function switchProfile(page, firstName, lastName) {
	await page.getByRole('button', { name: 'Changer de profil', exact: true }).first().click();
	const dialog = page.getByRole('dialog', { name: 'Changer de profil' });
	await dialog.waitFor();
	await dialog
		.locator('ul li button')
		.filter({ hasText: `${firstName} ${lastName}` })
		.first()
		.click();
	await dialog.waitFor({ state: 'detached' });
	await page.waitForTimeout(300);
}

export async function activeProfileName(page) {
	return (await page.locator('aside button').first().innerText()).replace(/\s+/g, ' ').trim();
}

export async function state(page) {
	return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), STORAGE_KEY);
}

export async function resetViaButton(page) {
	await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click();
	await page.getByRole('button', { name: 'Réinitialiser la démo' }).click();
	await page.waitForTimeout(400);
}

export function check(results, id, name, condition, observed, expected) {
	results.push({
		id,
		name,
		status: condition ? 'OK' : 'KO',
		observed,
		expected
	});
}

export function summarize(results) {
	const ok = results.filter((r) => r.status === 'OK').length;
	const ko = results.filter((r) => r.status === 'KO').length;
	return { ok, ko, total: results.length };
}
