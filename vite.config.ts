import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import type { Plugin } from 'vite';

/**
 * Exclut l'espace membre de démonstration du bundle de production.
 *
 * Les routes chargent les pages et la coquille de démonstration par `import()`
 * gardé par `dev`. Vite analyse néanmoins ces imports statiquement et créerait
 * des chunks contenant les données fictives. Ce plugin coupe la résolution des
 * modules `$lib/demo/pages/*` et `$lib/demo/components/*` au build : les
 * fichiers ne sont ni lus, ni transformés, ni émis. En développement et sous
 * Vitest, il ne s'applique pas.
 */
function excludeDemoFromBuild(): Plugin {
	const stubId = '\0bagad-demo-excluded';
	const demoModule = /(?:^|[\\/])(?:\$lib[\\/]demo|lib[\\/]demo)[\\/](?:pages|components)[\\/]/;

	return {
		name: 'bagad-exclude-demo-from-build',
		enforce: 'pre',
		apply: 'build',
		resolveId(id) {
			return demoModule.test(id) ? stubId : null;
		},
		load(id) {
			return id === stubId ? 'export default {};' : null;
		}
	};
}

export default defineConfig({
	plugins: [excludeDemoFromBuild(), sveltekit()],
	ssr: {
		// Better Auth 1.7.x dépend de Zod 4 (API `z.looseObject`) alors que le
		// projet utilise Zod 3 pour ses schémas. Sans cela, le bundle SSR laisse
		// `import * as z from "zod"` et Node résout la version 3 à la racine,
		// ce qui casse le build. Inliner les paquets laisse chacun résoudre sa
		// propre version.
		// `@lucide/svelte` (v1) publie des composants `.svelte` : il doit être
		// compilé par le plugin Svelte, sinon le rendu SSR échoue avec
		// « Unknown file extension ".svelte" ».
		noExternal: ['better-auth', '@better-auth/core', 'zod', '@lucide/svelte']
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
