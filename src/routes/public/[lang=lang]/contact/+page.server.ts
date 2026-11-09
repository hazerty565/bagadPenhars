import { turnstileSiteKey } from '$lib/server/data/contact';

export const load = async () => {
	const siteKey = await turnstileSiteKey();
	return { turnstileSiteKey: siteKey };
};