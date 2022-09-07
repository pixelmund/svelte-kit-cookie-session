import { CookieSession } from '$lib/core';
import { json, type RequestHandler } from '@sveltejs/kit';
import { initialData, SECRET } from '../_utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GET: RequestHandler = async (event) => {
	const session = new CookieSession(event, { secret: SECRET, rolling: true });
	await session.init();
	await session.set(initialData);

	await sleep(4000);

	const newSession = new CookieSession(event, { secret: SECRET, rolling: true });
	await newSession.init();

	if (new Date(newSession.expires!).getTime() === new Date(session.expires!).getTime()) {
		return json({ ok: false });
	}

	return json({ ok: true });
};
