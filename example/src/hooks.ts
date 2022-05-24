import type { GetSession } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { handleSession } from "svelte-kit-cookie-session";

export const getSession: GetSession = function ({ locals }) {
  return locals.sessionData;
};

const sessionHandler = handleSession({
  secret: "SOME_COMPLEX_SECRET_AT_LEAST_32_CHARS",
});

export const handle = sequence(sessionHandler, async ({ resolve, event }) => {
  const sessionData = await event.locals.session.data();
  event.locals.sessionData = sessionData;
  return await resolve(event, {
    transformPage: ({ html }) => {
      const theme = sessionData?.theme ?? "light";
      return html.replace("%session.theme%", theme);
    },
  });
});
