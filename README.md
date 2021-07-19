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

The secret is a private key or list of private keys you must pass at runtime, it has to be `32 characters` long. Use [Password Generator](https://1password.com/password-generator/) to generate strong secrets.

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

### ♻️ Secret rotation is supported. It allows you to change the secret used to sign and encrypt sessions while still being able to decrypt sessions that were created with a previous secret.

This is useful if you want to:

- rotate secrets for better security every two (or more, or less) weeks
- change the secret you previously used because it leaked somewhere (😱)

Then you can use multiple secrets:

**Week 1**:

```js
export const handle = handleSession({
  secret:
    "SOME_SECRET_SECRET_32_CHARS_LONG",
});
```

**Week 2**:

```js
export const handle = handleSession({
  secret: [
    {
      id: 2,
      secret: "2Fvqq8rvH7n5B8tDFfnPk9uETJrvJ0Eu",
    },
    {
      id: 1,
      secret: "SOME_SECRET_SECRET_32_CHARS_LONG",
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
