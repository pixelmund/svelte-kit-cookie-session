import type { GetSession } from "@sveltejs/kit";
import { handleSession } from "svelte-kit-cookie-session";

export const getSession: GetSession = function ({ locals }) {
  return locals.session.data;
};

export const handle = handleSession(
  {
    secret: "A_VERY_SECRET_SECRET_32_CHARS_LONG",
  },
  async function ({ event, resolve }) {
    const response = await resolve(event, {
      transformPage: ({ html }) => {
        const theme = event.locals.session.data?.theme ?? "light";
        return html.replace("%session.theme%", theme);
      },
    });

    return response;
  }
);
