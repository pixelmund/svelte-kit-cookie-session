import { cookieSession } from '$lib';
import { json, type RequestHandler } from '@sveltejs/kit';
import { getCookieValue, initialData, SECRET } from '../_utils';

export const GET: RequestHandler = async (event) => {
	const { session: newSession } = await cookieSession(event, {
		secret: SECRET
	});

	await newSession.set(initialData);

	// @ts-ignore
	const initialCookie = event.cookies.get('kit.session');

	const { session: sessionWithNewSecret } = await cookieSession(event, {
		secret: [
			{ id: 2, secret: 'JmLy4vMnwmQ75zhSJPc7Ud6U0anKnDZZ' },
			{ id: 1, secret: SECRET }
		]
	});

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
