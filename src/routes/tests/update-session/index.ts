import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
	await locals.session.update((sd) => (!sd ? { views: 0 } : { views: sd.views + 1 }));

	return {
		body: {
			views: locals.session.data.views
		}
	};
};
