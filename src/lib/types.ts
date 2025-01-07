import type { RequestEvent } from '@sveltejs/kit';
import type { MaybePromise } from '@sveltejs/kit';

export interface SessionOptions {
	/**
	 * An optional function that is called when no stored session exists, this would be the initial session state.
	 * This function is called with the request event and should return an object that will be used as the initial session state.
	 * Can be asynchronous.
	 * @param event The request event
	 * @returns The initial session state
	 *
	 */
	init?: (event: RequestEvent) => MaybePromise<Partial<App.PageData['session']>>;

	/**
	 * Weither or not the session should be saved initially.
	 */
	saveUninitialized?: boolean;

	/**
	 * The name of the cookie to use for the session.
	 */
	key?: string;
	/**
	 * The secret(s) used to sign the session cookie.
	 */
	secret: BinaryLike | { id: number; secret: BinaryLike }[];

	/**
	 *
	 *  The expiration time of the session.
	 *
	 **/
	expires?: number;

	/**
	 * expires in Minutes
	 */
	expires_in?: 'days' | 'hours' | 'minutes' | 'seconds';

	/**
	 *
	 * Determines if the session cookie should be chunked.
	 * If the session cookie exceeds the browser's maximum cookie size, it will be split into multiple cookies.
	 * @default false
	 *
	 **/
	chunked?: boolean;

	/**
	 * Should the session refresh on every request?
	 */
	rolling?: true | number;
	cookie?: {
		/**
		 * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.6|`HttpOnly` `Set-Cookie` attribute}.
		 * When truthy, the `HttpOnly` attribute is set, otherwise it is not. By
		 * default, the `HttpOnly` attribute is not set.
		 *
		 * *Note* be careful when setting this to true, as compliant clients will
		 * not allow client-side JavaScript to see the cookie in `document.cookie`.
		 */
		httpOnly?: boolean | undefined;
		/**
		 * Specifies the boolean or string to be the value for the {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|`SameSite` `Set-Cookie` attribute}.
		 *
		 * - `true` will set the `SameSite` attribute to `Strict` for strict same
		 * site enforcement.
		 * - `false` will not set the `SameSite` attribute.
		 * - `'lax'` will set the `SameSite` attribute to Lax for lax same site
		 * enforcement.
		 * - `'strict'` will set the `SameSite` attribute to Strict for strict same
		 * site enforcement.
		 *  - `'none'` will set the SameSite attribute to None for an explicit
		 *  cross-site cookie.
		 *
		 * More information about the different enforcement levels can be found in {@link https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-03#section-4.1.2.7|the specification}.
		 *
		 * *note* This is an attribute that has not yet been fully standardized, and may change in the future. This also means many clients may ignore this attribute until they understand it.
		 */
		sameSite?: true | false | 'lax' | 'strict' | 'none' | undefined;
		/**
		 * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.4|`Path` `Set-Cookie` attribute}.
		 * By default, the path is considered the "default path".
		 */
		path?: string | undefined;
		/**
		 * Specifies the value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.3|Domain Set-Cookie attribute}. By default, no
		 * domain is set, and most clients will consider the cookie to apply to only
		 * the current domain.
		 */
		domain?: string | undefined;
		/**
		 * Specifies the boolean value for the {@link https://tools.ietf.org/html/rfc6265#section-5.2.5|`Secure` `Set-Cookie` attribute}. When truthy, the
		 * `Secure` attribute is set, otherwise it is not. By default, the `Secure` attribute is not set.
		 *
		 * *Note* be careful when setting this to `true`, as compliant clients will
		 * not send the cookie back to the server in the future if the browser does
		 * not have an HTTPS connection.
		 */
		secure?: boolean | undefined;
		/**
		 * Enables the [`Partitioned` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-cutler-httpbis-partitioned-cookies/).
		 * When enabled, clients will only send the cookie back when the current domain _and_ top-level domain matches.
		 *
		 * This is an attribute that has not yet been fully standardized, and may change in the future.
		 * This also means clients may ignore this attribute until they understand it. More information
		 * about can be found in [the proposal](https://github.com/privacycg/CHIPS).
		 */
		partitioned?: boolean;
		/**
		 * Specifies the value for the [`Priority` `Set-Cookie` attribute](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
		 *
		 * - `'low'` will set the `Priority` attribute to `Low`.
		 * - `'medium'` will set the `Priority` attribute to `Medium`, the default priority when not set.
		 * - `'high'` will set the `Priority` attribute to `High`.
		 *
		 * More information about priority levels can be found in [the specification](https://tools.ietf.org/html/draft-west-cookie-priority-00#section-4.1).
		 */
		priority?: 'low' | 'medium' | 'high';
	};
}

export interface Session<SessionType = Record<string, any>> {
	data: SessionType;
	expires: Date | undefined;
	update: (
		updateFn: (data: SessionType) => Partial<SessionType> | Promise<Partial<SessionType>>
	) => Promise<SessionType>;
	set: (data?: SessionType) => Promise<SessionType>;
	refresh: (expires_in_days?: number) => Promise<boolean>;
	destroy: () => Promise<boolean>;
}

export interface PrivateSession {
	'set-cookie'?: string | undefined;
}

export type BinaryLike = string | Uint8Array | Uint16Array | ArrayBufferView | Buffer;
