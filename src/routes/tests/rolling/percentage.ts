import { cookieSession } from '$lib';
import { getCookieValue, initialData, SECRET } from '../_utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const get = async () => {
	const { session } = await cookieSession('', {
		secret: SECRET,
		rolling: true,
        expires: 1,
	});

	await session.set(initialData);

	// @ts-ignore
	const cookie = getCookieValue(session['set-cookie']);

	await sleep(5000);

	const { session: newSession } = await cookieSession(cookie, {
		secret: SECRET,
        expires: 1,
        rolling: 99.9999999999,
	});

	if (new Date(newSession.data.expires).getTime() === new Date(session.data.expires).getTime()) {
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
