/// <reference types="@sveltejs/kit" />

interface Locals {
  session: import("svelte-kit-cookie-session").Session<{
    theme: "dark" | "light";
  }>;
}

type RequestHandler<Body = unknown> = import("@sveltejs/kit").RequestHandler<
  Locals,
  Body
>;
