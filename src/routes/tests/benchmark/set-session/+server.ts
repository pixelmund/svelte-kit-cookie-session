import { cookieSession } from '$lib';
import type { RequestHandler } from '@sveltejs/kit';
import { initialData, SECRET } from '../_utils';
import { Benchmark } from './_benchmark';

export const post: RequestHandler = async ({ request }) => {
	const { runs = 1000 } = await request.json();

	const benchmark = new Benchmark();

	for (let index = 0; index < runs; index += 1) {
		const { session } = await cookieSession('', {
			secret: SECRET
		});
		await session.set(initialData);
	}

	const elapsed = benchmark.elapsed();

	return {
		body: {
			runs,
			elapsed: `${elapsed}ms`,
			each: `${elapsed / runs}ms`
		}
	};
};
