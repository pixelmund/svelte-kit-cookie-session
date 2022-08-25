# Svelte Kit Cookie Session [![License](https://img.shields.io/github/license/pixelmund/svelte-kit-cookie-session.svg)](https://github.com/pixelmund/svelte-kit-cookie-session) [![Latest Stable Version](https://img.shields.io/npm/v/svelte-kit-cookie-session.svg)](https://www.npmjs.com/package/svelte-kit-cookie-session)

⚒️ Encrypted "stateless" cookie sessions for SvelteKit

---

**This [SvelteKit](https://kit.svelte.dev) backend utility** allows you to create a session to be stored in the browser cookies via a encrypted seal. This provides strong client/"stateless" sessions.

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
1. [Sync sessions between browser and server](#sync-session-between-browser-and-server)

**By default the cookie has an ⏰ expiration time of 7 days**, set via [`expires`] which should be a `number` in `days`.

---

## Upgrading

> :warning: SvelteKit removed support for `getSession` and the `session` store!

You can upgrade by creating a `+layout.server.js` file at the root and returning the session data from there.

> src/routes/+layout.server.ts

```js
/** @type {import('./$types').LayoutServerLoad} */
export const load = ({ locals }) => {
	return {
		session: locals.session.data // You can also use your old `getSession` function if you wish.
	};
};
```

You'll now have access to the `session` data by using `$page.data.session` or via the `parent` function from other `+page.server.js` load functions.

```svelte
<script>
	import { page } from '$app/stores';
	$: session = $page.data.session;
</script>
```

## Installation

Install into `dependencies`

```bash
npm i svelte-kit-cookie-session

yarn add svelte-kit-cookie-session
```

Update your `app.d.ts` file to look something like:

```ts
/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs#typescript
// for information about these interfaces
declare namespace App {
	interface Locals {
		session: import('svelte-kit-cookie-session').Session<SessionData>;
		cookies: Record<string, string>; // all parsed cookies are automatically set from handleSession to avoid overhead
	}

	interface Platform {}

	interface PrivateEnv {}

	interface PublicEnv {}
}
```

## Usage

You can find some examples in the src/routes/tests folder [Tests](/src/routes/tests).

The secret is a private key or list of private keys you must pass at runtime, it should be at least `32 characters` long. Use [Password Generator](https://1password.com/password-generator/) to generate strong secrets.

⚠️ You should always store secrets in secret environment variables on your platform.

### Initializing

> src/hooks.ts || src/hooks/index.ts

```js
import { handleSession } from 'svelte-kit-cookie-session';

// You can do it like this, without passing a own handle function
export const handle = handleSession({
	secret: 'SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS'
});

// Or pass your handle function as second argument to handleSession

export const handle = handleSession(
	{
		secret: 'SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS'
	},
	({ event, resolve }) => {
		// event.locals is populated with the session `event.locals.session`
		// event.locals is also populated with all parsed cookies by handleSession, it would cause overhead to parse them again - `event.locals.cookies`.

		// Do anything you want here
		return resolve(event);
	}
);
```

In case you're using [sequence()](https://kit.svelte.dev/docs/modules#sveltejs-kit-hooks-sequence), do this

```js
const sessionHandler = handleSession({
	secret: 'SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS'
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
	secret: 'SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS'
});
```

**Week 2**:

```js
export const handle = handleSession({
	secret: [
		{
			id: 2,
			secret: 'SOME_OTHER_COMPLEX_SECRET_AT_LEAST_32_CHARS'
		},
		{
			id: 1,
			secret: 'SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS'
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

`If the session already exists, the data get's updated but the expiration time stays the same`

> src/routes/counter/+page.server.js

```js
/** @type {import('@sveltejs/kit').Action} */
export async function POST({ locals, request }) {
	const { counter = 0 } = locals.session.data;

	await locals.session.set({ counter: counter + 1 });

	return;
}
```

`Sometimes you don't want to get the session data first only to increment a counter or some other value, that's where the update method comes in to play`

> src/routes/counter/+page.server.ts

```js
/** @type {import('@sveltejs/kit').Action} */
export async function POST({ locals, request }) {
	await locals.session.update(({ count }) => ({ count: count ? count + 1 : 0 }));

	return;
}
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
export function load({ parent }) {
	const { session } = await parent();

	// Already logged in:
	if(session.userId) {
		throw redirect(302, '/')
	}

	return {
		session: locals.session.data
	};
}
```

### Destroying the Session

> src/routes/logout/+page.server.js

```js
/** @type {import('@sveltejs/kit').Action} */
export async function DELETE({ locals }) {
	await locals.session.destroy();
	return
}
```

### Refresh the session with the same data but renew the expiration date

> src/routes/refresh/+page.server.js

```js
/** @type {import('@sveltejs/kit').Action} */
export async function PUT({ locals, request }) {
	await locals.session.refresh(/** Optional new expiration time in days */);

	return;
}
```

### Refresh the session expiration on every request `Rolling` -> default is false!

You can also specify a percentage from 1 to 100 which refreshes the session when a percentage of the expiration date is met.

> Note this currently only fires if a session is already existing

```js
handleSession({
	rolling: true // or 1-100 for percentage o the expiry date met,
});
```

### Sync session between browser and server

The `handleSession` function keeps track if the client needs to be synced with the server!
If the header `x-svelte-kit-cookie-session-needs-sync` is set, you know that you have to sync the state.
You can do so by using the `invalidate` function.

**_The enhance function can be extended like so:_**

```ts
import { invalidate } from "$app/navigation";

/// lib/form.ts
export function enhance(){
	...
	async function handle_submit(e) {
		...
		if (response.ok) {
			if (response.headers.has('x-svelte-kit-cookie-session-needs-sync')) {
				await invalidate();
			}
			...
		}
		...
	}
}

```

### Express/Connect Integration

This library can integrate with express, polka or any other connect compatible middleware layer.

**Please make sure to polyfill the webcrypto module on globalThis if you're doing so!**

```ts
import express from 'express';
import { sessionMiddleware } from 'svelte-kit-cookie-session';

const app = express();

app.use(sessionMiddleware({ secret: 'A_VERY_SECRET_SECRET_AT_LEAST_32_CHARS_LONG' }));

app.get('/', (req, res) => {
	const sessionData = req.session.data;
	const views = sessionData.views ?? 0;
	const { views } = await req.session.set({ views: views + 1 });
	return res.json({ views });
});

app.listen(4004, () => {
	console.log('Listening on http://localhost:4004');
});
```
