# Svelte Kit Cookie Session

Real docs will be coming soon, for now look at these examples:

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
