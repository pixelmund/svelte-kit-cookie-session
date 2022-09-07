import { CookieSession } from '$lib/core';
import { json, type RequestHandler } from '@sveltejs/kit';
import { initialData, SECRET } from '../_utils';
import { Benchmark } from './_benchmark';

export const POST: RequestHandler = async (event) => {
	const { runs = 1000 } = await event.request.json();

	const initialSession = new CookieSession(event, { secret: SECRET });
	await initialSession.init();
	await initialSession.set(initialData);

	const benchmark = new Benchmark();

	for (let index = 0; index < runs; index += 1) {
		const session = new CookieSession(event, { secret: SECRET });
		await session.init();
	}

	const elapsed = benchmark.elapsed();

	return json({
		runs,
		elapsed: `${elapsed}ms`,
		each: `${elapsed / runs}ms`
	});
};
