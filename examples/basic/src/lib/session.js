import { session as sessionStore } from "$app/stores";

/** @type {(method: 'POST' | 'PUT' | 'DELETE', value: any) => any} */
function handleSession(method, value) {
  fetch("/session", {
    method,
    body: method !== "DELETE" ? JSON.stringify(value) : undefined,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-cache",
  }).then(() => {});
}

/** @type {{set: (value: any) => void, update: (value: any) => void, destroy: () => void, subscribe: import("svelte/store").Writable['subscribe']}} */
export const session = {
  set: (value) => {
    sessionStore.set(value);
    handleSession("POST", value);
  },
  update: (value) => {
    sessionStore.set(value);
    handleSession("PUT", value);
  },
  destroy: () => {
    sessionStore.set({});
    handleSession("DELETE", value);
  },
  subscribe: sessionStore.subscribe,
};
