import type { RequestHandler } from '@sveltejs/kit';

export const post: RequestHandler = async ({ locals }) => {
	await locals.session.update((sd) => (sd.views == null ? { views: 1 } : { views: sd.views + 1 }));

	return {
		body: {}
	};
};
