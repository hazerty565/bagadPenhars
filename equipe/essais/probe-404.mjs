// Enquête : origine exacte de l'erreur console 404.
import { launch, newPage, openDemo } from './lib.mjs';

const browser = await launch();
const { page, context } = await newPage(browser);
const events = [];
page.on('console', (msg) => {
	if (msg.type() === 'error') {
		events.push({ kind: 'console', text: msg.text(), location: msg.location() });
	}
});
page.on('request', (req) =>
	events.push({ kind: 'request', url: req.url(), type: req.resourceType() })
);
page.on('response', (res) => {
	if (res.status() >= 400) events.push({ kind: 'response', url: res.url(), status: res.status() });
});
page.on('requestfailed', (req) =>
	events.push({ kind: 'failed', url: req.url(), error: req.failure()?.errorText })
);
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');
cdp.on('Network.responseReceived', (event) => {
	if (event.response.status >= 400)
		events.push({
			kind: 'cdp-response',
			url: event.response.url,
			status: event.response.status,
			type: event.type
		});
});
await openDemo(page, '/dashboard');
await page.waitForTimeout(1500);
await page.goto('http://localhost:5173/dashboard/membres', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
console.log(JSON.stringify({ events: events.filter((e) => e.kind !== 'request') }, null, 2));
await browser.close();
