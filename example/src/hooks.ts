import type { GetSession } from "@sveltejs/kit";
import { handleSession } from "$cookieSession/index";

export const getSession: GetSession<Locals> = function ({ locals }) {
  return locals.session.data;
};

export const handle = handleSession(
  {
    secret: "A_VERY_SECRET_SECRET_32_CHARS_LONG",
  },
  async function ({ request, resolve }) {
    const response = await resolve(request);

    if (!response.body || !response.headers) {
      return response;
    }

    if (response.headers["content-type"] === "text/html") {
      let theme = request.locals.session.data?.theme ?? "light";
      response.body = (response.body as string).replace(
        "%session.theme%",
        theme
      );
    }

    return response;
  }
);
