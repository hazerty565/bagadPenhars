// Essai technique : import direct des services de démonstration depuis la page.
import { launch, newPage, openDemo, BASE } from './lib.mjs';

const browser = await launch();
const { page } = await newPage(browser);
await openDemo(page, '/dashboard');
const out = await page.evaluate(async () => {
	try {
		const mod = await import('/src/lib/demo/services/documents.ts');
		const store = await import('/src/lib/demo/store.svelte.ts');
		return {
			ok: true,
			keys: Object.keys(mod),
			docs: store.demo.documents.length,
			active: store.demo.activeProfileId
		};
	} catch (error) {
		return { ok: false, error: String(error) };
	}
});
console.log(JSON.stringify({ BASE, out }, null, 2));
await browser.close();
