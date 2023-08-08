import { CookieSession } from '$lib/core';
import { json, type RequestHandler } from '@sveltejs/kit';
import { initialData, SECRET } from '../../_utils';

export const GET: RequestHandler = async (event) => {
	const newSession = new CookieSession(event, {
		secret: SECRET,
		expires_in: 'minutes',
		expires: 60
	});
	await newSession.init();
	await newSession.set(initialData);

	if (newSession.expires === undefined) {
		return json({
			ok: false
		});
	}

	const minutes = Math.floor((newSession.expires.getTime() - Date.now()) / 1000 / 60);

	if (minutes <= 60 && minutes > 58) {
		return json({
			ok: true
		});
	} else {
		return json({
			ok: false
		});
	}
};
