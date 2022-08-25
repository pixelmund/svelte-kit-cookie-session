import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	await locals.session.set({ views: 42 });

	return {
		views: locals.session.data.views
	};
};
