import { initializeSession, Session, SessionOptions } from "./initialize";
import type { Handle } from "@sveltejs/kit";

export function handleSession<
  SessionType = Record<string, any>,
  Locals = Record<string, any>
>(
  options: SessionOptions,
  passedHandle: Handle<Locals & { session: Session<SessionType> }> = async ({
    request,
    render,
  }) => render(request)
) {
  return async function handle({ request, render }) {
    // We type it as any here to avoid typescript complaining about set-cookie;
    const session: any = initializeSession<SessionType>(
      request.headers,
      options
    );
    request.locals.session = session;

    const response = await passedHandle({ request, render });

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
