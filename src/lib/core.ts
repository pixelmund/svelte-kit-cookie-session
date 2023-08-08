import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { encrypt, decrypt, getKey, generateNonce } from './crypto.js';
import type { SessionOptions } from './types';
import {
	expiresToMaxage,
	maxAgeToDateOfExpiry,
	normalizeConfig,
	type NormalizedConfig
} from './utils.js';

export class CookieSession<SessionType = Record<string, any>> {
	#config: NormalizedConfig;
	#cookies: Cookies;
	#event: RequestEvent;
	#initialData: any = {};
	#sessionData: any = undefined;
	#state: {
		needsSync: boolean;
		invalidDate: boolean;
		reEncrypt: boolean;
		destroy: boolean;
	} = { destroy: false, reEncrypt: false, invalidDate: false, needsSync: false };

	constructor(event: RequestEvent, userConfig: SessionOptions) {
		this.#event = event;
		const isSecure =
			event.request.headers.get('x-forwarded-proto') === 'https' ||
			event.request.url.startsWith('https');
		this.#config = normalizeConfig(userConfig, isSecure);
		this.#cookies = event.cookies;
	}

	get expires(): Date | undefined {
		return this.#sessionData ? this.#sessionData.expires : undefined;
	}

	get data(): SessionType {
		return this.#sessionData && !this.#state.invalidDate && !this.#state.destroy
			? { ...this.#sessionData }
			: this.#initialData;
	}

	get needsSync() {
		return this.#state.needsSync;
	}

	async init() {
		const { data, state } = await this.getSessionData();

		this.#initialData = await this.#config.init(this.#event);

		if (this.#config.saveUninitialized && !data && this.#initialData) {
			await this.set(this.#initialData);
		}

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
		const dt = this.data;
		const sd = await updateFn(dt);
		return await this.set({ ...dt, ...sd });
	}

	public destroy() {
		this.#state.needsSync = true;
		this.#sessionData = {};

		if (!this.#config.chunked) {
			this.deleteCookies([
				{
					name: this.#config.key,
					value: ''
				}
			]);
		}

		const chunks = this.getChunkedCookies();
		const cookiesToDelete = chunks;

		const meta = this.#cookies.get(`${this.#config.key}.meta`);

		if (meta) {
			cookiesToDelete.push({ name: `${this.#config.key}.meta`, value: meta });
		}

		this.deleteCookies(cookiesToDelete);
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

	private async refreshSession(expires?: number) {
		if (!this.#sessionData) {
			return false;
		}

		this.#state.needsSync = true;

		const newMaxAge = expiresToMaxage(expires ? expires : this.#config.expires, this.#config.expires_in);

		this.#sessionData = {
			...this.#sessionData,
			expires: maxAgeToDateOfExpiry(newMaxAge)
		};

		await this.setCookie(newMaxAge);
	}

	private chunkString(str: string, chunkSize: number) {
		const chunks = [];
		for (let i = 0; i < str.length; i += chunkSize) {
			chunks.push(str.substring(i, i + chunkSize));
		}
		return chunks;
	}

	private async setCookie(maxAge: number) {
		const cookieOptions = {
			httpOnly: this.#config.cookie.httpOnly,
			path: this.#config.cookie.path,
			sameSite: this.#config.cookie.sameSite,
			secure: this.#config.cookie.secure,
			domain: this.#config.cookie?.domain,
			maxAge: maxAge
		};

		const nonce = generateNonce();
		const key = getKey(this.#config.secrets[0].secret as string);

		const encode = () => {
			return encrypt(key, nonce, this.#sessionData);
		};

		const id = String(this.#config.secrets[0].id);

		if (!this.#config.chunked) {
			return this.#cookies.set(this.#config.key, `${await encode()}&id=${id}`, cookieOptions);
		}

		const metaCookie = this.#cookies.get(`${this.#config.key}.meta`);
		const [currentChunkAmount] = metaCookie ? metaCookie.split('-') : [0];

		// We need to check if the user has chunks enabled and if so we need to encrypt the data in chunks
		const encoded = await encode();

		const chunkSize = 3996 - this.#config.key.length - 16 - id.length;
		const chunks = this.chunkString(encoded, chunkSize);

		// If the amount of chunks is different from the amount of chunks we have stored in the meta cookie we need to delete the old ones

		if (currentChunkAmount !== String(chunks.length)) {
			const cookiesToDelete = this.getChunkedCookies();
			this.deleteCookies(cookiesToDelete);
		}

		if (chunks.length > 0) {
			for (let i = 0; i < chunks.length; i++) {
				this.#cookies.set(`${this.#config.key}.${i}`, chunks[i], cookieOptions);
			}

			this.#cookies.set(
				`${this.#config.key}.meta`,
				`${chunks.length}-${this.#config.secrets[0].id}`,
				cookieOptions
			);
		}
	}

	private deleteCookies(cookies: { name: string; value: string }[]) {
		for (const cookie of cookies) {
			this.#cookies.delete(cookie.name, {
				httpOnly: this.#config.cookie.httpOnly,
				path: this.#config.cookie.path,
				sameSite: this.#config.cookie.sameSite,
				secure: this.#config.cookie.secure,
				domain: this.#config.cookie?.domain
			});
		}
	}

	private async getSessionData() {
		const session = {
			state: {
				invalidDate: false,
				reEncrypt: false,
				destroy: false
			},
			data: undefined
		};

		let secret_id = this.#config.secrets[0].id;
		let sessionCookie: string = '';

		if (!this.#config.chunked) {
			const splitted = (this.#cookies.get(this.#config.key) || '').split('&id=');
			sessionCookie = splitted[0];
			secret_id = Number(splitted[1]);
		} else {
			const chunks = this.getChunkedCookies();
			const metaCookie = this.#cookies.get(`${this.#config.key}.meta`);

			if (metaCookie) {
				const meta = metaCookie?.split('-');
				secret_id = Number(meta[1]);
			}

			sessionCookie = chunks.map((chunk) => chunk.value).join('');
		}

		if (sessionCookie.length === 0) {
			return session;
		}

		// If we have a session cookie we try to get the id from the cookie value and use it to decode the cookie.
		// If the decodeID is not the first secret in the secrets array we should re encrypt to the newest secret.

		// Split the sessionCookie on the &id= field to get the id we used to encrypt the session.
		const decodeID = secret_id ? Number(secret_id) : this.#config.secrets[0].id;

		// Use the id from the cookie or the initial one which is always 1.
		let secret = this.#config.secrets.find((sec) => sec.id === decodeID);

		// If there is no secret found try the first in the secrets array.
		if (!secret) secret = this.#config.secrets[0];

		// Try to decode with the given sessionCookie and secret
		try {
			const key = getKey(secret.secret);
			const decrypted = await decrypt(key, sessionCookie);

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

	private getChunkedCookies() {
		const allCookies = this.#cookies
			.getAll()
			.filter((cookie) => cookie.name.startsWith(this.#config.key));

		const chunks = allCookies
			.filter((cookie) => cookie.name.endsWith('.meta') === false)
			.sort((a, b) => {
				const aIndex = Number(a.name.split('.')[1]);
				const bIndex = Number(b.name.split('.')[1]);
				return aIndex - bIndex;
			});

		return chunks;
	}
}
