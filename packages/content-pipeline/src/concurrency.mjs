export async function runLimited(items, limit, worker) {
	if (!Number.isInteger(limit) || limit < 1) {
		throw new Error(`Concurrency limit must be a positive integer, received ${limit}.`);
	}

	const results = Array.from({ length: items.length });
	let nextIndex = 0;

	async function runWorker() {
		const index = nextIndex;
		nextIndex += 1;
		if (index >= items.length) {
			return;
		}
		results[index] = await worker(items[index], index);
		await runWorker();
	}

	const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
	await Promise.all(workers);
	return results;
}
