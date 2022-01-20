/// <reference types="@sveltejs/kit" />

interface Locals {
  session: import("svelte-kit-cookie-session").Session<{
    theme: "dark" | "light";
  }>;
}

