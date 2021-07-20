import { parse, serialize, daysToMaxage } from "./utils/cookie";
import type { CookieSerializeOptions } from "./utils/cookie";
import { decrypt, encrypt } from "./utils/crypto";

let initialSecret: string;
let encoder: (value: string) => string | undefined;
let decoder: (value: string) => string | undefined;

export interface SessionOptions {
  key?: string;
  secret: string | { id: number; secret: string }[];
  expires?: number;
  rolling?: boolean;
  cookie?: Omit<CookieSerializeOptions, "expires" | "maxAge" | "encode">;
}

export interface Session<SessionType = Record<string, any>> {
  data: SessionType & {
    expires?: Date;
  };
  refresh: (expires_in_days?: number) => boolean;
  destroy: () => boolean;
}

export function initializeSession<SessionType = Record<string, any>>(
  headers: Record<string, string>,
  options: SessionOptions
): Session<SessionType> {
  const key = options.key || "kit.session";
  const expires = daysToMaxage(options.expires ?? 7);

  // Null or Undefined
  if (options.secret == null) {
    throw new Error(
      "Please provide at least one secret"
    );
  }

  const secrets =
    typeof options.secret === "string"
      ? [{ id: 1, secret: options.secret }]
      : options.secret;

  /** This is mainly for testing purposes */
  let changedSecrets: boolean = false;
  if (!initialSecret || initialSecret !== secrets[0].secret) {
    initialSecret = secrets[0].secret;
    changedSecrets = true;
  }
  // Setup de/encoding
  if (!encoder || changedSecrets) {
    encoder = encrypt(secrets[0].secret);
  }
  if (!decoder || changedSecrets) {
    decoder = decrypt(secrets[0].secret);
  }

  const sessionOptions = {
    key,
    expires,
    cookie: options.cookie || {},
  };

  //@ts-ignore That's okay
  sessionOptions.cookie.maxAge = expires;

  // Set sane default cookie optioons
  if (!sessionOptions.cookie.httpOnly) {
    sessionOptions.cookie.httpOnly = true;
  }
  if (!sessionOptions.cookie.sameSite) {
    sessionOptions.cookie.sameSite = true;
  }
  if (!sessionOptions.cookie.path) {
    sessionOptions.cookie.path = "/";
  }

  // Parse the cookie header
  const cookies = parse(headers.cookie || headers.Cookie || "", {});

  // Grab the session cookie from the parsed cookies
  let sessionCookie: string = cookies[sessionOptions.key] || "";
  let isInvalidDate: boolean = false;
  let shouldReEncrypt: boolean = false;
  let shouldDestroy: boolean = false;

  let sessionData: (SessionType & { expires?: Date }) | undefined;

  // If we have a session cookie we try to get the id from the cookie value and use it to decode the cookie.
  // If the decodeID is not the first secret in the secrets array we should re encrypt to the newest secret.
  if (sessionCookie.length > 0) {
    // Split the sessionCookie on the &id= field to get the id we used to encrypt the session.
    const [_sessionCookie, id] = sessionCookie.split("&id=");

    const decodeID = id ? Number(id) : 1;

    // Use the id from the cookie or the initial one which is always 1.
    let secret = secrets.find((sec) => sec.id === decodeID);

    // If there is no secret found try the first in the secrets array.
    if (!secret) secret = secrets[0];

    // Set the session cookie without &id=
    sessionCookie = _sessionCookie;

    // If the decodeID unequals the newest secret id in the array, re initialize the decoder.
    if (secrets[0].id !== decodeID) {
      decoder = decrypt(secret.secret);
    }

    // Try to decode with the given sessionCookie and secret
    try {
      const decrypted = decoder(sessionCookie);
      if (decrypted && decrypted.length > 0) {
        sessionData = JSON.parse(decrypted);
        // If the decodeID unequals the newest secret id in the array, we should re-encrypt the session with the newest secret.
        if (secrets[0].id !== decodeID) {
          shouldReEncrypt = true;
        }
      } else {
        shouldDestroy = true;
      }
    } catch (error) {
      shouldDestroy = true;
    }
  }

  // Check if the session is already expired
  if (
    sessionData &&
    sessionData.expires &&
    new Date(sessionData.expires).getTime() < new Date().getTime()
  ) {
    isInvalidDate = true;
  }

  const session: { "set-cookie"?: string } = {};

  // Initialize the session proxy
  const sessionProxy: Session<SessionType> = new Proxy(session, {
    set: function (obj, prop, value) {
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
          (encoder(JSON.stringify(sessionData)) || "") + "&id=" + secrets[0].id,
          sessionOptions.cookie
        );
        obj["set-cookie"] = sessionCookie;
      }
      return true;
    },
    get: function (obj, prop) {
      if (prop === "data") {
        return sessionData && !isInvalidDate ? sessionData : {};
      } else if (prop === "refresh") {
        return (expires_in_days?: number) => {
          if (!sessionData || isInvalidDate) {
            return false;
          }

          let new_expires = daysToMaxage(options.expires ?? 7);

          if (expires_in_days) {
            new_expires = daysToMaxage(expires_in_days);
          }

          sessionData = {
            ...sessionData,
            expires: new Date(Date.now() + new_expires * 1000),
          };

          sessionCookie = serialize(
            sessionOptions.key,
            (encoder(JSON.stringify(sessionData)) || "") +
              "&id=" +
              secrets[0].id,
            {
              ...sessionOptions.cookie,
              maxAge: new_expires,
            }
          );

          obj["set-cookie"] = sessionCookie;
          return true;
        };
      } else if (prop === "destroy") {
        return () => {
          if (sessionCookie.length === 0) return false;
          sessionData = undefined;
          sessionCookie = serialize(sessionOptions.key, "0", {
            ...sessionOptions.cookie,
            maxAge: undefined,
            expires: new Date(Date.now() - 360000000),
          });
          obj["set-cookie"] = sessionCookie;
          return true;
        };
      }
      return (obj as any)[prop];
    },
  }) as any;

  // If we have an invalid date or shouldDestroy is set to true we destroy the session.
  if (isInvalidDate || shouldDestroy) {
    sessionProxy.destroy();
  }
  // If rolling is activated and the session exists we refresh the session on every request.
  if (options?.rolling && !isInvalidDate && sessionData) {
    sessionProxy.refresh();
  }
  // Check if we have to re encrypt the data
  if (shouldReEncrypt && sessionData) {
    sessionProxy.data = { ...sessionData };
  }

  return sessionProxy;
}
