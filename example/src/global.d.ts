/// <reference types="@sveltejs/kit" />

interface SessionData {
  theme: string;
}

// See https://kit.svelte.dev/docs#typescript
// for information about these interfaces
declare namespace App {
  interface Locals {
    session: import("svelte-kit-cookie-session").Session<SessionData>;
    cookies: Record<string, string>;
  }

  interface Platform {}

  interface Session extends SessionData {}

  interface Stuff {}
}
