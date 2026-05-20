import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/**
 * @param {import('vite').UserConfig} [config]
 */
export function defineSvelteKitConfig(config = {}) {
	return defineConfig({
		...config,
		plugins: [sveltekit(), ...(config.plugins ?? [])]
	});
}
