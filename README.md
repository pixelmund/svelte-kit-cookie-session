# Svelte Kit Cookie Session

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

You can find real-world examples in the [examples folder](./examples/).

The secret is a private key you must pass at runtime, it has to be at least 32 characters long. Use [Password Generator](https://1password.com/password-generator/) to generate strong passwords.

⚠️ You should always store passwords in secret environment variables on your platform.

### Initializing

> src/hooks.ts || src/hooks/index.ts

```ts
import { initializeSession } from "svelte-kit-cookie-session";
import type { GetContext, GetSession, Handle } from "@sveltejs/kit";

export const getContext: GetContext = async function ({ headers }) {
  const session = initializeSession(headers, {
    secret: "SOME_SECRET_AT_LEAST_32_CHARACTERS_LONG",
    cookie: { path: "/" },
  });

  return {
    session,
    db,
  };
};

export const getSession: GetSession<{}> = async function ({ context }) {
  return context.session.data;
};

export const handle: Handle<{}> = async function (request, render) {
  const response = await render(request);

  return {
    ...response,
    headers: {
      ...response.headers,
      ...(request.context as { session: { "Set-Cookie": string } }).session,
    },
  };
};
```

### Setting The Session

> src/routes/login.ts

```ts
import type { RequestHandler } from "@sveltejs/kit";

export const post: RequestHandler = function ({ context }) {
  context.session.data = {
    user: "test",
    email: "test@test.com",
  };

  /** Session Cookie will by encrypted and automatically set onto the Set-Cookie Header, thanks to JS Proxies */

  return {
    body: {
      success: true,
    },
  };
};
```

### Destroying the Session

> src/routes/logout.ts

```ts
import type { RequestHandler } from "@sveltejs/kit";

export const post: RequestHandler = function ({ context }) {
  context.session.destroy = true;

  /** Session Cookie will by destroyed */

  return {
    body: {
      success: true,
    },
  };
};
```

### Refreshing the Session with new Data but keep the expiration date

> src/routes/refresh.ts

```ts
import type { RequestHandler } from "@sveltejs/kit";

export const get: RequestHandler = async function ({ context }) {
  const session = context.session.data;

  if (!session?.theme) {
    (context.session as { data: { theme: string } }).data = { theme: "dark" };
  }

  if (session.theme === "dark") {
    session.theme = "light";
  } else {
    session.theme = "dark";
  }

  context.session.data = session;
  context.session.refresh = true;

  return {
    body: {
      theme: context.session.data.theme,
    },
  };
};
```
