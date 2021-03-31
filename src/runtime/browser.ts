/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { onDestroy } from "svelte";
import { writable } from "svelte/store";
import type { Readable, Writable } from "svelte/store";

let updating = false;
let prevSession: any = {};

let options = {
  endpoint: "/--session--",
  optimistic: true,
};

type HandleSession = (
  method: "POST" | "PUT" | "DELETE",
  value: any,
  opts: { optimistic?: boolean },
  sessionStore: Writable<any>
) => Promise<void>;

type SessionFn = (value?: any, opts?: { optimistic?: boolean }) => void;

export let session: {
  set: SessionFn;
  refresh: SessionFn;
  destroy: SessionFn;
  subscribe: Readable<any>["subscribe"];
} = {
  subscribe: writable<any>({}).subscribe,
  set: (val, opts) => {},
  refresh: (val, opts) => {},
  destroy: (val, opts) => {},
};

const handleSession: HandleSession = async function (
  method,
  value,
  opts,
  sessionStore
) {
  updating = true;
  if (opts.optimistic) {
    sessionStore.set(value);
  }
  const response = await fetch(options.endpoint, {
    method,
    body: method !== "DELETE" ? JSON.stringify(value) : undefined,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-cache",
  });
  if (!response.ok) {
    if (opts.optimistic) {
      sessionStore.set(prevSession);
    }
    updating = false;
    return;
  }
  const data = await response.json();
  updating = false;
  prevSession = data;
  sessionStore.set(method === "DELETE" ? {} : data);
};

export function initializeSession(
  sessionStore: Writable<any>,
  opts?: { optimistic?: boolean; endpoint?: string }
): void {
  if (opts) {
    options = {
      ...options,
      ...opts,
    };
  }

  const unsubscriber = sessionStore.subscribe((val: any) => {
    if (!updating) {
      prevSession = val;
    }
  });

  session = {
    set: (value: any, opts = { optimistic: options.optimistic }) => {
      handleSession("POST", value, opts, sessionStore);
    },
    refresh: (value: any, opts = { optimistic: options.optimistic }) => {
      handleSession("PUT", value, opts, sessionStore);
    },
    destroy: (opts = { optimistic: options.optimistic }) => {
      handleSession("DELETE", null, opts, sessionStore);
    },
    subscribe: sessionStore.subscribe,
  } as const;

  onDestroy(() => {
    unsubscriber();
  });
}
