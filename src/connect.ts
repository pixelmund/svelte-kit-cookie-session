import initializeSession from "./core.js";
import type { SessionOptions } from "./types";
import type { IncomingMessage, ServerResponse } from "http";

declare global {
  namespace Express {
    interface Request {
      session: import("./types").Session<Session.SessionData>;
      cookies: Record<string, string>;
    }
  }
  namespace Polka {
    interface Request {
      session: import("./types").Session<Session.SessionData>;
    }
  }
}

declare namespace Session {
  interface SessionData {}
}

/**
 * This interface allows you to declare additional properties on your session object using [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
 *
 * @example
 * declare namespace Session {
 *     interface SessionData {
 *         views: number;
 *     }
 * }
 *
 */

export function sessionMiddleware<
  Req extends { headers: IncomingMessage["headers"] },
  Res extends ServerResponse,
  SessionType = Record<string, any>
>(options: SessionOptions): (req: Req, res: Res, next: () => void) => any {
  return (req, res, next) => {
    const { session, cookies } = initializeSession<SessionType>(
      req.headers.cookie || "",
      options
    );

    //@ts-ignore
    req.session = session;
    //@ts-ignore
    req.cookies = cookies;

    const setSessionHeaders = () => {
      //@ts-ignore This can exist
      const sessionCookie = req.session["set-cookie"];

      if (sessionCookie && sessionCookie.length > 0) {
        const existingSetCookie = res.getHeader("Set-Cookie") as
          | string
          | string[];

        if (!existingSetCookie) {
          res.setHeader("Set-Cookie", [sessionCookie]);
        } else if (typeof existingSetCookie === "string") {
          res.setHeader("Set-Cookie", [existingSetCookie, sessionCookie]);
        } else {
          res.setHeader("Set-Cookie", [...existingSetCookie, sessionCookie]);
        }
      }
    };

    const end = res.end;
    res.end = function (...args: any) {
      setSessionHeaders();
      return end.apply(this, args);
    };

    return next();
  };
}
