import { daysToMaxage, parse, serialize } from "./utils/cookie";
import { decrypt, encrypt } from "salteen";
import type { CookieSerializeOptions } from "./utils/cookie";

let initialSecret: string;
let encoder: (value: string) => string | undefined;
let decoder: (value: string) => string | undefined;

interface SessionOptions {
  key?: string;
  secret: string;
  expires?: number;
  cookie?: Omit<CookieSerializeOptions, "expires" | "maxAge" | "encode">;
}

export type PublicSession<SessionType = any> = {
  data: SessionType & { expires?: Date };
  refresh: true;
  destroy: true;
};

export function initializeSession<SessionType = any>(
  headers: Record<string, string>,
  options: SessionOptions
): PublicSession<SessionType> {
  const key = options.key || "kit.session";
  const expires = options.expires || daysToMaxage(7);

  //** This is mainly for testing purposes */
  let changedSecrets: boolean = false;
  if (!initialSecret || initialSecret !== options.secret) {
    initialSecret = options.secret;
    changedSecrets = true;
  }
  if (!encoder || changedSecrets) {
    encoder = encrypt(options.secret);
  }
  if (!decoder || changedSecrets) {
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
  if (!sessionOptions.cookie.path) {
    sessionOptions.cookie.path = "/";
  }

  const cookies = parse(headers.cookie || headers.Cookie || "", {});

  let sessionCookie: string = cookies[sessionOptions.key] || "";
  let isInvalidDate: boolean = false;

  let sessionData: (SessionType & { expires?: Date }) | undefined;

  if (sessionCookie.length > 0) {
    const decrypted = decoder(sessionCookie);
    if (decrypted && decrypted.length > 0) {
      try {
        sessionData = JSON.parse(decrypted);
      } catch (error) {
        throw new Error("Malformed Data or Wrong Key used");
      }
    }
  }

  if (
    sessionData &&
    sessionData.expires &&
    new Date(sessionData.expires).getTime() < new Date().getTime()
  ) {
    isInvalidDate = true;
  }

  const session: { "set-cookie"?: string } = {};

  const sessionProxy = new Proxy(session, {
    set: function (obj, prop, value) {
      if (prop === "refresh") {
        if (!sessionData || isInvalidDate) {
          return true;
        }
        sessionData = {
          ...sessionData,
          expires: new Date(Date.now() + expires * 1000),
        };
        sessionCookie = serialize(
          sessionOptions.key,
          encoder(JSON.stringify(sessionData)),
          sessionOptions.cookie
        );
        obj["set-cookie"] = sessionCookie;
        return true;
      }
      if (prop === "destroy") {
        if (sessionCookie.length === 0) return true;
        sessionData = undefined;
        sessionCookie = serialize(sessionOptions.key, "0", {
          ...sessionOptions.cookie,
          maxAge: undefined,
          expires: new Date(Date.now() - 360000000),
        });
        obj["set-cookie"] = sessionCookie;
        return true;
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
          encoder(JSON.stringify(sessionData)),
          sessionOptions.cookie
        );
        obj["set-cookie"] = sessionCookie;
      }
      return true;
    },
    get: function (obj, prop) {
      if (prop === "data") {
        return sessionData && !isInvalidDate ? sessionData : {};
      }
      return (obj as any)[prop];
    },
  }) as any;

  if (isInvalidDate) {
    sessionProxy.destroy = true;
  }

  return sessionProxy;
}
