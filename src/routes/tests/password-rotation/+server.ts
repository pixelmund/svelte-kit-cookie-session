import { cookieSession } from '$lib';
import { getCookieValue, initialData, SECRET } from '../_utils';

export const get = async () => {
	const { session: newSession } = await cookieSession('', {
		secret: SECRET
	});

	await newSession.set(initialData);

	// @ts-ignore
	const initialCookie = getCookieValue(newSession['set-cookie']);

	const { session: sessionWithNewSecret } = await cookieSession(initialCookie, {
		secret: [
			{ id: 2, secret: 'JmLy4vMnwmQ75zhSJPc7Ud6U0anKnDZZ' },
			{ id: 1, secret: SECRET }
		]
	});

	const sessionWithNewSecretData = sessionWithNewSecret.data;

	if (initialData.username !== sessionWithNewSecretData?.username) {
		return {
			body: {
				reason: 'Should have the same data',
				ok: false
			}
		};
	}

	// @ts-ignore
	if (initialCookie === getCookieValue(sessionWithNewSecret['set-cookie'])) {
		return {
			body: {
				reason: "Cookie should get re-encrypted",
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
