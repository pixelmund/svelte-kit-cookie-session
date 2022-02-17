import type { RequestHandler } from "@sveltejs/kit";

export const del: RequestHandler = ({ locals }) => {
  // Destroy the session and cookie
  locals.session.destroy();

  return { body: { ok: true } };
};

export const post: RequestHandler = ({ locals }) => {
  // Use the current session theme or default to light
  let theme = locals.session.data?.theme ?? "light";

  // Toggle the theme
  theme = theme === "light" ? "dark" : "light";

  // Set the session, updates current session if already exists
  locals.session.data = { theme };

  return { body: { ...locals.session.data } };
};
