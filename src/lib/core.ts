import type { RequestEvent } from '@sveltejs/kit';
import { encrypt, decrypt } from 'zencrypt';
import type { BinaryLike, SessionOptions } from './types';
import {
	daysToMaxage,
	maxAgeToDateOfExpiry,
	normalizeConfig
} from './utils.js';

export async function cookieSession<SessionType = Record<string, any>>(
	event: RequestEvent,
	userConfig: SessionOptions
) {
	const config = normalizeConfig(userConfig);
	let needsSync = false;
	
	const sessionCookie = event.cookies.get(config.key);
	const serialize = event.cookies.set;
	const destroy = event.cookies.delete;

	let { data: sessionData, state } = await getSessionData(sessionCookie || '', config.secrets);

	async function makeCookie(maxAge: number) {
		const encode = async () => {
			return `${await encrypt(sessionData, config.secrets[0].secret as string)}&id=${
				config.secrets[0].id
			}`;
		};

		return serialize(config.key, await encode(), {
			httpOnly: config.cookie.httpOnly,
			path: config.cookie.path,
			sameSite: config.cookie.sameSite,
			secure: config.cookie.secure,
			domain: config.cookie?.domain,
			maxAge: maxAge
		});
	}

	async function setSession(sd: SessionType) {
		let maxAge = config.cookie.maxAge;

		if (sessionData?.expires) {
			maxAge = new Date(sessionData.expires).getTime() / 1000 - new Date().getTime() / 1000;
		}

		needsSync = true;

		sessionData = {
			...sd,
			expires: maxAgeToDateOfExpiry(maxAge)
		};

		await makeCookie(maxAge);
	}

	async function refreshSession(expiresInDays?: number) {
		if (!sessionData) {
			return false;
		}

		needsSync = true;

		const newMaxAge = daysToMaxage(expiresInDays ? expiresInDays : config.expiresInDays);

		sessionData = {
			...sessionData,
			expires: maxAgeToDateOfExpiry(newMaxAge)
		};

		await makeCookie(newMaxAge);
	}

	async function destroySession() {
		needsSync = true;
		sessionData = {};
		destroy(config.key);
	}

	async function reEncryptSession() {
		let maxAge = config.cookie.maxAge;

		if (sessionData?.expires) {
			maxAge = new Date(sessionData.expires).getTime() / 1000 - new Date().getTime() / 1000;
		}

		await makeCookie(maxAge);
	}

	// If rolling is activated and the session exists we refresh the session on every request.
	if (config?.rolling) {
		if (typeof config.rolling === 'number' && sessionData?.expires) {
			// refreshes when a percentage of the expiration date is met
			const differenceInSeconds = Math.round(
				new Date(sessionData.expires).getTime() / 1000 - new Date().getTime() / 1000
			);

			if (differenceInSeconds < (config.rolling / 100) * config.cookie.maxAge) {
				await refreshSession();
			}
		} else {
			await refreshSession();
		}
	}

	if (state.destroy || state.invalidDate) {
		await destroySession();
	}
	if (state.reEncrypt) {
		await reEncryptSession();
	}

	return {
		session: {
			get needsSync() {
				return needsSync;
			},
			get expires(): Date | undefined {
				return sessionData ? sessionData.expires : undefined;
			},
			get data(): any {
				return sessionData && !state.invalidDate && !state.destroy
					? { ...sessionData, expires: undefined }
					: {};
			},
			set: async function (data: SessionType) {
				await setSession(data);
				return sessionData;
			},
			update: async function (
				updateFn: (data: SessionType) => Partial<SessionType> | Promise<Partial<SessionType>>
			) {
				const sd = await updateFn(sessionData);
				await setSession({ ...sessionData, ...sd });
				return sessionData;
			},
			refresh: async function (expiresInDays?: number) {
				await refreshSession(expiresInDays);
				return true;
			},
			destroy: async function () {
				await destroySession();
				return true;
			}
		}
	};
}

async function getSessionData(
	sessionCookieString: string,
	secrets: Array<{ id: number; secret: BinaryLike }>
) {
	const state = {
		invalidDate: false,
		reEncrypt: false,
		destroy: false
	};

	if (sessionCookieString.length === 0) {
		return {
			state,
			data: {}
		};
	}

	const [sessionCookie, secret_id] = sessionCookieString.split('&id=');

	// If we have a session cookie we try to get the id from the cookie value and use it to decode the cookie.
	// If the decodeID is not the first secret in the secrets array we should re encrypt to the newest secret.

	// Split the sessionCookie on the &id= field to get the id we used to encrypt the session.
	const decodeID = secret_id ? Number(secret_id) : 1;

	// Use the id from the cookie or the initial one which is always 1.
	let secret = secrets.find((sec) => sec.id === decodeID);

	// If there is no secret found try the first in the secrets array.
	if (!secret) secret = secrets[0];

	// Try to decode with the given sessionCookie and secret
	try {
		const decrypted = await decrypt(sessionCookie, secret.secret);

		if (
			decrypted &&
			decrypted.expires &&
			new Date(decrypted.expires).getTime() < new Date().getTime()
		) {
			state.invalidDate = true;
			state.destroy = true;
		}

		// If the decodeID unequals the newest secret id in the array, we should re-encrypt the session with the newest secret.
		if (secrets[0].id !== decodeID) {
			state.reEncrypt = true;
		}

		return {
			state,
			data: decrypted
		};
	} catch (error) {
		state.destroy = true;
		return {
			state,
			data: {}
		};
	}
}
