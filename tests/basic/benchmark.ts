import { test } from "uvu";
import { initializeSession } from "../../src";

const emptyHeaders = {};
const SECRET = "HAvKWScWHsJQBr6uR9bdrSYiso1AOxKB";

const getCookieValue = (cookie: string) => cookie.split(";")[0].trim();

const initialData = {
  username: "patrick",
  email: "patrick@patrick.com",
  theme: "light",
  lang: "de",
};

test("initialize and set session benchmark", () => {
  console.time("init-set-session");

  for (let index = 0; index < 1000; index++) {
    const session = initializeSession(emptyHeaders, {
      secret: SECRET,
    }) as any;
    session.data = initialData;
  }

  console.timeEnd("init-set-session");
});

test("initialize and set session benchmark", () => {
  const newSession = initializeSession({}, { secret: SECRET }) as any;

  newSession.data = initialData;
  const cookie = getCookieValue(newSession["set-cookie"]);

  console.time('decode-session')

  for (let index = 0; index < 1000; index++) {
    const sessionWithInitialCookie = initializeSession(
      { Cookie: cookie },
      { secret: SECRET }
    );
  }
  console.timeEnd("decode-session");
});

