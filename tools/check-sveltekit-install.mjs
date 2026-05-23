import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const workspaceRoots = ['apps', 'packages'];
const kitPackagePath = join('node_modules', '@sveltejs', 'kit');

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function workspacePackageDirs() {
	return workspaceRoots.flatMap((workspaceRoot) => {
		const absoluteRoot = join(root, workspaceRoot);

		if (!existsSync(absoluteRoot)) {
			return [];
		}

		return readdirSync(absoluteRoot, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => join(absoluteRoot, entry.name))
			.filter((directory) => existsSync(join(directory, 'package.json')));
	});
}

const packageDirs = [root, ...workspacePackageDirs()];
const kitInstalls = packageDirs.flatMap((directory) => {
	const packageJson = readJson(join(directory, 'package.json'));
	const kitPath = join(directory, kitPackagePath);

	if (!existsSync(kitPath)) {
		return [];
	}

	return [{ name: packageJson.name, directory, realpath: realpathSync(kitPath) }];
});

const realpaths = new Map();
for (const install of kitInstalls) {
	const installs = realpaths.get(install.realpath) ?? [];
	installs.push(install);
	realpaths.set(install.realpath, installs);
}

const errors = [];

if (realpaths.size > 1) {
	errors.push(
		[
			'Multiple @sveltejs/kit installs are linked in this workspace.',
			...Array.from(realpaths.entries()).map(([realpath, installs]) => {
				const packages = installs.map((install) => install.name).join(', ');
				return `- ${packages}: ${realpath}`;
			})
		].join('\n')
	);
}

const sharedConfigPackage = readJson(join(root, 'packages/config/package.json'));
const sharedConfigDeps = {
	...sharedConfigPackage.dependencies,
	...sharedConfigPackage.devDependencies,
	...sharedConfigPackage.peerDependencies
};

if (sharedConfigDeps['@sveltejs/kit']) {
	errors.push(
		'@learn-anything/config must not depend on @sveltejs/kit; apps should pass their app-local sveltekit() plugin into defineSvelteKitConfig.'
	);
}

const sharedSvelteKitConfig = readFileSync(join(root, 'packages/config/vite/sveltekit.js'), 'utf8');
if (sharedSvelteKitConfig.includes('@sveltejs/kit')) {
	errors.push(
		'packages/config/vite/sveltekit.js must not import @sveltejs/kit; doing so can split SvelteKit runtime instances under pnpm.'
	);
}

if (errors.length > 0) {
	console.error(errors.join('\n\n'));
	process.exit(1);
}

const install = kitInstalls[0];
const suffix = install ? ` (${install.realpath})` : '';
console.log(`SvelteKit install check passed${suffix}`);
