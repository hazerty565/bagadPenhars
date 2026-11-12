// Enquête : initiateur de la requête /favicon.ico sur /dashboard.
import { launch, newPage } from './lib.mjs';

const browser = await launch();
const { page, context } = await newPage(browser);
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');
const initiators = [];
cdp.on('Network.requestWillBeSent', (e) => {
	if (/favicon/.test(e.request.url))
		initiators.push({
			url: e.request.url,
			type: e.type,
			initiator: e.initiator,
			documentURL: e.documentURL
		});
});
const docs = [];
page.on('response', (res) => {
	if (res.request().resourceType() === 'document')
		docs.push({ url: res.url(), status: res.status() });
});
await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const html = await page.evaluate(() => document.querySelector('head')?.innerHTML.slice(0, 600));
console.log(JSON.stringify({ initiators, docs, head: html }, null, 2));
await browser.close();
