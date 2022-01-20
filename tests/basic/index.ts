import { test } from "uvu";
import * as assert from "uvu/assert";
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

const getCookieValue = (cookie: string) => cookie.split(";")[0].trim();

test("cookieSession should initialize the session as an object", () => {
  const session = cookieSession(emptyHeaders, {
    secret: SECRET,
  }) as any;

  assert.type(
    session,
    "object",
    "Session should be not undefined and an object"
  );
});

test("session.data = data should be set correctly", () => {
  const session = cookieSession(emptyHeaders, {
    secret: SECRET,
  }) as any;
  session.data = initialData;
  const sessionData = session.data;
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

test("session.data = data should set the set-cookie Header", () => {
  const session = cookieSession(emptyHeaders, {
    secret: SECRET,
  }) as any;
  assert.equal(session["set-cookie"], undefined);
  session.data = initialData;
  assert.type(session["set-cookie"], "string");
});

test("session.refresh() should refresh the session expiration time", async () => {
  const session = cookieSession(emptyHeaders, { secret: SECRET }) as any;

  session.data = initialData;
  const sessionData = session.data;

  await sleep(100);

  session.refresh();

  if (sessionData.expires === session.data.expires) {
    throw new Error("Expiration date should be refreshed");
  }
});

test("session.destroy() should delete the session cookie and data", () => {
  const session = cookieSession(emptyHeaders, { secret: SECRET });
  session.data = initialData;

  const cookieString = session["set-cookie"];
  
  session.destroy();

  const afterCookieString = session["set-cookie"];

  if (afterCookieString === cookieString) {
    throw new Error("Destroy cookie not set correctly");
  }
});

test("Session should be initialized with the same data from a given session cookie header", () => {
  const newSession = cookieSession(emptyHeaders, { secret: SECRET });
  newSession.data = initialData;

  const cookie = getCookieValue(newSession["set-cookie"]);

  const sessionWithInitialCookie = cookieSession(cookie, { secret: SECRET });
  
  const sessionData = sessionWithInitialCookie.data;

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
  const oldSession = cookieSession(emptyHeaders, { secret: SECRET }) as any;

  oldSession.data = initialData;
  const cookie = getCookieValue(oldSession["set-cookie"]);

  await sleep(1500);

  const sessionWithInitialCookie = cookieSession(cookie, { secret: SECRET });

  sessionWithInitialCookie.data = {
    ...initialData,
    ...sessionWithInitialCookie.data,
    username: "mike",
  };

  const sessionData = sessionWithInitialCookie.data;

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

  if (
    new Date(oldSession.data.expires).getTime() !==
    new Date(sessionData.expires).getTime()
  ) {
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

test("Session should only decrypt data with the same secret and throw an error otherwise", () => {
  const newSession = cookieSession(emptyHeaders, { secret: SECRET }) as any;

  newSession.data = initialData;

  const cookie = getCookieValue(newSession["set-cookie"]);

  const sessionWithWrongSecret = cookieSession(cookie, {
    secret: "zL9X16gHNCt1uRuopnJuanfznf0ziczP",
  });

  sessionWithWrongSecret.data;

  const wrongCookie = getCookieValue(sessionWithWrongSecret["set-cookie"]);
  assert.equal(wrongCookie, "kit.session=0");
});

test("Session should handle password rotation", () => {
  
  const newSession = cookieSession(emptyHeaders, { secret: SECRET });

  newSession.data = initialData;

  const initialCookie = getCookieValue(newSession["set-cookie"]);

  const sessionWithNewSecret = cookieSession(initialCookie, {
    secret: [
      { id: 2, secret: "JmLy4vMnwmQ75zhSJPc7Ud6U0anKnDZZ" },
      { id: 1, secret: SECRET },
    ],
  });

  sessionWithNewSecret.data;

  assert.equal(
    {
      username: initialData.username,
    },
    {
      username: sessionWithNewSecret.data.username
    },
    "Password rotated secrets should result in the same session data"
  );

  assert.not.equal(
    initialCookie,
    getCookieValue(sessionWithNewSecret["set-cookie"]),
    "Password rotated session should re encrypt the data/cookie"
  );

  const nextCookie = getCookieValue(sessionWithNewSecret["set-cookie"]);

  const sessionWithNewestSecret = cookieSession(nextCookie, {
    secret: [
      { id: 3, secret: "8AcoepoH61eK5ooJwHWnRNLK5ZAJDCku" },
      { id: 2, secret: "JmLy4vMnwmQ75zhSJPc7Ud6U0anKnDZZ" },
      { id: 1, secret: SECRET },
    ],
  });

  sessionWithNewestSecret.data;

  assert.equal(
    {
      username: initialData.username,
    },
    {
      username: sessionWithNewestSecret.data.username
    },
    "Password rotated secrets should result in the same session data"
  );

  assert.not.equal(
    getCookieValue(sessionWithNewSecret["set-cookie"]),
    getCookieValue(sessionWithNewestSecret["set-cookie"]),
    "Password rotated session should re encrypt the data/cookie"
  );
});

test("Session should be deleted if used secret id is not found", () => {
  const newSession = cookieSession("", { secret: SECRET });

  newSession.data = initialData;

  const initialCookie = getCookieValue(newSession["set-cookie"]);

  const sessionWithNewSecret = cookieSession(initialCookie, {
    secret: [{ id: 2, secret: "LaOF8ZZVl453orCQpItURpuksdLlASAF" }],
  });

  sessionWithNewSecret.data;

  const deletedCookie = getCookieValue(sessionWithNewSecret["set-cookie"]);

  assert.equal(deletedCookie, "kit.session=0", "Cookie should be deleted");
});

const BINARY_SECRET = new Uint8Array(32);

test("Session should be initialized with a BinaryLike secret", () => {
  const newSession = cookieSession("", { secret: BINARY_SECRET });

  newSession.data = initialData;

  const cookie = getCookieValue(newSession["set-cookie"]);

  const sessionWithInitialCookie = cookieSession(cookie, {
    secret: BINARY_SECRET,
  });

  const sessionData = sessionWithInitialCookie.data;
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
