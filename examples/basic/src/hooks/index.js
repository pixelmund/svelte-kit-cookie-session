import { initializeSession } from "svelte-kit-cookie-session";

/** @type {import('@sveltejs/kit').GetContext} */
export async function getContext({ headers }) {
  const session = initializeSession(headers, {
    secret: "SOME_SECRET_AT_LEAST_32_CHARACTERS_LONG",
    cookie: { path: "/" },
  });

  return {
    session,
  };
}

/** @type {import('@sveltejs/kit').GetSession} */
export async function getSession({ context }) {
  return context.session.data;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle(request, render) {
  const response = await render(request);

  return {
    ...response,
    headers: {
      ...response.headers,
      ...request.context.session,
    },
  };
}
