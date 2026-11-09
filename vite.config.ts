import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Better Auth 1.7.x dépend de Zod 4 (API `z.looseObject`) alors que le
	// projet utilise Zod 3 pour ses schémas. Sans cela, le bundle SSR laisse
	// `import * as z from "zod"` et Node résout la version 3 à la racine,
	// ce qui casse le build. Inliner les deux laisse chaque paquet résoudre
	// sa propre version.
	ssr: {
		noExternal: ['better-auth', '@better-auth/core', 'zod']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**', 'src/autre/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', 'src/autre/**']
				}
			}
		]
	}
});
