# Svelte Kit Cookie Session [![License](https://img.shields.io/github/license/pixelmund/svelte-kit-cookie-session.svg)](https://github.com/pixelmund/svelte-kit-cookie-session) [![Latest Stable Version](https://img.shields.io/npm/v/svelte-kit-cookie-session.svg)](https://www.npmjs.com/package/svelte-kit-cookie-session)

⚒️ Encrypted "stateless" cookie sessions for SvelteKit

---

**This [SvelteKit](https://kit.svelte.dev) backend utility** allows you to create a session to be stored in the browser cookies via a encrypted seal. This provides strong client/"stateless" sessions.

The seal stored on the client contains the session data, not your server, making it a "stateless" session from the server point of view. This is a different take than `express-session` where the cookie contains a session ID to then be used to map data on the server-side.

---

**By default the cookie has an ⏰ expiration time of 7 days**, set via [`expires`] which should be a `number` in `days`.

---

## Installation

```bash
npm i svelte-kit-cookie-session

yarn add svelte-kit-cookie-session
```

## Usage

You can find an example implementation here [Example](/example).

The secret is a private key you must pass at runtime, it has to be at least 32 characters long. Use [Password Generator](https://1password.com/password-generator/) to generate strong passwords.

⚠️ You should always store passwords in secret environment variables on your platform.

### Initializing

#### There are two ways to initialize the session, one is doing it manually the other one is a higher-order-function

> src/hooks.ts || src/hooks/index.ts

`Suggested way`

```js
import { handleSession } from "svelte-kit-cookie-session";

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession({ locals }) {
  return locals.session.data;
}

// You can do it like this, without passing a own handle function
export const handle = handleSession({
  secret: "SOME_SECRET_SECRET_32_CHARS_LONG",
});

// Or pass your handle function as second argument to handleSession

export const handle = handleSession(
  {
    secret: "SOME_SECRET_SECRET_32_CHARS_LONG",
  },
  ({ request, resolve }) => {
    // request.locals is populated with the session `request.locals.session`

    // Do anything you want here
    return resolve(request);
  }
);
```

`Manually`

This manual setup is basically what `handleSession` is doing behind the scenes.

```js
import { initializeSession } from "svelte-kit-cookie-session";

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession({ locals }) {
  return locals.session.data;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ request, resolve }) {

  const session = initializeSession(request.headers, {
    secret: "SOME_SECRET_AT_LEAST_32_CHARACTERS_LONG",
  });

  request.locals.session = session;

  const response = await resolve(request);

  /** `session` is a Proxy, after the svelte kit renderer does it job, it will contain a optional set-cookie header if you set the session in an endpoint */

	if (!session['set-cookie'] || !response?.headers) {
		return response;
	}

	if (response.headers['set-cookie']) {
		if (typeof response.headers['set-cookie'] === 'string') {
			(response.headers['set-cookie'] as any) = [
				response.headers['set-cookie'],
				session['set-cookie']
			];
		} else if (Array.isArray(response.headers['set-cookie'])) {
			(response.headers['set-cookie'] as any) = [
				...response.headers['set-cookie'],
				session['set-cookie']
			];
		}
	} else {
		response.headers['set-cookie'] = session['set-cookie'];
	}

  return response;
}
```

### Setting The Session

`If the session already exists, the data get's updated but the expiration time stays the same`

> src/routes/login.ts

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function post({ locals, body }) {
  locals.session.data = body;

  return {
    body: locals.session.data,
  };
}
```

### Destroying the Session

> src/routes/logout.ts

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function del({ locals }) {
  locals.session.destroy();

  return {
    body: {
      ok: true,
    },
  };
}
```

### Refresh the session with the same data but renew the expiration date.

> src/routes/refresh.ts

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function put({ locals, body }) {
  locals.session.refresh(/** Optional new expiration time in days */);

  return {
    body: locals.session.data,
  };
}
```

### Refresh the session expiration on every request `Rolling` -> default is false!

> Note this currently only fires if a session is already existing

```js
handleSession({
  rolling: true,
});
```
