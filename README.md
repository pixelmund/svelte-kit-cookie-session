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

You can find a real-world example in this [repository](https://github.com/pixelmund/sveltekit-cookie-session-example).

The secret is a private key you must pass at runtime, it has to be at least 32 characters long. Use [Password Generator](https://1password.com/password-generator/) to generate strong passwords.

⚠️ You should always store passwords in secret environment variables on your platform.

### Initializing

> src/hooks.ts || src/hooks/index.ts

```js
import { initializeSession } from "svelte-kit-cookie-session";

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession({ locals }) {
  return locals.session.data;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ request, render }) {
  
  const session = initializeSession(request.headers, {
    secret: "SOME_SECRET_AT_LEAST_32_CHARACTERS_LONG",
    cookie: { path: "/" },
  });

  request.locals.session = session;

  const response = await render(request);

  /** `session` is a Proxy, after the svelte kit renderer does it job, it will contain a set-cookie header if you set the session in an endpoint */

  if (!session || session?.["set-cookie"].length === 0) {
    return response;
  }

  return {
    ...response,
    headers: {
      ...response.headers,
      ...session,
    },
  };
}
```

### Setting The Session

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
  locals.session.destroy = true;

  return {
    body: {
      ok: true,
    },
  };
}
```

### Refreshing the Session with new Data but keep the expiration date

> src/routes/refresh.ts

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function put({ locals, body }) {
  locals.session.data = body;
  locals.session.refresh = true;

  return {
    body: locals.session.data,
  };
}
```

## Advanced Usage

> src/lib/session.ts

**Create a custom session store which handles persisting the session**

```js
import { session as sessionStore } from "$app/stores";

/** @type {(method: 'POST' | 'PUT' | 'DELETE', value: any) => any} */
function handleSession(method, value) {
  fetch("/session", {
    method,
    body: method !== "DELETE" ? JSON.stringify(value) : undefined,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-cache",
  }).then(() => {});
}

/** @type {{set: (value: any) => void, update: (value: any) => void, destroy: () => void, subscribe: import("svelte/store").Writable['subscribe']}} */
export const session = {
  set: (value) => {
    sessionStore.set(value);
    handleSession("POST", value);
  },
  update: (value) => {
    sessionStore.set(value);
    handleSession("PUT", value);
  },
  destroy: () => {
    sessionStore.set({});
    handleSession("DELETE");
  },
  subscribe: sessionStore.subscribe,
};
```

> src/routes/session/index.js

**This is the corresponding endpoint for the custom session store, which handles the different methods.**

⚠️ You probably want to secure this somehow, im up for suggestions!

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function post({ locals, body }) {
  locals.session.data = body;

  return {
    body: locals.session.data,
  };
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function put({ locals, body }) {
  locals.session.data = body;
  locals.session.refresh = true;

  return {
    body: locals.session.data,
  };
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function del({ locals }) {
  locals.session.destroy = true;

  return {
    body: {
      ok: true,
    },
  };
}
```
