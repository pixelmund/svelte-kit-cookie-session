import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
	await locals.session.set({ views: 42 });

	return {
		body: {
			views: locals.session.data.views
		}
	};
};
