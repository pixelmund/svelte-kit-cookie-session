import { initializeSession, Session, SessionOptions } from "./initialize";
import type { Handle } from "@sveltejs/kit";

export function handleSession<
  SessionType = Record<string, any>,
  Locals = Record<string, any>
>(
  options: SessionOptions,
  passedHandle: Handle<Locals & { session: Session<SessionType> }> = async ({
    request,
    resolve,
  }) => resolve(request)
) {
  //@ts-ignore TODO: Remove this once kit hits 1.0
  return async function handle({ request, resolve, render }) {
    if (typeof render !== "undefined") {
      throw new Error(
        "Please update to the latest @next version of @sveltejs/kit, `render` should now be called `resolve`"
      );
    }

    // We type it as any here to avoid typescript complaining about set-cookie;
    const session: any = initializeSession<SessionType>(
      request.headers,
      options
    );
    request.locals.session = session;

    const response = await passedHandle({ request, resolve });

    if (!session["set-cookie"] || !response?.headers) {
      return response;
    }

    if (response.headers["set-cookie"]) {
      if (typeof response.headers["set-cookie"] === "string") {
        (response.headers["set-cookie"] as any) = [
          response.headers["set-cookie"],
          session["set-cookie"],
        ];
      } else if (Array.isArray(response.headers["set-cookie"])) {
        (response.headers["set-cookie"] as any) = [
          ...response.headers["set-cookie"],
          session["set-cookie"],
        ];
      }
    } else {
      response.headers["set-cookie"] = session["set-cookie"];
    }

    return response;
  } as Handle<Locals & { session: Session<SessionType> }>;
}
