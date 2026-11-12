// Enquête : favicon / 404 selon les pages.
import { launch, newPage } from './lib.mjs';

const browser = await launch();
const { page } = await newPage(browser);
const perPage = [];
for (const path of ['/fr', '/dashboard']) {
	const errors = [];
	const onConsole = (msg) => {
		if (msg.type() === 'error') errors.push({ text: msg.text(), url: msg.location()?.url });
	};
	page.on('console', onConsole);
	await page.goto('http://localhost:5173' + path, { waitUntil: 'networkidle' });
	await page.waitForTimeout(800);
	const icons = await page.evaluate(() =>
		[...document.querySelectorAll('link[rel~="icon"]')].map((l) => l.getAttribute('href'))
	);
	perPage.push({ path, errors, icons, title: await page.title() });
	page.off('console', onConsole);
}
console.log(JSON.stringify(perPage, null, 2));
await browser.close();
