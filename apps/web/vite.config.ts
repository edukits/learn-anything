import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineSvelteKitConfig } from '@learn-anything/config/vite/sveltekit';

const directory = dirname(fileURLToPath(import.meta.url));

export default defineSvelteKitConfig({
	server: {
		fs: {
			allow: [resolve(directory, '../..')]
		}
	}
});
