import { cookieSession } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';
import { initialData, SECRET } from '../_utils';
import { Benchmark } from './_benchmark';

export const POST: RequestHandler = async (event) => {
	const { runs = 1000 } = await event.request.json();

	const { session: initialSession } = await cookieSession(event, { secret: SECRET });
	await initialSession.set(initialData);

	const benchmark = new Benchmark();

	for (let index = 0; index < runs; index += 1) {
		await cookieSession(event, {
			secret: SECRET
		});
	}

	const elapsed = benchmark.elapsed();

	return json({
		runs,
		elapsed: `${elapsed}ms`,
		each: `${elapsed / runs}ms`
	});
};
