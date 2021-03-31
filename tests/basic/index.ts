import { test } from "uvu";
import * as assert from "uvu/assert";
import { initializeSession } from "../../src";

const emptyHeaders = {};
const SECRET = "A_VERY_SECRET_SECRET_32_CHARS_LONG";

const initialData = {
  username: "patrick",
  email: "patrick@patrick.com",
  theme: "light",
  lang: "de",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("initializeSession should initialize the session as an object", () => {
  const session = initializeSession(emptyHeaders, {
    secret: SECRET,
  }) as any;

  assert.type(
    session,
    "object",
    "Session should be not undefined and an object"
  );
});

test("session.data = data should be set correctly", () => {
  const session = initializeSession(emptyHeaders, {
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
  const session = initializeSession(emptyHeaders, {
    secret: SECRET,
  }) as any;
  assert.equal(session["set-cookie"], "");
  session.data = initialData;
  assert.type(session["set-cookie"], "string");
});

test("session.refresh = true should refresh the session expiration time", async () => {
  const session = initializeSession({}, { secret: SECRET }) as any;

  session.data = initialData;
  const sessionData = session.data;

  await sleep(100);

  session.refresh = true;

  if (sessionData.expires === session.data.expires) {
    throw new Error("Expiration date should be refreshed");
  }
});

test("session.destroy = true should delete the session cookie and data", () => {
  const session = initializeSession({}, { secret: SECRET }) as any;
  session.data = initialData;

  const cookieString = session["set-cookie"];

  session.destroy = true;

  if (session["set-cookie"] === cookieString) {
    throw new Error("Destroy cookie not set correctly");
  }
});

test("Session should be initialized with the same data from a given session cookie header", () => {
  const newSession = initializeSession({}, { secret: SECRET }) as any;

  newSession.data = initialData;
  const cookie = newSession["set-cookie"].split(";")[0].trim();

  const sessionWithInitialCookie = initializeSession(
    { Cookie: cookie },
    { secret: SECRET }
  );

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

test("Session should only decrypt data with the same secret and throw an error otherwise", () => {
  const newSession = initializeSession({}, { secret: SECRET }) as any;

  newSession.data = initialData;
  const cookie = newSession["set-cookie"].split(";")[0].trim();

  assert.throws(() => {
    const sessionWithWrongSecret = initializeSession(
      { Cookie: cookie },
      { secret: "OTHER_SECRET_THAT_DOESNT_MATCH" }
    );
  });
});

test.run();
