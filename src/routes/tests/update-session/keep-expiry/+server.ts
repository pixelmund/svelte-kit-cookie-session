import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	await locals.session.update((sd) => (sd.views == null ? { views: 0 } : { views: sd.views + 1 }));

	return json({
		data: locals.session.data as {}
	});
};
