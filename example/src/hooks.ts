import type { GetSession } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { handleSession } from "svelte-kit-cookie-session";

export const getSession: GetSession = function ({ locals }) {
  return locals.session.data;
};

const sessionHandler = handleSession({
  secret: "SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS",
});

export const handle = sequence(sessionHandler, async ({ resolve, event }) => {
  return await resolve(event, {
    transformPage: ({ html }) => {
      const theme = event.locals.session.data?.theme ?? "light";
      return html.replace("%session.theme%", theme);
    },
  });
});
