import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => {
	if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
console.log('TITLE:', await page.title());
console.log('URL:', page.url());
const text = await page.locator('body').innerText();
console.log('--- BODY ---');
console.log(text.slice(0, 2500));
console.log('--- ERRORS ---');
console.log(errors.slice(0, 10));
await browser.close();
