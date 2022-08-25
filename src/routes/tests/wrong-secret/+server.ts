import { cookieSession } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData, SECRET } from '../_utils';

export const GET: RequestHandler = async () => {
	const { session: newSession } = await cookieSession('', {
		secret: SECRET
	});

	await newSession.set(initialData);

	//@ts-ignore
	const cookie = getCookieValue(newSession['set-cookie']);

	const { session: sessionWithWrongSecret } = await cookieSession(cookie, {
		secret: 'zL9X16gHNCt1uRuopnJuanfznf0ziczP'
	});

	sessionWithWrongSecret.data;

	//@ts-ignore
	const wrongCookie = getCookieValue(sessionWithWrongSecret['set-cookie']);

	if (wrongCookie !== 'kit.session=0') {
		return json({ ok: false });
	}

	return json({ ok: true });
};
