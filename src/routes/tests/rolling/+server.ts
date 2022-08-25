import { cookieSession } from '$lib';
import { getCookieValue, initialData, SECRET } from '../_utils';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const get = async () => {
	const { session } = await cookieSession('', {
		secret: SECRET,
		rolling: true
	});

	await session.set(initialData);

	// @ts-ignore
	const cookie = getCookieValue(session['set-cookie']);

	await sleep(4000);

	const { session: newSession } = await cookieSession(cookie, {
		secret: SECRET,
		rolling: true
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
