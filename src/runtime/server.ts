import type { RequestHandler } from "@sveltejs/kit";

export const storeSession: RequestHandler<any, Record<string, any>> = function (
  request
) {
  const requestBody = request!.body;

  if (requestBody?.expires) {
    throw new Error("Cannot set expiration date from payload");
  }

  request!.context.session.data = requestBody;

  return {
    status: 200,
    body: request!.context.session.data,
  };
};

export const refreshSession: RequestHandler<
  any,
  Record<string, any>
> = function (request) {
  const requestBody = (request!.body as unknown) as Record<string, unknown>;

  if (requestBody?.expires) {
    throw new Error("Cannot set expiration date from payload");
  }
  if (requestBody) {
    request!.context.session.data = requestBody;
  }

  request!.context.session.refresh = true;

  return {
    status: 200,
    body: request!.context.session.data,
  };
};

export const destroySession: RequestHandler<
  any,
  Record<string, any>
> = function (request) {
  request!.context.session.destroy = true;

  return {
    status: 200,
    body: {
      ok: true,
    },
  };
};
