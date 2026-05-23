import { defineConfig } from 'vite';

/**
 * @param {import('vite').UserConfig} config
 * @param {import('vite').PluginOption} sveltekitPlugin
 */
export function defineSvelteKitConfig(config, sveltekitPlugin) {
	if (!sveltekitPlugin) {
		throw new Error('defineSvelteKitConfig requires the app-local sveltekit() plugin');
	}

	return defineConfig({
		...config,
		plugins: [sveltekitPlugin, ...(config.plugins ?? [])]
	});
}
