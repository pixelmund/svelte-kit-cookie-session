import { session as sessionStore } from "$app/stores";

/** @type {{set: (value: any) => void, update: (value: any) => void, destroy: () => void, subscribe: import("svelte/store").Writable['subscribe']}} */
export const session = {
  set: (value) => {
    sessionStore.set(value);
    (async () => {
      await fetch("/session", {
        method: "POST",
        body: JSON.stringify(value),
        credentials: "include",
        cache: "no-cache",
      });
    })();
  },
  update: (value) => {
    sessionStore.set(value);
    (async () => {
      await fetch("/session", {
        method: "PUT",
        body: JSON.stringify(value),
        credentials: "include",
        cache: "no-cache",
      });
    })();
  },
  destroy: () => {
    (async () => {
      await fetch("/session", {
        method: "DELETE",
        credentials: "include",
        cache: "no-cache",
      });
    })();
    sessionStore.set({});
  },
  subscribe: sessionStore.subscribe,
};
