import { test } from "uvu";
import * as assert from "uvu/assert";
import { webcrypto } from "crypto";
// @ts-expect-error
globalThis.crypto = webcrypto;

import { cookieSession } from "../../src/index.js";

const emptyHeaders = "";
const SECRET = "SOME_SECRET_VALUE";

const initialData = {
  username: "patrick",
  email: "patrick@patrick.com",
  theme: "light",
  lang: "de",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getCookieValue = (cookie: string) => {
  return cookie.split(";")[0].trim();
};

test("cookieSession should initialize the session as an object", async () => {
  const { session } = (await cookieSession(emptyHeaders, {
    secret: SECRET,
  })) as any;

  assert.type(
    session,
    "object",
    "Session should be not undefined and an object"
  );
});

test("session.data(data) should be set correctly", async () => {
  const { session } = (await cookieSession(emptyHeaders, {
    secret: SECRET,
  })) as any;
  await session.data(initialData);
  const sessionData = await session.data();
  assert.equal(
    {
      username: sessionData.username,
      email: sessionData.email,
      theme: sessionData.theme,
      lang: sessionData.lang,
    },
    initialData,
    "Data should be set correctly"
  );
});

test("session.data(data) should set the set-cookie Header", async () => {
  const { session } = (await cookieSession(emptyHeaders, {
    secret: SECRET,
  })) as any;
  assert.equal(session["set-cookie"], undefined);
  await session.data(initialData);
  assert.type(session["set-cookie"], "string");
});

test("session.refresh() should refresh the session expiration time", async () => {
  const { session } = (await cookieSession(emptyHeaders, {
    secret: SECRET,
  })) as any;

  await session.data(initialData);
  const sessionData = await session.data();

  await sleep(100);

  session.refresh();

  if (sessionData.expires === session.data.expires) {
    throw new Error("Expiration date should be refreshed");
  }
});

test("setting rolling should refresh the session every time", async () => {
  const { session: newSession } = await cookieSession(emptyHeaders, {
    secret: SECRET,
    rolling: true,
  });
  await newSession.data(initialData);
  const newSessionData = await newSession.data();

  const cookie = getCookieValue(newSession["set-cookie"]);

  await sleep(4000);

  const { session: sessionWithInitialCookie } = await cookieSession(cookie, {
    secret: SECRET,
    rolling: true,
  });

  const sessionData = await sessionWithInitialCookie.data();

  if (
    new Date(newSessionData.expires).getTime() ===
    new Date(sessionData.expires).getTime()
  ) {
    throw new Error("Expiration date should be refreshed");
  }
});

test("setting rolling should refresh the session if a certain percentage of the expiry date is met", async () => {
  const { session: newSession } = await cookieSession(emptyHeaders, {
    secret: SECRET,
    expires: 1,
  });
  await newSession.data(initialData);
  const newSessionData = await newSession.data();

  const cookie = getCookieValue(newSession["set-cookie"]);

  await sleep(5000);

  const { session: sessionWithInitialCookie } = await cookieSession(cookie, {
    secret: SECRET,
    expires: 1,
    rolling: 99.9999999999,
  });

  const sessionData = await sessionWithInitialCookie.data();

  if (
    new Date(newSessionData.expires).getTime() ===
    new Date(sessionData.expires).getTime()
  ) {
    throw new Error("Expiration date should be refreshed");
  }
});

test("session.destroy() should delete the session cookie and data", async () => {
  const { session } = await cookieSession(emptyHeaders, { secret: SECRET });
  await session.data(initialData);

  const cookieString = session["set-cookie"];

  await session.destroy();

  const afterCookieString = session["set-cookie"];

  if (afterCookieString === cookieString) {
    throw new Error("Destroy cookie not set correctly");
  }
});

test("Session should be initialized with the same data from a given session cookie header", async () => {
  const { session: newSession } = await cookieSession(emptyHeaders, {
    secret: SECRET,
  });
  await newSession.data(initialData);

  const cookie = getCookieValue(newSession["set-cookie"]);

  const { session: sessionWithInitialCookie } = await cookieSession(cookie, {
    secret: SECRET,
  });

  const sessionData = await sessionWithInitialCookie.data();

  assert.equal(
    {
      username: sessionData.username,
      email: sessionData.email,
      theme: sessionData.theme,
      lang: sessionData.lang,
    },
    initialData,
    "Data should be set correctly"
  );
});

test("if the session exists setting session.data should update the data but keep the expiration date", async () => {
  const { session: oldSession } = await cookieSession(emptyHeaders, {
    secret: SECRET,
  });

  const olsSessionData = await oldSession.data(initialData);
  const cookie = getCookieValue(oldSession["set-cookie"]);

  await sleep(1500);

  const { session: sessionWithInitialCookie } = await cookieSession(cookie, {
    secret: SECRET,
  });

  await sessionWithInitialCookie.data({
    ...initialData,
    ...(await sessionWithInitialCookie.data()),
    username: "mike",
  });

  const sessionData = await sessionWithInitialCookie.data();

  assert.equal(
    {
      username: sessionData.username,
      email: sessionData.email,
      theme: sessionData.theme,
      lang: sessionData.lang,
    },
    { ...initialData, username: "mike" },
    "Data should be set correctly"
  );

  const initialExpires = new Date(olsSessionData.expires).getTime();
  const afterExpires = new Date(sessionData.expires).getTime();

  if (afterExpires >= initialExpires - 2000) {
  } else {
    throw new Error("Expires should not change");
  }
  if (afterExpires < initialExpires + 2000) {
  } else {
    throw new Error("Expires should not change");
  }

  const oldMaxAge = oldSession["set-cookie"]
    .split(";")[1]
    .trim()
    .replace("Max-Age=", "");
  const newMaxAge = sessionWithInitialCookie["set-cookie"]
    .split(";")[1]
    .trim()
    .replace("Max-Age=", "");

  if (newMaxAge < oldMaxAge) {
    // OK
  } else {
    throw new Error(
      "Session cookie should have the correct max age after updating"
    );
  }
});

test("Session should only decrypt data with the same secret and throw an error otherwise", async () => {
  const { session: newSession } = (await cookieSession(emptyHeaders, {
    secret: SECRET,
  })) as any;

  await newSession.data(initialData);

  const cookie = getCookieValue(newSession["set-cookie"]);

  const { session: sessionWithWrongSecret } = await cookieSession(cookie, {
    secret: "zL9X16gHNCt1uRuopnJuanfznf0ziczP",
  });

  await sessionWithWrongSecret.data();

  const wrongCookie = getCookieValue(sessionWithWrongSecret["set-cookie"]);
  assert.equal(wrongCookie, "kit.session=0");
});

test("Session should handle password rotation", async () => {
  const { session: newSession } = await cookieSession(emptyHeaders, {
    secret: SECRET,
  });

  await newSession.data(initialData);

  const initialCookie = getCookieValue(newSession["set-cookie"]);

  const { session: sessionWithNewSecret } = await cookieSession(initialCookie, {
    secret: [
      { id: 2, secret: "JmLy4vMnwmQ75zhSJPc7Ud6U0anKnDZZ" },
      { id: 1, secret: SECRET },
    ],
  });

  const sessionWithNewSecretData = await sessionWithNewSecret.data();

  assert.equal(
    {
      username: initialData.username,
    },
    {
      username: sessionWithNewSecretData.username,
    },
    "Password rotated secrets should result in the same session data"
  );

  assert.not.equal(
    initialCookie,
    getCookieValue(sessionWithNewSecret["set-cookie"]),
    "Password rotated session should re encrypt the data/cookie"
  );

  const nextCookie = getCookieValue(sessionWithNewSecret["set-cookie"]);

  const { session: sessionWithNewestSecret } = await cookieSession(nextCookie, {
    secret: [
      { id: 3, secret: "8AcoepoH61eK5ooJwHWnRNLK5ZAJDCku" },
      { id: 2, secret: "JmLy4vMnwmQ75zhSJPc7Ud6U0anKnDZZ" },
      { id: 1, secret: SECRET },
    ],
  });

  const sessionWithNewestSecretData = await sessionWithNewestSecret.data();

  assert.equal(
    {
      username: initialData.username,
    },
    {
      username: sessionWithNewestSecretData.username,
    },
    "Password rotated secrets should result in the same session data"
  );

  assert.not.equal(
    getCookieValue(sessionWithNewSecret["set-cookie"]),
    getCookieValue(sessionWithNewestSecret["set-cookie"]),
    "Password rotated session should re encrypt the data/cookie"
  );
});

test("Session should be deleted if used secret id is not found", async () => {
  const { session: newSession } = await cookieSession("", { secret: SECRET });

  await newSession.data(initialData);

  const initialCookie = getCookieValue(newSession["set-cookie"]);

  const { session: sessionWithNewSecret } = await cookieSession(initialCookie, {
    secret: [{ id: 2, secret: "LaOF8ZZVl453orCQpItURpuksdLlASAF" }],
  });

  await sessionWithNewSecret.data();

  const deletedCookie = getCookieValue(sessionWithNewSecret["set-cookie"]);

  assert.equal(deletedCookie, "kit.session=0", "Cookie should be deleted");
});

const BINARY_SECRET = new Uint8Array(32);

test("Session should be initialized with a BinaryLike secret", async () => {
  const { session: newSession } = await cookieSession("", {
    secret: BINARY_SECRET,
  });

  await newSession.data(initialData);

  const cookie = getCookieValue(newSession["set-cookie"]);

  const { session: sessionWithInitialCookie } = await cookieSession(cookie, {
    secret: BINARY_SECRET,
  });

  const sessionData = await sessionWithInitialCookie.data();
  assert.equal(
    {
      username: sessionData.username,
      email: sessionData.email,
      theme: sessionData.theme,
      lang: sessionData.lang,
    },
    initialData,
    "Data should be set correctly"
  );
});

test.run();
