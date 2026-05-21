import { defineSvelteKitConfig } from '@learn-anything/config/vite/sveltekit';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineSvelteKitConfig({
	resolve: {
		alias: [{ find: /^katex$/, replacement: require.resolve('katex') }]
	}
});
