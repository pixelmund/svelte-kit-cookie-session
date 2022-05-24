import type { RequestHandler } from "@sveltejs/kit";

export const del: RequestHandler = async ({ locals }) => {
  // Destroy the session and cookie
  await locals.session.destroy();

  return { body: { ok: true } };
};

export const post: RequestHandler = async ({ locals }) => {
  const sessionData = locals.sessionData;

  // Use the current session theme or default to light
  let theme = sessionData?.theme ?? "light";

  // Toggle the theme
  theme = theme === "light" ? "dark" : "light";

  return { body: { ...(await locals.session.data({ theme })) } };
};
