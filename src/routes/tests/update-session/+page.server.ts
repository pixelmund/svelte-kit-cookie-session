import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	await locals.session.update((sd) => (sd.views == null ? { views: 0 } : { views: sd.views + 1 }));

	return {
		views: locals.session.data.views
	};
};
