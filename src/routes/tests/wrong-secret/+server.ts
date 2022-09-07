import { CookieSession } from '$lib/core';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData, SECRET } from '../_utils';

export const GET: RequestHandler = async (event) => {
	const newSession = new CookieSession(event, {
		secret: SECRET
	});
	await newSession.init();
	await newSession.set(initialData);

	const sessionWithWrongSecret = new CookieSession(event, {
		secret: 'zL9X16gHNCt1uRuopnJuanfznf0ziczP'
	});
	await sessionWithWrongSecret.init();
	sessionWithWrongSecret.data;

	const wrongCookie = event.cookies.get('kit.session');

	if (wrongCookie !== '') {
		return json({ ok: false });
	}

	return json({ ok: true });
};
