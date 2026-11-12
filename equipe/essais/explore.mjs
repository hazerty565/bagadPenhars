// Exploration QA de l'espace membre en mode démonstration.
// Usage : node equipe/essais/explore.mjs [chemin]
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const path = process.argv[2] ?? '/dashboard';

const browser = await chromium.launch({
	executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	headless: true
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const logs = [];
page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: String(err) }));

await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => ({
	url: location.href,
	title: document.title,
	storageKeys: Object.keys(localStorage),
	bodyText: document.body.innerText.slice(0, 6000)
}));

console.log(JSON.stringify({ info, logs }, null, 2));
await page.screenshot({ path: 'equipe/essais/shot-explore.png', fullPage: false });
await browser.close();
