import { cookieSession } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData, SECRET } from '../_utils';

export const GET: RequestHandler = async (event) => {
	const { session: newSession } = await cookieSession(event, {
		secret: SECRET
	});

	await newSession.set(initialData);

	const { session: sessionWithWrongSecret } = await cookieSession(event, {
		secret: 'zL9X16gHNCt1uRuopnJuanfznf0ziczP'
	});

	sessionWithWrongSecret.data;

	const wrongCookie = event.cookies.get('kit.session');

	if (wrongCookie !== '') {
		return json({ ok: false });
	}

	return json({ ok: true });
};
