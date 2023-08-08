import { CookieSession } from '$lib/core';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData, SECRET } from '../_utils';

export const GET: RequestHandler = async (event) => {
	const newSession = new CookieSession(event, { secret: SECRET });
	await newSession.init();
	await newSession.set(initialData);

	// @ts-ignore
	const initialCookie = event.cookies.get('kit.session');

	const sessionWithNewSecret = new CookieSession(event, {
		secret: [
			{ id: 2, secret: '728hH4HPFNCduN6js58D3ZAfHeoRZc4v' },
			{ id: 1, secret: SECRET }
		]
	});
	await sessionWithNewSecret.init();

	const sessionWithNewSecretData = sessionWithNewSecret.data;

	if (initialData.username !== sessionWithNewSecretData?.username) {
		return json({
			reason: 'Should have the same data',
			ok: false
		});
	}

	// @ts-ignore
	if (initialCookie === event.cookies.get('kit.session')) {
		return json({
			reason: 'Cookie should get re-encrypted',
			ok: false
		});
	}

	return json({
		ok: true
	});
};
