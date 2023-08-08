import { CookieSession } from '$lib/core';
import { json, type RequestHandler } from '@sveltejs/kit';
import { SECRET } from '../_utils';

export const GET: RequestHandler = async (event) => {
	const withoutInitialization = new CookieSession(event, {
		secret: SECRET,
		init: () => ({ initialized: true }),
		saveUninitialized: false
	});
	await withoutInitialization.init();

	// @ts-ignore
	const initialCookie = event.cookies.get('kit.session');

	if (initialCookie !== undefined) {
		return json({
			ok: false
		});
	}

	const withInitialization = new CookieSession(event, {
		secret: SECRET,
		init: () => ({ initialized: true }),
		saveUninitialized: true
	});

	await withInitialization.init();

	// @ts-ignore
	const newCookie = event.cookies.get('kit.session');

	if (newCookie === undefined) {
		return json({
			ok: false
		});
	}

	return json({
		ok: true
	});
};
