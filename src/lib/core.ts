import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { encrypt, decrypt } from 'zencrypt';
import type { SessionOptions } from './types';
import {
	daysToMaxage,
	maxAgeToDateOfExpiry,
	normalizeConfig,
	type NormalizedConfig
} from './utils.js';

export class CookieSession<SessionType = Record<string, any>> {
	#config: NormalizedConfig;
	#cookies: Cookies;
	#sessionData: any = {};
	#state: {
		needsSync: boolean;
		invalidDate: boolean;
		reEncrypt: boolean;
		destroy: boolean;
	} = { destroy: false, reEncrypt: false, invalidDate: false, needsSync: false };

	constructor(event: RequestEvent, userConfig: SessionOptions) {
		this.#config = normalizeConfig(userConfig);
		this.#cookies = event.cookies;
	}

	get expires(): Date | undefined {
		return this.#sessionData ? this.#sessionData.expires : undefined;
	}

	get data(): SessionType {
		return this.#sessionData && !this.#state.invalidDate && !this.#state.destroy
			? { ...this.#sessionData, expires: undefined }
			: {};
	}

	get needsSync() {
		return this.#state.needsSync;
	}

	async init() {
		const { data, state } = await this.getSessionData();

		if (data) {
			this.#sessionData = data;
		}

		if (state.destroy || state.invalidDate) {
			this.destroy();
		}

		if (state.reEncrypt) {
			await this.reEncrypt();
		}

		// If rolling is activated and the session exists we refresh the session on every request.
		if (this.#config?.rolling) {
			if (typeof this.#config.rolling === 'number' && this.#sessionData?.expires) {
				// refreshes when a percentage of the expiration date is met
				const differenceInSeconds = Math.round(
					new Date(this.#sessionData.expires).getTime() / 1000 - new Date().getTime() / 1000
				);

				if (differenceInSeconds < (this.#config.rolling / 100) * this.#config.cookie.maxAge) {
					await this.refreshSession();
				}
			} else {
				await this.refreshSession();
			}
		}
	}

	public async set(data: SessionType) {
		let maxAge = this.#config.cookie.maxAge;

		if (this.#sessionData?.expires) {
			maxAge = new Date(this.#sessionData.expires).getTime() / 1000 - new Date().getTime() / 1000;
		}

		this.#state.needsSync = true;

		this.#sessionData = {
			...data,
			expires: maxAgeToDateOfExpiry(maxAge)
		};

		await this.setCookie(maxAge);

		return this.#sessionData;
	}

	public async update(
		updateFn: (data: SessionType) => Partial<SessionType> | Promise<Partial<SessionType>>
	) {
		const sd = await updateFn(this.#sessionData);
		return await this.set({ ...this.#sessionData, ...sd });
	}

	public destroy() {
		this.#state.needsSync = true;
		this.#sessionData = {};
		this.#cookies.delete(this.#config.key, {
			httpOnly: this.#config.cookie.httpOnly,
			path: this.#config.cookie.path,
			sameSite: this.#config.cookie.sameSite,
			secure: this.#config.cookie.secure,
			domain: this.#config.cookie?.domain
		});
	}

	public async refresh(expiresInDays?: number) {
		await this.refreshSession(expiresInDays);
		return true;
	}

	private async reEncrypt() {
		let maxAge = this.#config.cookie.maxAge;

		if (this.#sessionData?.expires) {
			maxAge = new Date(this.#sessionData.expires).getTime() / 1000 - new Date().getTime() / 1000;
		}

		await this.setCookie(maxAge);
	}

	private async refreshSession(expiresInDays?: number) {
		if (!this.#sessionData) {
			return false;
		}

		this.#state.needsSync = true;

		const newMaxAge = daysToMaxage(expiresInDays ? expiresInDays : this.#config.expiresInDays);

		this.#sessionData = {
			...this.#sessionData,
			expires: maxAgeToDateOfExpiry(newMaxAge)
		};

		await this.setCookie(newMaxAge);
	}

	private async setCookie(maxAge: number) {
		const encode = async () => {
			return `${await encrypt(this.#sessionData, this.#config.secrets[0].secret as string)}&id=${
				this.#config.secrets[0].id
			}`;
		};

		return this.#cookies.set(this.#config.key, await encode(), {
			httpOnly: this.#config.cookie.httpOnly,
			path: this.#config.cookie.path,
			sameSite: this.#config.cookie.sameSite,
			secure: this.#config.cookie.secure,
			domain: this.#config.cookie?.domain,
			maxAge: maxAge
		});
	}

	private async getSessionData() {
		const session = {
			state: {
				invalidDate: false,
				reEncrypt: false,
				destroy: false
			},
			data: {}
		};

		const sessionCookieString = this.#cookies.get(this.#config.key) || '';

		if (sessionCookieString.length === 0) {
			return session;
		}

		const [sessionCookie, secret_id] = sessionCookieString.split('&id=');

		// If we have a session cookie we try to get the id from the cookie value and use it to decode the cookie.
		// If the decodeID is not the first secret in the secrets array we should re encrypt to the newest secret.

		// Split the sessionCookie on the &id= field to get the id we used to encrypt the session.
		const decodeID = secret_id ? Number(secret_id) : 1;

		// Use the id from the cookie or the initial one which is always 1.
		let secret = this.#config.secrets.find((sec) => sec.id === decodeID);

		// If there is no secret found try the first in the secrets array.
		if (!secret) secret = this.#config.secrets[0];

		// Try to decode with the given sessionCookie and secret
		try {
			const decrypted = await decrypt(sessionCookie, secret.secret);

			if (
				decrypted &&
				decrypted.expires &&
				new Date(decrypted.expires).getTime() < new Date().getTime()
			) {
				session.state.invalidDate = true;
				session.state.destroy = true;
			}

			// If the decodeID unequals the newest secret id in the array, we should re-encrypt the session with the newest secret.
			if (this.#config.secrets[0].id !== decodeID) {
				session.state.reEncrypt = true;
			}

			session.data = decrypted;

			return session;
		} catch (error) {
			session.state.destroy = true;
			return session;
		}
	}
}
