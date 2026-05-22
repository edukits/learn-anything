import type { StorybookConfig } from '@storybook/sveltekit';
import { fileURLToPath } from 'node:url';

const tokensPackagePath = fileURLToPath(new URL('../../tokens', import.meta.url));

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	viteFinal: async (viteConfig) => ({
		...viteConfig,
		server: {
			...viteConfig.server,
			fs: {
				...viteConfig.server?.fs,
				allow: [...(viteConfig.server?.fs?.allow ?? []), tokensPackagePath]
			}
		}
	})
};

export default config;
