import { cookieSession } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData, SECRET } from '../../_utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GET: RequestHandler = async () => {
	const { session } = await cookieSession('', {
		secret: SECRET,
		rolling: true,
		expires: 1
	});

	await session.set(initialData);

	// @ts-ignore
	const cookie = getCookieValue(session['set-cookie']);

	await sleep(5000);

	const { session: newSession } = await cookieSession(cookie, {
		secret: SECRET,
		expires: 1,
		rolling: 99.9999999999
	});

	if (new Date(newSession.data.expires).getTime() === new Date(session.data.expires).getTime()) {
		return json({ ok: false });
	}

	return json({ ok: true });
};
