import { cookieSession } from '$lib';
import { getCookieValue, initialData } from '../_utils';

const BINARY_SECRET = new Uint8Array(32);

export const get = async () => {
	const { session: newSession } = await cookieSession('', {
		secret: BINARY_SECRET
	});

	await newSession.set(initialData);

	// @ts-ignore
	const cookie = getCookieValue(newSession['set-cookie']);

	const { session: sessionWithInitialCookie } = await cookieSession(cookie, {
		secret: BINARY_SECRET
	});

	const sessionData = sessionWithInitialCookie.data;

	if (initialData.username !== sessionData.username) {
		return {
			body: {
				ok: false
			}
		};
	}

	return {
		body: {
			ok: true
		}
	};
};
