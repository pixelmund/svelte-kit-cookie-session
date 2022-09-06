import { cookieSession } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';
import { initialData, SECRET } from '../../_utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GET: RequestHandler = async (event) => {
	const { session } = await cookieSession(event, {
		secret: SECRET,
		rolling: true,
		expires: 1
	});

	await session.set(initialData);

	await sleep(5000);

	const { session: newSession } = await cookieSession(event, {
		secret: SECRET,
		expires: 1,
		rolling: 99.9999999999
	});

	if (new Date(newSession.expires!).getTime() === new Date(session.expires!).getTime()) {
		return json({ ok: false });
	}

	return json({ ok: true });
};
