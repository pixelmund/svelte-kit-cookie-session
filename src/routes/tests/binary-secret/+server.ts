import { CookieSession } from '$lib/core';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData } from '../_utils';

const BINARY_SECRET = new Uint8Array(32);

export const GET: RequestHandler = async (event) => {
	const newSession = new CookieSession(event, { secret: BINARY_SECRET });
	await newSession.init();
	await newSession.set(initialData);

	const sessionWithInitialCookie = new CookieSession(event, { secret: BINARY_SECRET });
	await sessionWithInitialCookie.init();
	const sessionData = sessionWithInitialCookie.data;

	if (initialData.username !== sessionData.username) {
		return json({
			ok: false
		});
	}

	return json({
		ok: true
	});
};
