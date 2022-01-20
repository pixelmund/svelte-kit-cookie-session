import type { GetSession } from "@sveltejs/kit";
import { handleSession } from "svelte-kit-cookie-session";

export const getSession: GetSession<Locals> = function ({ locals }) {
  return locals.session.data;
};

export const handle = handleSession(
  {
    secret: "A_VERY_SECRET_SECRET_32_CHARS_LONG",
  },
  async function ({ event, resolve }) {
    const response = await resolve(event);

    if (!response.body || !response.headers) {
      return response;
    }

    if (response.headers.get('content-type').startsWith('text/html')) {
      let theme = event.locals.session.data?.theme ?? "light";
      const body = await response.text();
      return new Response(body.replace("%session.theme%", theme), response);
    }

    return response;
  }
);
