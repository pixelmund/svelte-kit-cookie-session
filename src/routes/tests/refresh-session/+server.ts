import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.session.data.views === 999) {
		await locals.session.refresh(30);
	} else {
		await locals.session.set({ views: 999 });
	}

	return json({ views: locals.session.data.views });
};
