import { cookieSession } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData } from '../_utils';

const BINARY_SECRET = new Uint8Array(32);

export const GET: RequestHandler = async (event) => {
	const { session: newSession } = await cookieSession(event, {
		secret: BINARY_SECRET
	});

	await newSession.set(initialData);

	const { session: sessionWithInitialCookie } = await cookieSession(event, {
		secret: BINARY_SECRET
	});

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
