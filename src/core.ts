import { decrypt, encrypt } from "./crypto.js";
import { parse, serialize } from "./cookie.js";
import type { Session, SessionOptions } from "./types";
import { daysToMaxage, maxAgeToDateOfExpiry } from "./utils.js";
import type { BinaryLike } from "crypto";

let initialSecret: BinaryLike;
let encoder: (value: string) => string | undefined;
let decoder: (value: string) => string | undefined;

export default function initializeSession<SessionType = Record<string, any>>(
  headersOrCookieString: Headers | string,
  userOptions: SessionOptions
) {
  if (userOptions.secret == null) {
    throw new Error("Please provide at least one secret");
  }

  const isSecureCookie =
    typeof process !== "undefined"
      ? process.env.NODE_ENV !== "development"
      : false;

  const options = {
    key: userOptions.key ?? "kit.session",
    expiresInDays: userOptions.expires ?? 7,
    cookie: {
      maxAge: daysToMaxage(userOptions.expires ?? 7),
      httpOnly: userOptions?.cookie?.httpOnly ?? true,
      sameSite: userOptions?.cookie?.sameSite ?? true,
      path: userOptions?.cookie?.path ?? "/",
      domain: userOptions?.cookie?.domain ?? undefined,
      secure: userOptions?.cookie?.secure ?? isSecureCookie,
    },
    rolling: userOptions?.rolling ?? false,
    secrets: Array.isArray(userOptions.secret)
      ? userOptions.secret
      : [{ id: 1, secret: userOptions.secret }],
  };

  /** This is mainly for testing purposes */
  let changedSecrets: boolean = false;
  if (!initialSecret || initialSecret !== options.secrets[0].secret) {
    initialSecret = options.secrets[0].secret;
    changedSecrets = true;
  }
  // Setup de/encoding
  if (!encoder || changedSecrets) {
    encoder = encrypt(options.secrets[0].secret);
  }
  if (!decoder || changedSecrets) {
    decoder = decrypt(options.secrets[0].secret);
  }

  const cookies = parse(
    typeof headersOrCookieString === "string"
      ? headersOrCookieString
      : headersOrCookieString.get("cookie") || "",
    {}
  );

  let sessionCookie: string = cookies[options.key] || "";

  const sessionState = {
    invalidDate: false,
    shouldReEncrypt: false,
    shouldDestroy: false,
    shouldSendToClient: false,
  };

  type SessionDataWithExpires = SessionType & { expires?: Date };

  let sessionData: SessionDataWithExpires | undefined;
  let checkedExpiry = false;

  function checkSessionExpiry() {
    if (
      sessionData &&
      sessionData.expires &&
      new Date(sessionData.expires).getTime() < new Date().getTime()
    ) {
      sessionState.invalidDate = true;
    }
  }

  function getSessionData() {
    if (sessionData) {
      if (!checkedExpiry) {
        checkedExpiry = true;
        checkSessionExpiry();
      }

      return sessionData;
    }

    const [_sessionCookie, secret_id] = sessionCookie.split("&id=");

    // If we have a session cookie we try to get the id from the cookie value and use it to decode the cookie.
    // If the decodeID is not the first secret in the secrets array we should re encrypt to the newest secret.
    if (_sessionCookie.length > 0) {
      // Split the sessionCookie on the &id= field to get the id we used to encrypt the session.
      const decodeID = secret_id ? Number(secret_id) : 1;

      // Use the id from the cookie or the initial one which is always 1.
      let secret = options.secrets.find((sec) => sec.id === decodeID);

      // If there is no secret found try the first in the secrets array.
      if (!secret) secret = options.secrets[0];

      // Set the session cookie without &id=
      sessionCookie = _sessionCookie;

      // If the decodeID unequals the newest secret id in the array, re initialize the decoder.
      if (options.secrets[0].id !== decodeID) {
        decoder = decrypt(secret.secret);
      }

      // Try to decode with the given sessionCookie and secret
      try {
        const decrypted = decoder(_sessionCookie);
        if (decrypted && decrypted.length > 0) {
          sessionData = JSON.parse(decrypted);
          checkSessionExpiry();
          // If the decodeID unequals the newest secret id in the array, we should re-encrypt the session with the newest secret.
          if (options.secrets[0].id !== decodeID) {
            reEncryptSession();
          }

          return sessionData;
        } else {
          destroySession();
        }
      } catch (error) {
        destroySession();
      }
    }
  }

  function makeCookie(maxAge: number, destroy: boolean = false) {
    return serialize(
      options.key,
      destroy
        ? "0"
        : encoder(JSON.stringify(sessionData) || "") +
            "&id=" +
            options.secrets[0].id,
      {
        ...options.cookie,
        maxAge: destroy ? undefined : maxAge,
        expires: destroy ? new Date(Date.now() - 360000000) : undefined,
      }
    );
  }

  let setCookie: string | undefined;

  const session = {
    get "set-cookie"(): string | undefined {
      return setCookie;
    },
    //@ts-expect-error This is actually fine
    get data(): SessionDataWithExpires | undefined {
      const currentData = getSessionData();

      return currentData &&
        !sessionState.invalidDate &&
        !sessionState.shouldDestroy
        ? currentData
        : undefined;
    },
    set data(data: SessionType) {
      let maxAge = options.cookie.maxAge;

      if (sessionData?.expires) {
        maxAge =
          new Date(sessionData.expires).getTime() / 1000 -
          new Date().getTime() / 1000;
      }

      sessionData = {
        ...data,
        expires: maxAgeToDateOfExpiry(maxAge),
      };

      sessionState.shouldSendToClient = true;

      setCookie = makeCookie(maxAge);
    },
    refresh: function (expiresInDays?: number) {
      if (!sessionData) {
        return false;
      }

      const newMaxAge = daysToMaxage(expiresInDays ?? options.expiresInDays);

      sessionData = {
        ...sessionData,
        expires: maxAgeToDateOfExpiry(newMaxAge),
      };

      setCookie = makeCookie(newMaxAge);

      sessionState.shouldSendToClient = true;

      return true;
    },
    destroy: function () {
      sessionData = undefined;
      setCookie = makeCookie(0, true);
      sessionState.shouldSendToClient = true;
      return true;
    },
  };

  // If rolling is activated and the session exists we refresh the session on every request.
  if (userOptions?.rolling && !sessionState.invalidDate && sessionData) {
    session.refresh();
  }

  function destroySession() {
    sessionState.shouldSendToClient = true;
    session.destroy();
  }

  function reEncryptSession() {
    if (sessionData) {
      sessionState.shouldSendToClient = true;
      session.data = { ...sessionData };
    }
  }

  return session as any as Session<SessionDataWithExpires | undefined>;
}
