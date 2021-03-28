import { daysToMaxage, parse, serialize } from "./utils/cookie";
import { decrypt, encrypt } from "salteen";
import type { CookieSerializeOptions } from "./utils/cookie";

let encoder: (value: string) => string | undefined;
let decoder: (value: string) => string | undefined;

export { daysToMaxage } from "./utils/cookie";

interface SessionOptions {
  key?: string;
  secret: string;
  expires?: number;
  cookie?: Omit<CookieSerializeOptions, "expires" | "maxAge" | "encode">;
}

export function initializeSession<SessionType = any>(
  headers: Record<string, string>,
  options: SessionOptions
): { data?: SessionType & { expires: Date } } {
  const key = options.key || "kit.session";
  const expires = options.expires || daysToMaxage(7);

  if (!encoder) {
    encoder = encrypt(options.secret);
  }
  if (!decoder) {
    decoder = decrypt(options.secret);
  }

  const sessionOptions = {
    key,
    expires,
    cookie: options.cookie || {},
  };

  //@ts-ignore That's okay
  sessionOptions.cookie.maxAge = expires;

  if (!sessionOptions.cookie.httpOnly) {
    sessionOptions.cookie.httpOnly = true;
  }
  if (!sessionOptions.cookie.sameSite) {
    sessionOptions.cookie.sameSite = true;
  }

  const cookies = parse(headers.cookie || "", {});
  let sessionCookie: string = cookies[sessionOptions.key] || "";

  let sessionData: SessionType & { expires?: Date };

  if (sessionCookie.length > 0) {
    const decrypted = decoder(sessionCookie);
    if (decrypted && decrypted.length > 0) {
      try {
        sessionData = JSON.parse(decrypted);
      } catch (error) {}
    }
  }

  const session = {
    "Set-Cookie": "",
  };

  return new Proxy(session, {
    set: function (obj, prop, value) {
      if (prop === "refresh") {
        if (!sessionData) return false;
        sessionCookie = serialize(
          sessionOptions.key,
          encrypt(
            JSON.stringify({
              ...sessionData,
              expires: new Date(Date.now() + expires * 1000),
            })
          ),
          sessionOptions.cookie
        );
        obj["Set-Cookie"] = sessionCookie;
        return true;
      }
      if (prop === "destroy") {
        if (sessionCookie.length === 0) return false;
        obj["Set-Cookie"] = serialize(sessionOptions.key, "0", {
          ...sessionOptions.cookie,
          maxAge: undefined,
          expires: new Date(Date.now() - 360000000),
        });
      }
      if (prop === "data") {
        if (sessionData && sessionData.expires) {
          const currentDate = new Date();
          if (typeof sessionData.expires === "string") {
            sessionData.expires = new Date(sessionData.expires);
          }
          const exp =
            sessionData.expires.getTime() / 1000 - currentDate.getTime() / 1000;
          (sessionOptions.cookie as any).maxAge = exp;
        }
        sessionData = {
          ...value,
          expires:
            sessionData?.expires || new Date(Date.now() + expires * 1000),
        };
        sessionCookie = serialize(
          sessionOptions.key,
          encrypt(JSON.stringify(sessionData)),
          sessionOptions.cookie
        );
        obj["Set-Cookie"] = sessionCookie;
      }
      return true;
    },
    get: function (obj, prop) {
      if (prop === "data") {
        return sessionData ? sessionData : {};
      }
      return (obj as any)[prop];
    },
  }) as any;
}
