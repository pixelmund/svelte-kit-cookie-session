/** @type {import('@sveltejs/kit').RequestHandler} */
export async function post({ context, body }) {
  context.session.data = JSON.parse(body);

  return {
    body: context.session.data,
  };
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function put({ context, body }) {
  context.session.data = body;
  context.session.refresh = true;

  return {
    body: context.session.data,
  };
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function del({ context }) {
  context.session.destroy = true;

  return {
    body: {
      ok: true,
    },
  };
}
