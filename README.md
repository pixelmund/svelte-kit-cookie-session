# Svelte Kit Cookie Session [![License](https://img.shields.io/github/license/pixelmund/svelte-kit-cookie-session.svg)](https://github.com/pixelmund/svelte-kit-cookie-session) [![Latest Stable Version](https://img.shields.io/npm/v/svelte-kit-cookie-session.svg)](https://www.npmjs.com/package/svelte-kit-cookie-session)

⚒️ Encrypted "stateless" cookie sessions for SvelteKit

---

Check out, [Svemix](https://github.com/svemix/svemix) if you want to have a better developer experience using **SvelteKit**. Svemix can be seen as an full stack addition to **Kit**. It let's you write server side code inside .svelte files, has session handling on the next level with auto client session updates, loaders and actions that run on the server and even working with javascript disabled, also provides you with meta/SEO handling.

---

**This [SvelteKit](https://kit.svelte.dev) backend utility** allows you to create a session to be stored in the browser cookies via a encrypted seal. This provides strong client/"stateless" sessions.

The seal stored on the client contains the session data, not your server, making it a "stateless" session from the server point of view. This is a different take than `express-session` where the cookie contains a session ID to then be used to map data on the server-side.

---

**By default the cookie has an ⏰ expiration time of 7 days**, set via [`expires`] which should be a `number` in `days`.

---

## Upgrading from v2 to v3

Please use any version above `@sveltejs/kit@1.0.0-next.340`, all older versions are not compatible with v3 anymore. Stick to `2.1.4` if you like to use older versions of `kit`.
There are some breaking changes around the apis, all methods are now async and setting the data is done via the `set` function. We're now using the WebCrypto Api instead of NodeJs Crypto, since it is polyfilled by SvelteKit and we can now support all environments instead of only Node ones.

## Installation

Install into `dependencies`

```bash
npm i svelte-kit-cookie-session

yarn add svelte-kit-cookie-session
```

Update your `app.d.ts` file to look something like:

```ts
/// <reference types="@sveltejs/kit" />

interface SessionData {
  // Your session data
  views: number;
}

// See https://kit.svelte.dev/docs#typescript
// for information about these interfaces
declare namespace App {
  interface Locals {
    session: import("svelte-kit-cookie-session").Session<SessionData>;
    cookies: Record<string, string>; // all parsed cookies are automatically set from handleSession to avoid overhead
  }

  interface Platform {}

  interface Session extends SessionData {}

  interface Stuff {}
}
```

## Usage

You can find an example implementation here [Example](/example).

The secret is a private key or list of private keys you must pass at runtime, it should be at least `32 characters` long. Use [Password Generator](https://1password.com/password-generator/) to generate strong secrets.

⚠️ You should always store secrets in secret environment variables on your platform.

### Initializing

> src/hooks.ts || src/hooks/index.ts

```js
import { handleSession } from "svelte-kit-cookie-session";

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession({ locals }) {
  return locals.session.data;
}

// You can do it like this, without passing a own handle function
export const handle = handleSession({
  secret: "SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS",
});

// Or pass your handle function as second argument to handleSession

export const handle = handleSession(
  {
    secret: "SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS",
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
  secret: "SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS",
});
export const handle = sequence(sessionHandler, ({ resolve, event }) => {
  // event.locals is populated with the session `event.locals.session`
  // event.locals is also populated with all parsed cookies by handleSession, it would cause overhead to parse them again - `event.locals.cookies`.
  // Do anything you want here
  return resolve(event);
});
```

### ♻️ Secret rotation is supported. It allows you to change the secret used to sign and encrypt sessions while still being able to decrypt sessions that were created with a previous secret.

This is useful if you want to:

- rotate secrets for better security every two (or more, or less) weeks
- change the secret you previously used because it leaked somewhere (😱)

Then you can use multiple secrets:

**Week 1**:

```js
export const handle = handleSession({
  secret: "SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS",
});
```

**Week 2**:

```js
export const handle = handleSession({
  secret: [
    {
      id: 2,
      secret: "SOME_OTHER_COMPLEX_SECRET_AT_LEAST_32_CHARS",
    },
    {
      id: 1,
      secret: "SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS",
    },
  ],
});
```

Notes:

- `id` is required so that we do not have to try every secret in the list when decrypting (the `id` is part of the cookies value).
- The secret used to encrypt session data is always the first one in the array, so when rotating to put a new secret, it must be first in the array list
- Even if you do not provide an array at first, you can always move to array based secret afterwards, knowing that your first password (`string`) was given `{id:1}` automatically.

### Setting The Session

`If the session already exists, the data get's updated but the expiration time stays the same`

`The only way to set the session is executing and awaiting locals.session.set({}) with an object`

> src/routes/login.ts

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function post({ locals, request }) {
  await locals.session.set({ loggedIn: true });

  return {
    body: locals.session.data,
  };
}
```

### Accessing The Session

`After initializing the session, your locals will be filled with a session object, we automatically set the cookie if you set the session via locals.session.set({}) to something and receive the current data via locals.session.data only.`

> src/routes/api/me.ts

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ locals, request }) {
  // Access your data via locals.session.data
  const currentUser = locals.session.data.user;

  return {
    body: {
      me: currentUser,
    },
  };
}
```

### Destroying the Session

> src/routes/logout.ts

```js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function del({ locals }) {
  await locals.session.destroy();

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
export async function put({ locals, request }) {
  await locals.session.refresh(/** Optional new expiration time in days */);

  return {
    body: locals.session.data,
  };
}
```

### Refresh the session expiration on every request `Rolling` -> default is false!

You can also specify a percentage from 1 to 100 which refreshes the session when a percentage of the expiration date is met.

> Note this currently only fires if a session is already existing

```js
handleSession({
  rolling: true, // or 1-100 for percentage o the expiry date met,
});
```

### Express/Connect Integration

This library can integrate with express, polka or any other connect compatible middleware layer.

**Please make sure to polyfill the webcrypto module on globalThis if you're doing so!**

```ts
import express from "express";
import { sessionMiddleware } from "svelte-kit-cookie-session";

const app = express();

app.use(
  sessionMiddleware({ secret: "A_VERY_SECRET_SECRET_AT_LEAST_32_CHARS_LONG" })
);

app.get("/", (req, res) => {
  const sessionData = req.session.data;
  const views = sessionData.views ?? 0;
  const { views } = await req.session.set({ views: views + 1 });
  return res.json({ views });
});

app.listen(4004, () => {
  console.log("Listening on http://localhost:4004");
});
```
