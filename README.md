# Svelte Kit Cookie Session [![License](https://img.shields.io/github/license/pixelmund/svelte-kit-cookie-session.svg)](https://github.com/pixelmund/svelte-kit-cookie-session) [![Latest Stable Version](https://img.shields.io/npm/v/svelte-kit-cookie-session.svg)](https://www.npmjs.com/package/svelte-kit-cookie-session)

⚒️ Encrypted "stateless" cookie sessions for SvelteKit

---

**This [SvelteKit](https://kit.svelte.dev) backend utility** allows you to create a session to be stored in the browser cookies via an encrypted seal. This provides strong client/"stateless" sessions.

The seal stored on the client contains the session data, not your server, making it a "stateless" session from the server point of view. This is a different take than `express-session` where the cookie contains a session ID to then be used to map data on the server-side.

---

## 📚&nbsp;&nbsp;Table of Contents

1. [Upgrading](#upgrading)
1. [Installation](#installation)
1. [Usage](#usage)
1. [Initializing](#initializing)
1. [Secret Rotation](#secret-rotation)
1. [Setting the Session](#setting-the-session)
1. [Accessing the Session](#accessing-the-session)
1. [Destroying the Session](#destroying-the-session)
1. [Refreshing the Session](#refresh-the-session-with-the-same-data-but-renew-the-expiration-date)
1. [Configure Expiry Date](#configure-expiry-date)
1. [Save unsaved session with the initial data](#save-unsaved-session-with-the-initial-data)

**By default the cookie has an ⏰ expiration time of 7 days**, set via [`expires`] which should be a `number` in either `days | hours | minutes | seconds` configurable by the `expires_in` option.

## Upgrading

#### Version 3.x to 4.x

The internal encryption library changed to the [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) which is up to 35% faster than the previous implementation. The encryption should also now be even more secure.
Because of the change of the encryption library we have an major version bump. You now have to provide a secret with an exact length of 32 characters or bytes. You can use [Password Generator](https://1password.com/password-generator/) to generate strong secrets. 

## Installation

Install into `dependencies`

```bash
npm i svelte-kit-cookie-session

yarn add svelte-kit-cookie-session

pnpm add svelte-kit-cookie-session
```

Update your `app.d.ts` file to look something like:

```ts
import type { Session } from 'svelte-kit-cookie-session';

type SessionData = {
	views: number;
};

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session<SessionData>;
		}
		interface PageData {
			// can add any properties here, return it from your root layout
			session: SessionData;
		}
		// interface Platform {}
	}
}

export {};
```

## Usage

You can find some examples in the src/routes/tests folder [Tests](/src/routes/tests).

The secret is a private key or list of private keys you must pass at runtime, it should be `32 characters` long. Use [Password Generator](https://1password.com/password-generator/) to generate strong secrets.

⚠️ You should always store secrets in secret environment variables on your platform.

### Initializing

> src/hooks.server.ts

```js
import { handleSession } from 'svelte-kit-cookie-session';

// You can do it like this, without passing a own handle function
export const handle = handleSession({
	// Optional initial state of the session, default is an empty object {}
	// init: (event) => ({
	// 	views: 0
	// }),
	// chunked: true // Optional, default is false - if true, the session will be chunked into multiple cookies avoiding the browser limit for cookies
	secret: 'SOME_COMPLEX_SECRET_32_CHARSLONG'
});

// Or pass your handle function as second argument to handleSession

export const handle = handleSession(
	{
		secret: 'SOME_COMPLEX_SECRET_32_CHARSLONG'
	},
	({ event, resolve }) => {
		// event.locals is populated with the session `event.locals.session`

		// Do anything you want here
		return resolve(event);
	}
);
```

In case you're using [sequence()](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence), do this

```js
const sessionHandler = handleSession({
	secret: 'SOME_COMPLEX_SECRET_32_CHARSLONG'
});
export const handle = sequence(sessionHandler, ({ resolve, event }) => {
	// event.locals is populated with the session `event.locals.session`
	// event.locals is also populated with all parsed cookies by handleSession, it would cause overhead to parse them again - `event.locals.cookies`.
	// Do anything you want here
	return resolve(event);
});
```

### Secret rotation

is supported. It allows you to change the secret used to sign and encrypt sessions while still being able to decrypt sessions that were created with a previous secret.

This is useful if you want to:

- rotate secrets for better security every two (or more, or less) weeks
- change the secret you previously used because it leaked somewhere (😱)

Then you can use multiple secrets:

**Week 1**:

```js
export const handle = handleSession({
	secret: 'SOME_COMPLEX_SECRET_32_CHARSLONG'
});
```

**Week 2**:

```js
export const handle = handleSession({
	secret: [
		{
			id: 2,
			secret: 'SOME_OTHER_COMPLEX_SECR_32_CHARS'
		},
		{
			id: 1,
			secret: 'SOME_COMPLEX_SECRET_32_CHARSLONG'
		}
	]
});
```

Notes:

- `id` is required so that we do not have to try every secret in the list when decrypting (the `id` is part of the cookies value).
- The secret used to encrypt session data is always the first one in the array, so when rotating to put a new secret, it must be first in the array list
- Even if you do not provide an array at first, you can always move to array based secret afterwards, knowing that your first password (`string`) was given `{id:1}` automatically.

### Setting The Session

Setting the session can be done in two ways, either via the `set` method or via the `update` method.

`If the session already exists, the data gets updated but the expiration time stays the same`

> src/routes/counter/+page.server.js

```js
/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	default: async ({ locals }) => {
		const { counter = 0 } = locals.session.data;

		await locals.session.set({ counter: counter + 1 });

		return {};
	}
};
```

`Sometimes you don't want to get the session data first only to increment a counter or some other value, that's where the update method comes in to play.`

> src/routes/counter/+page.server.ts

```js
/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	default: async ({ locals, request }) => {
		await locals.session.update(({ count }) => ({ count: count ? count + 1 : 0 }));
		return {};
	}
};
```

### Accessing The Session

`After initializing the session, your locals will be filled with a session object, we automatically set the cookie if you set the session via locals.session.set({}) to something and receive the current data via locals.session.data only.`

> src/routes/+layout.server.js

```js
/** @type {import('@sveltejs/kit').LayoutServerLoad} */
export function load({ locals, request }) {
	return {
		session: locals.session.data
	};
}
```

> src/routes/+page.svelte

```svelte
<script>
	import { page } from '$app/stores';
	$: session = $page.data.session;
</script>
```

> src/routes/auth/login/+page.server.js

```js
/** @type {import('@sveltejs/kit').PageData} */
export function load({ parent, locals }) {
	const { session } = await parent();
	// or
	// locals.session.data.session;


	// Already logged in:
	if(session.userId) {
		throw redirect(302, '/')
	}

	return {};
}
```

### Destroying the Session

> src/routes/logout/+page.server.js

```js
/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	default: async () => {
		await locals.session.destroy();
		return {};
	}
};
```

### Refresh the session with the same data but renew the expiration date

> src/routes/refresh/+page.server.js

```js
/** @type {import('@sveltejs/kit').Actions} */
export const actions = {
	default: async () => {
		await locals.session.refresh(/** Optional new expiration time in days */);
		return {};
	}
};
```

### Refresh the session expiration on every request `Rolling` -> default is false!

You can also specify a percentage from 1 to 100 which refreshes the session when a percentage of the expiration date is met.

> Note this currently only fires if a session is already existing

```js
handleSession({
	rolling: true // or 1-100 for percentage o the expiry date met,
});
```

### Configure Expiry Date

You can configure the expiry date of the session cookie via the `expires` option. It should be a `number` in either `days | hours | minutes | seconds`.

```js
handleSession({
	expires: 160, // 160 minutes
	expires_in: 'minutes', // minutes | hours | days | seconds
});
```

### Save unsaved session with the initial data

You can save unsaved sessions with the initial data via the `saveUninitialized` option. It should be a `boolean` and the default is `false`.

```js
handleSession({
	init: () => ({ views: 0 }),
	saveUninitialized: true,
});
```