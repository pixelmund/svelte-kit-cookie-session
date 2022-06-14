import { test } from "uvu";
import { webcrypto } from "crypto";
// @ts-expect-error
globalThis.crypto = webcrypto;
import { cookieSession } from "../../src/index.js";

const emptyHeaders = "";
const SECRET = "HAvKWScWHsJQBr6uR9bdrSYiso1AOxKB";

const getCookieValue = (cookie: string) => cookie.split(";")[0].trim();

const initialData = {
  username: "patrick",
  email: "patrick@patrick.com",
  theme: "light",
  lang: "de",
};

test("initialize and set session benchmark", async () => {
  console.time("init-set-session");

  for (let index = 0; index < 1000; index++) {
    const { session } = await cookieSession(emptyHeaders, {
      secret: SECRET,
    }) as any;
    await session.set(initialData);
  }

  console.timeEnd("init-set-session");
});

test("initialize and and dont get session data benchmark", async () => {
  const { session: newSession } = await cookieSession(emptyHeaders, {
    secret: SECRET,
  }) as any;

  await newSession.set(initialData);
  const cookie = getCookieValue(newSession["set-cookie"]);

  console.time("init-session");

  for (let index = 0; index < 1000; index++) {
    const sessionWithInitialCookie = await cookieSession(cookie, { secret: SECRET });
  }
  console.timeEnd("init-session");
});

test("initialize and get session data benchmark", async () => {
  const { session: newSession } = await cookieSession(emptyHeaders, {
    secret: SECRET,
  }) as any;

  await newSession.set(initialData);
  const cookie = getCookieValue(newSession["set-cookie"]);

  console.time("decode-session");

  for (let index = 0; index < 1000; index++) {
    const { session: sessionWithInitialCookie } = await cookieSession(cookie, {
      secret: SECRET,
    });
    const sessionData = sessionWithInitialCookie.data;
  }
  console.timeEnd("decode-session");
});
